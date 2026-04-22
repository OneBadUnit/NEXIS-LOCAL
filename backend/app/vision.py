# ============================================================
# ARC‑NEXUS VISION ROUTER
# ============================================================

from fastapi import APIRouter, UploadFile, File
from app.services.vision_service import run_llava

router = APIRouter()

@router.post("/analyze")
async def analyze_image(file: UploadFile = File(...)):
    image_bytes = await file.read()
    description = await run_llava(image_bytes)

    return {
        "description": description,
        "ocr_text": "",
        "thumbnail": None
    }
