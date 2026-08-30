"""Focused tests for benchmark dataset discovery and transform conventions."""
from __future__ import annotations

import json
from pathlib import Path

import numpy as np

from benchmark import BenchmarkPair, discover_pairs, load_source_to_reference_ground_truth


def test_discovers_conventional_pair_directory(tmp_path: Path) -> None:
    (tmp_path / "reference.png").touch()
    (tmp_path / "synthetic_target.png").touch()

    pairs, manifest = discover_pairs(tmp_path)

    assert manifest is None
    assert len(pairs) == 1
    assert pairs[0].source_path.name == "synthetic_target.png"
    assert pairs[0].reference_path.name == "reference.png"


def test_synthetic_generator_ground_truth_uses_inverse_for_registration(tmp_path: Path) -> None:
    gt_path = tmp_path / "ground_truth.json"
    forward = [[2.0, 0.0, 4.0], [0.0, 2.0, 6.0], [0.0, 0.0, 1.0]]
    inverse = np.linalg.inv(np.asarray(forward)).tolist()
    gt_path.write_text(json.dumps({
        "dataset_info": {
            "reference_image": "reference.png",
            "synthetic_target_image": "synthetic_target.png",
        },
        "homography_matrix_3x3": forward,
        "homography_matrix_inv_3x3": inverse,
    }))
    pair = BenchmarkPair(
        pair_id="synthetic",
        source_path=tmp_path / "synthetic_target.png",
        reference_path=tmp_path / "reference.png",
        ground_truth_path=gt_path,
    )

    matrix, note = load_source_to_reference_ground_truth(pair)

    assert matrix is not None
    assert np.allclose(matrix, inverse)
    assert "inverse maps moving/source to reference" in note


def test_does_not_assume_direction_of_generic_homography(tmp_path: Path) -> None:
    gt_path = tmp_path / "ground_truth.json"
    gt_path.write_text(json.dumps({"homography_matrix_3x3": np.eye(3).tolist()}))
    pair = BenchmarkPair(
        pair_id="generic",
        source_path=tmp_path / "source.png",
        reference_path=tmp_path / "reference.png",
        ground_truth_path=gt_path,
    )

    matrix, note = load_source_to_reference_ground_truth(pair)

    assert matrix is None
    assert "direction is not explicit" in note
