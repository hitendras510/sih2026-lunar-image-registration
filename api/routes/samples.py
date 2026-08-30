"""Lists pre-cleared demo pairs for the UI.

Owner: P4
"""
from __future__ import annotations

from fastapi import APIRouter
from api.schemas import SamplePair

router = APIRouter()


@router.get("", response_model=list[SamplePair])
def list_samples():
    return [
        SamplePair(
            id="synthetic-polar-01",
            modality_src="OHRC (Narrow Angle)",
            modality_ref="LRO NAC (Equirect)",
            sun_delta_deg=85.0,
            gsd_ratio=1.1,
            description="Synthetic high solar angle variation pair with crater polarity reversal.",
        ),
        SamplePair(
            id="tmc-iirs-crossmodal-02",
            modality_src="IIRS Hyperspectral (80m)",
            modality_ref="TMC-2 Ortho (5m)",
            sun_delta_deg=22.0,
            gsd_ratio=16.0,
            description="Extreme resolution gap cross-sensor lunar registration challenge.",
        ),
    ]


@router.get("/synthetic")
def get_synthetic_pair():
    """Return static/generated synthetic pair image paths and ground-truth metadata."""
    import json
    from pathlib import Path

    gt_file = Path("data_generation/output/ground_truth.json")
    gt_data = {}
    if gt_file.exists():
        with open(gt_file) as f:
            gt_data = json.load(f)

    return {
        "status": "success",
        "reference_image_url": "/synthetic/reference.png",
        "source_image_url": "/synthetic/synthetic_target.png",
        "ground_truth_url": "/synthetic/ground_truth.json",
        "reference_name": "reference.png (LRO NAC Grid)",
        "source_name": "synthetic_target.png (OHRC 7° Rot / 0.92 Scale / Gamma 0.7)",
        "ground_truth": gt_data,
    }

