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


# ------------------------------------------------------------
# MODEL CONFIGURATION
# ------------------------------------------------------------
MODEL_NAME = "large-v3"

# Load Whisper model once (GPU)
# compute_type="float16" is optimal for RTX 40‑series GPUs
try:
    model = WhisperModel(
        MODEL_NAME,
        device="cuda",
        compute_type="float16"
    )
    print(f">>> WHISPER MODEL LOADED: {MODEL_NAME} (GPU float16)")
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
            print(">>> WHISPER: starting transcription for:", path)

            segments, info = model.transcribe(path)

            text = " ".join(seg.text.strip() for seg in segments)

            print(">>> WHISPER RAW TEXT (len={}): {}".format(
                len(text),
                repr(text[:200])
            ))

            return text if text else "No speech detected in audio."

        except Exception as e:
            print(">>> WHISPER EXCEPTION:", repr(str(e)))
            return f"[AUDIO TRANSCRIPTION ERROR] {str(e)}"

    return await loop.run_in_executor(None, _work)
