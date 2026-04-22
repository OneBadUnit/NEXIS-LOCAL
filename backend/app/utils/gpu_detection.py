# ============================================================
# WHISPER DEVICE HELPER
# Determines whether Whisper should run on GPU (CUDA) or CPU.
# Used by modules that rely on Whisper for transcription.
# ============================================================

import torch


# ------------------------------------------------------------
# Device Selector
# Returns "cuda" if a compatible GPU is available, otherwise "cpu".
# ------------------------------------------------------------
def get_whisper_device() -> str:
    return "cuda" if torch.cuda.is_available() else "cpu"
