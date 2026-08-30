"""Tests for XFeat matcher module and fallback behavior."""
import pytest
import numpy as np
from selene.matchers.xfeat_matcher import match_xfeat


def test_xfeat_matcher_execution_and_fallback():
    img_ref = np.random.randint(0, 255, (256, 256), dtype=np.uint8)
    img_mov = img_ref.copy()

    pts_src, pts_ref, scores = match_xfeat(img_mov, img_ref)
    assert isinstance(pts_src, np.ndarray)
    assert isinstance(pts_ref, np.ndarray)
    assert isinstance(scores, np.ndarray)
