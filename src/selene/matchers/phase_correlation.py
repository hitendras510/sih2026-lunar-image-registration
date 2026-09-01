"""FFT-based phase correlation for translation priors and coarse alignment.

Owner: P3
"""
from __future__ import annotations

import numpy as np
import cv2
from skimage.registration import phase_cross_correlation
from .sift_baseline import match_sift


def match_phase_correlation(
    img_src: np.ndarray,
    img_ref: np.ndarray,
    upsample_factor: int = 10,
    grid_points: int = 16,
) -> tuple[np.ndarray, np.ndarray, np.ndarray]:
    """Compute sub-pixel translation offset using FFT Phase Cross-Correlation.

    Generates synthetic grid correspondence pairs shifted by the detected global translation (dy, dx).

    Args:
        img_src: Source image.
        img_ref: Reference image.
        upsample_factor: Sub-pixel upsampling factor.
        grid_points: Number of regular points along each dimension to sample correspondences.

    Returns:
        (pts_src, pts_ref, scores)
    """
    try:
        def _to_2d(im: np.ndarray) -> np.ndarray:
            if im.ndim == 3:
                im = im.mean(axis=-1)
            return im.astype(np.float32)

        src_f = _to_2d(img_src)
        ref_f = _to_2d(img_ref)

        # If shapes differ, resample src_f to ref_f shape for phase correlation
        if src_f.shape != ref_f.shape:
            src_eval = cv2.resize(src_f, (ref_f.shape[1], ref_f.shape[0]), interpolation=cv2.INTER_LINEAR)
        else:
            src_eval = src_f

        # Calculate global shift in *reference* pixel space: shift = (dy, dx)
        shift, error, _ = phase_cross_correlation(
            ref_f,
            src_eval,
            upsample_factor=upsample_factor
        )
        dy_ref, dx_ref = float(shift[0]), float(shift[1])

        h_src, w_src = src_f.shape[:2]
        h_ref, w_ref = ref_f.shape[:2]

        ys = np.linspace(h_src * 0.1, h_src * 0.9, grid_points, dtype=np.float32)
        xs = np.linspace(w_src * 0.1, w_src * 0.9, grid_points, dtype=np.float32)
        gx, gy = np.meshgrid(xs, ys)

        pts_src = np.stack([gx.ravel(), gy.ravel()], axis=1)
        pts_ref = np.stack(
            [
                pts_src[:, 0] * (w_ref / float(w_src)) + dx_ref,
                pts_src[:, 1] * (h_ref / float(h_src)) + dy_ref,
            ],
            axis=1,
        ).astype(np.float32)

        valid = (
            (pts_ref[:, 0] >= 0)
            & (pts_ref[:, 0] < w_ref)
            & (pts_ref[:, 1] >= 0)
            & (pts_ref[:, 1] < h_ref)
        )

        pts_src = pts_src[valid]
        pts_ref = pts_ref[valid]

        if len(pts_src) >= 4:
            confidence = float(max(0.1, 1.0 - float(error)))
            scores = np.full(len(pts_src), confidence, dtype=np.float32)
            return pts_src, pts_ref, scores

    except Exception:
        pass

    return match_sift(img_src, img_ref)

