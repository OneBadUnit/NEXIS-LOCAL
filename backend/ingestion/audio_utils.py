# ============================================================
# AUDIO INGESTION MODULE
# Handles GPU‑accelerated audio transcription using
# faster‑whisper (Large‑v3). Loaded once at import time.
#
# Provides:
#   - transcribe_audio_file(path) → str
#
# Fully async, uses run_in_executor for non‑blocking GPU work.
# Includes debug instrumentation for visibility.
# ============================================================

print(">>> AUDIO_UTILS LOADED FROM ingestion/audio_utils.py")

import asyncio
from faster_whisper import WhisperModel
from app.utils.gpu_detection import get_whisper_device


# ------------------------------------------------------------
# MODEL CONFIGURATION
# ------------------------------------------------------------
MODEL_NAME = "large-v3"

# Load Whisper model once (auto-detected device)
try:
    _device = get_whisper_device()
    _compute = "float16" if _device == "cuda" else "int8"

    print("\n================ WHISPER INIT ================")
    print(f"[WHISPER] Requested device: {_device}")

    model = WhisperModel(
        MODEL_NAME,
        device=_device,
        compute_type=_compute,
    )

    print(f"[WHISPER] Model loaded successfully on {_device} ({_compute})")
    print("==============================================\n")

except Exception as e:
    print(">>> ERROR LOADING WHISPER MODEL:", e)
    model = None


# ------------------------------------------------------------
# TRANSCRIPTION FUNCTION
# Non‑blocking async wrapper around GPU Whisper inference.
# ------------------------------------------------------------
async def transcribe_audio_file(path: str) -> str:
    """
    Transcribe an audio file using faster‑whisper (GPU).
    Fully instrumented for debugging.

    Returns:
        str: Transcript text or an error message.
    """

    if model is None:
        return "[AUDIO TRANSCRIPTION ERROR] Whisper model failed to load."

    loop = asyncio.get_event_loop()

    def _work():
        try:
            print("\n================ WHISPER RUN ================")
            print(f"[WHISPER] Starting transcription for: {path}")
            print(f"[WHISPER] Runtime device: {_device}")
            print("=============================================\n")

            segments, info = model.transcribe(path)

            text = " ".join(seg.text.strip() for seg in segments)

            # Clean preview instead of dumping full text
            preview = text[:200].replace("\n", " ")
            print(f">>> WHISPER PREVIEW (first 200 chars): {preview!r}")

            print("\n================ WHISPER DONE ================")
            print(f"[WHISPER] Finished transcription for: {path}")
            print("==============================================\n")

            return text if text else "No speech detected in audio."

        except Exception as e:
            print(">>> WHISPER EXCEPTION:", repr(str(e)))
            return f"[AUDIO TRANSCRIPTION ERROR] {str(e)}"

    return await loop.run_in_executor(None, _work)
