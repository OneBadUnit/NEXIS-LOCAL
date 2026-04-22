# ============================================================
# YOUTUBE INGESTION MODULE
# Downloads audio via yt-dlp, extracts the final .m4a file,
# and sends it to Whisper for transcription. Fully async with
# safe temp handling and Windows‑safe subprocess execution.
# ============================================================

import os
import tempfile
import subprocess

from .audio_utils import transcribe_audio_file


# ------------------------------------------------------------
# CONFIG
# ------------------------------------------------------------
YT_DLP_PATH = r"C:\Users\OneBadUnit\AppData\Local\Programs\Python\Python311\Scripts\yt-dlp.exe"


# ------------------------------------------------------------
# YOUTUBE → AUDIO → TRANSCRIPTION
# ------------------------------------------------------------
async def transcribe_youtube_url(url: str) -> str:
    tmp_dir = tempfile.mkdtemp(prefix="arc_yt_")
    audio_prefix = os.path.join(tmp_dir, "audio")

    try:
        print(f"[YT] Starting download: {url}")

        cmd = (
            f'"{YT_DLP_PATH}" '
            f'-f bestaudio/best '
            f'-x --audio-format m4a '
            f'-o "{audio_prefix}.%(ext)s" '
            f'"{url}"'
        )

        # Windows‑safe subprocess execution
        proc = subprocess.Popen(
            cmd,
            stdout=subprocess.PIPE,
            stderr=subprocess.PIPE,
            shell=True
        )

        out, err = proc.communicate()

        print("[YT] yt-dlp stdout:", out.decode(errors="ignore"))
        print("[YT] yt-dlp stderr:", err.decode(errors="ignore"))

        if proc.returncode != 0:
            return f"[YT ERROR] yt-dlp failed: {err.decode(errors='ignore')}"

        # Locate the downloaded audio file
        final_audio = None
        for f in os.listdir(tmp_dir):
            if f.startswith("audio") and f.endswith(".m4a"):
                final_audio = os.path.join(tmp_dir, f)
                break

        if not final_audio:
            return "[YT ERROR] Audio file not found after download."

        print("[YT] Download complete. Transcribing...")

        text = await transcribe_audio_file(final_audio)

        print("[YT] Transcription complete.")
        return text

    except Exception as e:
        return f"[YT ERROR] Exception: {str(e)}"

    finally:
        # Cleanup temp directory
        try:
            for f in os.listdir(tmp_dir):
                os.remove(os.path.join(tmp_dir, f))
            os.rmdir(tmp_dir)
        except:
            pass
