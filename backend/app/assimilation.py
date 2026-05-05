# ============================================================
# ARC-NEXUS - INGESTION ENGINE
# File: app/assimilation.py
# Version: 002 (Stability + Validation + UI Consistency)
# ============================================================

import os
import json
import subprocess
import tempfile

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
# Media duration utility
# Uses ffprobe (bundled with ffmpeg) to read duration from a
# file on disk.  Returns None if duration cannot be determined.
# ------------------------------------------------------------
_FFPROBE = r"C:\ffmpeg\bin\ffprobe.exe"

_AUDIO_EXT = {".mp3", ".wav", ".m4a", ".ogg"}
_VIDEO_EXT = {".mp4", ".mov", ".mkv", ".avi"}
_MEDIA_EXT = _AUDIO_EXT | _VIDEO_EXT


def _get_media_duration_minutes(data: bytes, ext: str) -> float | None:
    """
    Write bytes to a temp file, probe duration with ffprobe, return minutes.
    Returns None when duration cannot be determined (non-fatal).
    """
    if not os.path.exists(_FFPROBE):
        return None
    tmp_path = None
    try:
        with tempfile.NamedTemporaryFile(suffix=ext, delete=False) as f:
            f.write(data)
            tmp_path = f.name
        result = subprocess.run(
            [
                _FFPROBE,
                "-v", "quiet",
                "-print_format", "json",
                "-show_format",
                tmp_path,
            ],
            capture_output=True,
            text=True,
            timeout=15,
        )
        if result.returncode == 0:
            info = json.loads(result.stdout)
            duration_s = float(info.get("format", {}).get("duration", 0))
            return duration_s / 60.0
    except Exception:
        pass
    finally:
        if tmp_path:
            try:
                os.unlink(tmp_path)
            except Exception:
                pass
    return None


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

        # Check extracted content size against plan limit before saving
        content_kb = len(extracted.encode("utf-8")) / 1024
        content_size_error = usage_tracker.check_url_content_size(db, content_kb, DEFAULT_USER_ID)
        if content_size_error:
            raise HTTPException(status_code=413, detail=content_size_error)

        result_text = extracted

    elif source_type == "file":
        if not file:
            raise HTTPException(status_code=400, detail="No file uploaded.")

        # Read bytes once so we can check size and duration before processing
        file_bytes = await file.read()
        await file.seek(0)

        file_size_mb = len(file_bytes) / (1024 * 1024)
        size_error = usage_tracker.check_file_upload_size(db, file_size_mb, DEFAULT_USER_ID)
        if size_error:
            raise HTTPException(status_code=413, detail=size_error)

        # For audio/video: check duration before running Whisper
        _, ext = os.path.splitext((file.filename or "").lower())
        if ext in _MEDIA_EXT:
            duration = _get_media_duration_minutes(file_bytes, ext)
            if duration is not None:
                dur_error = usage_tracker.check_audio_video_duration(db, duration, DEFAULT_USER_ID)
                if dur_error:
                    raise HTTPException(status_code=413, detail=dur_error)

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