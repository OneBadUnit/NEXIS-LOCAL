import asyncio

async def extract_docx_text(data: bytes) -> str:
    try:
        import docx
    except ImportError:
        return "DOCX support not available."

    def _work():
        try:
            from io import BytesIO
            doc = docx.Document(BytesIO(data))
            parts = [p.text for p in doc.paragraphs if p.text.strip()]
            return "\n".join(parts) if parts else "No text detected in DOCX."
        except Exception as e:
            return f"DOCX processing error: {str(e)}"

    loop = asyncio.get_event_loop()
    return await loop.run_in_executor(None, _work)
