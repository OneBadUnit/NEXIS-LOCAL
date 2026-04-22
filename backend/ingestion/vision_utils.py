# ============================================================
# VISION INGESTION UTILITY
# Provides:
#   - OCR text extraction
#   - Base64 thumbnail generation
#   - Unified response structure for Assimilation pipeline
# ============================================================

import base64
from .ocr_utils import extract_text_from_image


# ------------------------------------------------------------
# IMAGE → OCR + THUMBNAIL
# ------------------------------------------------------------
async def process_image_with_thumbnail(file):
    data = await file.read()

    text = await extract_text_from_image(data)
    thumbnail_b64 = base64.b64encode(data).decode("utf-8")

    return {
        "ocr_text": text,
        "thumbnail": thumbnail_b64,
        "description": "Image processed successfully."
    }
