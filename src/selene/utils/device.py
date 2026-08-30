"""Hardware accelerator device detection utility for PyTorch deep matchers.

Owner: P3
"""
from __future__ import annotations


def get_optimal_device() -> str:
    """Detect available hardware acceleration device (cuda, mps, cpu).

    Returns:
        String device name: "cuda", "mps", or "cpu".
    """
    try:
        import torch

        if torch.cuda.is_available():
            return "cuda"
        elif hasattr(torch.backends, "mps") and torch.backends.mps.is_available():
            return "mps"
    except Exception:
        pass

    return "cpu"
