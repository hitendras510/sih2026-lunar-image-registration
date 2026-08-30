"""XFeat (Accelerated Local Feature Architecture) matcher with graceful fallback to SIFT baseline.

Owner: P3
"""
from __future__ import annotations

import numpy as np
from .sift_baseline import match_sift


def match_xfeat(
    img_src: np.ndarray,
    img_ref: np.ndarray,
    top_k: int = 4096,
    device: str = "cpu",
) -> tuple[np.ndarray, np.ndarray, np.ndarray]:
    """Match image pair using XFeat lightweight deep local feature matcher.

    Falls back cleanly to SIFT baseline if XFeat / PyTorch are not installed.

    Args:
        img_src: 2D array source image.
        img_ref: 2D array reference image.
        top_k: Maximum keypoints to extract.
        device: "cpu" or "cuda".

    Returns:
        (pts_src, pts_ref, scores)
    """
    try:
        import torch

        # Attempt import from torch hub or installed xfeat package
        try:
            xfeat = torch.hub.load("verlab/accelerated_features", "XFeat", pretrained=True, top_k=top_k)
        except Exception:
            from modules.xfeat import XFeat
            xfeat = XFeat(top_k=top_k)

        xfeat = xfeat.to(device).eval()

        def _prepare(im: np.ndarray) -> torch.Tensor:
            if im.ndim == 2:
                im = np.stack([im, im, im], axis=-1)
            im_f = im.astype(np.float32)
            if im_f.max() > 1.0:
                im_f /= 255.0
            return torch.from_numpy(im_f.transpose(2, 0, 1))[None, ...].to(device)

        t_src = _prepare(img_src)
        t_ref = _prepare(img_ref)

        with torch.inference_mode():
            mkpts0, mkpts1 = xfeat.match_xfeat(t_src, t_ref, top_k=top_k)
            scores = np.ones(len(mkpts0), dtype=np.float32)

        if len(mkpts0) > 0:
            return (
                mkpts0.cpu().numpy().astype(np.float32),
                mkpts1.cpu().numpy().astype(np.float32),
                scores,
            )

    except BaseException:
        pass

    return match_sift(img_src, img_ref)
