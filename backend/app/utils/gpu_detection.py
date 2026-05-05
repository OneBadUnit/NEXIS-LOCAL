# ============================================================
# ARC-NEXUS - GPU DETECTION UTILITY
# File: app/utils/gpu_detection.py
# Version: 003 (Multi-vendor: NVIDIA, AMD, Intel, Apple)
# ============================================================

import subprocess


# ------------------------------------------------------------
# Per-vendor probe helpers
# ------------------------------------------------------------

def _try_torch_cuda() -> dict | None:
    """NVIDIA CUDA or AMD ROCm (ROCm uses the CUDA-compatible API)."""
    try:
        import torch  # type: ignore
        if torch.cuda.is_available():
            device_name = ""
            try:
                device_name = torch.cuda.get_device_name(0)
            except Exception:
                pass
            # ROCm builds set torch.version.hip
            is_rocm = bool(getattr(torch.version, "hip", None))
            if is_rocm:
                return {
                    "has_gpu_acceleration": True,
                    "acceleration_backend": "AMD / ROCm",
                    "gpu_vendor": "AMD",
                    "gpu_name": device_name or "AMD GPU",
                    "performance_mode": "GPU accelerated",
                    "detection_confidence": "high",
                    "whisper_device": "cuda",
                }
            return {
                "has_gpu_acceleration": True,
                "acceleration_backend": "CUDA",
                "gpu_vendor": "NVIDIA",
                "gpu_name": device_name or "NVIDIA GPU",
                "performance_mode": "GPU accelerated",
                "detection_confidence": "high",
                "whisper_device": "cuda",
            }
    except Exception:
        pass
    return None


def _try_torch_mps() -> dict | None:
    """Apple Silicon / Metal Performance Shaders."""
    try:
        import torch  # type: ignore
        if hasattr(torch.backends, "mps") and torch.backends.mps.is_available():
            return {
                "has_gpu_acceleration": True,
                "acceleration_backend": "Metal",
                "gpu_vendor": "Apple",
                "gpu_name": "Apple Silicon",
                "performance_mode": "GPU accelerated",
                "detection_confidence": "high",
                "whisper_device": "cpu",  # faster-whisper does not support MPS
            }
    except Exception:
        pass
    return None


def _try_intel_xpu() -> dict | None:
    """Intel GPU via Intel Extension for PyTorch (optional package)."""
    try:
        import intel_extension_for_pytorch as ipex  # type: ignore
        if ipex.xpu.is_available():
            device_name = ""
            try:
                device_name = ipex.xpu.get_device_name(0)
            except Exception:
                pass
            return {
                "has_gpu_acceleration": True,
                "acceleration_backend": "Intel / Level Zero",
                "gpu_vendor": "Intel",
                "gpu_name": device_name or "Intel GPU",
                "performance_mode": "GPU accelerated",
                "detection_confidence": "high",
                "whisper_device": "cpu",  # faster-whisper does not support Intel XPU
            }
    except Exception:
        pass
    return None


def _try_subprocess_gpu() -> dict | None:
    """
    Lightweight subprocess fallback using OS GPU info.
    Returns a low-confidence result when a GPU is present
    but no compatible ML backend was found.
    """
    try:
        output = subprocess.check_output(
            ["wmic", "path", "win32_VideoController", "get", "Name"],
            stderr=subprocess.DEVNULL,
            timeout=5,
        ).decode(errors="ignore").lower()

        if "nvidia" in output:
            return {
                "has_gpu_acceleration": True,
                "acceleration_backend": "Unknown GPU",
                "gpu_vendor": "NVIDIA",
                "gpu_name": "NVIDIA GPU",
                "performance_mode": "GPU accelerated",
                "detection_confidence": "low",
                "whisper_device": "cpu",
            }
        if "amd" in output or "radeon" in output:
            return {
                "has_gpu_acceleration": True,
                "acceleration_backend": "Unknown GPU",
                "gpu_vendor": "AMD",
                "gpu_name": "AMD GPU",
                "performance_mode": "GPU accelerated",
                "detection_confidence": "low",
                "whisper_device": "cpu",
            }
        if "intel" in output and ("arc" in output or "gpu" in output or "graphics" in output):
            return {
                "has_gpu_acceleration": True,
                "acceleration_backend": "Intel / Level Zero",
                "gpu_vendor": "Intel",
                "gpu_name": "Intel GPU",
                "performance_mode": "GPU accelerated",
                "detection_confidence": "low",
                "whisper_device": "cpu",
            }
    except Exception:
        pass
    return None


# ------------------------------------------------------------
# CPU-only result
# ------------------------------------------------------------

_CPU_RESULT: dict = {
    "has_gpu_acceleration": False,
    "acceleration_backend": None,
    "gpu_vendor": None,
    "gpu_name": None,
    "performance_mode": "CPU mode",
    "detection_confidence": "high",
    "whisper_device": "cpu",
}


# ------------------------------------------------------------
# Public API
# ------------------------------------------------------------

def get_gpu_info() -> dict:
    """
    Multi-vendor GPU detection.

    Returns normalized fields:
      - has_gpu_acceleration: bool
      - acceleration_backend: str | None  ("CUDA", "Metal", "AMD / ROCm", "Intel / Level Zero", "Unknown GPU")
      - gpu_vendor: str | None
      - gpu_name: str | None
      - performance_mode: "GPU accelerated" | "CPU mode"
      - detection_confidence: "high" | "low"
      - whisper_device: "cuda" | "cpu"
    """
    result = (
        _try_torch_cuda()
        or _try_torch_mps()
        or _try_intel_xpu()
        or _try_subprocess_gpu()
    )
    return result if result else dict(_CPU_RESULT)


def get_whisper_device() -> str:
    """
    Returns the device string for faster-whisper.
    "cuda" for NVIDIA CUDA and AMD ROCm, "cpu" for everything else.
    """
    return get_gpu_info().get("whisper_device", "cpu")