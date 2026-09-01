"""SELENE-MATCH command-line entry point and orchestrator.

    selene run    --src <path> --ref <path> --out <job_dir>
    selene eval   --job <job_dir>
    selene export --job <job_dir> --zip <output.zip>

Wires Stage 0 -> Stage 8 in order.
"""
from __future__ import annotations

import argparse
import datetime
import json
import shutil
import zipfile
from pathlib import Path
from typing import Callable
import numpy as np
import cv2

from selene.config import PipelineConfig, load_config
from selene.utils.logging import setup_logging, get_logger
from selene.ingest.pair import Pair
from selene.ingest.geotiff_reader import read_geotiff
from selene.ingest.pds_reader import read_pds3, read_pds4
from selene.geometry.pyramid import resample_to_gsd, upscale_coordinates, match_coarse_to_fine_pyramid
from selene.geometry.mapproject_tier2 import crop_reference_to_pair
from selene.illum.shadow_mask import detect_shadows
from selene.matchers.gate import route_and_match
from selene.robust.magsac import find_homography_magsac, threshold_m_to_px
from selene.robust.uniform_sampler import sample_uniform_gcps
from selene.warp.subpixel_lk import refine_subpixel_lk
from selene.warp.tps import warp_tps
from selene.warp.piecewise_affine import piecewise_affine_warp
from selene.warp.export_geotiff import export_geotiff
from selene.eval.metrics import compute_metrics, MetricsResult, check_quality_gates
from selene.eval.plots import plot_checkerboard, plot_quiver, plot_coverage_heatmap, plot_residual_heatmap
from selene.eval.report_pdf import generate_pdf_report
from selene.utils.seeding import set_reproducible_seed


def load_image_any(path: str | Path) -> tuple[np.ndarray, object | None, object | None]:
    """Load image from GeoTIFF or common image formats (PNG, JPG, TIFF)."""
    p = Path(path)
    if not p.exists():
        raise FileNotFoundError(f"Image not found: {path}")

    # Try GeoTIFF via rasterio first
    if p.suffix.lower() in (".tif", ".tiff", ".geotif", ".geotiff"):
        try:
            arr, crs, transform, _ = read_geotiff(p)
            return arr, crs, transform
        except Exception:
            pass

    # Standard image format fallback via OpenCV
    img = cv2.imread(str(p), cv2.IMREAD_GRAYSCALE)
    if img is None:
        raise ValueError(f"Could not decode image: {p}")
    arr = (img.astype(np.float32) - img.min()) / (img.max() - img.min() + 1e-6)
    return arr, None, None


def run_pipeline(
    src_path: str | Path,
    ref_path: str | Path,
    out_dir: str | Path,
    config: PipelineConfig | None = None,
    job_id: str = "job_default",
    progress_callback: Callable[[float, str], None] | None = None,
) -> dict:
    """Execute end-to-end SELENE-MATCH registration pipeline (Stages 0 - 8)."""
    if config is None:
        config = PipelineConfig()
    
    set_reproducible_seed(config.seed if hasattr(config, "seed") else 42)

    out_path = Path(out_dir)
    out_path.mkdir(parents=True, exist_ok=True)
    setup_logging(job_id=job_id, log_dir=out_path)
    log = get_logger("pipeline")

    def _notify(prog: float, msg: str):
        log.info(msg)
        if progress_callback:
            try:
                progress_callback(prog, msg)
            except Exception:
                pass

    _notify(0.05, f"Starting SELENE-MATCH pipeline: job={job_id}")
    log.info(f"Source: {src_path} | Reference: {ref_path}")

    # ── Stage 1: Ingest & Geometry ────────────────────────────────────────────
    _notify(0.12, "Stage 1: Ingesting metadata & reading rasters")
    pair = Pair.from_paths(ref=ref_path, mov=src_path)
    img_src, crs_src, trans_src = load_image_any(src_path)
    img_ref, crs_ref, trans_ref = load_image_any(ref_path)

    # Footprint geometry pre-cropping if footprint metadata and a geotransform exist
    if pair.mov_meta.footprint_wkt and trans_ref is not None:
        img_ref = crop_reference_to_pair(img_ref, trans_ref, pair.mov_meta.footprint_wkt)

    log.info(f"Stage 1 Ingest: src_shape={img_src.shape}, ref_shape={img_ref.shape}, Δaz={pair.delta_sun_az:.1f}°, gsd_ratio={pair.gsd_ratio:.2f}")

    # ── Stage 2: GSD Pyramid Scale Equalization ──────────────────────────────
    _notify(0.25, "Stage 2: Building GSD pyramid & resampling")
    common_gsd_m = max(pair.ref_meta.gsd_m, pair.mov_meta.gsd_m)
    img_src_work = resample_to_gsd(img_src, pair.mov_meta.gsd_m, common_gsd_m)
    img_ref_work = resample_to_gsd(img_ref, pair.ref_meta.gsd_m, common_gsd_m)
    log.info(f"GSD Pyramid: resampled to common GSD={common_gsd_m:.2f}m | src_work={img_src_work.shape}, ref_work={img_ref_work.shape}")

    # ── Stage 2b: Illumination Shadow Masking ───────────────────────────────
    _notify(0.35, "Stage 3: Illumination shadow masking")
    shadow_mask_src = detect_shadows(img_src)
    shadow_mask_ref = detect_shadows(img_ref)
    log.info(f"Shadow Mask: computed exclusion zones (src_shadow_pixels={np.count_nonzero(shadow_mask_src)})")

    # ── Stage 3/4: Matching Ensemble & Gate (Multi-Scale Pyramid) ───────────────
    _notify(0.50, "Stage 4: Feature matching & correspondence generation")
    pts_src_w, pts_ref_w, scores, matcher_name = match_coarse_to_fine_pyramid(
        img_src=img_src,
        img_ref=img_ref,
        pair=pair,
        config=config,
        route_and_match_fn=route_and_match,
    )
    log.info(f"Matcher [{matcher_name}] found {len(pts_src_w)} candidate correspondences")

    if len(pts_src_w) < 4:
        raise RuntimeError(f"Insufficient match candidates found by matcher ({len(pts_src_w)} points)")

    # Map match coordinates from working GSD space back to native pixel space
    pts_src_nat = upscale_coordinates(pts_src_w, from_gsd_m=common_gsd_m, to_gsd_m=pair.mov_meta.gsd_m)
    pts_ref_nat = upscale_coordinates(pts_ref_w, from_gsd_m=common_gsd_m, to_gsd_m=pair.ref_meta.gsd_m)

    # ── Stage 5: Robust Fit & Shadow-Aware Uniform GCP Sampling ─────────────
    _notify(0.65, "Stage 5: MAGSAC++ robust fit & uniform GCP sampling")
    magsac_px = threshold_m_to_px(config.magsac_threshold_m, pair.mov_meta.gsd_m)
    H_fit, inlier_mask = find_homography_magsac(pts_src_nat, pts_ref_nat, threshold_px=magsac_px)
    log.info(
        f"MAGSAC++ retained {np.sum(inlier_mask)} inliers / {len(pts_src_nat)} total "
        f"(threshold={magsac_px:.2f} px from {config.magsac_threshold_m:.2f} m)"
    )

    pts_src_in = pts_src_nat[inlier_mask]
    pts_ref_in = pts_ref_nat[inlier_mask]
    scores_in = scores[inlier_mask] if len(scores) == len(inlier_mask) else None

    # Spatial uniformity sampling with shadow mask exclusion
    pts_src_gcp, pts_ref_gcp, sel_idx = sample_uniform_gcps(
        pts_src_in,
        pts_ref_in,
        scores=scores_in,
        image_shape=img_src.shape[:2],
        grid_cells=config.grid_cells,
        min_dist_px=config.min_gcp_spacing_px,
        shadow_mask=shadow_mask_src,
    )
    log.info(f"Uniform sampler selected {len(pts_src_gcp)} well-distributed GCPs")

    if len(pts_src_gcp) > config.max_gcps:
        keep = np.arange(config.max_gcps)
        pts_src_gcp = pts_src_gcp[keep]
        pts_ref_gcp = pts_ref_gcp[keep]
        sel_idx = sel_idx[keep]
        log.info(f"Capped GCPs to max_gcps={config.max_gcps}")

    # ── Stage 7: Sub-Pixel Refinement ─────────────────────────────────────────
    _notify(0.78, "Stage 7: Sub-pixel IC-LK refinement")
    pts_src_refined, valid_lk = refine_subpixel_lk(
        img_ref=img_ref,
        img_mov=img_src,
        pts_ref=pts_ref_gcp,
        pts_mov=pts_src_gcp,
        patch_size=config.lk_patch_size,
        max_iters=config.lk_max_iter,
        eps=config.lk_eps,
        H_coarse=H_fit,
    )
    pts_src_final = pts_src_refined[valid_lk]
    pts_ref_final = pts_ref_gcp[valid_lk]
    
    # --- P2.1 GCP Confidence Score ---
    scores_gcp = scores_in[sel_idx] if scores_in is not None else np.ones(len(pts_src_gcp))
    scores_final = scores_gcp[valid_lk]
    
    if H_fit is not None and len(pts_src_final) > 0:
        ones = np.ones((len(pts_src_final), 1))
        homo_src = np.hstack([pts_src_final, ones])
        proj = (H_fit @ homo_src.T).T
        proj_pts = proj[:, :2] / (proj[:, 2:] + 1e-8)
        residuals = np.linalg.norm(proj_pts - pts_ref_final, axis=1)
        res_score = np.clip(1.0 - residuals / 5.0, 0, 1.0)
    else:
        res_score = np.ones(len(pts_src_final))
        
    if shadow_mask_src is not None and np.any(shadow_mask_src > 0) and len(pts_src_final) > 0:
        dist_transform = cv2.distanceTransform((shadow_mask_src == 0).astype(np.uint8), cv2.DIST_L2, 3)
        x_idx = np.clip(pts_src_final[:, 0].astype(int), 0, dist_transform.shape[1]-1)
        y_idx = np.clip(pts_src_final[:, 1].astype(int), 0, dist_transform.shape[0]-1)
        dists = dist_transform[y_idx, x_idx]
        dist_score = np.clip(dists / 50.0, 0, 1.0)
    else:
        dist_score = np.ones(len(pts_src_final))
        
    confidence = (scores_final + res_score + dist_score) / 3.0
    
    log.info(f"Sub-pixel refinement validated {len(pts_src_final)} GCPs")

    if len(pts_src_final) < 4 and H_fit is None:
        raise RuntimeError(
            f"Registration failed: only {len(pts_src_final)} valid control points and no homography."
        )

    # ── Stage 6: Warping & Co-Registration ────────────────────────────────────
    _notify(0.88, "Stage 6: Warping image & exporting GeoTIFF")
    ref_shape = img_ref.shape[:2]
    if config.warp_model == "tps" and len(pts_src_final) >= config.min_gcps_for_tps:
        warped = warp_tps(img_src, pts_src_final, pts_ref_final, output_shape=ref_shape)
    elif config.warp_model == "piecewise_affine" and len(pts_src_final) >= 4:
        warped = piecewise_affine_warp(img_src, pts_src_final, pts_ref_final, output_shape=ref_shape)
    else:
        # Fallback to homography warp
        if len(pts_src_final) >= 4:
            H_final, _ = cv2.findHomography(pts_src_final, pts_ref_final, cv2.RANSAC)
        elif H_fit is not None:
            H_final = H_fit
        else:
            H_final = None

        if H_final is None:
            raise RuntimeError("Registration failed: could not estimate a warp model.")
        warped = cv2.warpPerspective(img_src, H_final, (ref_shape[1], ref_shape[0]))

    # Export Warped GeoTIFF / Product
    registered_tif = out_path / "registered.tif"
    export_geotiff(
        img_array=warped,
        out_path=registered_tif,
        crs=crs_ref,
        transform=trans_ref,
    )
    # Also export PNG view for UI
    registered_png = out_path / "registered.png"
    cv2.imwrite(str(registered_png), (warped * 255).clip(0, 255).astype(np.uint8))

    # Save matches CSV
    matches_csv = out_path / "matches.csv"
    with open(matches_csv, "w") as f:
        f.write("src_x,src_y,ref_x,ref_y,confidence\n")
        for (sx, sy), (rx, ry), c in zip(pts_src_final, pts_ref_final, confidence):
            f.write(f"{sx:.3f},{sy:.3f},{rx:.3f},{ry:.3f},{c:.3f}\n")

    # ── Stage 8: Evaluation & Deliverables ────────────────────────────────────
    _notify(0.96, "Stage 8: Generating metrics, plots & PDF report")

    # Check for Ground Truth transformation if available
    H_gt = None
    gt_candidate = Path(src_path).parent / "ground_truth.json"
    if not gt_candidate.exists():
        gt_candidate = Path(ref_path).parent / "ground_truth.json"
    if gt_candidate.exists():
        try:
            with open(gt_candidate) as f:
                gt_data = json.load(f)
            if "homography_matrix_3x3" in gt_data:
                H_gt = np.array(gt_data["homography_matrix_3x3"], dtype=np.float64)
        except Exception:
            pass

    # Provenance metadata tracking
    git_commit = "unknown"
    try:
        import subprocess
        git_commit = subprocess.check_output(["git", "rev-parse", "HEAD"], timeout=2.0).decode().strip()
    except Exception:
        pass

    deep_available = False
    torch_ver = "none"
    try:
        import torch
        deep_available = True
        torch_ver = getattr(torch, "__version__", "unknown")
    except ImportError:
        pass

    provenance = {
        "git_commit": git_commit,
        "seed": config.seed if hasattr(config, "seed") else 42,
        "matcher_used": matcher_name,
        "deep_matcher_available": deep_available,
        "sun_geometry_inferred": pair.sun_geometry_is_inferred,
        "generated_at": datetime.datetime.now(datetime.timezone.utc).isoformat(),
        "package_versions": {"torch": torch_ver, "opencv": cv2.__version__},
    }

    metrics = compute_metrics(
        pts_src=pts_src_nat,
        pts_dst=pts_ref_nat,
        inlier_mask=inlier_mask,
        gsd_m=pair.mov_meta.gsd_m,
        H_fit=H_fit,
        H_gt=H_gt,
        image_shape=ref_shape,
        shadow_mask=shadow_mask_ref,
        provenance=provenance,
    )
    if len(pts_ref_final) >= 3:
        from selene.eval.uniformity import nni_score, grid_coverage
        metrics.nni_index = round(nni_score(pts_ref_final, area_shape=ref_shape), 4)
        metrics.grid_coverage_fraction = round(grid_coverage(pts_ref_final, image_shape=ref_shape), 4)

    metrics_dict = metrics.to_dict()
    metrics_dict["mean_confidence"] = float(np.mean(confidence)) if len(confidence) > 0 else 0.0
    metrics_dict["pct_gcp_confidence_ge_0.6"] = float(np.mean(confidence >= 0.6)) if len(confidence) > 0 else 0.0
    metrics_dict["matcher_used"] = matcher_name
    metrics_dict["n_gcp_final"] = int(len(pts_src_final))
    gates = check_quality_gates(metrics)
    metrics_dict["quality_gates"] = gates
    metrics_dict["quality_gate_pass"] = bool(gates["overall_pass"])

    metrics_json = out_path / "metrics.json"
    with open(metrics_json, "w") as f:
        json.dump(metrics_dict, f, indent=2)

    # Verification Plots
    plot_paths: list[Path] = []
    p_checker = p_quiver = p_heatmap = p_residual = None
    try:
        p_checker = plot_checkerboard(img_ref, warped, out_path / "plot_checkerboard.png")
        plot_paths.append(p_checker)
        p_quiver = plot_quiver(
            pts_src_final, pts_ref_final, out_path / "plot_quiver.png",
            image_shape=ref_shape, H_fit=H_fit,
        )
        plot_paths.append(p_quiver)
        p_heatmap = plot_coverage_heatmap(pts_ref_final, out_path / "plot_coverage.png", image_shape=ref_shape)
        plot_paths.append(p_heatmap)
        p_residual = plot_residual_heatmap(
            pts_src_final, pts_ref_final, out_path / "plot_residual_heatmap.png",
            image_shape=ref_shape, H_fit=H_fit,
        )
    except Exception as exc:
        log.exception(f"Stage 8 diagnostic plots failed: {exc}")

    pdf_report = None
    try:
        pdf_report = generate_pdf_report(
            job_dir=out_path,
            metrics=metrics,
            job_id=job_id,
            plots=plot_paths or None,
        )
    except Exception as exc:
        log.exception(f"Stage 8 PDF report failed: {exc}")

    log.info(f"Pipeline completed successfully. RMSE={metrics.rmse_m:.2f} m ({metrics.rmse_px:.2f} px)")

    return {
        "job_id": job_id,
        "status": "success",
        "registered_geotiff": str(registered_tif),
        "matches_csv": str(matches_csv),
        "metrics": metrics_dict,
        "pdf_report": str(pdf_report) if pdf_report else None,
        "residual_heatmap": str(p_residual) if p_residual else None,
    }


def main() -> None:
    parser = argparse.ArgumentParser(prog="selene", description="SELENE-MATCH Lunar Image Registration CLI")
    sub = parser.add_subparsers(dest="command", required=True)

    p_run = sub.add_parser("run", help="Run the full correspondence + registration pipeline")
    p_run.add_argument("--src", required=True, help="Path to moving source image")
    p_run.add_argument("--ref", required=True, help="Path to reference image")
    p_run.add_argument("--out", required=True, help="Output directory for products")
    p_run.add_argument("--config", default=None, help="Path to optional config.yaml")

    p_eval = sub.add_parser("eval", help="Compute/print evaluation metrics for a job")
    p_eval.add_argument("--job", required=True, help="Path to completed job directory")

    p_export = sub.add_parser("export", help="Package a job's deliverables into a zip bundle")
    p_export.add_argument("--job", required=True, help="Path to completed job directory")
    p_export.add_argument("--zip", required=True, help="Path for destination .zip file")

    args = parser.parse_args()

    if args.command == "run":
        cfg = load_config(args.config) if args.config else PipelineConfig()
        res = run_pipeline(src_path=args.src, ref_path=args.ref, out_dir=args.out, config=cfg)
        print("\n=== Registration Results ===")
        for k, v in res["metrics"].items():
            print(f"  {k}: {v}")
        print(f"\nDeliverables saved to: {args.out}")

    elif args.command == "eval":
        metrics_file = Path(args.job) / "metrics.json"
        if not metrics_file.exists():
            print(f"Error: metrics.json not found in {args.job}")
            return
        with open(metrics_file) as f:
            data = json.load(f)
        print(f"\n=== Evaluation Metrics for {args.job} ===")
        for k, v in data.items():
            print(f"  {k}: {v}")

    elif args.command == "export":
        job_dir = Path(args.job)
        zip_path = Path(args.zip)
        zip_path.parent.mkdir(parents=True, exist_ok=True)
        with zipfile.ZipFile(zip_path, "w", zipfile.ZIP_DEFLATED) as zf:
            for file in job_dir.glob("**/*"):
                if file.is_file() and not file.name.endswith(".zip"):
                    zf.write(file, arcname=file.relative_to(job_dir))
        print(f"Exported deliverable bundle to: {zip_path}")


if __name__ == "__main__":
    main()
