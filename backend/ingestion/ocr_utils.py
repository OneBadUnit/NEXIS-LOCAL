# ============================================================
# OCR INGESTION MODULE
# High‑accuracy OCR pipeline using Tesseract with aggressive
# preprocessing (denoise, threshold, deskew). Fully async.
#
# cv2, numpy, PIL, and pytesseract are imported lazily inside
# functions — NOT at module level — so the backend starts
# cleanly when OCR_ENABLED is false (hosted mode).
# ============================================================

import io
import asyncio


# ------------------------------------------------------------
# TESSERACT CONFIG
# Resolved at runtime inside the OCR call, not at import time.
# ------------------------------------------------------------
_TESSERACT_CMD = r"D:\NEXIS\Tesseract-OCR\tesseract.exe"


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
    from app.core.config import settings
    if not settings.OCR_ENABLED:
        return "OCR is not available in hosted beta mode."

    def _work():
        try:
            import pytesseract
            from PIL import Image

            pytesseract.pytesseract.tesseract_cmd = _TESSERACT_CMD

            pil_img = Image.open(io.BytesIO(file_bytes))
            processed = preprocess_image(pil_img)

            text = pytesseract.image_to_string(processed).strip()
            return text if text else "No text detected in image."

        except Exception as e:
            return f"[OCR ERROR] {str(e)}"

    loop = asyncio.get_event_loop()
    return await loop.run_in_executor(None, _work)
