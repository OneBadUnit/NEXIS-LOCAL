# ============================================================
# ARC-NEXUS - VISION ENGINE
# File: app/vision.py
# Version: 003 (Feature-flagged + Lazy vision_service import)
# ============================================================

from fastapi import APIRouter, UploadFile, File, HTTPException, Depends
from sqlalchemy.orm import Session
from app.core.db import get_db
from app.core import usage as usage_tracker
from app.core.usage import DEFAULT_USER_ID

# vision_service is NOT imported at module level.
# It is imported lazily inside the route when VISION_ENABLED is true.


# ------------------------------------------------------------
# Router
# ------------------------------------------------------------
router = APIRouter(tags=["nexis-vision"])


# ------------------------------------------------------------
# POST /vision/analyze
# Analyze an image using vision model
# ------------------------------------------------------------
@router.post("/analyze")
async def analyze_image(file: UploadFile = File(...), db: Session = Depends(get_db)):

    # -----------------------------
    # Feature flag check
    # -----------------------------
    from app.core.config import settings
    if not settings.VISION_ENABLED:
        raise HTTPException(
            status_code=503,
            detail="Vision analysis is not available in hosted beta mode.",
        )

    # -----------------------------
    # Validate file
    # -----------------------------
    if not file:
        raise HTTPException(status_code=400, detail="No file uploaded.")

    if not file.content_type or not file.content_type.startswith("image/"):
        raise HTTPException(status_code=400, detail="File must be an image.")

    # ----------------------------------------------------------
    # SERVER-SIDE LIMIT CHECK (check only — no increment yet)
    # ----------------------------------------------------------
    limit_error = usage_tracker.check_raw_input_limits(db, DEFAULT_USER_ID)
    if limit_error:
        raise HTTPException(status_code=429, detail=limit_error)

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
    # Run vision model (lazy import)
    # -----------------------------
    try:
        from app.services.vision_service import run_llava
        description = await run_llava(image_bytes)
    except Exception:
        raise HTTPException(status_code=500, detail="Vision processing failed.")

    # ----------------------------------------------------------
    # COMMIT USAGE — only reached after successful vision run
    # ----------------------------------------------------------
    usage_tracker.increment_raw_input(db, DEFAULT_USER_ID)

    # -----------------------------
    # Return standardized output
    # -----------------------------
    return {
        "type": "image",
        "description": description or "",
        "ocr_text": "",        # reserved for future OCR integration
        "thumbnail": None      # reserved for future preview handling
    }