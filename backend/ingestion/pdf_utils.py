# ============================================================
# PDF INGESTION MODULE
# Version: 008 (Lazy imports + OCR feature flag)
#
# SEARCH TAGS:
#   ARC_TESSERACT_PATH
#   ARC_ENV_SWAP
#
# fitz (PyMuPDF), PIL, and pytesseract are imported lazily
# inside extract_pdf_text so this module can be imported
# without loading those libraries at startup.
# ============================================================

import io
import os
import asyncio


# ------------------------------------------------------------
# PDF EXTRACTION
# ------------------------------------------------------------
async def extract_pdf_text(data: bytes) -> str:

    def _work():
        try:
            import fitz                  # lazy — PyMuPDF
            from PIL import Image        # lazy
            import pytesseract           # lazy

            from app.core.config import settings

            # ----------------------------------------------------
            # 🔥 ARC_TESSERACT_PATH (AUTO-DETECT)
            # ----------------------------------------------------
            POSSIBLE_PATHS = [
                r"D:\NEXIS\Tesseract-OCR\tesseract.exe",
                r"D:\arc-nexus\Tesseract-OCR\tesseract.exe",
            ]
            tesseract_path = None
            for p in POSSIBLE_PATHS:
                if os.path.exists(p):
                    tesseract_path = p
                    break
            if not tesseract_path:
                tesseract_path = "tesseract"

            tesseract_dir = os.path.dirname(tesseract_path)

            # ----------------------------------------------------
            # 🔥 ARC_ENV_SWAP (runtime path injection)
            # ----------------------------------------------------
            if tesseract_dir:
                os.environ["PATH"] += os.pathsep + tesseract_dir

            pytesseract.pytesseract.tesseract_cmd = tesseract_path

            doc = fitz.open(stream=data, filetype="pdf")
            final_output = []

            for i, page in enumerate(doc):
                try:
                    text = page.get_text("text")

                    # -------- Embedded text --------
                    if text and text.strip():
                        final_output.append(text.strip())
                        continue

                    # -------- OCR fallback (only when enabled) --------
                    if not settings.OCR_ENABLED:
                        final_output.append(f"[Page {i+1}: OCR not available in hosted beta mode]")
                        continue

                    pix = page.get_pixmap(dpi=300)
                    img_bytes = pix.tobytes("png")
                    pil_img = Image.open(io.BytesIO(img_bytes))

                    ocr_text = pytesseract.image_to_string(pil_img).strip()

                    if ocr_text:
                        final_output.append(ocr_text)
                    else:
                        final_output.append(f"[Page {i+1}: No text detected]")

                except Exception as page_error:
                    final_output.append(f"[Page {i+1} ERROR: {str(page_error)}]")

            combined = "\n\n".join(final_output)
            return combined if combined.strip() else "No text detected in PDF."

        except Exception as e:
            return f"PDF processing error: {str(e)}"

    loop = asyncio.get_event_loop()
    return await loop.run_in_executor(None, _work)