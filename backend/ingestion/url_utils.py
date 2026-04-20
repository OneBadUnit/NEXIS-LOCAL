import requests
from bs4 import BeautifulSoup
from .youtube_utils import transcribe_youtube_url

async def process_url_or_youtube(url: str) -> str:
    if not url:
        return "No URL provided."

    # STRICT YouTube detection
    if "youtube.com" in url or "youtu.be" in url:
        yt_text = await transcribe_youtube_url(url)

        if yt_text and len(yt_text.strip()) > 20:
            return yt_text

        return f"[YouTube processing failed]\n{yt_text}"

    # Non-YouTube fallback
    try:
        resp = requests.get(url, timeout=15)
        resp.raise_for_status()

        soup = BeautifulSoup(resp.text, "html.parser")
        for tag in soup(["script", "style", "noscript"]):
            tag.extract()

        text = soup.get_text(separator="\n")
        cleaned = "\n".join(
            line.strip() for line in text.splitlines() if line.strip()
        )

        return cleaned if cleaned else "No readable text found on page."

    except Exception as e:
        return f"Error processing URL: {str(e)}"
