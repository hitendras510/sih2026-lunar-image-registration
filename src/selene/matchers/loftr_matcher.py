"""LoFTR (Local Feature Transformer) dense deep matcher with graceful fallback to LightGlue / SIFT.

Owner: P3
"""
from __future__ import annotations

import numpy as np
from .sift_baseline import match_sift


def match_loftr(
    img_src: np.ndarray,
    img_ref: np.ndarray,
    pretrained: str = "outdoor",
    device: str = "cpu",
) -> tuple[np.ndarray, np.ndarray, np.ndarray]:
    """Match image pair using LoFTR (Local Feature Transformer) dense matcher.

    Falls back cleanly to SIFT baseline if Kornia / PyTorch are not installed or fail.

    Args:
        img_src: 2D array source image.
        img_ref: 2D array reference image.
        pretrained: "outdoor" or "indoor".
        device: "cpu" or "cuda".

    Returns:
        (pts_src, pts_ref, scores)
    """
    try:
        import torch
        import kornia.feature as KF

        def _prepare_tensor(im: np.ndarray) -> torch.Tensor:
            if im.ndim == 3:
                im = im.mean(axis=-1)
            im_f = im.astype(np.float32)
            if im_f.max() > 1.0:
                im_f /= 255.0
            return torch.from_numpy(im_f)[None, None, ...].to(device)

        t_src = _prepare_tensor(img_src)
        t_ref = _prepare_tensor(img_ref)

        matcher = KF.LoFTR(pretrained=pretrained).to(device).eval()

        input_dict = {"image0": t_src, "image1": t_ref}
        with torch.inference_mode():
            correspondences = matcher(input_dict)
            mkpts0 = correspondences["keypoints0"].cpu().numpy().astype(np.float32)
            mkpts1 = correspondences["keypoints1"].cpu().numpy().astype(np.float32)
            scores = correspondences["confidence"].cpu().numpy().astype(np.float32)

        if len(mkpts0) > 0:
            return mkpts0, mkpts1, scores

    except BaseException:
        pass

    return match_sift(img_src, img_ref)
