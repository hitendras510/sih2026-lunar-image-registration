"""Tests for hardware accelerator device selection."""
import pytest
from selene.utils.device import get_optimal_device


def test_device_auto_detection():
    device = get_optimal_device()
    assert device in ("cuda", "mps", "cpu")
