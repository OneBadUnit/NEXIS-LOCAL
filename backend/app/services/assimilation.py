import os
import tempfile
from typing import Optional
from urllib.parse import urlparse, parse_qs

import yt_dlp
from faster_whisper import WhisperModel

from youtube_transcript_api import (
    YouTubeTranscriptApi,
    TranscriptsDisabled,
    NoTranscriptFound
)


# ---------------------------------------------------------
# Helpers
# ---------------------------------------------------------

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


# ---------------------------------------------------------
# GPU Whisper Model (loaded once)
# ---------------------------------------------------------

WHISPER_MODEL = WhisperModel(
    "medium",
    device="cuda",
    compute_type="float16"
)


# ---------------------------------------------------------
# YouTube Transcript Fetcher
# ---------------------------------------------------------

async def get_youtube_transcript(url: str) -> Optional[str]:
    """
    Try to fetch captions. If unavailable, return None so Whisper can take over.
    """
    video_id = _extract_video_id(url)
    if not video_id:
        return None

    try:
        segments = YouTubeTranscriptApi.get_transcript(
            video_id,
            languages=["en", "en-US", "en-GB"]
        )
        text = " ".join(seg.get("text", "") for seg in segments)
        return text if text.strip() else None

    except (TranscriptsDisabled, NoTranscriptFound):
        return None
    except Exception:
        return None


# ---------------------------------------------------------
# Whisper Fallback
# ---------------------------------------------------------

async def whisper_transcribe(audio_path: str) -> str:
    """
    GPU Whisper transcription.
    """
    segments, _ = WHISPER_MODEL.transcribe(audio_path, beam_size=5)

    text = " ".join(seg.text.strip() for seg in segments)
    return text.strip()


# ---------------------------------------------------------
# Download Audio with yt-dlp
# ---------------------------------------------------------

async def download_audio(url: str) -> Optional[str]:
    """
    Downloads audio to a temporary file and returns the path.
    """
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


# ---------------------------------------------------------
# Main Assimilation Logic
# ---------------------------------------------------------

async def process_url(url: str):
    # 1. Try captions
    transcript = await get_youtube_transcript(url)

    # 2. If captions fail → Whisper fallback
    if not transcript:
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


# ---------------------------------------------------------
# File Processing (unchanged for now)
# ---------------------------------------------------------

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
