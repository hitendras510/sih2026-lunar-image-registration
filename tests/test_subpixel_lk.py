"""Tests for subpixel Lucas-Kanade refinement."""
import pytest
import numpy as np
import cv2
from selene.warp.subpixel_lk import refine_subpixel_lk, refine_subpixel_ecc


def test_subpixel_lk_convergence():
    # Create rich synthetic texture with clear gradients
    y, x = np.mgrid[0:200, 0:200]
    img_ref = (np.exp(-((x - 100.0)**2 + (y - 100.0)**2) / 400.0) + 0.3 * np.sin(x * 0.2) * np.cos(y * 0.2)).astype(np.float32)
    img_ref = (img_ref - img_ref.min()) / (img_ref.max() - img_ref.min() + 1e-6)

    # Shift by known subpixel amount (dx=0.4, dy=-0.3)
    M = np.array([[1.0, 0.0, 0.4], [0.0, 1.0, -0.3]], dtype=np.float32)
    img_mov = cv2.warpAffine(img_ref, M, (200, 200))

    pts_ref = np.array([[100.0, 100.0]], dtype=np.float32)
    pts_mov = np.array([[100.0, 100.0]], dtype=np.float32)  # Initial unrefined position

    refined_mov, valid = refine_subpixel_lk(
        img_ref, img_mov, pts_ref, pts_mov, patch_size=31, max_iters=30
    )

    assert bool(valid[0]) is True
    # The refined moving point should align back with the shifted position
    assert np.isclose(refined_mov[0, 0], 100.4, atol=0.1)
    assert np.isclose(refined_mov[0, 1], 99.7, atol=0.1)


def test_subpixel_ecc_convergence():
    y, x = np.mgrid[0:200, 0:200]
    img_ref = (np.exp(-((x - 100.0)**2 + (y - 100.0)**2) / 400.0) + 0.3 * np.sin(x * 0.2) * np.cos(y * 0.2)).astype(np.float32)
    img_ref = (img_ref - img_ref.min()) / (img_ref.max() - img_ref.min() + 1e-6)

    M = np.array([[1.0, 0.0, 0.5], [0.0, 1.0, -0.5]], dtype=np.float32)
    img_mov = cv2.warpAffine(img_ref, M, (200, 200))

    pts_ref = np.array([[100.0, 100.0]], dtype=np.float32)
    pts_mov = np.array([[100.0, 100.0]], dtype=np.float32)

    refined_mov, valid = refine_subpixel_ecc(
        img_ref, img_mov, pts_ref, pts_mov, patch_size=31, max_iters=30
    )
    assert bool(valid[0]) is True

