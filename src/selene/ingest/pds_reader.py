"""Parse Chandrayaan-2 PDS3/PDS4 IMG+XML and IIRS QUB cubes into numpy
arrays + label dicts.  Uses ``pvl`` / ``planetaryimage``; never hand-rolls
a binary label parser.

Owner: P1
"""
from __future__ import annotations

from pathlib import Path

import numpy as np


def read_pds3(
    path: str | Path,
    band_idx: int | None = None,
) -> tuple[np.ndarray, dict]:
    """Read a PDS3 ``.lbl`` + ``.img`` / ``.qub`` file pair.

    The label file is located by replacing the image extension with ``.lbl``
    (or ``.LBL`` on case-sensitive file systems).

    Args:
        path: Path to either the image file (``.img``/``.qub``) or its
              label (``.lbl``).
        band_idx: Optional 0-indexed band selection for 3D hyper-spectral IIRS cubes.

    Returns:
        ``(array, label_dict)`` where *array* is float32 in [0, 1] and
        *label_dict* is the raw PVL label as a Python dict.

    Raises:
        ImportError: If ``pvl`` or ``planetaryimage`` are not installed.
    """
    try:
        import pvl
        import planetaryimage
    except ImportError as exc:
        raise ImportError(
            "Install PDS libraries: pip install pvl planetaryimage"
        ) from exc

    path = Path(path)

    # Resolve label path
    if path.suffix.lower() in (".lbl",):
        lbl_path = path
    else:
        lbl_path = path.with_suffix(".lbl")
        if not lbl_path.exists():
            lbl_path = path.with_suffix(".LBL")
    if not lbl_path.exists():
        raise FileNotFoundError(f"PDS3 label not found adjacent to: {path}")

    label = pvl.load(str(lbl_path))
    label_dict: dict = dict(label)

    img_obj = planetaryimage.PDS3Image.open(str(lbl_path))
    array = np.array(img_obj.image, dtype=np.float32)

    # Handle 3D multi-spectral/hyper-spectral cubes (e.g. Chandrayaan-2 IIRS)
    if array.ndim == 3:
        if band_idx is not None and 0 <= band_idx < array.shape[0]:
            array = array[band_idx]
        elif band_idx is not None and 0 <= band_idx < array.shape[-1]:
            array = array[..., band_idx]
        else:
            array = array.mean(axis=0) if array.shape[0] < array.shape[-1] else array.mean(axis=-1)

    lo, hi = float(array.min()), float(array.max())
    if hi > lo:
        array = (array - lo) / (hi - lo)

    return array, label_dict


def read_pds4(path: str | Path) -> tuple[np.ndarray, dict]:
    """Read a PDS4 ``.xml`` label + associated data file.

    Tries rasterio first (handles GeoTIFF data products); falls back to
    a raw binary read for unrecognised formats.

    Args:
        path: Path to the PDS4 XML label file (or a file next to one).

    Returns:
        ``(array, label_dict)`` — float32 [0, 1] array and raw label dict.
    """
    try:
        import pvl
    except ImportError as exc:
        raise ImportError("Install pvl: pip install pvl") from exc

    path = Path(path)
    xml_path = path if path.suffix.lower() == ".xml" else path.with_suffix(".xml")
    if not xml_path.exists():
        raise FileNotFoundError(f"PDS4 label not found: {xml_path}")

    label = pvl.load(str(xml_path))
    label_dict: dict = dict(label)

    # ── Locate the data file ──────────────────────────────────────────────────
    data_path: Path | None = None
    fao = label_dict.get("File_Area_Observational", {})
    if isinstance(fao, dict):
        fname = fao.get("File", {})
        if isinstance(fname, dict):
            fn = fname.get("file_name")
            if fn:
                data_path = xml_path.parent / str(fn)

    if data_path is None or not data_path.exists():
        for ext in (".img", ".IMG", ".fits", ".tif", ".tiff", ".dat"):
            candidate = xml_path.with_suffix(ext)
            if candidate.exists():
                data_path = candidate
                break

    if data_path is None:
        raise FileNotFoundError(f"Cannot locate data file for PDS4 label: {xml_path}")

    # ── Try rasterio (GeoTIFF-based PDS4 products) ────────────────────────────
    try:
        from .geotiff_reader import read_geotiff
        array, *_ = read_geotiff(data_path)
        return array, label_dict
    except Exception:
        pass

    # ── Fallback: raw uint16 read ─────────────────────────────────────────────
    raw = np.fromfile(str(data_path), dtype=np.uint16).astype(np.float32)
    hi = float(raw.max())
    if hi > 0:
        raw /= hi
    return raw.reshape(-1, 1), label_dict
