# ============================================================
# PDF INGESTION MODULE
# Hybrid PDF extractor:
#   1. Extract embedded text (fast)
#   2. Detect empty pages
#   3. Render page → image
#   4. OCR fallback via Tesseract
#   5. Merge into clean multi‑page transcript
# Fully async, thread‑offloaded.
# ============================================================

import io
import asyncio
import fitz  # PyMuPDF
from PIL import Image
import pytesseract

# ------------------------------------------------------------
# TESSERACT CONFIG
# ------------------------------------------------------------
pytesseract.pytesseract.tesseract_cmd = r"D:\arc-nexus\Tesseract-OCR\tesseract.exe"


# ------------------------------------------------------------
# HYBRID PDF EXTRACTION
# ------------------------------------------------------------
async def extract_pdf_text(data: bytes) -> str:
    """
    Extract text from a PDF using hybrid extraction:
    - Embedded text when available
    - OCR fallback for scanned/image-only pages
    """

    def _work():
        try:
            doc = fitz.open(stream=data, filetype="pdf")
            final_output = []

            for page in doc:
                text = page.get_text("text")

                if text and text.strip():
                    final_output.append(text.strip())
                    continue

                pix = page.get_pixmap(dpi=300)
                img_bytes = pix.tobytes("png")
                pil_img = Image.open(io.BytesIO(img_bytes))

                ocr_text = pytesseract.image_to_string(pil_img).strip()
                final_output.append(ocr_text if ocr_text else "No text detected on page.")

            combined = "\n\n".join(final_output)
            return combined if combined.strip() else "No text detected in PDF."

        except Exception as e:
            return f"PDF processing error: {str(e)}"

    loop = asyncio.get_event_loop()
    return await loop.run_in_executor(None, _work)
