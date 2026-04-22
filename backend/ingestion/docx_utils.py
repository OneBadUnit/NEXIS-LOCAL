# ============================================================
# DOCX INGESTION MODULE
# Extracts text from DOCX files using python-docx.
# Runs extraction inside a thread executor to avoid blocking
# the event loop. Returns clean text or a clear error message.
# ============================================================

import asyncio


# ------------------------------------------------------------
# DOCX TEXT EXTRACTION
# ------------------------------------------------------------
async def extract_docx_text(data: bytes) -> str:
    """
    Extract text from a DOCX file (provided as raw bytes).

    Returns:
        str: Extracted text or an error message.
    """

    # Lazy import so the backend still runs even if python-docx
    # is not installed on the user's machine.
    try:
        import docx
    except ImportError:
        return "DOCX support not available."

    loop = asyncio.get_event_loop()

    def _work():
        try:
            from io import BytesIO

            doc = docx.Document(BytesIO(data))
            parts = [p.text for p in doc.paragraphs if p.text.strip()]

            if not parts:
                return "No text detected in DOCX."

            return "\n".join(parts)

        except Exception as e:
            return f"DOCX processing error: {str(e)}"

    # Offload CPU-bound parsing to a thread
    return await loop.run_in_executor(None, _work)
