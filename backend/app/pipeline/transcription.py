# ============================================================
# PIPELINE: AUDIO TRANSCRIPTION (Whisper Integration)
# This module provides the real transcription function used by
# the ingestion/assimilation pipeline. It loads Whisper using
# GPU when available, logs device usage, and returns structured
# transcription output.
# ============================================================

import traceback
from faster_whisper import WhisperModel
from app.utils.gpu_detection import get_whisper_device


# ------------------------------------------------------------
# transcribe_audio
# Accepts a path to an audio file and returns a dictionary:
#   - text:          full transcription text
#   - segments:      list of segment dicts (start, end, text)
#   - device_used:   "cuda" or "cpu"
#
# This function is synchronous because Whisper GPU execution
# is blocking. If async behavior is needed later, wrap this
# function in a thread executor.
# ------------------------------------------------------------
def transcribe_audio(audio_path: str) -> dict:
    device = get_whisper_device()

    # ============================================================
    # WHISPER INIT LOGS
    # ============================================================
    print("\n================ WHISPER INIT ================")
    print(f"[WHISPER] Requested device: {device}")

    try:
        model = WhisperModel(
            "medium",
            device=device,
            compute_type="float16" if device == "cuda" else "int8"
        )
        print(f"[WHISPER] Model loaded successfully on: {device}")
    except Exception as e:
        print("[WHISPER] ERROR loading Whisper model:")
        traceback.print_exc()
        return {
            "text": "",
            "segments": [],
            "device_used": device,
            "error": f"Model load failure: {e}"
        }

    # ============================================================
    # WHISPER TRANSCRIPTION START
    # ============================================================
    print("\n================ WHISPER RUN ================")
    print(f"[WHISPER] Starting transcription for: {audio_path}")
    print(f"[WHISPER] Runtime device: {device}")
    print("=============================================\n")

    try:
        segments, info = model.transcribe(audio_path)
    except Exception as e:
        print("[WHISPER] ERROR during transcription:")
        traceback.print_exc()
        return {
            "text": "",
            "segments": [],
            "device_used": device,
            "error": f"Transcription failure: {e}"
        }

    # Collect segments into a clean list
    collected_segments = []
    full_text = []

    for seg in segments:
        collected_segments.append({
            "start": seg.start,
            "end": seg.end,
            "text": seg.text
        })
        full_text.append(seg.text)

    # ============================================================
    # WHISPER TRANSCRIPTION COMPLETE
    # ============================================================
    print("\n================ WHISPER DONE ================")
    print(f"[WHISPER] Finished transcription for: {audio_path}")
    print("==============================================\n")

    return {
        "text": " ".join(full_text).strip(),
        "segments": collected_segments,
        "device_used": device,
    }
