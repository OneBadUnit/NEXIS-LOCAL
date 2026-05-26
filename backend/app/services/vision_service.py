# ============================================================
# ARC-NEXUS - VISION SERVICE
# File: app/services/vision_service.py
# Version: 004 (NEXIS_VISION_MODEL + multimodal collection support)
#
# Provides two public async functions:
#   run_llava(image_bytes)           — legacy/direct vision call
#   describe_for_collection(image_bytes) — rich multimodal prompt
#     designed for the Image Collect pipeline (OCR + description)
#
# Also provides:
#   check_vision_model_available(model, ollama_url) — sync probe
#     Returns True/False without raising; used before attempting
#     a generation call so we can show a clean fallback message.
# ============================================================

import base64
import io
import requests
import asyncio
from functools import partial

# PIL is imported lazily inside _normalize_image so this module
# can be imported without loading Pillow at startup.


# ------------------------------------------------------------
# Runtime config helpers
# (read from settings lazily to avoid circular import at load)
# ------------------------------------------------------------
def _ollama_url() -> str:
    from app.core.config import settings
    return (settings.OLLAMA_URL or "http://localhost:11434").rstrip("/")


def _vision_model() -> str:
    from app.core.config import settings
    # NEXIS_VISION_MODEL takes priority; fall back to legacy VISION_MODEL.
    m = (settings.NEXIS_VISION_MODEL or "").strip()
    if not m:
        m = (settings.VISION_MODEL or "llava:13b").strip()
    return m


# ------------------------------------------------------------
# Normalize image bytes → RGB PNG
# Ensures consistent input for all formats.
# ------------------------------------------------------------
def _normalize_image(image_bytes: bytes) -> bytes:
    from PIL import Image  # lazy import
    try:
        img = Image.open(io.BytesIO(image_bytes)).convert("RGB")
        buf = io.BytesIO()
        img.save(buf, format="PNG")
        return buf.getvalue()
    except Exception:
        raise ValueError("Invalid or unsupported image format.")


# ------------------------------------------------------------
# Ollama model availability probe (synchronous, fast)
# Calls GET /api/tags and checks if the model name is listed.
# Returns False on any error (network, timeout, etc.) so the
# caller can decide to skip vision gracefully.
# ------------------------------------------------------------
def check_vision_model_available(model_name: str, ollama_url: str) -> bool:
    try:
        resp = requests.get(f"{ollama_url}/api/tags", timeout=5)
        if not resp.ok:
            return False
        data = resp.json()
        installed = [m.get("name", "") for m in data.get("models", [])]
        # Accept exact match or base-name match (e.g. "llava" matches "llava:13b")
        base = model_name.split(":")[0].lower()
        for name in installed:
            if name == model_name or name.lower() == model_name.lower():
                return True
            if name.split(":")[0].lower() == base:
                return True
        return False
    except Exception:
        return False


# ------------------------------------------------------------
# Synchronous Ollama generate call (shared by both prompts)
# ------------------------------------------------------------
def _call_ollama_vision(image_bytes: bytes, prompt: str) -> str:
    try:
        clean_bytes = _normalize_image(image_bytes)
        image_b64 = base64.b64encode(clean_bytes).decode("utf-8")
        model = _vision_model()
        url = f"{_ollama_url()}/api/generate"

        payload = {
            "model": model,
            "prompt": prompt,
            "images": [image_b64],
            "stream": False,
        }

        resp = requests.post(url, json=payload, timeout=180)
        resp.raise_for_status()

        data = resp.json()
        output = data.get("response", "")

        if isinstance(output, str):
            cleaned = output.strip()
            return cleaned if cleaned else "[VISION ERROR] Empty response from model."
        return str(output)

    except ValueError as ve:
        return f"[VISION ERROR] {str(ve)}"
    except requests.exceptions.Timeout:
        return "[VISION ERROR] Request timed out."
    except requests.exceptions.ConnectionError:
        return "[VISION ERROR] Could not connect to Ollama."
    except requests.exceptions.HTTPError as e:
        return f"[VISION ERROR] HTTP error: {str(e)}"
    except Exception as e:
        return f"[VISION ERROR] {str(e)}"


# ------------------------------------------------------------
# Legacy: run_llava — simple description prompt
# Used when VISION_ENABLED=True (direct vision path).
# ------------------------------------------------------------
_LEGACY_PROMPT = "Describe this image in clear, detailed terms."


async def run_llava(image_bytes: bytes) -> str:
    loop = asyncio.get_event_loop()
    return await loop.run_in_executor(
        None,
        partial(_call_ollama_vision, image_bytes, _LEGACY_PROMPT),
    )


# ------------------------------------------------------------
# Collection: describe_for_collection — rich multimodal prompt
# Used by the Image Collect pipeline alongside Tesseract OCR.
# ------------------------------------------------------------
_COLLECTION_PROMPT = (
    "Carefully describe this image. Cover the following:\n\n"
    "1. SUBJECT & CONTENT: What is shown? Describe the main subjects, "
    "objects, people, animals, or data visible.\n"
    "2. IMAGE TYPE: Is this a photograph, infographic, chart, screenshot, "
    "diagram, illustration, or something else?\n"
    "3. VISIBLE TEXT: Quote or paraphrase any visible text, labels, captions, "
    "titles, or data values you can read.\n"
    "4. PURPOSE & MESSAGE: What is the apparent purpose or message of this image?\n"
    "5. VISUAL FRAMING & TONE: Describe the composition, color palette, "
    "emotional tone, and visual style.\n"
    "6. CONTEXT & BIAS (if applicable): For news images, political content, "
    "infographics, or advertising — note any framing, point of view, "
    "or contextual indicators visible in the image.\n\n"
    "Be specific, factual, and thorough. Do not add opinions beyond what is visible."
)


async def describe_for_collection(image_bytes: bytes) -> str:
    loop = asyncio.get_event_loop()
    return await loop.run_in_executor(
        None,
        partial(_call_ollama_vision, image_bytes, _COLLECTION_PROMPT),
    )