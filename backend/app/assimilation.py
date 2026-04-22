# ============================================================
# ARC‑NEXUS ASSIMILATION MODULE
# Unified ingestion endpoint for text, URLs, and files.
# ============================================================

from fastapi import APIRouter, UploadFile, File, Form

from ingestion.url_utils import process_url_or_youtube
from ingestion.file_router import process_uploaded_file

# ------------------------------------------------------------
# Router
# ------------------------------------------------------------
router = APIRouter(tags=["assimilation"])


# ------------------------------------------------------------
# POST /assimilation/process
# Accepts multipart/form-data for files
# Accepts Form fields for url/text
# ------------------------------------------------------------
@router.post("/process")
async def process_assimilation(
    source_type: str = Form(...),          # "text", "url", "file"
    content: str = Form(""),               # URL or raw text
    file: UploadFile = File(None)          # actual uploaded file
):

    # -----------------------------
    # URL ingestion
    # -----------------------------
    if source_type == "url":
        extracted = await process_url_or_youtube(content)
        return {"type": "url", "text": extracted}

    # -----------------------------
    # File ingestion
    # -----------------------------
    if source_type == "file":
        if not file:
            return {"error": "No file uploaded"}
        extracted = await process_uploaded_file(file)
        return {"type": "file", "text": extracted}

    # -----------------------------
    # Raw text ingestion
    # -----------------------------
    if source_type == "text":
        return {"type": "text", "text": content}

    # -----------------------------
    # Invalid type
    # -----------------------------
    return {"error": "Invalid source_type"}
