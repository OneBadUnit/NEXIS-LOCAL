# ============================================================
# ARC-NEXUS - VISION SERVICE
# File: app/services/vision_service.py
# Version: 002 (Stability + Error Handling + Consistency)
# ============================================================

import base64
import requests
import asyncio
from functools import partial
from PIL import Image
import io

# ------------------------------------------------------------
# Ollama Configuration
# ------------------------------------------------------------
LLAVA_URL = "http://localhost:11434/api/generate"
LLAVA_MODEL = "llava:13b"   # MUST match `ollama list` exactly


# ------------------------------------------------------------
# Normalize image bytes → RGB PNG
# Ensures consistent input for all formats
# ------------------------------------------------------------
def _normalize_image(image_bytes: bytes) -> bytes:
    try:
        img = Image.open(io.BytesIO(image_bytes)).convert("RGB")
        buf = io.BytesIO()
        img.save(buf, format="PNG")
        return buf.getvalue()
    except Exception:
        raise ValueError("Invalid or unsupported image format.")


# ------------------------------------------------------------
# Synchronous LLaVA call
# ------------------------------------------------------------
def _run_llava_sync(image_bytes: bytes) -> str:
    try:
        # Normalize image
        clean_bytes = _normalize_image(image_bytes)

        # Encode image
        image_b64 = base64.b64encode(clean_bytes).decode("utf-8")

        # Payload
        payload = {
            "model": LLAVA_MODEL,
            "prompt": "Describe this image in clear, detailed terms.",
            "images": [image_b64],
            "stream": False,
        }

        # Request
        resp = requests.post(
            LLAVA_URL,
            json=payload,
            timeout=120
        )

        resp.raise_for_status()

        data = resp.json()
        output = data.get("response", "")

        if isinstance(output, str):
            cleaned = output.strip()
            if cleaned:
                return cleaned
            return "[VISION ERROR] Empty response from model."

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
# Async wrapper
# ------------------------------------------------------------
async def run_llava(image_bytes: bytes) -> str:
    loop = asyncio.get_event_loop()

    return await loop.run_in_executor(
        None,
        partial(_run_llava_sync, image_bytes),
    )