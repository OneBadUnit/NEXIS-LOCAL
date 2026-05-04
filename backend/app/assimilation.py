# ============================================================
# ARC-NEXUS - INGESTION ENGINE
# File: app/assimilation.py
# Version: 002 (Stability + Validation + UI Consistency)
# ============================================================

from fastapi import APIRouter, UploadFile, File, Form, HTTPException, Depends
from sqlalchemy.orm import Session

from ingestion.url_utils import process_url_or_youtube
from ingestion.file_router import process_uploaded_file
from app.core.db import get_db
from app.core import usage as usage_tracker
from app.core.usage import DEFAULT_USER_ID


# ------------------------------------------------------------
# Router
# ------------------------------------------------------------
router = APIRouter(tags=["nexis-ingestion"])


# ------------------------------------------------------------
# POST /collect/process
# Unified ingestion endpoint for:
# - text
# - url
# - file
# ------------------------------------------------------------
@router.post("/process")
async def process_assimilation(
    source_type: str = Form(...),   # "text" | "url" | "file"
    content: str = Form(""),        # text or URL
    file: UploadFile = File(None),  # uploaded file
    db: Session = Depends(get_db)
):

    # Normalize
    source_type = source_type.lower().strip()

    # Validate source_type first so an invalid type doesn't consume a usage slot
    if source_type not in ("text", "url", "file"):
        raise HTTPException(
            status_code=400,
            detail="Invalid source_type. Use: text, url, or file."
        )

    # ----------------------------------------------------------
    # SERVER-SIDE LIMIT CHECK (check only — no increment yet)
    # Reject before any work is done if either storage or monthly
    # raw-input limit is reached.
    # ----------------------------------------------------------
    limit_error = usage_tracker.check_raw_input_limits(db, DEFAULT_USER_ID)
    if limit_error:
        raise HTTPException(status_code=429, detail=limit_error)

    # -----------------------------
    # EXTRACT
    # Run extraction for the given source type.
    # Only increment usage counters after a successful result.
    # -----------------------------
    result_type = source_type
    result_text: str

    if source_type == "text":
        clean = content.strip()
        if not clean:
            raise HTTPException(status_code=400, detail="Text content is empty.")
        result_text = clean

    elif source_type == "url":
        if not content.strip():
            raise HTTPException(status_code=400, detail="URL is empty.")

        extracted = await process_url_or_youtube(content)

        if not extracted:
            raise HTTPException(status_code=400, detail="Failed to extract content from URL.")

        result_text = extracted

    elif source_type == "file":
        if not file:
            raise HTTPException(status_code=400, detail="No file uploaded.")

        extracted = await process_uploaded_file(file)

        if not extracted:
            raise HTTPException(status_code=400, detail="Failed to extract content from file.")

        result_text = extracted

    # ----------------------------------------------------------
    # COMMIT USAGE — only reached on successful extraction
    # Increments both the storage count and the monthly counter.
    # ----------------------------------------------------------
    usage_tracker.increment_raw_input(db, DEFAULT_USER_ID)

    return {
        "type": result_type,
        "text": result_text
    }