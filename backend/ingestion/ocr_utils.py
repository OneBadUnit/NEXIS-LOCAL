# ============================================================
# OCR INGESTION MODULE
# File: ingestion/ocr_utils.py
# Version: 002 (NEXIS_TESSERACT_PATH + local-mode bypass + diagnostics)
#
# High-accuracy OCR pipeline using Tesseract with aggressive
# preprocessing (denoise, threshold, deskew). Fully async.
#
# cv2, numpy, PIL, and pytesseract are imported lazily inside
# functions — NOT at module level — so the backend starts
# cleanly when OCR_ENABLED is false (hosted mode).
# ============================================================

import os
import io
import asyncio


# ------------------------------------------------------------
# TESSERACT PATH RESOLUTION
# Priority: NEXIS_TESSERACT_PATH (env/config) → known local install
# ------------------------------------------------------------
_FALLBACK_TESSERACT = r"D:\ARC NEXUS LLC\NEXIS\Tesseract-OCR\tesseract.exe"


def resolve_tesseract_path() -> str:
    """Return the effective Tesseract executable path.

    Reads NEXIS_TESSERACT_PATH from settings; falls back to the
    known NEXIS-LOCAL install location if the setting is empty.
    """
    from app.core.config import settings
    configured = (settings.NEXIS_TESSERACT_PATH or "").strip()
    return configured if configured else _FALLBACK_TESSERACT


def get_ocr_diagnostics() -> dict:
    """Return OCR availability info for the /api/system/check endpoint."""
    from app.core.config import settings
    path = resolve_tesseract_path()
    found = os.path.isfile(path)
    # Available when Tesseract exists AND either the flag is set OR we're in local mode.
    available = found and (settings.OCR_ENABLED or not settings.NEXIS_HOSTED_MODE)
    return {
        "tesseract_path": path,
        "executable_found": found,
        "ocr_available": available,
    }


# ------------------------------------------------------------
# PREPROCESSING PIPELINE
# ------------------------------------------------------------
def preprocess_image(pil_img):
    import cv2
    import numpy as np
    from PIL import Image

    img = np.array(pil_img)

    gray = cv2.cvtColor(img, cv2.COLOR_BGR2GRAY)
    gray = cv2.fastNlMeansDenoising(gray, h=20)

    thresh = cv2.adaptiveThreshold(
        gray,
        255,
        cv2.ADAPTIVE_THRESH_GAUSSIAN_C,
        cv2.THRESH_BINARY,
        31,
        10
    )

    coords = np.column_stack(np.where(thresh > 0))
    angle = cv2.minAreaRect(coords)[-1]

    if angle < -45:
        angle = -(90 + angle)
    else:
        angle = -angle

    (h, w) = thresh.shape
    M = cv2.getRotationMatrix2D((w // 2, h // 2), angle, 1.0)
    deskewed = cv2.warpAffine(thresh, M, (w, h), flags=cv2.INTER_CUBIC)

    return Image.fromarray(deskewed)


# ------------------------------------------------------------
# OCR EXECUTION (ASYNC)
# ------------------------------------------------------------
async def extract_text_from_image(file_bytes: bytes) -> str:
    """Run Tesseract OCR on image bytes.

    - Hosted mode (NEXIS_HOSTED_MODE=True): blocked unless OCR_ENABLED=True.
    - Local mode (NEXIS_HOSTED_MODE=False): always attempted; returns a clear
      error message if Tesseract is not found — never silently fails.
    """
    from app.core.config import settings

    # Hosted-mode gate: only block when explicitly deployed to cloud.
    if settings.NEXIS_HOSTED_MODE and not settings.OCR_ENABLED:
        return "OCR is not available in hosted beta mode."

    tess_path = resolve_tesseract_path()

    def _work():
        try:
            import pytesseract
            from PIL import Image

            if not os.path.isfile(tess_path):
                return (
                    f"[OCR UNAVAILABLE] Tesseract not found at: {tess_path}\n"
                    f"Set NEXIS_TESSERACT_PATH in your .env to point to tesseract.exe."
                )

            pytesseract.pytesseract.tesseract_cmd = tess_path

            pil_img = Image.open(io.BytesIO(file_bytes))
            processed = preprocess_image(pil_img)

            text = pytesseract.image_to_string(processed).strip()
            return text if text else "No text detected in image."

        except Exception as e:
            return f"[OCR ERROR] {str(e)}"

    loop = asyncio.get_event_loop()
    return await loop.run_in_executor(None, _work)
