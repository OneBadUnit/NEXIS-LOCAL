# backend/ingestion/ocr_utils.py

import pytesseract
from PIL import Image, ImageFilter, ImageOps
import io
import numpy as np
import cv2

# Correct Tesseract path
pytesseract.pytesseract.tesseract_cmd = r"D:\arc-nexus\Tesseract-OCR\tesseract.exe"


def preprocess_image(pil_img: Image.Image) -> Image.Image:
    """
    Preprocess image for dramatically improved OCR accuracy.
    """

    # Convert to OpenCV format
    img = np.array(pil_img)

    # Convert to grayscale
    gray = cv2.cvtColor(img, cv2.COLOR_BGR2GRAY)

    # Denoise
    gray = cv2.fastNlMeansDenoising(gray, h=20)

    # Adaptive threshold (handles shadows + uneven lighting)
    thresh = cv2.adaptiveThreshold(
        gray,
        255,
        cv2.ADAPTIVE_THRESH_GAUSSIAN_C,
        cv2.THRESH_BINARY,
        31,
        10
    )

    # Deskew
    coords = np.column_stack(np.where(thresh > 0))
    angle = cv2.minAreaRect(coords)[-1]

    if angle < -45:
        angle = -(90 + angle)
    else:
        angle = -angle

    (h, w) = thresh.shape
    M = cv2.getRotationMatrix2D((w // 2, h // 2), angle, 1.0)
    deskewed = cv2.warpAffine(thresh, M, (w, h), flags=cv2.INTER_CUBIC)

    # Convert back to PIL
    return Image.fromarray(deskewed)


async def extract_text_from_image(file_bytes: bytes) -> str:
    """
    Async OCR with preprocessing.
    """

    def _work():
        try:
            pil_img = Image.open(io.BytesIO(file_bytes))

            # Preprocess for better OCR
            processed = preprocess_image(pil_img)

            text = pytesseract.image_to_string(processed)
            text = text.strip()

            return text if text else "No text detected in image."

        except Exception as e:
            return f"[OCR ERROR] {str(e)}"

    import asyncio
    loop = asyncio.get_event_loop()
    return await loop.run_in_executor(None, _work)
