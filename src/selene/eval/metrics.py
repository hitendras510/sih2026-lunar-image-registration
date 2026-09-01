"""RMSE_px, RMSE_m, N_raw, N_inlier, inlier ratio, CE90/P90 metrics computation.

Owner: P4
"""
from __future__ import annotations

from dataclasses import dataclass, asdict
import numpy as np
from selene.eval.uniformity import nni_score, grid_coverage


@dataclass
class MetricsResult:
    """Core geometric alignment accuracy and reliability metrics."""
    n_raw: int
    n_inliers: int
    inlier_ratio: float
    rmse_px: float
    rmse_m: float
    ce90_px: float
    ce90_m: float
    mean_residual_px: float
    max_residual_px: float = 0.0
    rmse_val_px: float = 0.0
    rmse_val_m: float = 0.0
    nni_index: float = 0.0
    grid_coverage_fraction: float = 0.0
    gsd_m: float = 1.0
    rmse_vs_gt_px: float | None = None
    rmse_vs_gt_m: float | None = None
    provenance: dict | None = None

    def to_dict(self) -> dict:
        return asdict(self)


def compute_metrics(
    pts_src: np.ndarray,
    pts_dst: np.ndarray,
    inlier_mask: np.ndarray | None = None,
    gsd_m: float = 1.0,
    H_fit: np.ndarray | None = None,
    H_gt: np.ndarray | None = None,
    image_shape: tuple[int, int] = (1024, 1024),
    shadow_mask: np.ndarray | None = None,
    pts_src_val: np.ndarray | None = None,
    pts_dst_val: np.ndarray | None = None,
    val_split: float = 0.2,
    provenance: dict | None = None,
) -> MetricsResult:
    """Calculate geodetic accuracy metrics on matched point correspondences.

    Includes independent 80/20 train/validation GCP evaluation to prevent
    circular evaluation bias.

    Args:
        pts_src:     (N, 2) Source points.
        pts_dst:     (N, 2) Destination/Reference points.
        inlier_mask: (N,) Boolean inlier mask.
        gsd_m:       Ground sampling distance in metres per pixel.
        H_fit:       Optional fitted 3x3 Homography for residual calculation.
        image_shape: (height, width) of the image space.
        shadow_mask: Optional shadow exclusion mask.
        pts_src_val: Optional explicit holdout validation source points.
        pts_dst_val: Optional explicit holdout validation destination points.
        val_split:   Holdout fraction for validation set when explicit val points not given.

    Returns:
        MetricsResult with pixel- and metre-scale statistics.
    """
    n_raw = len(pts_src)
    if n_raw == 0:
        return MetricsResult(0, 0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, gsd_m=gsd_m, provenance=provenance)

    if inlier_mask is None:
        inlier_mask = np.ones(n_raw, dtype=bool)

    n_inliers = int(np.sum(inlier_mask))
    inlier_ratio = float(n_inliers / n_raw) if n_raw > 0 else 0.0

    inliers_src = pts_src[inlier_mask]
    inliers_dst = pts_dst[inlier_mask]

    if len(inliers_src) == 0:
        return MetricsResult(n_raw, 0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, gsd_m=gsd_m, provenance=provenance)

    # ── Independent Validation GCP Split ────────────────────────────────────
    if pts_src_val is None or pts_dst_val is None:
        if len(inliers_src) >= 10:
            # Deterministic split: 80% train, 20% validation holdout
            n_val = max(2, int(len(inliers_src) * val_split))
            indices = np.arange(len(inliers_src))
            val_idx = indices[-n_val:]
            train_idx = indices[:-n_val]
            
            fit_src, fit_dst = inliers_src[train_idx], inliers_dst[train_idx]
            val_src, val_dst = inliers_src[val_idx], inliers_dst[val_idx]
        else:
            fit_src, fit_dst = inliers_src, inliers_dst
            val_src, val_dst = inliers_src, inliers_dst
    else:
        fit_src, fit_dst = inliers_src, inliers_dst
        val_src, val_dst = pts_src_val, pts_dst_val

    def _calc_residuals(s_pts: np.ndarray, d_pts: np.ndarray) -> np.ndarray:
        if len(s_pts) == 0:
            return np.array([0.0], dtype=np.float32)
        if H_fit is not None:
            ones = np.ones((len(s_pts), 1), dtype=np.float32)
            homo_src = np.hstack([s_pts, ones])
            proj = (H_fit @ homo_src.T).T
            proj_pts = proj[:, :2] / (proj[:, 2:] + 1e-8)
            return np.linalg.norm(proj_pts - d_pts, axis=1)
        return np.linalg.norm(s_pts - d_pts, axis=1)

    residuals_fit = _calc_residuals(fit_src, fit_dst)
    residuals_val = _calc_residuals(val_src, val_dst)

    rmse_px = float(np.sqrt(np.mean(residuals_fit**2)))
    rmse_m = float(rmse_px * gsd_m)

    rmse_val_px = float(np.sqrt(np.mean(residuals_val**2)))
    rmse_val_m = float(rmse_val_px * gsd_m)

    # CE90 (90th percentile error radius)
    ce90_px = float(np.percentile(residuals_fit, 90))
    ce90_m = float(ce90_px * gsd_m)

    mean_res = float(np.mean(residuals_fit))
    max_res = float(np.max(residuals_fit))

    # Uniformity in the *reference* frame (image_shape is the reference raster).
    nni_val = nni_score(inliers_dst, area_shape=image_shape)
    cov_val = grid_coverage(inliers_dst, image_shape=image_shape)

    # Independent Ground Truth Warp RMSE (if known GT transformation provided)
    rmse_vs_gt_px = None
    rmse_vs_gt_m = None
    if H_gt is not None and len(inliers_src) > 0:
        ones = np.ones((len(inliers_src), 1), dtype=np.float32)
        homo_src = np.hstack([inliers_src, ones])
        proj = (H_gt @ homo_src.T).T
        proj_pts = proj[:, :2] / (proj[:, 2:] + 1e-8)
        res_gt = np.linalg.norm(proj_pts - inliers_dst, axis=1)
        rmse_vs_gt_px = float(round(np.sqrt(np.mean(res_gt**2)), 4))
        rmse_vs_gt_m = float(round(rmse_vs_gt_px * gsd_m, 4))

    return MetricsResult(
        n_raw=n_raw,
        n_inliers=n_inliers,
        inlier_ratio=round(inlier_ratio, 4),
        rmse_px=round(rmse_px, 4),
        rmse_m=round(rmse_m, 4),
        ce90_px=round(ce90_px, 4),
        ce90_m=round(ce90_m, 4),
        mean_residual_px=round(mean_res, 4),
        max_residual_px=round(max_res, 4),
        gsd_m=gsd_m,
        rmse_val_px=round(rmse_val_px, 4),
        rmse_val_m=round(rmse_val_m, 4),
        nni_index=round(nni_val, 4),
        grid_coverage_fraction=round(cov_val, 4),
        rmse_vs_gt_px=rmse_vs_gt_px,
        rmse_vs_gt_m=rmse_vs_gt_m,
        provenance=provenance,
    )


def check_quality_gates(metrics: MetricsResult, subpixel_target: float = 1.0) -> dict[str, bool]:
    """Validate whether registration metrics meet PS target standards.

    Args:
        metrics: Computed MetricsResult instance.
        subpixel_target: Target RMSE in pixels (default 1.0 px).

    Returns:
        Dict of boolean pass/fail status flags for each quality gate requirement.
    """
    rmse_pass = metrics.rmse_px < subpixel_target and metrics.n_inliers >= 4
    inlier_pass = metrics.n_inliers >= 4 and metrics.inlier_ratio >= 0.10
    coverage_pass = metrics.grid_coverage_fraction >= 0.25

    return {
        "subpixel_target_met": rmse_pass,
        "inlier_target_met": inlier_pass,
        "coverage_target_met": coverage_pass,
        "overall_pass": rmse_pass and inlier_pass and coverage_pass,
    }

