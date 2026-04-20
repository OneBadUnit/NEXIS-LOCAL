import base64
from .ocr_utils import extract_image_text

async def process_image_with_thumbnail(file):
    data = await file.read()

    text = await extract_image_text(data)

    thumbnail_b64 = base64.b64encode(data).decode("utf-8")

    return {
        "ocr_text": text,
        "thumbnail": thumbnail_b64,
        "description": "Image processed successfully."
    }
