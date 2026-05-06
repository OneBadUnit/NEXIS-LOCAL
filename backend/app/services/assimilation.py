# ============================================================
# ASSIMILATION MODULE (Backend)
# Handles ingestion of external content such as YouTube URLs
# and uploaded files. Attempts to fetch transcripts directly,
# falling back to GPU Whisper transcription when needed.
# All blocking operations (Whisper, yt-dlp) are executed in
# thread pools to keep FastAPI fully async-safe.
#
# Heavy imports (yt_dlp, faster_whisper, youtube_transcript_api)
# are deferred to function bodies — NOT loaded at import time.
# ============================================================

import os
import tempfile
import asyncio
from typing import Optional
from urllib.parse import urlparse, parse_qs


# ------------------------------------------------------------
# Helper: Extract YouTube Video ID
# ------------------------------------------------------------
def _extract_video_id(url: str) -> Optional[str]:
    parsed = urlparse(url)

    if "youtube.com" in parsed.netloc:
        qs = parse_qs(parsed.query)
        vid = qs.get("v", [None])[0]
        if vid:
            return vid

    if "youtu.be" in parsed.netloc:
        return parsed.path.lstrip("/")

    return None


# ------------------------------------------------------------
# Whisper Model — Lazy Cache
# Loaded only on first transcription request when enabled.
# ------------------------------------------------------------
_WHISPER_MODEL = None


def _get_whisper_model():
    """Load WhisperModel once on first call. Never at import time."""
    global _WHISPER_MODEL
    if _WHISPER_MODEL is not None:
        return _WHISPER_MODEL

    from faster_whisper import WhisperModel
    from app.utils.gpu_detection import get_whisper_device

    device = get_whisper_device()
    compute = "float16" if device == "cuda" else "int8"
    _WHISPER_MODEL = WhisperModel("medium", device=device, compute_type=compute)
    return _WHISPER_MODEL



# ------------------------------------------------------------
# YouTube Transcript Fetcher (Captions API)
# Attempts to fetch captions directly. If unavailable, returns
# None so Whisper can take over.
# ------------------------------------------------------------
async def get_youtube_transcript(url: str) -> Optional[str]:
    from app.core.config import settings
    if not settings.YOUTUBE_INGESTION_ENABLED:
        return None

    video_id = _extract_video_id(url)
    if not video_id:
        return None

    try:
        from youtube_transcript_api import (
            YouTubeTranscriptApi,
            TranscriptsDisabled,
            NoTranscriptFound,
        )
        segments = YouTubeTranscriptApi.get_transcript(
            video_id,
            languages=["en", "en-US", "en-GB"]
        )
        text = " ".join(seg.get("text", "") for seg in segments)
        return text.strip() or None

    except Exception:
        return None


# ------------------------------------------------------------
# Whisper Transcription (Async-Safe)
# Whisper is blocking, so we wrap it in a thread executor.
# ------------------------------------------------------------
def _whisper_sync(audio_path: str) -> str:
    model = _get_whisper_model()
    segments, _ = model.transcribe(audio_path, beam_size=5)
    return " ".join(seg.text.strip() for seg in segments).strip()


async def whisper_transcribe(audio_path: str) -> str:
    from app.core.config import settings
    if not settings.WHISPER_ENABLED:
        return "Audio/video transcription is not available in hosted beta mode."
    loop = asyncio.get_event_loop()
    return await loop.run_in_executor(None, lambda: _whisper_sync(audio_path))


# ------------------------------------------------------------
# yt-dlp Audio Download (Async-Safe)
# yt-dlp is blocking, so we wrap it in a thread executor.
# ------------------------------------------------------------
def _download_audio_sync(url: str) -> Optional[str]:
    import yt_dlp  # lazy — not loaded at startup

    temp_dir = tempfile.mkdtemp()
    output_path = os.path.join(temp_dir, "audio.%(ext)s")

    ydl_opts = {
        "format": "bestaudio/best",
        "outtmpl": output_path,
        "quiet": True,
        "no_warnings": True,
        "postprocessors": [
            {
                "key": "FFmpegExtractAudio",
                "preferredcodec": "wav",
                "preferredquality": "192",
            }
        ],
    }

    try:
        with yt_dlp.YoutubeDL(ydl_opts) as ydl:
            ydl.download([url])

        # Find the WAV file
        for file in os.listdir(temp_dir):
            if file.endswith(".wav"):
                return os.path.join(temp_dir, file)

    except Exception:
        return None

    return None


async def download_audio(url: str) -> Optional[str]:
    from app.core.config import settings
    if not settings.YOUTUBE_INGESTION_ENABLED:
        return None
    loop = asyncio.get_event_loop()
    return await loop.run_in_executor(None, lambda: _download_audio_sync(url))


# ------------------------------------------------------------
# Main Assimilation Logic
# Attempts captions → falls back to Whisper → returns transcript.
# ------------------------------------------------------------
async def process_url(url: str):
    from app.core.config import settings

    # 1. Try YouTube captions
    transcript = await get_youtube_transcript(url)

    # 2. If captions fail → Whisper fallback (only when enabled)
    if not transcript:
        if not settings.YOUTUBE_INGESTION_ENABLED:
            return {
                "source": url,
                "type": "url",
                "transcript": "YouTube/video ingestion is not available in hosted beta mode.",
            }

        audio_path = await download_audio(url)

        if audio_path:
            try:
                transcript = await whisper_transcribe(audio_path)
            except Exception as e:
                transcript = f"[Error] Whisper failed: {e}"
        else:
            transcript = "[Error] Could not download audio for Whisper fallback."

    return {
        "source": url,
        "type": "url",
        "transcript": transcript,
    }


# ------------------------------------------------------------
# File Processing (Stubbed for Now)
# Audio → placeholder
# PDF → placeholder
# Text → decoded directly
# ------------------------------------------------------------
async def process_file(file):
    content = await file.read()

    if file.filename.endswith((".mp3", ".wav", ".m4a", ".mp4", ".mov")):
        transcript = "[Stub] Audio transcription placeholder"
    elif file.filename.endswith(".pdf"):
        transcript = "[Stub] PDF text extraction placeholder"
    else:
        transcript = content.decode("utf-8")

    return {
        "source": file.filename,
        "type": "file",
        "transcript": transcript,
    }
