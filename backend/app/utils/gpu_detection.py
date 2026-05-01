# ============================================================
# ARC-NEXUS - GPU DETECTION UTILITY
# File: app/utils/gpu_detection.py
# Version: 002 (Safe Detection + Logging)
# ============================================================

import torch


# ------------------------------------------------------------
# Get Whisper Device
# ------------------------------------------------------------
def get_whisper_device() -> str:
    """
    Returns:
        "cuda" if GPU is available
        "cpu" otherwise
    """
    try:
        if torch.cuda.is_available():
            return "cuda"
    except Exception:
        pass

    return "cpu"


# ------------------------------------------------------------
# Optional: Debug Info (not required, but useful)
# ------------------------------------------------------------
def get_gpu_info() -> dict:
    """
    Returns basic GPU info for diagnostics.
    Safe to call even if CUDA is not available.
    """
    try:
        if torch.cuda.is_available():
            return {
                "available": True,
                "device_name": torch.cuda.get_device_name(0),
                "device_count": torch.cuda.device_count(),
            }
    except Exception:
        pass

    return {
        "available": False,
        "device_name": None,
        "device_count": 0,
    }