# ============================================================
# URL INGESTION MODULE
# Version: 006 (All branches return dict {raw_content, brief, source_type})
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
# YOUTUBE HELPERS
# ------------------------------------------------------------

def _fetch_yt_title(url: str) -> str:
    """Fetch YouTube video title via oEmbed (no API key required)."""
    try:
        resp = requests.get(
            f"https://www.youtube.com/oembed?url={url}&format=json",
            timeout=6,
            headers={"User-Agent": "Mozilla/5.0"},
        )
        if resp.ok:
            return resp.json().get("title", "")
    except Exception:
        pass
    return ""


def _fetch_yt_transcript_with_timestamps(url: str):
    """Try YouTube captions API.  Returns (transcript_text, timestamps_text)
    or (None, "") when captions are unavailable or the URL is not a YouTube
    video.  Imported lazily to avoid loading the library at startup.
    """
    try:
        from youtube_transcript_api import YouTubeTranscriptApi
        from urllib.parse import urlparse, parse_qs

        parsed = urlparse(url)
        if "youtube.com" in parsed.netloc:
            video_id = parse_qs(parsed.query).get("v", [None])[0]
        elif "youtu.be" in parsed.netloc:
            video_id = parsed.path.lstrip("/")
        else:
            return None, ""

        if not video_id:
            return None, ""

        segments = YouTubeTranscriptApi.get_transcript(
            video_id, languages=["en", "en-US", "en-GB"]
        )

        # Full transcript text
        text = " ".join(seg.get("text", "").strip() for seg in segments).strip()
        if not text:
            return None, ""

        # ~10 evenly spaced timestamp markers
        step = max(1, len(segments) // 10)
        ts_lines = []
        for seg in segments[::step]:
            t = int(seg.get("start", 0))
            mins, secs = divmod(t, 60)
            excerpt = seg.get("text", "").strip()[:70]
            ts_lines.append(f"[{mins:02d}:{secs:02d}] {excerpt}")

        return text, "\n".join(ts_lines)

    except Exception:
        return None, ""


# ------------------------------------------------------------
# MAIN URL PROCESSOR
# ------------------------------------------------------------
async def process_url_or_youtube(url: str) -> dict:
    """Returns { "raw_content": str, "brief": str, "source_type": str }.
    raw_content is the pure extracted text (transcript, article, etc.).
    brief is the AI-generated analysis (empty string for non-video URLs).
    """
    print(f">>> process_url_or_youtube CALLED with: {url}")

    def _make(text: str, source_type: str = "url", brief: str = "") -> dict:
        return {"raw_content": text, "brief": brief, "source_type": source_type}

    if not url:
        return _make("No URL provided.")

    from app.core.config import settings

    # ---------------- YOUTUBE ----------------
    if "youtube.com" in url or "youtu.be" in url:
        print(">>> YT BRANCH HIT")

        if not settings.YOUTUBE_INGESTION_ENABLED:
            return _make("YouTube/video ingestion is not available in hosted beta mode.", "youtube")

        # ── Step 1: metadata ─────────────────────────────────
        title = _fetch_yt_title(url)
        print(f">>> YT title: {title!r}")

        # ── Step 2: YouTube captions API (fast, no Whisper) ──
        transcript = None
        transcript_source = "unknown"
        timestamps = ""
        try:
            transcript, timestamps = _fetch_yt_transcript_with_timestamps(url)
            if transcript:
                transcript_source = "YouTube captions"
                print(">>> YT: Got captions")
        except Exception as e:
            print(">>> YT: Captions error:", e)

        # ── Step 3: Whisper fallback ──────────────────────────
        if not transcript:
            print(">>> YT: Falling back to Whisper")
            try:
                from .youtube_utils import transcribe_youtube_url
                yt_text = await transcribe_youtube_url(url)
                if yt_text and len(yt_text.strip()) > 20:
                    transcript = yt_text
                    transcript_source = "Whisper transcription"
            except Exception as e:
                print(">>> YT: Whisper failed:", e)

        if not transcript:
            processed = await extract_audio_with_ytdlp(url)
            if processed:
                transcript = processed
                transcript_source = "Whisper transcription (yt-dlp)"

        if not transcript:
            return _make("[YouTube processing failed]", "youtube")

        # ── Step 4: generate video intelligence brief ─────────
        try:
            from app.services.video_intel import generate_video_brief
            result = await generate_video_brief(
                url=url,
                title=title,
                transcript=transcript,
                transcript_source=transcript_source,
                timestamps=timestamps,
                ollama_url=settings.OLLAMA_URL.rstrip("/"),
                model=settings.LLM_MODEL,
            )
            return {
                "raw_content": result["raw"],
                "brief": result["brief"],
                "source_type": "youtube",
            }
        except Exception as e:
            print(f">>> YT: video_intel failed: {e}")
            return _make(transcript, "youtube")  # graceful degradation

    # ---------------- MEDIA ----------------
    lower = url.lower()
    for ext in MEDIA_EXT:
        if lower.endswith(ext):
            print(">>> MEDIA BRANCH HIT:", ext)

            if not settings.WHISPER_ENABLED:
                return _make("Audio/video transcription is not available in hosted beta mode.", "media")

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

                return _make(result, "media")

            except Exception as e:
                return _make(f"Error downloading media: {str(e)}", "media")

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

        return _make(cleaned if cleaned else "No readable text found.", "article")

    except Exception as e:
        return _make(f"Error processing URL: {str(e)}", "article")