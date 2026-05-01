# ============================================================
# ARC-NEXUS - VISION ENGINE
# File: app/vision.py
# Version: 002 (Stability + Validation + Consistent Output)
# ============================================================

from fastapi import APIRouter, UploadFile, File, HTTPException
from app.services.vision_service import run_llava


# ------------------------------------------------------------
# Router
# ------------------------------------------------------------
router = APIRouter(tags=["nexis-vision"])


# ------------------------------------------------------------
# POST /vision/analyze
# Analyze an image using vision model
# ------------------------------------------------------------
@router.post("/analyze")
async def analyze_image(file: UploadFile = File(...)):

    # -----------------------------
    # Validate file
    # -----------------------------
    if not file:
        raise HTTPException(status_code=400, detail="No file uploaded.")

    if not file.content_type or not file.content_type.startswith("image/"):
        raise HTTPException(status_code=400, detail="File must be an image.")

    # -----------------------------
    # Read image
    # -----------------------------
    try:
        image_bytes = await file.read()
    except Exception:
        raise HTTPException(status_code=400, detail="Failed to read uploaded file.")

    if not image_bytes:
        raise HTTPException(status_code=400, detail="Empty image file.")

    # -----------------------------
    # Run vision model
    # -----------------------------
    try:
        description = await run_llava(image_bytes)
    except Exception:
        raise HTTPException(status_code=500, detail="Vision processing failed.")

    # -----------------------------
    # Return standardized output
    # -----------------------------
    return {
        "type": "image",
        "description": description or "",
        "ocr_text": "",        # reserved for future OCR integration
        "thumbnail": None      # reserved for future preview handling
    }