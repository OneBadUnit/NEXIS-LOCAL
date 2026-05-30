# ============================================================
# URL INGESTION MODULE
# Version: 007 (Article body isolation + contamination detection)
# ============================================================
#
# HTML extraction strategy (priority order):
#   1. trafilatura   — text-density extraction (best for news/article URLs)
#   2. BS4 selectors — article/main/[role]/common class patterns
#   3. Noise-stripped full body — last resort, always contamination-checked
#
# A contamination warning is surfaced to the user when ≥3 boilerplate
# markers are detected in the extracted text.  Raw content is never
# blocked on contamination alone — the user can still generate from it.
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


# ============================================================
# ARTICLE EXTRACTION HELPERS
# ============================================================

# Boilerplate phrases that appear in navigation/ads/sidebars.
# Matching ≥ _CONTAMINATION_THRESHOLD of these in extracted text
# indicates the content was not cleanly isolated.
_CONTAMINATION_MARKERS = [
    "advertisement",
    "most popular",
    "latest articles",
    "current top stories",
    "join our community",
    "sign in or register",
    "already a member",
    "back to top",
    "related articles",
    "promoted content",
    "read more:",
    "see all",
    "today's daily briefing",
    "latest blogs",
    "top ops",
    "homepage",
    "skip to main content",
    "newsletter",
    "subscribe now",
    "log in to comment",
    "create an account",
    "breaking news",
    "trending now",
    "today's top stories",
    "more from",
    "you may also like",
]

_CONTAMINATION_THRESHOLD = 3

# Class/id fragments that reliably identify noise containers.
# Only exact substring matches are used — conservative by design.
_NOISE_ATTRS = [
    "sidebar",
    "widget",
    "advertisement",
    "ads-",
    "-ads",
    "ad-wrapper",
    "ad-container",
    "promo",
    "newsletter",
    "subscribe",
    "signup",
    "social-share",
    "share-bar",
    "share-buttons",
    "related-articles",
    "related-posts",
    "most-popular",
    "popular-posts",
    "trending",
    "cookie-banner",
    "cookie-notice",
    "gdpr",
    "comment-section",
    "comment-form",
    "back-to-top",
    "skip-to-content",
    "top-stories-bar",
    "breaking-news-bar",
]

# CSS selectors tried in priority order when trafilatura is unavailable
# or returns insufficient content.
_ARTICLE_SELECTORS = [
    "article",
    "[role='article']",
    "[role='main']",
    "main",
    # Generic article body class patterns
    ".article-body",
    ".article-content",
    ".article__body",
    ".article__content",
    ".articleBody",
    ".story-body",
    ".story-content",
    ".storyBody",
    ".post-body",
    ".post-content",
    ".entry-content",
    ".content-body",
    ".main-content",
    # Times of Israel / WordPress-derived patterns
    ".the-content",
    # Structured data / test-id patterns
    "[data-testid='article-body']",
    "[data-module='ArticleBody']",
    # ID fallbacks
    "#article-body",
    "#articleBody",
    "#story-body",
    "#main-content",
    # Wikipedia
    "#mw-content-text",
]


def _strip_noise_elements(soup: BeautifulSoup) -> None:
    """Remove obvious non-content elements from soup in-place."""
    for tag in soup(["script", "style", "noscript", "head",
                     "header", "footer", "nav", "form",
                     "iframe", "aside"]):
        tag.extract()

    # Remove elements whose class or id contains a noise fragment.
    # Iterate over a snapshot (list()) because we mutate during traversal.
    for el in list(soup.find_all(True)):
        try:
            el_classes = " ".join(el.get("class", [])).lower()
            el_id = (el.get("id") or "").lower()
            combined = el_classes + " " + el_id
            if any(noise in combined for noise in _NOISE_ATTRS):
                el.extract()
        except Exception:
            pass


def _element_to_text(el: BeautifulSoup) -> str:
    """Return clean, collapsed text from a BS4 element."""
    for sup in el.find_all("sup"):
        sup.extract()
    for span in el.find_all("span", class_="mw-editsection"):
        span.extract()
    raw = el.get_text(separator="\n")
    lines = [line.strip() for line in raw.splitlines() if line.strip()]
    return "\n".join(lines)


def _detect_contamination(text: str):
    """Return (is_contaminated: bool, found_markers: list[str])."""
    text_lower = text.lower()
    found = [m for m in _CONTAMINATION_MARKERS if m in text_lower]
    return len(found) >= _CONTAMINATION_THRESHOLD, found


def _contamination_warning(markers) -> str:
    return (
        "Collected text may include webpage boilerplate. "
        "Review source before generating."
    )


def _extract_article_content(html: str, url: str):
    """
    Return (cleaned_text: str, warning: str).

    warning is "" when extraction confidence is high.
    warning is a user-facing string when contamination markers are found.

    Strategy:
      1. trafilatura — text-density extraction (best for arbitrary news sites)
      2. BS4 semantic selector priority
      3. Noise-stripped full body (last resort, always contamination-checked)
    """
    # ── Strategy 1: trafilatura ───────────────────────────────
    try:
        import trafilatura
        result = trafilatura.extract(
            html,
            include_comments=False,
            include_tables=False,
            favor_recall=True,
            no_fallback=False,
        )
        if result and len(result.strip()) > 200:
            print(">>> ARTICLE: extracted via trafilatura")
            contaminated, found = _detect_contamination(result)
            warning = _contamination_warning(found) if contaminated else ""
            return result.strip(), warning
        print(">>> ARTICLE: trafilatura returned insufficient content, falling back")
    except ImportError:
        print(">>> ARTICLE: trafilatura not installed — using BS4 fallback")
    except Exception as e:
        print(f">>> ARTICLE: trafilatura error ({e}), falling back")

    # ── Strategy 2: BS4 semantic selector priority ────────────
    soup = BeautifulSoup(html, "html.parser")
    _strip_noise_elements(soup)

    content = None
    for selector in _ARTICLE_SELECTORS:
        try:
            candidates = soup.select(selector)
        except Exception:
            continue
        if not candidates:
            continue
        best = max(candidates, key=lambda el: len(el.get_text()))
        if len(best.get_text().strip()) > 200:
            content = best
            print(f">>> ARTICLE: content found via selector {selector!r}")
            break

    if content is not None:
        text = _element_to_text(content)
        if len(text) > 200:
            contaminated, found = _detect_contamination(text)
            warning = _contamination_warning(found) if contaminated else ""
            return text, warning

    # ── Strategy 3: noise-stripped full body (last resort) ────
    print(">>> ARTICLE: falling back to full body extraction (may be contaminated)")
    body = soup.find("body") or soup
    text = _element_to_text(body)
    if not text:
        return "No readable text found.", ""

    contaminated, found = _detect_contamination(text)
    warning = _contamination_warning(found) if contaminated else (
        "Article content could not be isolated. "
        "Full page text was collected — review source before generating."
    )
    return text, warning


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
        return "YouTube ingestion is disabled. Set YOUTUBE_INGESTION_ENABLED=True in .env to enable."

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

        api = YouTubeTranscriptApi()
        transcript = api.fetch(video_id)
        segments = list(transcript)

        # Full transcript text
        text = " ".join(seg.text.strip() for seg in segments).strip()
        if not text:
            return None, ""

        # ~10 evenly spaced timestamp markers
        step = max(1, len(segments) // 10)
        ts_lines = []
        for seg in segments[::step]:
            t = int(getattr(seg, 'start', 0))
            mins, secs = divmod(t, 60)
            excerpt = getattr(seg, 'text', '').strip()[:70]
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
            return _make("YouTube ingestion is disabled. Set YOUTUBE_INGESTION_ENABLED=True in .env to enable.", "youtube")

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
                return _make("Audio/video transcription is disabled. Set WHISPER_ENABLED=True in .env to enable.", "media")

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

    # ---------------- HTML (ARTICLE EXTRACTION) ----------------
    print(">>> HTML BRANCH HIT")

    try:
        resp = safe_get(url)
        resp.raise_for_status()

        cleaned, warning = _extract_article_content(resp.text, url)

        return {
            "raw_content": cleaned if cleaned else "No readable text found.",
            "brief": "",
            "source_type": "article",
            "warning": warning,
        }

    except Exception as e:
        return _make(f"Error processing URL: {str(e)}", "article")