"""Matchers package: Gated matcher ensemble with SIFT, LightGlue, Phase Correlation, Mutual Information, and Crater Graph routing.

Owner: P3
"""
from .sift_baseline import match_sift
from .lightglue_matcher import match_lightglue
from .loftr_matcher import match_loftr
from .xfeat_matcher import match_xfeat
from .phase_correlation import match_phase_correlation
from .mutual_information import match_mutual_information
from .gate import select_matcher, route_and_match

__all__ = [
    "match_sift",
    "match_lightglue",
    "match_loftr",
    "match_xfeat",
    "match_phase_correlation",
    "match_mutual_information",
    "select_matcher",
    "route_and_match",
]
