"""Geometry package: gets both images of a Pair onto a common grid
before any matching happens.

Owner: P1
"""
from .crs import get_crs, MOON_EQUIRECT, MOON_STEREO_NORTH, MOON_STEREO_SOUTH
from .pyramid import build_gsd_pyramid, resample_to_gsd, upscale_coordinates, match_coarse_to_fine_pyramid
from .mapproject_tier2 import affine_from_footprint, crop_reference_to_pair
from .mapproject_tier1 import run_cam2map, run_spiceinit, ISIS3NotAvailableError
from .selenographic_model import project_to_sphere, kabsch_rotation

__all__ = [
    "get_crs",
    "MOON_EQUIRECT",
    "MOON_STEREO_NORTH",
    "MOON_STEREO_SOUTH",
    "build_gsd_pyramid",
    "resample_to_gsd",
    "upscale_coordinates",
    "match_coarse_to_fine_pyramid",
    "affine_from_footprint",

    "crop_reference_to_pair",
    "run_cam2map",
    "run_spiceinit",
    "ISIS3NotAvailableError",
    "project_to_sphere",
    "kabsch_rotation",
]
