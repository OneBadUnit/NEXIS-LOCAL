from fastapi import APIRouter, UploadFile, File, Form
from ingestion.file_router import process_uploaded_file
from ingestion.url_utils import process_url_or_youtube

router = APIRouter()

@router.post("/assimilate")
async def assimilate(
    text: str = Form(None),
    url: str = Form(None),
    file: UploadFile = File(None)
):
    """
    Unified ingestion endpoint.
    Handles:
    - raw text
    - URLs (including YouTube)
    - uploaded files
    """

    if text:
        return {"type": "text", "content": text}

    if url:
        content = await process_url_or_youtube(url)
        return {"type": "url", "content": content}

    if file:
        content = await process_uploaded_file(file)
        return {"type": "file", "content": content}

    return {"error": "No input provided."}
