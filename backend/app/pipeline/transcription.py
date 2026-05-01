# ============================================================
# ARC-NEXUS - AUDIO TRANSCRIPTION PIPELINE
# File: app/pipeline/transcription.py
# Version: 002 (Model Reuse + Cleaner Logging + Stability)
# ============================================================

import traceback
from faster_whisper import WhisperModel

from app.utils.gpu_detection import get_whisper_device


# ------------------------------------------------------------
# Global Model Cache (prevents reload every call)
# ------------------------------------------------------------
_whisper_model = None
_whisper_device = None


# ------------------------------------------------------------
# Load Whisper Model (once)
# ------------------------------------------------------------
def get_model():
    global _whisper_model, _whisper_device

    if _whisper_model is not None:
        return _whisper_model, _whisper_device

    device = get_whisper_device()

    try:
        print(f"[WHISPER] Loading model on {device}...")

        _whisper_model = WhisperModel(
            "medium",
            device=device,
            compute_type="float16" if device == "cuda" else "int8"
        )

        _whisper_device = device

        print(f"[WHISPER] Model ready on {device}")

    except Exception:
        print("[WHISPER] ERROR loading model:")
        traceback.print_exc()
        _whisper_model = None
        _whisper_device = device

    return _whisper_model, _whisper_device


# ------------------------------------------------------------
# Transcribe Audio
# ------------------------------------------------------------
def transcribe_audio(audio_path: str) -> dict:
    model, device = get_model()

    if model is None:
        return {
            "text": "",
            "segments": [],
            "device_used": device,
            "error": "Model not available"
        }

    print(f"[WHISPER] Transcribing: {audio_path} on {device}")

    try:
        segments, info = model.transcribe(audio_path)
    except Exception:
        print("[WHISPER] ERROR during transcription:")
        traceback.print_exc()
        return {
            "text": "",
            "segments": [],
            "device_used": device,
            "error": "Transcription failure"
        }

    collected_segments = []
    full_text = []

    for seg in segments:
        collected_segments.append({
            "start": seg.start,
            "end": seg.end,
            "text": seg.text
        })
        full_text.append(seg.text)

    return {
        "text": " ".join(full_text).strip(),
        "segments": collected_segments,
        "device_used": device,
    }