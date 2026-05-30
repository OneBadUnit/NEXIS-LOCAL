# ============================================================
# AUDIO INGESTION MODULE
# Handles GPU‑accelerated audio transcription using
# faster‑whisper (Large‑v3). Model is loaded lazily on first
# use — NOT at import time — so the backend starts cleanly
# on hosted services that don't have Whisper/GPU available.
#
# Provides:
#   - transcribe_audio_file(path) → str
#
# Fully async, uses run_in_executor for non‑blocking GPU work.
# Includes debug instrumentation for visibility.
# ============================================================

print(">>> AUDIO_UTILS LOADED FROM ingestion/audio_utils.py")

import asyncio


# ------------------------------------------------------------
# MODEL CONFIGURATION
# ------------------------------------------------------------
MODEL_NAME = "large-v3"

# Lazy cache — populated only on first transcription request.
_whisper_model = None
_whisper_device = None


def _get_whisper_model():
    """Load WhisperModel once on first call. Never at import time."""
    global _whisper_model, _whisper_device

    if _whisper_model is not None:
        return _whisper_model

    from app.utils.gpu_detection import get_whisper_device
    from faster_whisper import WhisperModel

    _whisper_device = get_whisper_device()
    _compute = "float16" if _whisper_device == "cuda" else "int8"

    print("\n================ WHISPER INIT ================")
    print(f"[WHISPER] Requested device: {_whisper_device}")

    _whisper_model = WhisperModel(
        MODEL_NAME,
        device=_whisper_device,
        compute_type=_compute,
    )

    print(f"[WHISPER] Model loaded successfully on {_whisper_device} ({_compute})")
    print("==============================================\n")

    return _whisper_model


# ------------------------------------------------------------
# TRANSCRIPTION FUNCTION
# Non‑blocking async wrapper around GPU Whisper inference.
# ------------------------------------------------------------
async def transcribe_audio_file(path: str) -> str:
    """
    Transcribe an audio file using faster‑whisper (GPU).
    Checks WHISPER_ENABLED flag before loading model.

    Returns:
        str: Transcript text or an error/disabled message.
    """

    from app.core.config import settings
    if not settings.WHISPER_ENABLED:
        return "Audio/video transcription is disabled. Set WHISPER_ENABLED=True in .env to enable."

    loop = asyncio.get_event_loop()

    def _work():
        try:
            model = _get_whisper_model()

            print("\n================ WHISPER RUN ================")
            print(f"[WHISPER] Starting transcription for: {path}")
            print(f"[WHISPER] Runtime device: {_whisper_device}")
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
