# ============================================================
# ARC‑NEXUS VISION SERVICE (Ollama LLaVA Backend)
# Normalizes image → PNG → base64 and calls Ollama /api/generate
#
# IMPORTANT:
#   Ollama does NOT auto-alias model names.
#   You MUST use the EXACT model name returned by `ollama list`.
#
#   Your installed model:
#       llava:34b
#
#   If the model name does not match exactly, Ollama loads a
#   non‑vision text model → ignores the image → returns garbage
#   like "EE nee a".
# ============================================================

import base64
import requests
import asyncio
from functools import partial
from PIL import Image
import io

# Ollama's default multimodal endpoint
LLAVA_URL = "http://localhost:11434/api/generate"


# ------------------------------------------------------------
# Normalize image bytes → RGB PNG → clean bytes
# Ensures consistent input for all formats (JPG, HEIC, WEBP, etc.)
# ------------------------------------------------------------
def _normalize_image(image_bytes: bytes) -> bytes:
    img = Image.open(io.BytesIO(image_bytes)).convert("RGB")
    buf = io.BytesIO()
    img.save(buf, format="PNG")
    return buf.getvalue()


# ------------------------------------------------------------
# Synchronous LLaVA call (wrapped by async function below)
# ------------------------------------------------------------
def _run_llava_sync(image_bytes: bytes) -> str:
    try:
        # Normalize and encode image
        clean_bytes = _normalize_image(image_bytes)
        image_b64 = base64.b64encode(clean_bytes).decode("utf-8")

        # ------------------------------------------------------------
        # OLLAMA PAYLOAD (CRITICAL)
        # ------------------------------------------------------------
        # MUST match `ollama list` EXACTLY:
        #   llava:34b
        # ------------------------------------------------------------
        payload = {
            "model": "llava:34b",
            "prompt": "Describe this image in clear detail.",
            "images": [image_b64],   # must be an array
            "stream": False,         # return full JSON response
        }

        # Send request to Ollama
        resp = requests.post(LLAVA_URL, json=payload)
        resp.raise_for_status()
        data = resp.json()

        # Extract model output
        output = data.get("response", "")

        if isinstance(output, str):
            return output.strip()

        return str(output)

    except Exception as e:
        return f"[VISION ERROR] {str(e)}"


# ------------------------------------------------------------
# Async wrapper so FastAPI can await without blocking
# ------------------------------------------------------------
async def run_llava(image_bytes: bytes) -> str:
    loop = asyncio.get_event_loop()
    return await loop.run_in_executor(
        None,
        partial(_run_llava_sync, image_bytes)
    )
