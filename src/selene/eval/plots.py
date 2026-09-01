"""Residual quiver plot, checkerboard overlay, coverage-grid heatmap using matplotlib.

Owner: P4
"""
from __future__ import annotations

from pathlib import Path
import numpy as np
import matplotlib
matplotlib.use("Agg")  # Non-interactive backend
import matplotlib.pyplot as plt


def plot_checkerboard(
    img_ref: np.ndarray,
    img_warped: np.ndarray,
    out_path: str | Path,
    num_squares: int = 8,
) -> Path:
    """Generate checkerboard overlay of reference and registered/warped image.

    Args:
        img_ref: Reference image array.
        img_warped: Warped/registered image array.
        out_path: Output PNG path.
        num_squares: Number of checkerboard tiles per dimension.

    Returns:
        Path to saved PNG.
    """
    out_path = Path(out_path)
    out_path.parent.mkdir(parents=True, exist_ok=True)

    h, w = img_ref.shape[:2]
    # Resize warped to match ref if needed
    if img_warped.shape[:2] != (h, w):
        import cv2
        img_warped = cv2.resize(img_warped, (w, h))

    sq_h = h // num_squares
    sq_w = w // num_squares

    checker = img_ref.copy().astype(np.float32)
    for i in range(num_squares):
        for j in range(num_squares):
            if (i + j) % 2 == 1:
                checker[i * sq_h : (i + 1) * sq_h, j * sq_w : (j + 1) * sq_w] = (
                    img_warped[i * sq_h : (i + 1) * sq_h, j * sq_w : (j + 1) * sq_w]
                )

    fig, ax = plt.subplots(figsize=(8, 8), dpi=150)
    ax.imshow(checker, cmap="gray")
    ax.set_title(f"Checkerboard Registration Overlay ({num_squares}x{num_squares})")
    ax.axis("off")
    plt.tight_layout()
    plt.savefig(str(out_path), bbox_inches="tight")
    plt.close(fig)
    return out_path


def _homography_residuals(
    pts_src: np.ndarray,
    pts_dst: np.ndarray,
    H: np.ndarray,
) -> tuple[np.ndarray, np.ndarray]:
    ones = np.ones((len(pts_src), 1), dtype=np.float32)
    homo_src = np.hstack([pts_src.astype(np.float32), ones])
    proj = (H @ homo_src.T).T
    proj_pts = proj[:, :2] / (proj[:, 2:] + 1e-8)
    return np.linalg.norm(proj_pts - pts_dst, axis=1), proj_pts


def plot_quiver(
    pts_src: np.ndarray,
    pts_ref: np.ndarray,
    out_path: str | Path,
    image_shape: tuple[int, int] = (1024, 1024),
    scale: float = 1.0,
    H_fit: np.ndarray | None = None,
) -> Path:
    """Plot residual vectors after projecting source points with H_fit (if given)."""
    out_path = Path(out_path)
    out_path.parent.mkdir(parents=True, exist_ok=True)

    fig, ax = plt.subplots(figsize=(8, 8), dpi=150)
    h, w = image_shape

    if len(pts_src) > 0:
        if H_fit is not None:
            _, proj = _homography_residuals(pts_src, pts_ref, H_fit)
            origins_x, origins_y = proj[:, 0], proj[:, 1]
            dx = pts_ref[:, 0] - proj[:, 0]
            dy = pts_ref[:, 1] - proj[:, 1]
        else:
            origins_x, origins_y = pts_ref[:, 0], pts_ref[:, 1]
            dx = np.zeros(len(pts_src))
            dy = np.zeros(len(pts_src))
        ax.quiver(
            origins_x,
            origins_y,
            dx,
            dy,
            angles="xy",
            scale_units="xy",
            scale=scale,
            color="lime",
            width=0.003,
        )
        ax.scatter(pts_ref[:, 0], pts_ref[:, 1], c="red", s=10, label="GCPs")

    ax.set_xlim(0, w)
    ax.set_ylim(h, 0)  # Invert Y for image coordinate system
    ax.set_title("GCP Residual Vectors (Quiver Plot)")
    ax.set_xlabel("X (pixels)")
    ax.set_ylabel("Y (pixels)")
    plt.tight_layout()
    plt.savefig(str(out_path), bbox_inches="tight")
    plt.close(fig)
    return out_path


def plot_coverage_heatmap(
    pts: np.ndarray,
    out_path: str | Path,
    image_shape: tuple[int, int] = (1024, 1024),
    grid_cells: int = 8,
) -> Path:
    """Plot 2D spatial histogram heatmap of GCP coverage."""
    out_path = Path(out_path)
    out_path.parent.mkdir(parents=True, exist_ok=True)

    h, w = image_shape
    fig, ax = plt.subplots(figsize=(8, 8), dpi=150)

    if len(pts) > 0:
        counts, xedges, yedges, img = ax.hist2d(
            pts[:, 0],
            pts[:, 1],
            bins=grid_cells,
            range=[[0, w], [0, h]],
            cmap="viridis",
        )
        plt.colorbar(img, ax=ax, label="GCP Count")

    ax.set_xlim(0, w)
    ax.set_ylim(h, 0)
    ax.set_title(f"GCP Uniformity & Density Heatmap ({grid_cells}x{grid_cells} Grid)")
    plt.tight_layout()
    plt.savefig(str(out_path), bbox_inches="tight")
    plt.close(fig)
    return out_path


def plot_residual_heatmap(
    pts_src: np.ndarray,
    pts_ref: np.ndarray,
    out_path: str | Path,
    image_shape: tuple[int, int] = (1024, 1024),
    grid_cells: int = 16,
    H_fit: np.ndarray | None = None,
) -> Path:
    """Plot a spatial heatmap of match residuals in the reference frame."""
    out_path = Path(out_path)
    out_path.parent.mkdir(parents=True, exist_ok=True)
    
    h, w = image_shape
    fig, ax = plt.subplots(figsize=(8, 8), dpi=150)
    
    # Configure axes with dark background
    ax.set_facecolor('#050c14')
    fig.patch.set_facecolor('#050c14')
    
    if len(pts_src) > 0:
        if H_fit is not None:
            residuals, _ = _homography_residuals(pts_src, pts_ref, H_fit)
        else:
            residuals = np.linalg.norm(pts_ref.astype(np.float32) - pts_src.astype(np.float32), axis=1)
        
        hb = ax.hexbin(
            pts_ref[:, 0], pts_ref[:, 1], 
            C=residuals, 
            gridsize=grid_cells, 
            cmap='turbo', 
            reduce_C_function=np.mean,
            alpha=0.85
        )
        cb = plt.colorbar(hb, ax=ax, label="Mean Residual (px)")
        cb.ax.yaxis.set_tick_params(color='white')
        cb.outline.set_edgecolor('white')
        plt.setp(cb.ax.yaxis.get_majorticklabels(), color='white')
        cb.set_label("Mean Residual (px)", color='white')

    ax.set_xlim(0, w)
    ax.set_ylim(h, 0)
    ax.set_title("Spatial Residual Heatmap", color='white')
    ax.tick_params(colors='white')
    for spine in ax.spines.values():
        spine.set_edgecolor('white')
        
    plt.tight_layout()
    plt.savefig(str(out_path), bbox_inches="tight", facecolor=fig.get_facecolor(), transparent=False)
    plt.close(fig)
    return out_path
