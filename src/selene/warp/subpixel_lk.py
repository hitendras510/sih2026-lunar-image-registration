"""Inverse-compositional Lucas-Kanade refinement on patches.

Owner: P3
"""
from __future__ import annotations

import numpy as np
import cv2


def refine_subpixel_lk(
    img_ref: np.ndarray,
    img_mov: np.ndarray,
    pts_ref: np.ndarray,
    pts_mov: np.ndarray,
    patch_size: int = 21,
    max_iters: int = 30,
    eps: float = 0.01,
    H_coarse: np.ndarray | None = None,
) -> tuple[np.ndarray, np.ndarray]:
    """Refine moving point locations to sub-pixel accuracy using Inverse-Compositional Lucas-Kanade.

    Precomputes image gradients on the template (reference patch) for fast O(1) iterative convergence.
    When *H_coarse* is provided, initial moving points are transformed to pre-align patches before IC-LK.

    Args:
        img_ref: Reference image (float32 [0, 1] or uint8).
        img_mov: Moving image (float32 [0, 1] or uint8).
        pts_ref: (N, 2) reference patch center coordinates (x, y).
        pts_mov: (N, 2) initial moving patch center coordinates (x, y).
        patch_size: Patch dimension in pixels (odd number).
        max_iters: Max optimization iterations.
        eps: Convergence delta norm threshold.
        H_coarse: Optional 3x3 initial Homography to pre-align moving points.

    Returns:
        (refined_pts_mov, valid_mask)
    """
    ref_f = img_ref.astype(np.float32)
    if ref_f.max() > 1.0:
        ref_f /= 255.0

    mov_f = img_mov.astype(np.float32)
    if mov_f.max() > 1.0:
        mov_f /= 255.0

    half_p = patch_size // 2
    h_r, w_r = ref_f.shape[:2]
    h_m, w_m = mov_f.shape[:2]

    # Pre-transform moving points using H_coarse if provided
    if H_coarse is not None:
        ones = np.ones((len(pts_mov), 1), dtype=np.float32)
        homo_m = np.hstack([pts_mov, ones])
        proj = (H_coarse @ homo_m.T).T
        pts_mov_start = proj[:, :2] / (proj[:, 2:] + 1e-8)
    else:
        pts_mov_start = pts_mov.copy()

    refined_mov = pts_mov_start.copy().astype(np.float32)
    valid_mask = np.ones(len(pts_ref), dtype=bool)

    # Pixel grid relative to patch center
    px = np.arange(-half_p, half_p + 1, dtype=np.float32)
    py = np.arange(-half_p, half_p + 1, dtype=np.float32)
    gx, gy = np.meshgrid(px, py)

    for i in range(len(pts_ref)):
        rx, ry = pts_ref[i]
        mx, my = pts_mov_start[i]

        # Check bounds for reference patch
        if (
            rx - half_p < 0
            or rx + half_p >= w_r
            or ry - half_p < 0
            or ry + half_p >= h_r
        ):
            valid_mask[i] = False
            continue

        # Extract reference template patch T(x)
        T = ref_f[int(ry) - half_p : int(ry) + half_p + 1, int(rx) - half_p : int(rx) + half_p + 1]

        # Compute gradient on template T
        grad_y, grad_x = np.gradient(T)
        grad = np.stack([grad_x.ravel(), grad_y.ravel()], axis=1)  # (P^2, 2)

        # Hessian matrix H = sum(grad^T * grad) with Tikhonov regularization
        H = grad.T @ grad
        trace_H = np.trace(H)
        if trace_H < 1e-8:
            valid_mask[i] = False
            continue

        H_reg = H + np.eye(2, dtype=np.float32) * (1e-6 * max(1.0, float(trace_H)))
        H_inv = np.linalg.inv(H_reg)

        # Iterative update on moving image position (p = [dx, dy])
        cur_mx, cur_my = mx, my
        converged = False

        for it in range(max_iters):
            # Check bounds on moving image
            if (
                cur_mx - half_p < 0
                or cur_mx + half_p >= w_m
                or cur_my - half_p < 0
                or cur_my + half_p >= h_m
            ):
                break

            # Sample warped image I(W(x; p)) via bilinear interpolation
            sample_x = (gx + cur_mx).astype(np.float32)
            sample_y = (gy + cur_my).astype(np.float32)
            I_warp = cv2.remap(mov_f, sample_x, sample_y, interpolation=cv2.INTER_LINEAR)

            # Error image: error = I(W(x; p)) - T(x)
            diff = (I_warp - T).ravel()

            # In inverse-compositional LK: dp = H_inv @ (grad.T @ diff), update is p <- p - dp
            dp = H_inv @ (grad.T @ diff)
            dp = np.clip(dp, -3.0, 3.0)

            cur_mx -= dp[0]
            cur_my -= dp[1]

            if np.linalg.norm(dp) < eps:
                converged = True
                break

        refined_mov[i] = [cur_mx, cur_my]

    return refined_mov, valid_mask


def refine_subpixel_ecc(
    img_ref: np.ndarray,
    img_mov: np.ndarray,
    pts_ref: np.ndarray,
    pts_mov: np.ndarray,
    patch_size: int = 31,
    max_iters: int = 30,
    eps: float = 1e-3,
) -> tuple[np.ndarray, np.ndarray]:
    """Refine moving point locations using Enhanced Correlation Coefficient (ECC) alignment.

    Args:
        img_ref: Reference image (float32 or uint8).
        img_mov: Moving image (float32 or uint8).
        pts_ref: (N, 2) reference patch center coordinates.
        pts_mov: (N, 2) moving patch center coordinates.
        patch_size: Patch dimension in pixels.
        max_iters: Maximum ECC iterations.
        eps: Convergence threshold.

    Returns:
        (refined_pts_mov, valid_mask)
    """
    ref_f = (img_ref * 255.0).astype(np.uint8) if img_ref.dtype == np.float32 else img_ref
    mov_f = (img_mov * 255.0).astype(np.uint8) if img_mov.dtype == np.float32 else img_mov

    half_p = patch_size // 2
    h_r, w_r = ref_f.shape[:2]
    h_m, w_m = mov_f.shape[:2]

    refined_mov = pts_mov.copy().astype(np.float32)
    valid_mask = np.ones(len(pts_ref), dtype=bool)

    criteria = (cv2.TERM_CRITERIA_EPS | cv2.TERM_CRITERIA_COUNT, max_iters, eps)

    for i in range(len(pts_ref)):
        rx, ry = int(pts_ref[i][0]), int(pts_ref[i][1])
        mx, my = int(pts_mov[i][0]), int(pts_mov[i][1])

        if (rx - half_p < 0 or rx + half_p >= w_r or ry - half_p < 0 or ry + half_p >= h_r or
            mx - half_p < 0 or mx + half_p >= w_m or my - half_p < 0 or my + half_p >= h_m):
            valid_mask[i] = False
            continue

        p_ref = ref_f[ry - half_p : ry + half_p + 1, rx - half_p : rx + half_p + 1]
        p_mov = mov_f[my - half_p : my + half_p + 1, mx - half_p : mx + half_p + 1]

        warp_matrix = np.eye(2, 3, dtype=np.float32)
        try:
            _, warp_matrix = cv2.findTransformECC(
                p_ref, p_mov, warp_matrix, cv2.MOTION_TRANSLATION, criteria
            )
            dx = warp_matrix[0, 2]
            dy = warp_matrix[1, 2]
            refined_mov[i] = [pts_mov[i][0] + dx, pts_mov[i][1] + dy]
        except cv2.error:
            valid_mask[i] = False

    return refined_mov, valid_mask

