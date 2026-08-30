"""Regression script to verify gate routing decisions across different image pairs.

Usage:
    python scripts/verify_gate_routing.py
"""
from __future__ import annotations

import sys
from pathlib import Path

# Add src to python path if needed
sys.path.insert(0, str(Path(__file__).resolve().parent.parent / "src"))

from selene.ingest.pair import Pair
from selene.matchers.gate import select_matcher


def run_verification():
    print("=== SELENE-MATCH Gate Routing Verification ===")
    
    test_cases = [
        {
            "name": "Similar Illumination (OHRC ↔ NAC)",
            "ref": "data/samples/ohrc_nac_pair1/nac.tif",
            "mov": "data/samples/ohrc_nac_pair1/ohrc.img",
            "ref_label": {"SOLAR_AZIMUTH": 45.0, "MAP_SCALE": 0.5, "INSTRUMENT_ID": "LRO_NAC"},
            "mov_label": {"SOLAR_AZIMUTH": 55.0, "MAP_SCALE": 0.25, "INSTRUMENT_ID": "OHRC"},
        },
        {
            "name": "Opposite Sun Azimuth (Polarity Flip)",
            "ref": "data/samples/opposite_azimuth_pair1/ref.tif",
            "mov": "data/samples/opposite_azimuth_pair1/mov.tif",
            "ref_label": {"SOLAR_AZIMUTH": 30.0, "MAP_SCALE": 1.0, "INSTRUMENT_ID": "OHRC"},
            "mov_label": {"SOLAR_AZIMUTH": 210.0, "MAP_SCALE": 1.0, "INSTRUMENT_ID": "OHRC"},
        },
        {
            "name": "Cross-Sensor Hyper-Spectral (IIRS ↔ WAC)",
            "ref": "data/samples/iirs_wac_pair1/wac.tif",
            "mov": "data/samples/iirs_wac_pair1/iirs.qub",
            "ref_label": {"SOLAR_AZIMUTH": 60.0, "MAP_SCALE": 100.0, "INSTRUMENT_ID": "LRO_WAC"},
            "mov_label": {"SOLAR_AZIMUTH": 70.0, "MAP_SCALE": 80.0, "INSTRUMENT_ID": "IIRS"},
        },
        {
            "name": "High Scale Ratio (TMC2 ↔ NAC 10x)",
            "ref": "data/samples/tmc_nac_pair1/nac.tif",
            "mov": "data/samples/tmc_nac_pair1/tmc.img",
            "ref_label": {"SOLAR_AZIMUTH": 40.0, "MAP_SCALE": 0.5, "INSTRUMENT_ID": "LRO_NAC"},
            "mov_label": {"SOLAR_AZIMUTH": 42.0, "MAP_SCALE": 5.0, "INSTRUMENT_ID": "TMC2"},
        },
    ]

    for tc in test_cases:
        pair = Pair.from_paths(
            ref=tc["ref"],
            mov=tc["mov"],
            ref_label=tc["ref_label"],
            mov_label=tc["mov_label"],
        )
        routed = select_matcher(pair)
        print(f"\n[Test Case]: {tc['name']}")
        print(f"  Reference Sensor: {pair.ref_meta.sensor_id} | GSD: {pair.ref_meta.gsd_m}m")
        print(f"  Moving Sensor:    {pair.mov_meta.sensor_id} | GSD: {pair.mov_meta.gsd_m}m")
        print(f"  Δ Sun Azimuth:    {pair.delta_sun_az:.1f}°")
        print(f"  Native GSD Ratio: {pair.gsd_ratio:.2f}x")
        print(f"  -> Routed Expert: [{routed}]")

    print("\nGate routing verification completed successfully!")


if __name__ == "__main__":
    run_verification()
