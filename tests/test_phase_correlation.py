import numpy as np
from selene.matchers.phase_correlation import match_phase_correlation


def test_phase_correlation_different_shapes():
    rng = np.random.default_rng(0)
    ref = rng.random((80, 120)).astype(np.float32)
    src = np.zeros((40, 60), dtype=np.float32)
    src[:, :] = ref[10:50, 20:80]  # coarse crop; sizes differ

    pts_src, pts_ref, scores = match_phase_correlation(src, ref, grid_points=8)
    assert len(pts_src) == len(pts_ref) == len(scores)
    if len(pts_ref) > 0:
        h, w = ref.shape
        assert np.all(pts_ref[:, 0] >= 0) and np.all(pts_ref[:, 0] < w)
        assert np.all(pts_ref[:, 1] >= 0) and np.all(pts_ref[:, 1] < h)
