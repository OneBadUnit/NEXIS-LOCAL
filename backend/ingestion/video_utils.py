import asyncio
import os
import tempfile
from .audio_utils import transcribe_audio_file

FFMPEG_PATH = "ffmpeg"  # update if needed

async def transcribe_video_file(path: str) -> str:
    tmp_dir = tempfile.mkdtemp(prefix="arc_vid_")
    audio_path = os.path.join(tmp_dir, "audio.m4a")

    try:
        cmd = [
            FFMPEG_PATH,
            "-y",
            "-i", path,
            "-vn",
            "-acodec", "aac",
            audio_path,
        ]

        proc = await asyncio.create_subprocess_exec(
            *cmd,
            stdout=asyncio.subprocess.PIPE,
            stderr=asyncio.subprocess.PIPE,
        )

        _, err = await proc.communicate()

        if proc.returncode != 0:
            return f"[FFMPEG ERROR] {err.decode(errors='ignore')}"

        text = await transcribe_audio_file(audio_path)
        return text

    except Exception as e:
        return f"[Video ERROR] {str(e)}"

    finally:
        try:
            if os.path.exists(audio_path):
                os.remove(audio_path)
            os.rmdir(tmp_dir)
        except:
            pass
