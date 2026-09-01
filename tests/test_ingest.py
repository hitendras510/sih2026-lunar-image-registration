"""Tests for ingest modules: metadata extraction and pair handling."""
import pytest
import numpy as np
from selene.ingest.metadata import extract_metadata, ImageMetadata
from selene.ingest.pair import Pair


def test_metadata_extraction():
    raw_label = {
        "SOLAR_AZIMUTH": 120.5,
        "SOLAR_ELEVATION": 35.0,
        "MAP_SCALE": 1.25,
        "INSTRUMENT_ID": "OHRC",
    }
    meta = extract_metadata(raw_label)
    assert isinstance(meta, ImageMetadata)
    assert meta.sun_azimuth == 120.5
    assert meta.sun_elevation == 35.0
    assert meta.gsd_m == 1.25
    assert meta.sensor_id == "OHRC"


def test_pair_properties():
    pair = Pair.from_paths(
        ref="ref.tif",
        mov="mov.tif",
        ref_label={"SOLAR_AZIMUTH": 90.0, "MAP_SCALE": 1.0, "INSTRUMENT_ID": "LRO_NAC"},
        mov_label={"SOLAR_AZIMUTH": 180.0, "MAP_SCALE": 2.0, "INSTRUMENT_ID": "OHRC"},
    )
    assert pair.delta_sun_az == 90.0
    assert pair.gsd_ratio == 2.0
    assert pair.is_cross_sensor is True


def test_pair_circular_azimuth():
    pair = Pair.from_paths(
        ref="ref.tif",
        mov="mov.tif",
        ref_label={"SOLAR_AZIMUTH": 10.0, "MAP_SCALE": 1.0, "INSTRUMENT_ID": "OHRC"},
        mov_label={"SOLAR_AZIMUTH": 350.0, "MAP_SCALE": 1.0, "INSTRUMENT_ID": "OHRC"},
    )
    assert pair.delta_sun_az == 20.0
    assert pair.sun_geometry_is_inferred is False
