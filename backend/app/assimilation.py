# ============================================================
# ARC-NEXUS - INGESTION ENGINE
# File: app/assimilation.py
# Version: 002 (Stability + Validation + UI Consistency)
# ============================================================

from fastapi import APIRouter, UploadFile, File, Form, HTTPException

from ingestion.url_utils import process_url_or_youtube
from ingestion.file_router import process_uploaded_file


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
    file: UploadFile = File(None)   # uploaded file
):

    # Normalize
    source_type = source_type.lower().strip()

    # -----------------------------
    # TEXT
    # -----------------------------
    if source_type == "text":
        clean = content.strip()
        if not clean:
            raise HTTPException(status_code=400, detail="Text content is empty.")
        return {
            "type": "text",
            "text": clean
        }

    # -----------------------------
    # URL
    # -----------------------------
    elif source_type == "url":
        if not content.strip():
            raise HTTPException(status_code=400, detail="URL is empty.")

        extracted = await process_url_or_youtube(content)

        if not extracted:
            raise HTTPException(status_code=400, detail="Failed to extract content from URL.")

        return {
            "type": "url",
            "text": extracted
        }

    # -----------------------------
    # FILE
    # -----------------------------
    elif source_type == "file":
        if not file:
            raise HTTPException(status_code=400, detail="No file uploaded.")

        extracted = await process_uploaded_file(file)

        if not extracted:
            raise HTTPException(status_code=400, detail="Failed to extract content from file.")

        return {
            "type": "file",
            "text": extracted
        }

    # -----------------------------
    # INVALID
    # -----------------------------
    else:
        raise HTTPException(
            status_code=400,
            detail="Invalid source_type. Use: text, url, or file."
        )