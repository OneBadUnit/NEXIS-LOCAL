# backend/ingestion/pdf_utils.py
import pytesseract
pytesseract.pytesseract.tesseract_cmd = r"D:\arc-nexus\Tesseract-OCR\tesseract.exe"

import fitz  # PyMuPDF
import asyncio
from PIL import Image
import io
import pytesseract


async def extract_pdf_text(data: bytes) -> str:
    """
    Hybrid PDF extractor:
    1. Extracts embedded text normally (fast)
    2. Detects pages with no text
    3. Converts those pages to images
    4. Runs OCR on each image page
    5. Returns a clean, multi-line transcript
    """

    def _work():
        try:
            doc = fitz.open(stream=data, filetype="pdf")
            final_output = []

            for page_index, page in enumerate(doc):
                # Try normal text extraction
                text = page.get_text("text")

                if text and text.strip():
                    final_output.append(text.strip())
                    continue

                # Fallback: OCR the page
                pix = page.get_pixmap(dpi=300)
                img_bytes = pix.tobytes("png")

                pil_img = Image.open(io.BytesIO(img_bytes))

                ocr_text = pytesseract.image_to_string(pil_img)
                ocr_text = ocr_text.strip() if ocr_text.strip() else "No text detected on page."

                final_output.append(ocr_text)

            combined = "\n\n".join(final_output)
            return combined if combined.strip() else "No text detected in PDF."

        except Exception as e:
            return f"PDF processing error: {str(e)}"

    loop = asyncio.get_event_loop()
    return await loop.run_in_executor(None, _work)
