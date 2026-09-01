"""Tests for gated matcher decision routing."""
import pytest
from selene.config import PipelineConfig
from selene.ingest.pair import Pair
from selene.matchers.gate import select_matcher


def test_gate_routes_polar_opposite_azimuth():
    pair = Pair.from_paths(
        ref="ref.tif",
        mov="mov.tif",
        ref_label={"SOLAR_AZIMUTH": 30.0, "MAP_SCALE": 1.0},
        mov_label={"SOLAR_AZIMUTH": 210.0, "MAP_SCALE": 1.0},
    )
    # delta_az = 180° > 60°
    assert select_matcher(pair) == "crater_graph"


def test_gate_routes_cross_sensor_iirs():
    pair = Pair.from_paths(
        ref="ref.tif",
        mov="mov.tif",
        ref_label={"SOLAR_AZIMUTH": 40.0, "MAP_SCALE": 5.0, "INSTRUMENT_ID": "TMC2"},
        mov_label={"SOLAR_AZIMUTH": 50.0, "MAP_SCALE": 80.0, "INSTRUMENT_ID": "IIRS"},
    )
    assert select_matcher(pair) == "mutual_info"


def test_gate_routes_similar_illumination_lightglue():
    pair = Pair.from_paths(
        ref="ref.tif",
        mov="mov.tif",
        ref_label={"SOLAR_AZIMUTH": 45.0, "MAP_SCALE": 1.0, "INSTRUMENT_ID": "OHRC"},
        mov_label={"SOLAR_AZIMUTH": 55.0, "MAP_SCALE": 1.0, "INSTRUMENT_ID": "OHRC"},
    )
    assert select_matcher(pair) == "lightglue"


def test_gate_does_not_force_sift_for_deep_matchers():
    pair = Pair.from_paths(
        ref="ref.tif",
        mov="mov.tif",
        ref_label={"SOLAR_AZIMUTH": 45.0, "MAP_SCALE": 1.0, "INSTRUMENT_ID": "OHRC"},
        mov_label={"SOLAR_AZIMUTH": 55.0, "MAP_SCALE": 1.0, "INSTRUMENT_ID": "OHRC"},
    )
    cfg = PipelineConfig(matcher="loftr", allow_deep_matchers=True)
    assert select_matcher(pair, cfg) == "loftr"
    cfg_off = PipelineConfig(matcher="loftr", allow_deep_matchers=False)
    assert select_matcher(pair, cfg_off) == "sift"


def test_inferred_azimuth_does_not_route_crater_graph():
    pair = Pair.from_paths(
        ref="ref.tif",
        mov="mov.tif",
        ref_label={"SOLAR_AZIMUTH": 0.0, "MAP_SCALE": 1.0, "INSTRUMENT_ID": "OHRC"},
        mov_label={"MAP_SCALE": 1.0, "INSTRUMENT_ID": "OHRC"},
    )
    assert pair.sun_geometry_is_inferred is True
    assert select_matcher(pair) != "crater_graph"
