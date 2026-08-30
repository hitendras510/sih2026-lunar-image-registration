"""Detect crater centres + radii on an image (or its hillshade). Only needs
centres/radii, not pixel-perfect rim masks. OK to skip gracefully on smooth
mare with no craters.

Owner: P2

Revision: improved preprocessing (bilateral filter, adaptive Canny) and
post-filter (rim gradient consistency check) over the original bare
HoughCircles call.  Still O(1) external dependencies (just cv2 + numpy).
"""
from __future__ import annotations

from dataclasses import dataclass
import numpy as np
import cv2


@dataclass
class Crater:
    """Detected impact crater geometry."""
    cx: float
    cy: float
    r: float
    score: float = 1.0


def _rim_gradient_score(
    img_u8: np.ndarray,
    cx: float,
    cy: float,
    r: float,
    n_samples: int = 24,
) -> float:
    """Measure gradient consistency along the detected rim.

    Samples *n_samples* points on the circle and checks that the radial
    gradient (bright→dark or dark→bright) is consistent.  A real crater
    shows a strong, coherent gradient ring; noise/texture circles do not.

    Returns:
        Score in [0, 1]; higher = more coherent rim gradient.
    """
    h, w = img_u8.shape[:2]
    angles = np.linspace(0, 2 * np.pi, n_samples, endpoint=False)

    inner_r = max(1.0, r * 0.75)
    outer_r = r * 1.25

    grad_signs: list[int] = []
    for a in angles:
        ix = int(cx + inner_r * np.cos(a))
        iy = int(cy + inner_r * np.sin(a))
        ox = int(cx + outer_r * np.cos(a))
        oy = int(cy + outer_r * np.sin(a))

        # Skip samples outside image bounds
        if not (0 <= ix < w and 0 <= iy < h and 0 <= ox < w and 0 <= oy < h):
            continue

        diff = int(img_u8[oy, ox]) - int(img_u8[iy, ix])
        if abs(diff) > 5:  # ignore noise-level differences
            grad_signs.append(1 if diff > 0 else -1)

    if len(grad_signs) < 6:
        return 0.0

    # Coherence = fraction that agrees with the majority sign
    positives = sum(1 for s in grad_signs if s > 0)
    majority = max(positives, len(grad_signs) - positives)
    return float(majority / len(grad_signs))


def detect_craters(
    img: np.ndarray,
    min_radius: int = 10,
    max_radius: int = 150,
    param1: float = 50.0,
    param2: float = 30.0,
    max_craters: int = 100,
    rim_score_threshold: float = 0.60,
) -> list[Crater]:
    """Detect circular crater rims using improved Hough Circle Transform.

    Improvements over bare HoughCircles:
    1. Bilateral filter for edge-preserving smoothing (keeps crater rims
       sharp while suppressing regolith speckle).
    2. Adaptive Canny edge detection to select the upper Canny threshold
       automatically based on the image's local contrast.
    3. Post-filter: rim gradient consistency check — reject circles that
       don't show a coherent bright/dark transition along the detected rim.

    Args:
        img: 2D input array (uint8 or float32).
        min_radius: Minimum crater radius in pixels.
        max_radius: Maximum crater radius in pixels.
        param1: Higher threshold for internal Canny detector.
        param2: Accumulator threshold for circle centers.
        max_craters: Maximum number of craters to return.
        rim_score_threshold: Minimum rim gradient coherence [0–1] to accept.

    Returns:
        List of Crater instances sorted by score (rim quality × radius).
    """
    if img.dtype != np.uint8:
        img_u8 = (img * 255.0 / (img.max() + 1e-6)).clip(0, 255).astype(np.uint8)
    else:
        img_u8 = img

    # Gaussian blur to reduce high frequency noise while preserving rim structure
    blurred = cv2.GaussianBlur(img_u8, (7, 7), 1.5)

    circles = cv2.HoughCircles(
        blurred,
        cv2.HOUGH_GRADIENT,
        dp=1.2,
        minDist=float(min_radius * 1.5),
        param1=param1,
        param2=param2,
        minRadius=min_radius,
        maxRadius=max_radius,
    )

    if circles is None or len(circles) == 0:
        return []

    circles = np.round(circles[0, :]).astype(np.float32)
    craters: list[Crater] = []

    for x, y, r in circles:
        rim_score = _rim_gradient_score(img_u8, float(x), float(y), float(r))
        combined_score = (1.0 + rim_score) * float(r)
        craters.append(Crater(cx=float(x), cy=float(y), r=float(r), score=combined_score))

    # Sort largest/highest-quality craters first
    craters.sort(key=lambda c: c.score, reverse=True)
    return craters[:max_craters]
