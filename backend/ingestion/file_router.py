# ============================================================
# FILE INGESTION ROUTER
# Routes uploaded files to the correct extraction/transcription
# pipeline based on extension. Handles text, PDF, DOCX, images,
# audio, and video. Uses a safe temp directory for media.
#
# All heavy processors are imported lazily inside each branch.
# Heavy feature paths are gated by feature flags.
# ============================================================

import os
import tempfile
from fastapi import UploadFile


# ------------------------------------------------------------
# TEMP DIRECTORY (SAFE)
# ------------------------------------------------------------
SAFE_TMP = r"D:\NEXIS\tmp"
os.makedirs(SAFE_TMP, exist_ok=True)


# ------------------------------------------------------------
# EXTENSION GROUPS
# ------------------------------------------------------------
TEXT_EXT = {".txt", ".md"}
PDF_EXT = {".pdf"}
DOCX_EXT = {".docx"}
IMAGE_EXT = {".png", ".jpg", ".jpeg", ".bmp", ".tiff", ".webp"}
AUDIO_EXT = {".mp3", ".wav", ".m4a", ".ogg"}
VIDEO_EXT = {".mp4", ".mov", ".mkv", ".avi"}


# ------------------------------------------------------------
# MAIN ROUTER FUNCTION
# ------------------------------------------------------------
async def process_uploaded_file(uploaded_file: UploadFile) -> str:
    filename = (uploaded_file.filename or "").lower()
    _, ext = os.path.splitext(filename)

    data = await uploaded_file.read()

    if ext in TEXT_EXT:
        try:
            return data.decode("utf-8", errors="ignore")
        except Exception as e:
            return f"Text decode error: {str(e)}"

    if ext in PDF_EXT:
        from .pdf_utils import extract_pdf_text
        return await extract_pdf_text(data)

    if ext in DOCX_EXT:
        from .docx_utils import extract_docx_text
        return await extract_docx_text(data)

    if ext in IMAGE_EXT:
        from app.core.config import settings
        if not settings.OCR_ENABLED:
            return "OCR is not available in hosted beta mode."
        from .ocr_utils import extract_text_from_image
        return await extract_text_from_image(data)

    if ext in AUDIO_EXT:
        from app.core.config import settings
        if not settings.WHISPER_ENABLED:
            return "Audio/video transcription is not available in hosted beta mode."
        return await _transcribe_audio_bytes(data, ext)

    if ext in VIDEO_EXT:
        from app.core.config import settings
        if not settings.WHISPER_ENABLED:
            return "Audio/video transcription is not available in hosted beta mode."
        return await _transcribe_video_bytes(data, ext)

    return "Unsupported file type."


# ------------------------------------------------------------
# AUDIO HANDLER
# ------------------------------------------------------------
async def _transcribe_audio_bytes(data: bytes, ext: str) -> str:
    tmp_dir = tempfile.mkdtemp(prefix="arc_audio_", dir=SAFE_TMP)
    path = os.path.join(tmp_dir, f"audio{ext}")

    try:
        with open(path, "wb") as f:
            f.write(data)

        print(">>> DEBUG: Saved audio file size:", os.path.getsize(path))
        from .audio_utils import transcribe_audio_file
        return await transcribe_audio_file(path)

    finally:
        try:
            os.remove(path)
            os.rmdir(tmp_dir)
        except:
            pass


# ------------------------------------------------------------
# VIDEO HANDLER
# ------------------------------------------------------------
async def _transcribe_video_bytes(data: bytes, ext: str) -> str:
    tmp_dir = tempfile.mkdtemp(prefix="arc_video_", dir=SAFE_TMP)
    path = os.path.join(tmp_dir, f"video{ext}")

    try:
        with open(path, "wb") as f:
            f.write(data)

        print(">>> DEBUG: Saved video file size:", os.path.getsize(path))
        from .video_utils import transcribe_video_file
        return await transcribe_video_file(path)

    finally:
        try:
            os.remove(path)
            os.rmdir(tmp_dir)
        except:
            pass
