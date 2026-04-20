from app.utils.gpu_detection import get_whisper_device


def transcribe_audio(audio_path: str) -> dict:
    device = get_whisper_device()
    # TODO: load Whisper model and run real transcription
    # For now, return a stub so the pipeline can be wired.
    return {
        "text": f"Stub transcription for {audio_path}",
        "segments": [],
        "device_used": device,
    }
