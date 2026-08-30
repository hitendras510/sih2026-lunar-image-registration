"""Tests for LoFTR matcher module and fallback behavior."""
import pytest
import numpy as np
from unittest.mock import patch
from selene.matchers.loftr_matcher import match_loftr


def test_loftr_matcher_fallback():
    img_ref = np.random.randint(0, 255, (256, 256), dtype=np.uint8)
    img_mov = img_ref.copy()

    with patch.dict("sys.modules", {"kornia": None, "kornia.feature": None}):
        pts_src, pts_ref, scores = match_loftr(img_mov, img_ref)
        assert isinstance(pts_src, np.ndarray)
        assert isinstance(pts_ref, np.ndarray)
        assert isinstance(scores, np.ndarray)
