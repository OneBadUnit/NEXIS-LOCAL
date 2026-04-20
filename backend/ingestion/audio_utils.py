print(">>> AUDIO_UTILS LOADED FROM ingestion/audio_utils.py")

import asyncio
from faster_whisper import WhisperModel

MODEL_NAME = "large-v3"

# Load Whisper once (GPU)
model = WhisperModel(
    MODEL_NAME,
    device="cuda",
    compute_type="float16"
)


async def transcribe_audio_file(path: str) -> str:
    """
    Transcribe an audio file using faster-whisper (GPU).
    Fully instrumented for debugging.
    """

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
