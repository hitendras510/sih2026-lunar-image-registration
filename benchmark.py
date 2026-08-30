#!/usr/bin/env python3
"""Reproducible benchmark runner for the SELENE-MATCH registration pipeline.

The project is a pair-wise registration pipeline, not a single trainable
``torch.nn.Module``.  This runner therefore evaluates its existing matcher /
homography / warp path on a held-out directory and keeps the two kinds of
quality evidence separate:

* Ground-truth geometric error is reported only for pairs that explicitly
  provide a source-to-reference transform.
* Reference-based photometric similarity is reported for successfully warped
  pairs.  It is useful for diagnosis, but is never presented as ground-truth
  geometric accuracy.
* Correspondence hold-out residual is an internal consistency diagnostic, not
  an independent accuracy measurement.

Supported test-data layouts
---------------------------
1. A manifest named ``benchmark_manifest.json``, ``manifest.json``, or
   ``pairs.json`` containing ``{"pairs": [{"id": ..., "source": ...,
   "reference": ..., "ground_truth": ..., "category": ...}]}``.
2. One directory per pair.  A pair directory needs a source named
   ``source``, ``moving``, ``target``, ``synthetic_target``, or ``mov`` and a
   reference named ``reference`` or ``ref`` (with a supported image suffix).
   The checked-in synthetic dataset uses ``reference.png``,
   ``synthetic_target.png``, and ``ground_truth.json``.

For a generic dataset, use a manifest and put a 3x3 source-to-reference
matrix in either ``source_to_reference_homography`` or
``moving_to_reference_homography``.  The generator's ``ground_truth.json``
is recognized explicitly: its inverse matrix is the source-to-reference
transform, because its forward matrix maps reference to synthetic target.
"""
from __future__ import annotations

import argparse
import csv
import hashlib
import json
import os
import platform
import random
import sys
import time
import traceback
from collections import Counter
from dataclasses import dataclass
from datetime import datetime, timezone
from pathlib import Path
from typing import Any, Iterable, Iterator

# Permit ``python benchmark.py`` from an uninstalled source checkout.
REPOSITORY_ROOT = Path(__file__).resolve().parent
SOURCE_ROOT = REPOSITORY_ROOT / "src"
if str(SOURCE_ROOT) not in sys.path:
    sys.path.insert(0, str(SOURCE_ROOT))

import cv2
import matplotlib
import numpy as np

matplotlib.use("Agg")
import matplotlib.pyplot as plt

from selene.cli import load_image_any, run_pipeline
from selene.config import PipelineConfig, load_config
from selene.geometry.pyramid import match_coarse_to_fine_pyramid
from selene.ingest.pair import Pair
from selene.matchers.gate import route_and_match


IMAGE_SUFFIXES = (".png", ".jpg", ".jpeg", ".tif", ".tiff", ".geotif", ".geotiff", ".bmp")
METHODS = (
    "auto",
    "sift",
    "loftr",
    "xfeat",
    "lightglue",
    "phase_corr",
    "mutual_info",
    "crater_graph",
)
MANIFEST_NAMES = ("benchmark_manifest.json", "manifest.json", "pairs.json")


@dataclass(frozen=True)
class BenchmarkPair:
    """A single held-out moving/source image and fixed/reference image."""

    pair_id: str
    source_path: Path
    reference_path: Path
    ground_truth_path: Path | None = None
    category: str | None = None
    ground_truth_inline: dict[str, Any] | None = None


class BenchmarkError(RuntimeError):
    """Raised for invalid benchmark inputs with a user-actionable message."""


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser(
        description="Benchmark the existing SELENE-MATCH registration pipeline on held-out pairs.",
        formatter_class=argparse.ArgumentDefaultsHelpFormatter,
    )
    parser.add_argument("--checkpoint", type=Path, default=None,
                        help=("Optional model checkpoint to fingerprint in provenance. The current "
                              "repository has no generic checkpoint loader, so this is not loaded."))
    parser.add_argument("--test-data", type=Path, required=True,
                        help="Held-out test directory or a benchmark JSON manifest.")
    parser.add_argument("--output-dir", type=Path, default=Path("benchmarks"),
                        help="Directory for results, plots, and per-pair pipeline artifacts.")
    parser.add_argument("--methods", default="auto",
                        help="Comma-separated pipeline methods to compare (for example: auto,sift).")
    parser.add_argument("--batch-size", type=int, default=1,
                        help="Requested batch size. Current pair-wise pipeline executes one pair at a time.")
    parser.add_argument("--num-workers", type=int, default=0,
                        help="Requested data-loader workers. Current pair-wise pipeline does synchronous I/O.")
    parser.add_argument("--device", choices=("auto", "cpu", "cuda", "mps"), default="auto",
                        help="Runtime device for learned matcher backends; falls back safely when unavailable.")
    parser.add_argument("--seed", type=int, default=42, help="Random seed for benchmark sampling and hold-out splits.")
    parser.add_argument("--warmup-iterations", type=int, default=1,
                        help="Untimed matcher-stage warm-up calls before latency measurements.")
    parser.add_argument("--benchmark-iterations", type=int, default=3,
                        help="Timed matcher-stage calls per pair and method.")
    parser.add_argument("--max-pairs", type=int, default=None,
                        help="Optional cap for a smoke test; do not use for a final benchmark.")
    parser.add_argument("--config", type=Path, default=None,
                        help="Optional SELENE PipelineConfig YAML file.")
    parser.add_argument("--no-qualitative", action="store_true",
                        help="Do not render representative registration examples.")
    return parser.parse_args()


def set_reproducible_seed(seed: int) -> dict[str, Any]:
    """Set all project-relevant random seeds without requiring PyTorch."""
    random.seed(seed)
    np.random.seed(seed)
    cv2.setRNGSeed(seed)
    result: dict[str, Any] = {"seed": seed, "torch_seeded": False, "torch_deterministic": False}
    try:
        import torch

        torch.manual_seed(seed)
        if torch.cuda.is_available():
            torch.cuda.manual_seed_all(seed)
        # Benchmarking must not silently select non-deterministic cuDNN paths.
        torch.backends.cudnn.benchmark = False
        torch.backends.cudnn.deterministic = True
        result["torch_seeded"] = True
        result["torch_deterministic"] = True
    except ImportError:
        pass
    return result


def resolve_device(requested: str, warnings: list[str]) -> str:
    """Resolve a requested Torch device, falling back rather than failing CUDA-less hosts."""
    if requested == "auto":
        try:
            import torch

            if torch.cuda.is_available():
                return "cuda"
            if hasattr(torch.backends, "mps") and torch.backends.mps.is_available():
                return "mps"
        except ImportError:
            pass
        return "cpu"

    if requested == "cuda":
        try:
            import torch

            if torch.cuda.is_available():
                return "cuda"
        except ImportError:
            pass
        warnings.append("CUDA was requested but PyTorch CUDA is unavailable; using CPU.")
        return "cpu"

    if requested == "mps":
        try:
            import torch

            if hasattr(torch.backends, "mps") and torch.backends.mps.is_available():
                return "mps"
        except ImportError:
            pass
        warnings.append("MPS was requested but unavailable; using CPU.")
        return "cpu"

    return "cpu"


def _normalise_path(value: str | Path, base_dir: Path) -> Path:
    path = Path(value)
    return path if path.is_absolute() else (base_dir / path).resolve()


def _first_value(data: dict[str, Any], keys: Iterable[str]) -> Any:
    for key in keys:
        value = data.get(key)
        if value is not None:
            return value
    return None


def _find_named_image(directory: Path, stems: Iterable[str]) -> Path | None:
    for stem in stems:
        for suffix in IMAGE_SUFFIXES:
            candidate = directory / f"{stem}{suffix}"
            if candidate.exists():
                return candidate.resolve()
            # Existing field data sometimes uses an upper-case GeoTIFF suffix.
            candidate = directory / f"{stem}{suffix.upper()}"
            if candidate.exists():
                return candidate.resolve()
    return None


def _pair_from_directory(directory: Path) -> BenchmarkPair | None:
    source = _find_named_image(directory, ("source", "moving", "target", "synthetic_target", "mov"))
    reference = _find_named_image(directory, ("reference", "ref", "fixed"))
    if source is None or reference is None:
        return None
    ground_truth = directory / "ground_truth.json"
    return BenchmarkPair(
        pair_id=directory.name,
        source_path=source,
        reference_path=reference,
        ground_truth_path=ground_truth.resolve() if ground_truth.exists() else None,
    )


def _pairs_from_manifest(manifest_path: Path) -> list[BenchmarkPair]:
    try:
        raw = json.loads(manifest_path.read_text(encoding="utf-8"))
    except json.JSONDecodeError as exc:
        raise BenchmarkError(f"Invalid JSON manifest {manifest_path}: {exc}") from exc

    entries = raw.get("pairs") if isinstance(raw, dict) else raw
    if not isinstance(entries, list):
        raise BenchmarkError(
            f"{manifest_path} must be a list of pairs or an object with a 'pairs' list."
        )

    pairs: list[BenchmarkPair] = []
    for index, entry in enumerate(entries):
        if not isinstance(entry, dict):
            raise BenchmarkError(f"Manifest pair #{index} is not a JSON object.")
        source = _first_value(entry, ("source", "moving", "mov", "target", "synthetic_target"))
        reference = _first_value(entry, ("reference", "ref", "fixed", "target_reference"))
        if source is None or reference is None:
            raise BenchmarkError(
                f"Manifest pair #{index} needs 'source' (or 'moving') and 'reference' paths."
            )
        source_path = _normalise_path(source, manifest_path.parent)
        reference_path = _normalise_path(reference, manifest_path.parent)
        if not source_path.is_file() or not reference_path.is_file():
            raise BenchmarkError(
                f"Manifest pair #{index} has missing image(s): source={source_path}, reference={reference_path}."
            )
        ground_truth = _first_value(entry, ("ground_truth", "ground_truth_path"))
        ground_truth_path = _normalise_path(ground_truth, manifest_path.parent) if ground_truth else None
        if ground_truth_path is not None and not ground_truth_path.is_file():
            raise BenchmarkError(f"Manifest pair #{index} ground truth does not exist: {ground_truth_path}")
        pair_id = str(entry.get("id") or entry.get("pair_id") or f"pair_{index:04d}")
        category = entry.get("category")
        inline_gt = {
            key: entry[key]
            for key in (
                "source_to_reference_homography",
                "moving_to_reference_homography",
                "reference_to_source_homography",
                "ground_truth_direction",
            )
            if key in entry
        }
        pairs.append(BenchmarkPair(
            pair_id=pair_id,
            source_path=source_path,
            reference_path=reference_path,
            ground_truth_path=ground_truth_path,
            category=str(category) if category is not None else None,
            ground_truth_inline=inline_gt or None,
        ))
    return pairs


def discover_pairs(test_data: Path) -> tuple[list[BenchmarkPair], Path | None]:
    """Discover supported held-out pairs without guessing arbitrary file names."""
    test_data = test_data.resolve()
    if test_data.is_file():
        if test_data.suffix.lower() != ".json":
            raise BenchmarkError("--test-data must be a directory or JSON benchmark manifest.")
        return _pairs_from_manifest(test_data), test_data
    if not test_data.is_dir():
        raise BenchmarkError(f"Held-out test data does not exist: {test_data}")

    for name in MANIFEST_NAMES:
        manifest = test_data / name
        if manifest.is_file():
            return _pairs_from_manifest(manifest), manifest

    pairs: list[BenchmarkPair] = []
    root_pair = _pair_from_directory(test_data)
    if root_pair is not None:
        pairs.append(root_pair)
    for directory in sorted(path for path in test_data.rglob("*") if path.is_dir()):
        pair = _pair_from_directory(directory)
        if pair is not None:
            pairs.append(pair)

    # Resolve accidental duplicates caused by a nested directory layout.
    unique_pairs: dict[tuple[Path, Path], BenchmarkPair] = {}
    for pair in pairs:
        unique_pairs[(pair.source_path, pair.reference_path)] = pair
    discovered = list(unique_pairs.values())
    if not discovered:
        raise BenchmarkError(
            "No pairs found. Supply a manifest or place each pair in a directory with "
            "reference.* and source.* (or moving.* / synthetic_target.*)."
        )
    return discovered, None


def _matrix_from(value: Any, description: str) -> np.ndarray:
    matrix = np.asarray(value, dtype=np.float64)
    if matrix.shape == (2, 3):
        matrix = np.vstack((matrix, np.array([0.0, 0.0, 1.0])))
    if matrix.shape != (3, 3) or not np.all(np.isfinite(matrix)):
        raise BenchmarkError(f"{description} must be a finite 3x3 (or 2x3 affine) matrix.")
    if abs(matrix[2, 2]) < 1e-12:
        raise BenchmarkError(f"{description} is singular or has zero homogeneous scale.")
    return matrix / matrix[2, 2]


def load_source_to_reference_ground_truth(pair: BenchmarkPair) -> tuple[np.ndarray | None, str]:
    """Load only unambiguous source-to-reference transforms.

    A bare ``homography_matrix_3x3`` is intentionally not treated as truth for
    generic data because its direction cannot be inferred reliably.
    """
    data: dict[str, Any] = {}
    if pair.ground_truth_path:
        try:
            loaded = json.loads(pair.ground_truth_path.read_text(encoding="utf-8"))
        except (OSError, json.JSONDecodeError) as exc:
            return None, f"Metric unavailable because ground-truth JSON could not be read: {exc}"
        if not isinstance(loaded, dict):
            return None, "Metric unavailable because ground truth is not a JSON object."
        data.update(loaded)
    # An explicit manifest declaration is the most specific contract and must
    # override any ambiguous convenience field inside a sidecar JSON file.
    if pair.ground_truth_inline:
        data.update(pair.ground_truth_inline)

    for key in ("source_to_reference_homography", "moving_to_reference_homography"):
        if key in data:
            return _matrix_from(data[key], key), f"Loaded explicit {key}."
    if "reference_to_source_homography" in data:
        try:
            return np.linalg.inv(_matrix_from(data["reference_to_source_homography"], "reference_to_source_homography")), (
                "Inverted explicit reference_to_source_homography."
            )
        except np.linalg.LinAlgError:
            return None, "Metric unavailable because reference_to_source_homography is singular."

    # Known data_generation/generate_synthetic_pair.py convention only.
    dataset_info = data.get("dataset_info")
    if (
        isinstance(dataset_info, dict)
        and "homography_matrix_3x3" in data
        and "homography_matrix_inv_3x3" in data
        and Path(str(dataset_info.get("reference_image", ""))).name == pair.reference_path.name
        and Path(str(dataset_info.get("synthetic_target_image", ""))).name == pair.source_path.name
    ):
        return _matrix_from(data["homography_matrix_inv_3x3"], "homography_matrix_inv_3x3"), (
            "Recognized synthetic generator convention: inverse maps moving/source to reference."
        )

    if pair.ground_truth_path is None and not data:
        return None, "Metric unavailable because no ground-truth transform was provided."
    return None, (
        "Metric unavailable because ground-truth transform direction is not explicit. "
        "Use source_to_reference_homography in the manifest or ground-truth JSON."
    )


def apply_homography(points: np.ndarray, matrix: np.ndarray) -> np.ndarray:
    homogeneous = np.column_stack((points.astype(np.float64), np.ones(len(points), dtype=np.float64)))
    projected = (matrix @ homogeneous.T).T
    denominator = projected[:, 2:3]
    output = np.full((len(points), 2), np.nan, dtype=np.float64)
    valid = np.abs(denominator[:, 0]) > 1e-12
    output[valid] = projected[valid, :2] / denominator[valid]
    return output


def scalar_statistics(values: Iterable[float]) -> dict[str, float | int] | None:
    array = np.asarray([value for value in values if value is not None and np.isfinite(value)], dtype=np.float64)
    if array.size == 0:
        return None
    return {
        "count": int(array.size),
        "mean": float(np.mean(array)),
        "median": float(np.median(array)),
        "std": float(np.std(array)),
        "min": float(np.min(array)),
        "max": float(np.max(array)),
        "p05": float(np.percentile(array, 5)),
        "p95": float(np.percentile(array, 95)),
    }


def transformation_error(
    estimated: np.ndarray,
    ground_truth: np.ndarray,
    source_shape: tuple[int, int],
    reference_shape: tuple[int, int],
    grid_steps: int = 25,
) -> dict[str, float | int] | None:
    """Evaluate source-to-reference transform error on a fixed uniform source grid."""
    source_height, source_width = source_shape
    reference_height, reference_width = reference_shape
    x, y = np.meshgrid(
        np.linspace(0, source_width - 1, grid_steps),
        np.linspace(0, source_height - 1, grid_steps),
    )
    grid = np.column_stack((x.ravel(), y.ravel()))
    estimate = apply_homography(grid, estimated)
    truth = apply_homography(grid, ground_truth)
    valid = np.all(np.isfinite(estimate), axis=1) & np.all(np.isfinite(truth), axis=1)
    # Grid points outside the reference for both transforms do not assess the
    # registered overlap. Keep grid points visible under either transform.
    in_reference = (
        ((truth[:, 0] >= 0) & (truth[:, 0] < reference_width) & (truth[:, 1] >= 0) & (truth[:, 1] < reference_height))
        | ((estimate[:, 0] >= 0) & (estimate[:, 0] < reference_width) & (estimate[:, 1] >= 0) & (estimate[:, 1] < reference_height))
    )
    errors = np.linalg.norm(estimate[valid & in_reference] - truth[valid & in_reference], axis=1)
    stats = scalar_statistics(errors)
    if stats is None:
        return None
    return {
        "grid_points_evaluated": int(stats.pop("count")),
        "rmse_px": float(np.sqrt(np.mean(errors ** 2))),
        "mae_px": float(np.mean(errors)),
        "median_px": float(np.median(errors)),
        "std_px": float(np.std(errors)),
        "min_px": float(np.min(errors)),
        "max_px": float(np.max(errors)),
        "p95_px": float(np.percentile(errors, 95)),
    }


def read_matches(path: Path) -> tuple[np.ndarray, np.ndarray]:
    if not path.is_file():
        return np.empty((0, 2), dtype=np.float32), np.empty((0, 2), dtype=np.float32)
    points_source: list[list[float]] = []
    points_reference: list[list[float]] = []
    with path.open(newline="", encoding="utf-8") as handle:
        for row in csv.DictReader(handle):
            try:
                points_source.append([float(row["src_x"]), float(row["src_y"])])
                points_reference.append([float(row["ref_x"]), float(row["ref_y"])])
            except (KeyError, TypeError, ValueError):
                continue
    return np.asarray(points_source, dtype=np.float32), np.asarray(points_reference, dtype=np.float32)


def estimate_homography(source_points: np.ndarray, reference_points: np.ndarray) -> np.ndarray | None:
    if len(source_points) < 4 or len(reference_points) < 4:
        return None
    method = cv2.USAC_MAGSAC if hasattr(cv2, "USAC_MAGSAC") else cv2.RANSAC
    matrix, _ = cv2.findHomography(source_points, reference_points, method=method, ransacReprojThreshold=4.0)
    if matrix is None or not np.all(np.isfinite(matrix)):
        return None
    return matrix / matrix[2, 2]


def holdout_correspondence_consistency(
    source_points: np.ndarray,
    reference_points: np.ndarray,
    seed: int,
) -> dict[str, float | int] | None:
    """Fit on 80% of correspondences and report error on the remaining 20%.

    This detects self-inconsistent match sets. It remains an internal metric:
    both partitions originate from the registration pipeline, not external GCPs.
    """
    if len(source_points) < 8:
        return None
    rng = np.random.default_rng(seed)
    order = rng.permutation(len(source_points))
    validation_count = max(4, int(round(len(source_points) * 0.2)))
    validation_count = min(validation_count, len(source_points) - 4)
    if validation_count < 1:
        return None
    validation_indices = order[:validation_count]
    training_indices = order[validation_count:]
    estimated = estimate_homography(source_points[training_indices], reference_points[training_indices])
    if estimated is None:
        return None
    predicted = apply_homography(source_points[validation_indices], estimated)
    errors = np.linalg.norm(predicted - reference_points[validation_indices], axis=1)
    stats = scalar_statistics(errors)
    if stats is None:
        return None
    return {
        "validation_points": int(stats.pop("count")),
        "rmse_px": float(np.sqrt(np.mean(errors ** 2))),
        "mae_px": float(np.mean(errors)),
        "median_px": float(np.median(errors)),
        "p95_px": float(np.percentile(errors, 95)),
        "max_px": float(np.max(errors)),
    }


def normalise_image(image: np.ndarray) -> np.ndarray:
    image = image.astype(np.float32)
    finite = image[np.isfinite(image)]
    if finite.size == 0:
        return np.zeros(image.shape[:2], dtype=np.float32)
    lo, hi = float(np.min(finite)), float(np.max(finite))
    if hi <= lo:
        return np.zeros(image.shape[:2], dtype=np.float32)
    return np.clip((image - lo) / (hi - lo), 0.0, 1.0)


def photometric_metrics(reference: np.ndarray, registered: np.ndarray) -> dict[str, float] | None:
    """Reference-based post-registration appearance metrics, not transform truth."""
    if reference.shape[:2] != registered.shape[:2]:
        registered = cv2.resize(registered, (reference.shape[1], reference.shape[0]), interpolation=cv2.INTER_LINEAR)
    reference_normalised = normalise_image(reference)
    registered_normalised = normalise_image(registered)
    difference = reference_normalised - registered_normalised
    metrics: dict[str, float] = {
        "mae_normalized": float(np.mean(np.abs(difference))),
        "rmse_normalized": float(np.sqrt(np.mean(difference ** 2))),
    }
    try:
        from skimage.metrics import peak_signal_noise_ratio, structural_similarity

        metrics["ssim"] = float(structural_similarity(reference_normalised, registered_normalised, data_range=1.0))
        metrics["psnr_db"] = float(peak_signal_noise_ratio(reference_normalised, registered_normalised, data_range=1.0))
    except ImportError:
        # The core pair is still valid. Dependencies are recorded in metadata.
        pass
    return metrics


def synchronize_cuda(device: str) -> None:
    if device != "cuda":
        return
    try:
        import torch

        torch.cuda.synchronize()
    except (ImportError, RuntimeError):
        return


def measure_matcher_stage(
    source_image: np.ndarray,
    reference_image: np.ndarray,
    pair: Pair,
    config: PipelineConfig,
    device: str,
    iterations: int,
) -> tuple[list[float], str, int]:
    """Time exactly the pipeline's correspondence stage on preloaded arrays.

    It excludes image loading, MAGSAC, warping, export, and plot creation. It
    includes the pipeline's required GSD resampling and gated matcher call.
    """
    latencies_ms: list[float] = []
    actual_matcher = "unavailable"
    match_count = 0
    for _ in range(iterations):
        synchronize_cuda(device)
        started = time.perf_counter()
        points_source, _, _, actual_matcher = match_coarse_to_fine_pyramid(
            img_src=source_image,
            img_ref=reference_image,
            pair=pair,
            config=config,
            route_and_match_fn=route_and_match,
        )
        synchronize_cuda(device)
        latencies_ms.append((time.perf_counter() - started) * 1000.0)
        match_count = int(len(points_source))
    return latencies_ms, actual_matcher, match_count


def file_fingerprint(path: Path | None) -> dict[str, Any] | None:
    if path is None:
        return None
    if not path.is_file():
        raise BenchmarkError(f"Checkpoint does not exist: {path}")
    hasher = hashlib.sha256()
    with path.open("rb") as handle:
        while chunk := handle.read(1024 * 1024):
            hasher.update(chunk)
    return {
        "path": str(path.resolve()),
        "size_bytes": path.stat().st_size,
        "sha256": hasher.hexdigest(),
        "loaded_by_pipeline": False,
        "note": "Provenance only: SELENE-MATCH currently exposes no generic checkpoint loader or model class.",
    }


def environment_metadata(device: str) -> dict[str, Any]:
    libraries: dict[str, str | None] = {"numpy": np.__version__, "opencv": cv2.__version__, "matplotlib": matplotlib.__version__}
    gpu: dict[str, Any] = {"name": None, "cuda_version": None, "memory_total_bytes": None}
    try:
        import torch

        libraries["torch"] = torch.__version__
        if device == "cuda" and torch.cuda.is_available():
            properties = torch.cuda.get_device_properties(0)
            gpu = {
                "name": torch.cuda.get_device_name(0),
                "cuda_version": torch.version.cuda,
                "memory_total_bytes": int(properties.total_memory),
            }
    except ImportError:
        libraries["torch"] = None
    try:
        import skimage

        libraries["scikit_image"] = skimage.__version__
    except ImportError:
        libraries["scikit_image"] = None
    return {
        "timestamp_utc": datetime.now(timezone.utc).isoformat(),
        "python": sys.version.replace("\n", " "),
        "platform": platform.platform(),
        "device": device,
        "gpu": gpu,
        "libraries": libraries,
    }


def resource_snapshot(device: str) -> dict[str, float | int | None]:
    rss_bytes: int | None = None
    cpu_seconds: float | None = None
    try:
        import psutil

        process = psutil.Process(os.getpid())
        info = process.memory_info()
        rss_bytes = int(info.rss)
        cpu_time = process.cpu_times()
        cpu_seconds = float(cpu_time.user + cpu_time.system)
    except ImportError:
        pass
    peak_rss: int | None = None
    try:
        import resource

        # Linux reports KiB; macOS reports bytes. This distinction matters
        # only on a Mac, where the value is already bytes.
        raw_peak = int(resource.getrusage(resource.RUSAGE_SELF).ru_maxrss)
        peak_rss = raw_peak if platform.system() == "Darwin" else raw_peak * 1024
    except ImportError:
        pass
    gpu_allocated: int | None = None
    gpu_peak: int | None = None
    if device == "cuda":
        try:
            import torch

            gpu_allocated = int(torch.cuda.memory_allocated())
            gpu_peak = int(torch.cuda.max_memory_allocated())
        except (ImportError, RuntimeError):
            pass
    return {
        "rss_bytes": rss_bytes,
        "peak_rss_bytes": peak_rss,
        "cpu_seconds": cpu_seconds,
        "gpu_memory_allocated_bytes": gpu_allocated,
        "gpu_peak_memory_allocated_bytes": gpu_peak,
    }


def reset_cuda_peak_memory(device: str) -> None:
    if device != "cuda":
        return
    try:
        import torch

        torch.cuda.reset_peak_memory_stats()
    except (ImportError, RuntimeError):
        pass


def pair_artifact_directory(output_dir: Path, method: str, pair_id: str) -> Path:
    safe_id = "".join(character if character.isalnum() or character in ("-", "_", ".") else "_" for character in pair_id)
    return output_dir / "pipeline_runs" / method / safe_id


def evaluate_one_pair(
    benchmark_pair: BenchmarkPair,
    method: str,
    output_dir: Path,
    config: PipelineConfig,
    device: str,
    iterations: int,
    seed: int,
) -> tuple[dict[str, Any], dict[str, np.ndarray] | None]:
    """Run one pair through the benchmark and preserve evidence for plots."""
    record: dict[str, Any] = {
        "pair_id": benchmark_pair.pair_id,
        "method_requested": method,
        "category": benchmark_pair.category,
        "source_path": str(benchmark_pair.source_path),
        "reference_path": str(benchmark_pair.reference_path),
        "ground_truth_path": str(benchmark_pair.ground_truth_path) if benchmark_pair.ground_truth_path else None,
        "status": "failed",
        "data_loading_ms": None,
        "matcher_stage_latency_ms": None,
        "pipeline_total_ms": None,
        "throughput_images_per_sec": None,
        "matcher_stage_actual": None,
        "matcher_stage_matches": None,
        "pipeline_metrics": None,
        "ground_truth_transform": None,
        "ground_truth_transform_error": None,
        "correspondence_holdout_consistency": None,
        "photometric_similarity": None,
        "resource_usage": None,
        "error": None,
    }
    visuals: dict[str, np.ndarray] | None = None
    try:
        data_started = time.perf_counter()
        source_image, _, _ = load_image_any(benchmark_pair.source_path)
        reference_image, _, _ = load_image_any(benchmark_pair.reference_path)
        record["data_loading_ms"] = (time.perf_counter() - data_started) * 1000.0
        record["image_resolution"] = {
            "source": [int(source_image.shape[0]), int(source_image.shape[1])],
            "reference": [int(reference_image.shape[0]), int(reference_image.shape[1])],
        }

        pair = Pair.from_paths(ref=benchmark_pair.reference_path, mov=benchmark_pair.source_path)
        condition_tags: list[str] = []
        if pair.delta_sun_az >= config.sun_azimuth_flip_deg:
            condition_tags.append("large_illumination_difference")
        if pair.gsd_ratio > 3.0:
            condition_tags.append("large_scale_difference")
        if pair.is_cross_sensor:
            condition_tags.append("cross_sensor")
        if benchmark_pair.category:
            condition_tags.append(f"manifest_category:{benchmark_pair.category}")
        record["conditions"] = {
            "delta_sun_azimuth_deg": pair.delta_sun_az,
            "gsd_ratio": pair.gsd_ratio,
            "cross_sensor": pair.is_cross_sensor,
            "tags": condition_tags,
        }
        latencies_ms, actual_matcher, match_count = measure_matcher_stage(
            source_image, reference_image, pair, config, device, iterations
        )
        record["matcher_stage_actual"] = actual_matcher
        record["matcher_stage_matches"] = match_count
        record["matcher_stage_latency_ms"] = scalar_statistics(latencies_ms)

        reset_cuda_peak_memory(device)
        before_resource = resource_snapshot(device)
        pipeline_started = time.perf_counter()
        artifact_dir = pair_artifact_directory(output_dir, method, benchmark_pair.pair_id)
        pipeline_result = run_pipeline(
            src_path=benchmark_pair.source_path,
            ref_path=benchmark_pair.reference_path,
            out_dir=artifact_dir,
            config=config,
            job_id=f"benchmark_{method}_{benchmark_pair.pair_id}",
        )
        pipeline_elapsed = time.perf_counter() - pipeline_started
        after_resource = resource_snapshot(device)
        record["pipeline_total_ms"] = pipeline_elapsed * 1000.0
        record["throughput_images_per_sec"] = 1.0 / pipeline_elapsed if pipeline_elapsed > 0 else None
        record["pipeline_metrics"] = pipeline_result.get("metrics")
        record["artifacts"] = {
            "directory": str(artifact_dir),
            "registered_geotiff": pipeline_result.get("registered_geotiff"),
            "matches_csv": pipeline_result.get("matches_csv"),
            "registered_png": str(artifact_dir / "registered.png"),
        }
        cpu_pct: float | None = None
        if before_resource["cpu_seconds"] is not None and after_resource["cpu_seconds"] is not None and pipeline_elapsed > 0:
            cpu_pct = 100.0 * (float(after_resource["cpu_seconds"]) - float(before_resource["cpu_seconds"])) / pipeline_elapsed
        record["resource_usage"] = {
            "process_rss_before_bytes": before_resource["rss_bytes"],
            "process_rss_after_bytes": after_resource["rss_bytes"],
            "process_peak_rss_bytes": after_resource["peak_rss_bytes"],
            "process_cpu_percent_approx": cpu_pct,
            "gpu_memory_allocated_bytes": after_resource["gpu_memory_allocated_bytes"],
            "gpu_peak_memory_allocated_bytes": after_resource["gpu_peak_memory_allocated_bytes"],
        }

        source_points, reference_points = read_matches(Path(pipeline_result["matches_csv"]))
        estimated = estimate_homography(source_points, reference_points)
        ground_truth, gt_note = load_source_to_reference_ground_truth(benchmark_pair)
        record["ground_truth_transform"] = {"available": ground_truth is not None, "note": gt_note}
        if ground_truth is not None and estimated is not None:
            record["ground_truth_transform_error"] = transformation_error(
                estimated=estimated,
                ground_truth=ground_truth,
                source_shape=source_image.shape[:2],
                reference_shape=reference_image.shape[:2],
            )
        elif ground_truth is not None:
            record["ground_truth_transform_error"] = None
            record["ground_truth_transform"]["note"] = (
                f"{gt_note} Metric unavailable because fewer than four usable final correspondences were exported."
            )
        record["correspondence_holdout_consistency"] = holdout_correspondence_consistency(
            source_points, reference_points, seed=seed
        )

        registered_path = artifact_dir / "registered.png"
        registered_raw = cv2.imread(str(registered_path), cv2.IMREAD_GRAYSCALE)
        if registered_raw is not None:
            registered = registered_raw.astype(np.float32) / 255.0
            record["photometric_similarity"] = photometric_metrics(reference_image, registered)
            visuals = {"source": source_image, "reference": reference_image, "registered": registered}
        record["status"] = "success"
    except Exception as exc:  # Keep remaining held-out pairs measurable after one failure.
        record["error"] = f"{type(exc).__name__}: {exc}"
        record["traceback"] = traceback.format_exc(limit=5)
    return record, visuals


def _metric_value(record: dict[str, Any], path: tuple[str, ...]) -> float | None:
    current: Any = record
    for key in path:
        if not isinstance(current, dict):
            return None
        current = current.get(key)
    return float(current) if isinstance(current, (int, float)) and np.isfinite(current) else None


def aggregate_records(records: list[dict[str, Any]]) -> dict[str, Any]:
    successful = [record for record in records if record["status"] == "success"]
    groups: dict[str, list[dict[str, Any]]] = {}
    for record in records:
        groups.setdefault(record["method_requested"], []).append(record)

    aggregate: dict[str, Any] = {
        "attempted_pairs": len(records),
        "successful_pairs": len(successful),
        "failed_pairs": len(records) - len(successful),
        "by_method": {},
        "robustness_subsets": {},
    }
    metric_paths = {
        "data_loading_ms": ("data_loading_ms",),
        "matcher_stage_latency_ms": ("matcher_stage_latency_ms", "mean"),
        "pipeline_total_ms": ("pipeline_total_ms",),
        "throughput_images_per_sec": ("throughput_images_per_sec",),
        "ground_truth_transform_rmse_px": ("ground_truth_transform_error", "rmse_px"),
        "ground_truth_transform_mae_px": ("ground_truth_transform_error", "mae_px"),
        "ground_truth_transform_p95_px": ("ground_truth_transform_error", "p95_px"),
        "photometric_rmse_normalized": ("photometric_similarity", "rmse_normalized"),
        "photometric_mae_normalized": ("photometric_similarity", "mae_normalized"),
        "photometric_ssim": ("photometric_similarity", "ssim"),
        "photometric_psnr_db": ("photometric_similarity", "psnr_db"),
        "correspondence_holdout_rmse_px": ("correspondence_holdout_consistency", "rmse_px"),
    }
    for method, method_records in groups.items():
        method_successful = [record for record in method_records if record["status"] == "success"]
        metrics = {
            name: scalar_statistics(_metric_value(record, path) for record in method_successful)
            for name, path in metric_paths.items()
        }
        actual_matchers = Counter(
            str(record["matcher_stage_actual"])
            for record in method_successful
            if record.get("matcher_stage_actual")
        )
        categories = Counter(
            str(record["category"])
            for record in method_records
            if record.get("category") is not None
        )
        aggregate["by_method"][method] = {
            "attempted_pairs": len(method_records),
            "successful_pairs": len(method_successful),
            "failed_pairs": len(method_records) - len(method_successful),
            "actual_matchers": dict(actual_matchers),
            "categories": dict(categories),
            "metrics": metrics,
        }
        subset_groups: dict[str, list[dict[str, Any]]] = {}
        for record in method_records:
            conditions = record.get("conditions") or {}
            for tag in conditions.get("tags", []):
                subset_groups.setdefault(str(tag), []).append(record)
        aggregate["robustness_subsets"][method] = {
            tag: {
                "attempted_pairs": len(subset_records),
                "successful_pairs": sum(record["status"] == "success" for record in subset_records),
                "ground_truth_transform_rmse_px": scalar_statistics(
                    _metric_value(record, ("ground_truth_transform_error", "rmse_px"))
                    for record in subset_records
                    if record["status"] == "success"
                ),
                "photometric_ssim": scalar_statistics(
                    _metric_value(record, ("photometric_similarity", "ssim"))
                    for record in subset_records
                    if record["status"] == "success"
                ),
            }
            for tag, subset_records in sorted(subset_groups.items())
        }
    return aggregate


def _output_image(image: np.ndarray) -> np.ndarray:
    if image.ndim == 3:
        image = image[..., 0]
    return normalise_image(image)


def save_qualitative_example(visuals: dict[str, np.ndarray], out_path: Path, title: str) -> None:
    """Save an unbiased four-panel source/reference/registered/difference figure."""
    source = _output_image(visuals["source"])
    reference = _output_image(visuals["reference"])
    registered = _output_image(visuals["registered"])
    if registered.shape != reference.shape:
        registered = cv2.resize(registered, (reference.shape[1], reference.shape[0]))
    difference = np.abs(reference - registered)
    figure, axes = plt.subplots(2, 2, figsize=(12, 10), dpi=150)
    panels = (
        (source, "Source / moving image", "gray"),
        (reference, "Target / reference image", "gray"),
        (registered, "Registered source", "gray"),
        (difference, "Absolute difference", "magma"),
    )
    for axis, (image, label, cmap) in zip(axes.ravel(), panels):
        axis.imshow(image, cmap=cmap)
        axis.set_title(label)
        axis.axis("off")
    figure.suptitle(title, fontweight="bold")
    figure.tight_layout()
    out_path.parent.mkdir(parents=True, exist_ok=True)
    figure.savefig(out_path, bbox_inches="tight")
    plt.close(figure)


def create_qualitative_examples(
    records: list[dict[str, Any]],
    visual_cache: dict[tuple[str, str], dict[str, np.ndarray]],
    output_dir: Path,
) -> list[str]:
    saved: list[str] = []
    for method in sorted({record["method_requested"] for record in records}):
        candidates: list[tuple[float, dict[str, Any]]] = []
        for record in records:
            if record["method_requested"] != method or record["status"] != "success":
                continue
            key = (method, record["pair_id"])
            if key not in visual_cache:
                continue
            # Ground-truth geometric error is preferred; diagnostics only if GT
            # is unavailable. Lower scores denote better registrations.
            score = _metric_value(record, ("ground_truth_transform_error", "rmse_px"))
            if score is None:
                score = _metric_value(record, ("correspondence_holdout_consistency", "rmse_px"))
            if score is None:
                score = _metric_value(record, ("photometric_similarity", "rmse_normalized"))
            if score is not None:
                candidates.append((score, record))
        if not candidates:
            continue
        candidates.sort(key=lambda item: item[0])
        selected = {
            "good": candidates[0],
            "average": candidates[len(candidates) // 2],
            "difficult": candidates[-1],
        }
        written_pair_ids: set[str] = set()
        for label, (score, record) in selected.items():
            # With fewer than three successful pairs, a single image cannot
            # honestly represent multiple difficulty tiers.
            if record["pair_id"] in written_pair_ids:
                continue
            written_pair_ids.add(record["pair_id"])
            output_path = output_dir / "plots" / "qualitative_examples" / method / f"{label}_{record['pair_id']}.png"
            save_qualitative_example(
                visual_cache[(method, record["pair_id"])],
                output_path,
                f"{method} — {label} case — score={score:.4f} ({record['pair_id']})",
            )
            saved.append(str(output_path))
    return saved


def create_distribution_plot(records: list[dict[str, Any]], output_dir: Path) -> list[str]:
    successful = [record for record in records if record["status"] == "success"]
    paths: list[str] = []
    ground_truth_errors = [_metric_value(record, ("ground_truth_transform_error", "rmse_px")) for record in successful]
    ground_truth_errors = [value for value in ground_truth_errors if value is not None]
    if ground_truth_errors:
        figure, axis = plt.subplots(figsize=(8, 5), dpi=150)
        axis.hist(ground_truth_errors, bins=min(20, max(5, len(ground_truth_errors))), color="#3b82f6", edgecolor="white")
        axis.set_title("Ground-truth transform-error distribution")
        axis.set_xlabel("Uniform-grid transform RMSE (px)")
        axis.set_ylabel("Pairs")
        figure.tight_layout()
        output_path = output_dir / "plots" / "metric_distribution.png"
        figure.savefig(output_path, bbox_inches="tight")
        plt.close(figure)
        paths.append(str(output_path))

    latency_groups: dict[str, list[float]] = {}
    for record in successful:
        value = _metric_value(record, ("matcher_stage_latency_ms", "mean"))
        if value is not None:
            latency_groups.setdefault(record["method_requested"], []).append(value)
    if latency_groups:
        figure, axis = plt.subplots(figsize=(8, 5), dpi=150)
        for method, values in sorted(latency_groups.items()):
            axis.hist(values, bins=min(20, max(5, len(values))), alpha=0.55, label=method)
        axis.set_title("Correspondence-stage latency distribution")
        axis.set_xlabel("Latency per image (ms; image I/O excluded)")
        axis.set_ylabel("Pairs")
        axis.legend()
        figure.tight_layout()
        output_path = output_dir / "plots" / "latency_distribution.png"
        figure.savefig(output_path, bbox_inches="tight")
        plt.close(figure)
        paths.append(str(output_path))
    return paths


def create_comparison_plot(aggregate: dict[str, Any], output_dir: Path) -> str | None:
    methods = list(aggregate["by_method"])
    if len(methods) < 2:
        return None
    accuracy: list[float] = []
    latency: list[float] = []
    for method in methods:
        metrics = aggregate["by_method"][method]["metrics"]
        gt_stats = metrics["ground_truth_transform_rmse_px"]
        photo_stats = metrics["photometric_rmse_normalized"]
        accuracy.append(float(gt_stats["mean"]) if gt_stats else float(photo_stats["mean"]) if photo_stats else np.nan)
        timing_stats = metrics["matcher_stage_latency_ms"]
        latency.append(float(timing_stats["mean"]) if timing_stats else np.nan)
    figure, axes = plt.subplots(1, 2, figsize=(11, 5), dpi=150)
    labels = [method.replace("_", "\n") for method in methods]
    axes[0].bar(labels, accuracy, color="#2563eb")
    axes[0].set_title("Mean geometric RMSE (or photometric RMSE if no GT)")
    axes[0].set_ylabel("Lower is better")
    axes[1].bar(labels, latency, color="#16a34a")
    axes[1].set_title("Mean correspondence-stage latency")
    axes[1].set_ylabel("ms/image; I/O excluded")
    figure.tight_layout()
    output_path = output_dir / "plots" / "model_comparison.png"
    figure.savefig(output_path, bbox_inches="tight")
    plt.close(figure)
    return str(output_path)


def flatten_records_for_csv(records: list[dict[str, Any]]) -> list[dict[str, Any]]:
    rows: list[dict[str, Any]] = []
    for record in records:
        row: dict[str, Any] = {
            "pair_id": record["pair_id"],
            "category": record["category"],
            "method_requested": record["method_requested"],
            "matcher_stage_actual": record["matcher_stage_actual"],
            "status": record["status"],
            "source_path": record["source_path"],
            "reference_path": record["reference_path"],
            "data_loading_ms": record["data_loading_ms"],
            "matcher_stage_mean_ms": _metric_value(record, ("matcher_stage_latency_ms", "mean")),
            "matcher_stage_p95_ms": _metric_value(record, ("matcher_stage_latency_ms", "p95")),
            "pipeline_total_ms": record["pipeline_total_ms"],
            "throughput_images_per_sec": record["throughput_images_per_sec"],
            "gt_transform_rmse_px": _metric_value(record, ("ground_truth_transform_error", "rmse_px")),
            "gt_transform_mae_px": _metric_value(record, ("ground_truth_transform_error", "mae_px")),
            "gt_transform_p95_px": _metric_value(record, ("ground_truth_transform_error", "p95_px")),
            "photometric_rmse_normalized": _metric_value(record, ("photometric_similarity", "rmse_normalized")),
            "photometric_ssim": _metric_value(record, ("photometric_similarity", "ssim")),
            "photometric_psnr_db": _metric_value(record, ("photometric_similarity", "psnr_db")),
            "correspondence_holdout_rmse_px": _metric_value(record, ("correspondence_holdout_consistency", "rmse_px")),
            "error": record["error"],
        }
        rows.append(row)
    return rows


def write_csv(path: Path, rows: list[dict[str, Any]]) -> None:
    if not rows:
        return
    with path.open("w", newline="", encoding="utf-8") as handle:
        writer = csv.DictWriter(handle, fieldnames=list(rows[0]))
        writer.writeheader()
        writer.writerows(rows)


def _format_stat(stats: dict[str, Any] | None, unit: str = "") -> str:
    if stats is None:
        return "unavailable"
    return f"mean={stats['mean']:.4f}{unit}, median={stats['median']:.4f}{unit}, P95={stats['p95']:.4f}{unit}"


def make_summary(results: dict[str, Any]) -> str:
    metadata = results["metadata"]
    aggregate = results["aggregate"]
    lines = [
        "=" * 56,
        "IMAGE REGISTRATION BENCHMARK",
        "=" * 56,
        f"Test dataset: {metadata['test_data']}",
        f"Test samples: {metadata['test_sample_count']}",
        f"Device: {metadata['environment']['device']}",
        f"Checkpoint: {metadata['checkpoint']['path'] if metadata['checkpoint'] else 'none supplied'}",
        "",
        "QUALITY METRIC INTERPRETATION",
        "- Ground-truth transform RMSE/MAE/P95: uniform source-grid error against an explicit source→reference transform.",
        "- Photometric RMSE/SSIM/PSNR: post-registration appearance comparison with the reference; not geometric ground truth.",
        "- Correspondence hold-out RMSE: internal 80/20 match consistency diagnostic; not independent ground truth.",
        "",
        "PERFORMANCE METRIC INTERPRETATION",
        "- Matcher-stage latency excludes file loading, robust fitting, warping, export, and plots; it includes required GSD resampling and matcher routing.",
        "- Pipeline total time includes complete registration and generated pair artifacts.",
        "",
    ]
    for method, result in aggregate["by_method"].items():
        metrics = result["metrics"]
        lines.extend((
            f"METHOD: {method}",
            f"Status: {result['successful_pairs']}/{result['attempted_pairs']} pairs succeeded",
            f"Actual matcher path(s): {result['actual_matchers'] or 'unavailable'}",
            f"Ground-truth transform RMSE: {_format_stat(metrics['ground_truth_transform_rmse_px'], ' px')}",
            f"Photometric SSIM: {_format_stat(metrics['photometric_ssim'])}",
            f"Matcher latency: {_format_stat(metrics['matcher_stage_latency_ms'], ' ms')}",
            f"Pipeline throughput: {_format_stat(metrics['throughput_images_per_sec'], ' images/s')}",
            "",
        ))
    resource = results["resource_summary"]
    lines.extend((
        "RESOURCE USAGE",
        "--------------",
        f"Model parameter count: {resource['model_parameter_count_note']}",
        f"Checkpoint size on disk: {resource['checkpoint_size_bytes'] if resource['checkpoint_size_bytes'] is not None else 'unavailable'} bytes",
        f"Peak GPU memory: {resource['gpu_peak_memory_bytes'] if resource['gpu_peak_memory_bytes'] is not None else 'unavailable'} bytes",
        f"Peak process RAM: {resource['peak_process_rss_bytes'] if resource['peak_process_rss_bytes'] is not None else 'unavailable'} bytes",
        "",
        "LIMITATIONS",
        "- The current repository exposes a routed registration pipeline, not a generic checkpoint loader or a persistent model object. Any --checkpoint is provenance-only and is not claimed as loaded.",
        "- No-transform pairs retain no-reference / photometric diagnostics only; ground-truth accuracy is explicitly unavailable.",
    ))
    if metadata["warnings"]:
        lines.extend(("", "WARNINGS"))
        lines.extend(f"- {warning}" for warning in metadata["warnings"])
    return "\n".join(lines) + "\n"


def _iter_progress(items: list[tuple[str, BenchmarkPair]]) -> Iterator[tuple[str, BenchmarkPair]]:
    try:
        from tqdm import tqdm

        yield from tqdm(items, desc="Benchmarking", unit="pair")
    except ImportError:
        yield from items


def parse_methods(raw: str) -> list[str]:
    methods = [method.strip() for method in raw.split(",") if method.strip()]
    if not methods:
        raise BenchmarkError("At least one method is required.")
    invalid = sorted(set(methods) - set(METHODS))
    if invalid:
        raise BenchmarkError(f"Unsupported method(s): {', '.join(invalid)}. Choices: {', '.join(METHODS)}")
    return list(dict.fromkeys(methods))


def main() -> int:
    args = parse_args()
    if args.batch_size < 1:
        raise BenchmarkError("--batch-size must be at least 1.")
    if args.num_workers < 0:
        raise BenchmarkError("--num-workers must not be negative.")
    if args.warmup_iterations < 0 or args.benchmark_iterations < 1:
        raise BenchmarkError("--warmup-iterations must be >= 0 and --benchmark-iterations must be >= 1.")

    warnings: list[str] = []
    seed_metadata = set_reproducible_seed(args.seed)
    device = resolve_device(args.device, warnings)
    methods = parse_methods(args.methods)
    pairs, manifest_path = discover_pairs(args.test_data)
    if args.max_pairs is not None:
        if args.max_pairs < 1:
            raise BenchmarkError("--max-pairs must be at least 1 when supplied.")
        warnings.append("--max-pairs is for smoke tests; do not use it for final presentation metrics.")
        pairs = pairs[:args.max_pairs]
    if args.batch_size != 1:
        warnings.append("The existing registration API is pair-wise; requested batch size is recorded but effective batch size is 1.")
    if args.num_workers != 0:
        warnings.append("The existing registration API has no DataLoader; requested workers are recorded but I/O is synchronous.")
    checkpoint = file_fingerprint(args.checkpoint)
    if checkpoint is not None:
        warnings.append("Checkpoint was fingerprinted for provenance only; no compatible checkpoint loader is present in this repository.")

    output_dir = args.output_dir.resolve()
    (output_dir / "plots").mkdir(parents=True, exist_ok=True)
    base_config = PipelineConfig() if args.config is None else load_config(args.config)

    # Configure once per method without mutating the caller's config file.
    work_items = [(method, pair) for method in methods for pair in pairs]
    visual_cache: dict[tuple[str, str], dict[str, np.ndarray]] = {}
    records: list[dict[str, Any]] = []
    overall_started = time.perf_counter()

    # Warm-up has no score and does not touch pair artifacts. It occurs on
    # preloaded test arrays and is never included in reported latency.
    if args.warmup_iterations and work_items:
        warm_method, warm_pair = work_items[0]
        warm_config = base_config.model_copy(update={"matcher": warm_method, "device": device})
        try:
            warm_source, _, _ = load_image_any(warm_pair.source_path)
            warm_reference, _, _ = load_image_any(warm_pair.reference_path)
            warm_descriptor = Pair.from_paths(ref=warm_pair.reference_path, mov=warm_pair.source_path)
            measure_matcher_stage(
                warm_source, warm_reference, warm_descriptor, warm_config, device, args.warmup_iterations
            )
        except Exception as exc:
            warnings.append(f"Warm-up did not complete ({type(exc).__name__}: {exc}); benchmark pairs will still be attempted.")

    for method, pair in _iter_progress(work_items):
        config = base_config.model_copy(update={"matcher": method, "device": device})
        record, visuals = evaluate_one_pair(
            benchmark_pair=pair,
            method=method,
            output_dir=output_dir,
            config=config,
            device=device,
            iterations=args.benchmark_iterations,
            seed=args.seed + len(records),
        )
        records.append(record)
        if visuals is not None:
            visual_cache[(method, pair.pair_id)] = visuals
        if record["status"] != "success":
            print(f"[WARN] {method}/{pair.pair_id} failed: {record['error']}", file=sys.stderr)

    aggregate = aggregate_records(records)
    plot_paths = create_distribution_plot(records, output_dir)
    comparison_path = create_comparison_plot(aggregate, output_dir)
    if comparison_path:
        plot_paths.append(comparison_path)
    qualitative_paths = [] if args.no_qualitative else create_qualitative_examples(records, visual_cache, output_dir)

    gpu_peaks = [
        _metric_value(record, ("resource_usage", "gpu_peak_memory_allocated_bytes"))
        for record in records
    ]
    rss_peaks = [
        _metric_value(record, ("resource_usage", "process_peak_rss_bytes"))
        for record in records
    ]
    results: dict[str, Any] = {
        "schema_version": 1,
        "metadata": {
            "test_data": str(args.test_data.resolve()),
            "manifest": str(manifest_path) if manifest_path else None,
            "test_sample_count": len(pairs),
            "test_selection": "Only pairs discovered under --test-data were used; training data is never loaded by this script.",
            "checkpoint": checkpoint,
            "requested": {
                "batch_size": args.batch_size,
                "num_workers": args.num_workers,
                "device": args.device,
                "warmup_iterations": args.warmup_iterations,
                "benchmark_iterations": args.benchmark_iterations,
                "methods": methods,
            },
            "effective": {"batch_size": 1, "num_workers": 0, "device": device},
            "seed": seed_metadata,
            "environment": environment_metadata(device),
            "preprocessing_configuration": base_config.model_dump(mode="json"),
            "warnings": warnings,
            "total_wall_time_seconds": time.perf_counter() - overall_started,
        },
        "records": records,
        "aggregate": aggregate,
        "resource_summary": {
            "model_parameter_count": None,
            "model_parameter_count_note": (
                "Unavailable: the pipeline creates matcher instances internally and exposes no persistent model object."
            ),
            "checkpoint_size_bytes": checkpoint["size_bytes"] if checkpoint else None,
            "gpu_peak_memory_bytes": int(max(value for value in gpu_peaks if value is not None)) if any(value is not None for value in gpu_peaks) else None,
            "peak_process_rss_bytes": int(max(value for value in rss_peaks if value is not None)) if any(value is not None for value in rss_peaks) else None,
        },
        "plots": plot_paths,
        "qualitative_examples": qualitative_paths,
    }
    summary = make_summary(results)
    (output_dir / "results.json").write_text(json.dumps(results, indent=2, allow_nan=False), encoding="utf-8")
    write_csv(output_dir / "results.csv", flatten_records_for_csv(records))
    (output_dir / "summary.txt").write_text(summary, encoding="utf-8")
    print(summary)
    print(f"Results written to: {output_dir}")
    return 0 if aggregate["successful_pairs"] > 0 else 2


if __name__ == "__main__":
    try:
        raise SystemExit(main())
    except BenchmarkError as exc:
        print(f"benchmark.py: error: {exc}", file=sys.stderr)
        raise SystemExit(2)
