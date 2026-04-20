# backend/ingestion/audio_utils.py

import asyncio
import os

import whisper

# Load Whisper Large-v3 once at startup (GPU will be used if available)
MODEL_NAME = "large-v3"
_model = whisper.load_model(MODEL_NAME)


async def transcribe_audio_file(path: str) -> str:
    """
    Transcribe an audio file using Whisper Large-v3.
    Keeps the same signature used by file_router.py.
    """

    loop = asyncio.get_event_loop()

    def _work():
        try:
            result = _model.transcribe(
                path,
                fp16=True,          # use GPU half-precision if available
                temperature=0.0,    # reduce hallucinations
                condition_on_previous_text=False,
                no_speech_threshold=0.6,  # more strict about "no speech"
                logprob_threshold=-1.0,
            )
            text = (result.get("text") or "").strip()
            return text if text else "No speech detected in audio."
        except Exception as e:
            return f"[AUDIO TRANSCRIPTION ERROR] {str(e)}"

    return await loop.run_in_executor(None, _work)
