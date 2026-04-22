# ============================================================
# PIPELINE: AUDIO TRANSCRIPTION (Stub)
# This module provides a placeholder transcription function
# used by the ingestion/assimilation pipeline. It currently
# returns a stub response but is structured so Whisper or any
# other transcription backend can be plugged in later.
# ============================================================

from app.utils.gpu_detection import get_whisper_device


# ------------------------------------------------------------
# transcribe_audio
# Accepts a path to an audio file and returns a dictionary
# containing:
#   - text:          transcription output (stub for now)
#   - segments:      list of segment objects (empty for now)
#   - device_used:   "cuda" or "cpu" depending on availability
#
# This function is intentionally synchronous because the real
# Whisper integration will determine whether async wrapping is
# needed (e.g., thread executor for blocking GPU calls).
# ------------------------------------------------------------
def transcribe_audio(audio_path: str) -> dict:
    device = get_whisper_device()

    # TODO: Replace stub with real Whisper transcription
    return {
        "text": f"Stub transcription for {audio_path}",
        "segments": [],
        "device_used": device,
    }
