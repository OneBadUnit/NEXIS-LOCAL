# ============================================================
# URL INGESTION MODULE
# Version: 004 (Lazy YouTube/yt-dlp + Feature Flags)
# ============================================================

print(">>> URL_UTILS LOADED FROM ingestion/url_utils.py")

import os
import tempfile
import requests
import subprocess
from bs4 import BeautifulSoup
from requests.exceptions import SSLError

# youtube_utils and file_router are imported lazily inside
# functions — NOT at module level — to prevent cascading into
# audio_utils and loading WhisperModel at startup.


MEDIA_EXT = {
    ".mp4", ".mov", ".mkv", ".avi",
    ".mp3", ".wav", ".m4a", ".ogg"
}


# ------------------------------------------------------------
# SAFE REQUEST (WITH SSL FALLBACK)
# ------------------------------------------------------------
def safe_get(url: str):
    try:
        return requests.get(
            url,
            timeout=15,
            headers={"User-Agent": "Mozilla/5.0"}
        )
    except SSLError:
        print(">>> SSL FAILED — retrying without verification")
        return requests.get(
            url,
            timeout=15,
            headers={"User-Agent": "Mozilla/5.0"},
            verify=False
        )


# ------------------------------------------------------------
# YOUTUBE FALLBACK
# ------------------------------------------------------------
async def extract_audio_with_ytdlp(url: str) -> str:
    from app.core.config import settings
    if not settings.YOUTUBE_INGESTION_ENABLED:
        return "YouTube/video ingestion is not available in hosted beta mode."

    print(">>> YT: Falling back to yt-dlp audio extraction")

    try:
        tmp_dir = tempfile.mkdtemp(prefix="arc_ytdlp_")
        audio_path = os.path.join(tmp_dir, "audio.m4a")

        cmd = [
            "yt-dlp",
            "-f", "bestaudio/best",
            "-x",
            "--audio-format", "m4a",
            "--user-agent", "Mozilla/5.0",
            "-o", audio_path,
            url,
        ]

        result = subprocess.run(
            cmd,
            capture_output=True,
            text=True,
            encoding="utf-8",
            errors="replace"
        )

        if result.returncode != 0:
            print(">>> YT: yt-dlp FAILED:", result.stderr)
            return None

        from .file_router import process_uploaded_file

        class TempUpload:
            filename = "youtube_audio.m4a"

            async def read(self_inner):
                with open(audio_path, "rb") as f:
                    return f.read()

        processed = await process_uploaded_file(TempUpload())

        try:
            os.remove(audio_path)
            os.rmdir(tmp_dir)
        except:
            pass

        return processed

    except Exception as e:
        print(">>> YT: yt-dlp extraction error:", e)
        return None


# ------------------------------------------------------------
# MAIN URL PROCESSOR
# ------------------------------------------------------------
async def process_url_or_youtube(url: str) -> str:
    print(f">>> process_url_or_youtube CALLED with: {url}")

    if not url:
        return "No URL provided."

    from app.core.config import settings

    # ---------------- YOUTUBE ----------------
    if "youtube.com" in url or "youtu.be" in url:
        print(">>> YT BRANCH HIT")

        if not settings.YOUTUBE_INGESTION_ENABLED:
            return "YouTube/video ingestion is not available in hosted beta mode."

        try:
            from .youtube_utils import transcribe_youtube_url
            yt_text = await transcribe_youtube_url(url)
            if yt_text and len(yt_text.strip()) > 20:
                return yt_text
        except Exception as e:
            print(">>> YT API FAILED:", e)

        processed = await extract_audio_with_ytdlp(url)
        if processed:
            return processed

        return "[YouTube processing failed]"

    # ---------------- MEDIA ----------------
    lower = url.lower()
    for ext in MEDIA_EXT:
        if lower.endswith(ext):
            print(">>> MEDIA BRANCH HIT:", ext)

            if not settings.WHISPER_ENABLED:
                return "Audio/video transcription is not available in hosted beta mode."

            try:
                resp = safe_get(url)
                resp.raise_for_status()

                tmp_dir = tempfile.mkdtemp(prefix="arc_url_media_")
                path = os.path.join(tmp_dir, f"downloaded{ext}")

                with open(path, "wb") as f:
                    f.write(resp.content)

                from .file_router import process_uploaded_file

                class TempUpload:
                    filename = f"downloaded{ext}"

                    async def read(self_inner):
                        return resp.content

                result = await process_uploaded_file(TempUpload())

                try:
                    os.remove(path)
                    os.rmdir(tmp_dir)
                except:
                    pass

                return result

            except Exception as e:
                return f"Error downloading media: {str(e)}"

    # ---------------- HTML ----------------
    print(">>> HTML BRANCH HIT")

    try:
        resp = safe_get(url)
        resp.raise_for_status()

        soup = BeautifulSoup(resp.text, "html.parser")

        for tag in soup([
            "script", "style", "noscript",
            "header", "footer", "nav",
            "form", "iframe", "table"
        ]):
            tag.extract()

        # Wikipedia targeting
        content = soup.find("div", id="mw-content-text")
        if content:
            soup = content

        for sup in soup.find_all("sup"):
            sup.extract()

        for span in soup.find_all("span", class_="mw-editsection"):
            span.extract()

        text = soup.get_text(separator="\n")

        cleaned = "\n".join(
            line.strip()
            for line in text.splitlines()
            if line.strip()
        )

        return cleaned if cleaned else "No readable text found."

    except Exception as e:
        return f"Error processing URL: {str(e)}"