"""Synthetic geometry recovery test."""
import pytest
import numpy as np
import cv2
from selene.robust.magsac import find_homography_magsac


def test_known_affine_recovered():
    np.random.seed(42)
    pts_src = np.random.uniform(100, 900, (50, 2)).astype(np.float32)

    # Known affine transform: 10px shift, 5 deg rotation
    theta = np.radians(5.0)
    cos_t, sin_t = np.cos(theta), np.sin(theta)
    M = np.array([
        [cos_t, -sin_t, 15.0],
        [sin_t, cos_t, -10.0],
        [0, 0, 1.0],
    ], dtype=np.float32)

    ones = np.ones((len(pts_src), 1), dtype=np.float32)
    homo = np.hstack([pts_src, ones])
    pts_dst = (M @ homo.T).T[:, :2]

    # Add small noise (<0.05px)
    pts_dst += np.random.normal(0, 0.02, pts_dst.shape).astype(np.float32)

    H_recovered, inliers = find_homography_magsac(pts_src, pts_dst, threshold_px=2.0)
    assert H_recovered is not None
    assert np.all(inliers)
    assert np.allclose(H_recovered / H_recovered[2, 2], M, atol=0.1)


def test_threshold_m_to_px():
    from selene.robust.magsac import threshold_m_to_px
    assert threshold_m_to_px(5.0, 5.0) == 1.0
    assert threshold_m_to_px(5.0, 0.25) == 20.0
    assert threshold_m_to_px(5.0, 80.0) == 1.0
