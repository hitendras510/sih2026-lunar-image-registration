"""cv2.findHomography(USAC_MAGSAC) wrapper + mask return.

Owner: P3
"""
from __future__ import annotations

import numpy as np
import cv2


def threshold_m_to_px(threshold_m: float, gsd_m: float) -> float:
    """Convert a MAGSAC threshold in metres to pixels at the given GSD."""
    return float(max(1.0, float(threshold_m) / max(float(gsd_m), 1e-6)))


def find_homography_magsac(
    pts_src: np.ndarray,
    pts_dst: np.ndarray,
    threshold_px: float = 4.0,
    confidence: float = 0.999,
    max_iters: int = 10000,
) -> tuple[np.ndarray | None, np.ndarray]:
    """Estimate 3x3 Homography using OpenCV MAGSAC++ (USAC_MAGSAC).

    MAGSAC++ provides marginalizing sample consensus for superior robustness
    over standard RANSAC under noisy lunar feature conditions.

    Args:
        pts_src: (N, 2) source coordinates.
        pts_dst: (N, 2) destination/reference coordinates.
        threshold_px: Error threshold in pixels.
        confidence: Desired confidence level.
        max_iters: Maximum RANSAC iterations.

    Returns:
        (H, inlier_mask) where H is (3, 3) float64 array and inlier_mask is (N,) bool array.
    """
    if len(pts_src) < 4 or len(pts_dst) < 4:
        return None, np.zeros(len(pts_src), dtype=bool)

    pts_src_f = pts_src.reshape(-1, 1, 2).astype(np.float32)
    pts_dst_f = pts_dst.reshape(-1, 1, 2).astype(np.float32)

    # Use USAC_MAGSAC if available, fallback to RANSAC
    method = cv2.USAC_MAGSAC if hasattr(cv2, "USAC_MAGSAC") else cv2.RANSAC

    H, mask = cv2.findHomography(
        pts_src_f,
        pts_dst_f,
        method=method,
        ransacReprojThreshold=threshold_px,
        confidence=confidence,
        maxIters=max_iters,
    )

    if mask is None or H is None:
        return None, np.zeros(len(pts_src), dtype=bool)

    inliers = (mask.ravel() == 1)
    return H, inliers


def estimate_affine_magsac(
    pts_src: np.ndarray,
    pts_dst: np.ndarray,
    threshold_px: float = 4.0,
) -> tuple[np.ndarray | None, np.ndarray]:
    """Estimate 2x3 Affine transformation using RANSAC / MAGSAC.

    Args:
        pts_src: (N, 2) source coordinates.
        pts_dst: (N, 2) target coordinates.
        threshold_px: Inlier reprojection threshold.

    Returns:
        (M, inlier_mask) where M is (2, 3) float64 array.
    """
    if len(pts_src) < 3 or len(pts_dst) < 3:
        return None, np.zeros(len(pts_src), dtype=bool)

    pts_src_f = pts_src.reshape(-1, 1, 2).astype(np.float32)
    pts_dst_f = pts_dst.reshape(-1, 1, 2).astype(np.float32)

    M, inliers = cv2.estimateAffine2D(
        pts_src_f,
        pts_dst_f,
        method=cv2.RANSAC,
        ransacReprojThreshold=threshold_px,
    )

    if M is None or inliers is None:
        return None, np.zeros(len(pts_src), dtype=bool)

    return M, (inliers.ravel() == 1)
