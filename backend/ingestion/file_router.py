# backend/ingestion/file_router.py

import os
from fastapi import UploadFile

from .pdf_utils import extract_pdf_text
from .docx_utils import extract_docx_text
from .ocr_utils import extract_text_from_image  # ⭐ FIXED IMPORT

from .audio_utils import transcribe_audio_file
from .video_utils import transcribe_video_file

TEXT_EXT = {".txt", ".md"}
PDF_EXT = {".pdf"}
DOCX_EXT = {".docx"}
IMAGE_EXT = {".png", ".jpg", ".jpeg", ".bmp", ".tiff", ".webp"}  # ⭐ added webp
AUDIO_EXT = {".mp3", ".wav", ".m4a", ".ogg"}
VIDEO_EXT = {".mp4", ".mov", ".mkv", ".avi"}


async def process_uploaded_file(uploaded_file: UploadFile) -> str:
    filename = (uploaded_file.filename or "").lower()
    _, ext = os.path.splitext(filename)

    data = await uploaded_file.read()

    # Plain text
    if ext in TEXT_EXT:
        try:
            return data.decode("utf-8", errors="ignore")
        except Exception as e:
            return f"Text decode error: {str(e)}"

    # PDF
    if ext in PDF_EXT:
        return await extract_pdf_text(data)

    # DOCX
    if ext in DOCX_EXT:
        return await extract_docx_text(data)

    # Images
    if ext in IMAGE_EXT:
        return await extract_text_from_image(data)  # ⭐ FIXED FUNCTION CALL

    # Audio
    if ext in AUDIO_EXT:
        return await _transcribe_audio_bytes(data, ext)

    # Video
    if ext in VIDEO_EXT:
        return await _transcribe_video_bytes(data, ext)

    return "Unsupported file type."


async def _transcribe_audio_bytes(data: bytes, ext: str) -> str:
    import tempfile
    tmp_dir = tempfile.mkdtemp(prefix="arc_audio_")
    path = os.path.join(tmp_dir, f"audio{ext}")

    try:
        with open(path, "wb") as f:
            f.write(data)
        return await transcribe_audio_file(path)
    finally:
        try:
            os.remove(path)
            os.rmdir(tmp_dir)
        except:
            pass


async def _transcribe_video_bytes(data: bytes, ext: str) -> str:
    import tempfile
    tmp_dir = tempfile.mkdtemp(prefix="arc_video_")
    path = os.path.join(tmp_dir, f"video{ext}")

    try:
        with open(path, "wb") as f:
            f.write(data)
        return await transcribe_video_file(path)
    finally:
        try:
            os.remove(path)
            os.rmdir(tmp_dir)
        except:
            pass
