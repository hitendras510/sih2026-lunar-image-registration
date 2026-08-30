"""SELENE-MATCH command-line entry point and orchestrator.

    selene run    --src <path> --ref <path> --out <job_dir>
    selene eval   --job <job_dir>
    selene export --job <job_dir> --zip <output.zip>

Wires Stage 0 -> Stage 8 in order.
"""
from __future__ import annotations

import argparse
import json
import shutil
import zipfile
from pathlib import Path
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
from selene.robust.magsac import find_homography_magsac
from selene.robust.uniform_sampler import sample_uniform_gcps
from selene.warp.subpixel_lk import refine_subpixel_lk
from selene.warp.tps import warp_tps
from selene.warp.piecewise_affine import piecewise_affine_warp
from selene.warp.export_geotiff import export_geotiff
from selene.eval.metrics import compute_metrics, MetricsResult
from selene.eval.plots import plot_checkerboard, plot_quiver, plot_coverage_heatmap
from selene.eval.report_pdf import generate_pdf_report


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
) -> dict:
    """Execute end-to-end SELENE-MATCH registration pipeline (Stages 0 - 8)."""
    if config is None:
        config = PipelineConfig()

    out_path = Path(out_dir)
    out_path.mkdir(parents=True, exist_ok=True)
    setup_logging(job_id=job_id, log_dir=out_path)
    log = get_logger("pipeline")

    log.info(f"Starting SELENE-MATCH pipeline: job={job_id}")
    log.info(f"Source: {src_path} | Reference: {ref_path}")

    # ── Stage 1: Ingest & Geometry ────────────────────────────────────────────
    pair = Pair.from_paths(ref=ref_path, mov=src_path)
    img_src, crs_src, trans_src = load_image_any(src_path)
    img_ref, crs_ref, trans_ref = load_image_any(ref_path)

    # Footprint geometry pre-cropping if footprint metadata available
    if pair.mov_meta.footprint_wkt:
        img_ref = crop_reference_to_pair(img_ref, trans_ref, pair.mov_meta.footprint_wkt)

    log.info(f"Stage 1 Ingest: src_shape={img_src.shape}, ref_shape={img_ref.shape}, Δaz={pair.delta_sun_az:.1f}°, gsd_ratio={pair.gsd_ratio:.2f}")

    # ── Stage 2: GSD Pyramid Scale Equalization ──────────────────────────────
    common_gsd_m = max(pair.ref_meta.gsd_m, pair.mov_meta.gsd_m)
    img_src_work = resample_to_gsd(img_src, pair.mov_meta.gsd_m, common_gsd_m)
    img_ref_work = resample_to_gsd(img_ref, pair.ref_meta.gsd_m, common_gsd_m)
    log.info(f"GSD Pyramid: resampled to common GSD={common_gsd_m:.2f}m | src_work={img_src_work.shape}, ref_work={img_ref_work.shape}")

    # ── Stage 2b: Illumination Shadow Masking ───────────────────────────────
    shadow_mask_src = detect_shadows(img_src_work)
    shadow_mask_ref = detect_shadows(img_ref_work)
    log.info(f"Shadow Mask: computed exclusion zones (src_shadow_pixels={np.count_nonzero(shadow_mask_src)})")

    # ── Stage 3/4: Matching Ensemble & Gate (Multi-Scale Pyramid) ───────────────
    log.info("Stage 3/4: Routing through matcher gate via GSD pyramid...")
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
    log.info("Stage 5: Robust fitting via MAGSAC++...")
    H_fit, inlier_mask = find_homography_magsac(pts_src_nat, pts_ref_nat, threshold_px=config.magsac_threshold_m)
    log.info(f"MAGSAC++ retained {np.sum(inlier_mask)} inliers / {len(pts_src_nat)} total")

    pts_src_in = pts_src_nat[inlier_mask]
    pts_ref_in = pts_ref_nat[inlier_mask]
    scores_in = scores[inlier_mask] if len(scores) == len(inlier_mask) else None

    # Spatial uniformity sampling with shadow mask exclusion
    pts_src_gcp, pts_ref_gcp, _ = sample_uniform_gcps(
        pts_src_in,
        pts_ref_in,
        scores=scores_in,
        image_shape=img_src.shape[:2],
        grid_cells=config.grid_cells,
        min_dist_px=config.min_gcp_spacing_px,
        shadow_mask=shadow_mask_src,
    )
    log.info(f"Uniform sampler selected {len(pts_src_gcp)} well-distributed GCPs")

    # ── Stage 7: Sub-Pixel Refinement ─────────────────────────────────────────
    log.info("Stage 7: Sub-pixel refinement via Inverse-Compositional LK...")
    pts_src_refined, valid_lk = refine_subpixel_lk(
        img_ref=img_ref,
        img_mov=img_src,
        pts_ref=pts_ref_gcp,
        pts_mov=pts_src_gcp,
        patch_size=config.lk_patch_size,
        max_iters=config.lk_max_iter,
        eps=config.lk_eps,
    )
    pts_src_final = pts_src_refined[valid_lk]
    pts_ref_final = pts_ref_gcp[valid_lk]
    log.info(f"Sub-pixel refinement validated {len(pts_src_final)} GCPs")

    # ── Stage 6: Warping & Co-Registration ────────────────────────────────────
    log.info(f"Stage 6: Warping moving image using [{config.warp_model}]...")
    ref_shape = img_ref.shape[:2]
    if config.warp_model == "tps" and len(pts_src_final) >= config.min_gcps_for_tps:
        warped = warp_tps(img_src, pts_src_final, pts_ref_final, output_shape=ref_shape)
    elif config.warp_model == "piecewise_affine" and len(pts_src_final) >= 4:
        warped = piecewise_affine_warp(img_src, pts_src_final, pts_ref_final, output_shape=ref_shape)
    else:
        # Fallback to homography warp
        H_final, _ = cv2.findHomography(pts_src_final, pts_ref_final, cv2.RANSAC)
        if H_final is not None:
            warped = cv2.warpPerspective(img_src, H_final, (ref_shape[1], ref_shape[0]))
        else:
            warped = img_src

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
        f.write("src_x,src_y,ref_x,ref_y\n")
        for (sx, sy), (rx, ry) in zip(pts_src_final, pts_ref_final):
            f.write(f"{sx:.3f},{sy:.3f},{rx:.3f},{ry:.3f}\n")

    # ── Stage 8: Evaluation & Deliverables ────────────────────────────────────
    log.info("Stage 8: Generating metrics, plots, and deliverable report...")
    metrics = compute_metrics(
        pts_src=pts_src_final,
        pts_dst=pts_ref_final,
        gsd_m=pair.mov_meta.gsd_m,
        H_fit=H_fit,
        image_shape=ref_shape,
        shadow_mask=shadow_mask_ref,
    )

    metrics_json = out_path / "metrics.json"
    with open(metrics_json, "w") as f:
        json.dump(metrics.to_dict(), f, indent=2)

    # Verification Plots
    p_checker = plot_checkerboard(img_ref, warped, out_path / "plot_checkerboard.png")
    p_quiver = plot_quiver(pts_src_final, pts_ref_final, out_path / "plot_quiver.png", image_shape=ref_shape)
    p_heatmap = plot_coverage_heatmap(pts_ref_final, out_path / "plot_coverage.png", image_shape=ref_shape)

    # Deliverable PDF
    pdf_report = generate_pdf_report(
        job_dir=out_path,
        metrics=metrics,
        job_id=job_id,
        plots=[p_checker, p_quiver, p_heatmap],
    )

    log.info(f"Pipeline completed successfully. RMSE={metrics.rmse_m:.2f} m ({metrics.rmse_px:.2f} px)")

    return {
        "job_id": job_id,
        "status": "success",
        "registered_geotiff": str(registered_tif),
        "matches_csv": str(matches_csv),
        "metrics": metrics.to_dict(),
        "pdf_report": str(pdf_report),
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
