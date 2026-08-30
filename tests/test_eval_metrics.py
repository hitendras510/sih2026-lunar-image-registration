"""Tests for evaluation metrics and uniformity."""
import pytest
import numpy as np
from selene.eval.metrics import compute_metrics, check_quality_gates
from selene.eval.uniformity import nni_score, grid_coverage


def test_compute_metrics_perfect_alignment():
    pts_src = np.array([[10, 10], [20, 20], [30, 30]], dtype=np.float32)
    pts_dst = pts_src.copy()

    metrics = compute_metrics(pts_src, pts_dst, gsd_m=2.0)
    assert metrics.n_raw == 3
    assert metrics.n_inliers == 3
    assert metrics.inlier_ratio == 1.0
    assert metrics.rmse_px == 0.0
    assert metrics.rmse_m == 0.0


def test_grid_coverage():
    # 4 points in distinct quadrants
    pts = np.array([[100, 100], [800, 100], [100, 800], [800, 800]], dtype=np.float32)
    cov = grid_coverage(pts, image_shape=(1000, 1000), grid_cells=2)
    assert cov == 1.0  # All 4 cells occupied


def test_compute_metrics_validation_split():
    # 12 points with slight noise
    np.random.seed(42)
    pts_src = np.random.uniform(10, 500, (12, 2)).astype(np.float32)
    noise = np.random.normal(0, 0.5, (12, 2)).astype(np.float32)
    pts_dst = pts_src + noise

    metrics = compute_metrics(pts_src, pts_dst, gsd_m=1.0, val_split=0.2)
    assert metrics.n_raw == 12
    assert metrics.n_inliers == 12
    assert metrics.rmse_px > 0.0
def test_check_quality_gates():
    pts_src = np.array([[10, 10], [20, 20], [30, 30], [40, 40]], dtype=np.float32)
    pts_dst = pts_src.copy()
    metrics = compute_metrics(pts_src, pts_dst, gsd_m=1.0)
    gates = check_quality_gates(metrics, subpixel_target=1.0)
    assert gates["subpixel_target_met"] is True
    assert gates["inlier_target_met"] is True
    assert gates["overall_pass"] is True


