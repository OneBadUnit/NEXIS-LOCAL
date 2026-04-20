# backend/app/api/vision.py

from fastapi import APIRouter, UploadFile, File, HTTPException
from datetime import datetime

from ingestion.vision_llava import analyze_image_with_llava

router = APIRouter(prefix="/vision", tags=["vision"])


@router.post("")
async def analyze_vision_image(file: UploadFile = File(...)):
    """
    Full multimodal vision endpoint using LLaVA-Next 34B.
    """

    if not file.content_type.startswith("image/"):
        raise HTTPException(status_code=400, detail="File must be an image.")

    # Read raw bytes
    file_bytes = await file.read()

    # Run LLaVA (NOT OCR)
    description = analyze_image_with_llava(file_bytes)

    # Normalize transcript for frontend
    return {
        "type": "vision",
        "source_name": file.filename,
        "timestamp": datetime.utcnow().isoformat() + "Z",

        # Frontend expects transcript.plain_text
        "transcript": {
            "plain_text": description
        },

        # Compatibility fields
        "description": description,
        "ocr_text": None,
        "thumbnail": None,
    }
