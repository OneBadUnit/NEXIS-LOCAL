# ============================================================
# VIDEO INGESTION MODULE
# Extracts audio from video using ffmpeg, then sends the audio
# to the Whisper transcription engine. Fully async, safe temp
# handling, and debug‑instrumented for visibility.
# ============================================================

print(">>> VIDEO_UTILS LOADED FROM ingestion/video_utils.py")

import asyncio
import os
import shutil
import tempfile

from .audio_utils import transcribe_audio_file


# ------------------------------------------------------------
# CONFIG
# Resolve ffmpeg from PATH; fall back to bare name so the OS error
# message names the missing tool rather than a stale absolute path.
# SAFE_TMP is relative to backend/tmp/ so it works on any machine.
# ------------------------------------------------------------
FFMPEG_PATH = shutil.which("ffmpeg") or "ffmpeg"

SAFE_TMP = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "tmp"))
os.makedirs(SAFE_TMP, exist_ok=True)


# ------------------------------------------------------------
# VIDEO → AUDIO → TRANSCRIPTION
# ------------------------------------------------------------
async def transcribe_video_file(path: str) -> str:
    tmp_dir = tempfile.mkdtemp(prefix="arc_vid_", dir=SAFE_TMP)
    audio_path = os.path.join(tmp_dir, "audio.wav")

    try:
        # Debug: input file size
        try:
            print(">>> DEBUG: Input video file size:", os.path.getsize(path))
        except Exception as e:
            print(">>> DEBUG: Could not stat input file:", str(e))

        # ffmpeg command
        cmd = [
            FFMPEG_PATH,
            "-y",
            "-i", path,
            "-vn",
            "-acodec", "pcm_s16le",
            "-ar", "16000",
            "-ac", "1",
            audio_path,
        ]

        print(">>> FFMPEG CMD:", " ".join(cmd))

        # Run ffmpeg asynchronously
        proc = await asyncio.create_subprocess_exec(
            *cmd,
            stdout=asyncio.subprocess.PIPE,
            stderr=asyncio.subprocess.PIPE,
        )

        out, err = await proc.communicate()

        err_text = err.decode(errors="ignore")
        print(">>> FFMPEG STDERR (first 400 chars):", err_text[:400], "…")
        print(">>> FFMPEG RETURN CODE:", proc.returncode)

        # ffmpeg failure
        if proc.returncode != 0:
            return f"[FFMPEG ERROR] {err_text}"

        # Ensure audio file exists
        if not os.path.exists(audio_path):
            print(">>> ERROR: ffmpeg did not create audio file")
            return "[Video ERROR] ffmpeg produced no audio file."

        audio_size = os.path.getsize(audio_path)
        print(">>> DEBUG: Extracted audio file size:", audio_size)

        if audio_size == 0:
            print(">>> ERROR: Extracted audio is empty")
            return "[Video ERROR] Extracted audio is empty."

        print(">>> FFMPEG SUCCESS, calling Whisper…")

        # Transcribe audio
        text = await transcribe_audio_file(audio_path)
        print(">>> WHISPER RESULT (first 200 chars):", repr(text[:200]), "…")

        return text

    except Exception as e:
        print(">>> VIDEO PIPELINE EXCEPTION:", repr(str(e)))
        return f"[Video ERROR] {str(e)}"

    finally:
        # Cleanup
        try:
            if os.path.exists(audio_path):
                os.remove(audio_path)
            os.rmdir(tmp_dir)
        except:
            pass
