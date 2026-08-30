"""8x8 grid occupancy, min-dist filter, GCP ranking for spatially uniform control point selection.

Owner: P3

Revision: added shadow-aware grid coverage exclusion — cells that are
entirely shadow are removed from the denominator so coverage scores reflect
what the algorithm *could* observe, not what was unobservable.
"""
from __future__ import annotations

import numpy as np


def _visible_cell_count(
    shadow_mask: np.ndarray | None,
    image_shape: tuple[int, int],
    grid_cells: int,
    shadow_fraction_threshold: float = 0.90,
) -> int:
    """Count how many grid cells contain enough visible (non-shadow) terrain.

    A cell whose shadow-pixel fraction exceeds *shadow_fraction_threshold*
    is considered entirely unobservable and excluded from the denominator
    when computing coverage metrics.

    Returns:
        Number of "valid" cells (≤ grid_cells²).
    """
    total = grid_cells * grid_cells
    if shadow_mask is None:
        return total

    h, w = image_shape
    cell_h = h / float(grid_cells)
    cell_w = w / float(grid_cells)

    valid = 0
    for cy in range(grid_cells):
        for cx in range(grid_cells):
            r1 = int(cy * cell_h)
            r2 = min(int((cy + 1) * cell_h), h)
            c1 = int(cx * cell_w)
            c2 = min(int((cx + 1) * cell_w), w)
            if r2 <= r1 or c2 <= c1:
                continue
            cell_mask = shadow_mask[r1:r2, c1:c2]
            shadow_frac = float(np.count_nonzero(cell_mask > 0)) / float(cell_mask.size)
            if shadow_frac < shadow_fraction_threshold:
                valid += 1
    return max(valid, 1)  # avoid divide-by-zero


def sample_uniform_gcps(
    pts_src: np.ndarray,
    pts_dst: np.ndarray,
    scores: np.ndarray | None = None,
    image_shape: tuple[int, int] = (1024, 1024),
    grid_cells: int = 8,
    min_dist_px: float = 15.0,
    max_pts_per_cell: int = 4,
    shadow_mask: np.ndarray | None = None,
) -> tuple[np.ndarray, np.ndarray, np.ndarray]:
    """Sample spatially uniform Ground Control Points (GCPs) across an NxN spatial grid.

    Prevents feature clustering in high-texture areas (e.g. fresh crater rims)
    and guarantees well-distributed constraints for thin-plate spline warping.

    Shadow-aware: any candidate whose pixel position falls inside
    *shadow_mask* (value > 0) is dropped before selection, preventing the
    sampler from choosing GCPs in pitch-black shadow regions where the
    gradient signal is zero and LK refinement will fail.

    Args:
        pts_src: (N, 2) source coordinates.
        pts_dst: (N, 2) destination coordinates.
        scores: (N,) match quality / confidence scores.
        image_shape: (height, width) of the source image.
        grid_cells: Number of cells along each axis (default: 8 for 64 cells).
        min_dist_px: Minimum Euclidean distance between selected GCPs.
        max_pts_per_cell: Maximum GCPs retained per grid cell.
        shadow_mask: Optional binary mask (>0 = shadow = exclusion zone).

    Returns:
        (sampled_src, sampled_dst, selected_indices)
    """
    if len(pts_src) == 0:
        return np.empty((0, 2), dtype=np.float32), np.empty((0, 2), dtype=np.float32), np.array([], dtype=int)

    h, w = image_shape
    if scores is None:
        scores = np.ones(len(pts_src), dtype=np.float32)

    # ── Filter out shadow pixels if shadow mask is provided ──────────────
    valid_mask = np.ones(len(pts_src), dtype=bool)
    if shadow_mask is not None:
        for i, (x, y) in enumerate(pts_src):
            ix, iy = int(round(x)), int(round(y))
            if 0 <= iy < shadow_mask.shape[0] and 0 <= ix < shadow_mask.shape[1]:
                if shadow_mask[iy, ix] > 0:
                    valid_mask[i] = False

    indices = np.where(valid_mask)[0]
    if len(indices) == 0:
        indices = np.arange(len(pts_src))

    # Sort candidates by score descending
    sorted_idx = indices[np.argsort(-scores[indices])]

    cell_h = h / float(grid_cells)
    cell_w = w / float(grid_cells)

    cell_counts = np.zeros((grid_cells, grid_cells), dtype=int)
    selected_indices: list[int] = []
    selected_pts: list[np.ndarray] = []

    for idx in sorted_idx:
        pt = pts_src[idx]
        x, y = pt[0], pt[1]

        # Determine cell index
        cx = min(int(x / cell_w), grid_cells - 1)
        cy = min(int(y / cell_h), grid_cells - 1)

        if cell_counts[cy, cx] >= max_pts_per_cell:
            continue

        # Check minimum spacing against already selected points
        if selected_pts:
            dists = np.linalg.norm(np.array(selected_pts) - pt, axis=1)
            if np.any(dists < min_dist_px):
                continue

        cell_counts[cy, cx] += 1
        selected_indices.append(idx)
        selected_pts.append(pt)

    sel_idx_arr = np.array(selected_indices, dtype=int)
    return pts_src[sel_idx_arr], pts_dst[sel_idx_arr], sel_idx_arr
