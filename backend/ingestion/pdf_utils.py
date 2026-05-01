# ============================================================
# PDF INGESTION MODULE
# Version: 007 (Path Fix + Auto-Detection + Future Safe)
#
# SEARCH TAGS:
#   ARC_TESSERACT_PATH
#   ARC_ENV_SWAP
# ============================================================

import io
import os
import asyncio
import fitz
from PIL import Image
import pytesseract


# ------------------------------------------------------------
# 🔥 ARC_TESSERACT_PATH (AUTO-DETECT)
# ------------------------------------------------------------
POSSIBLE_PATHS = [
    r"D:\NEXIS\Tesseract-OCR\tesseract.exe",
    r"D:\arc-nexus\Tesseract-OCR\tesseract.exe",  # legacy fallback
]

TESSERACT_PATH = None

for path in POSSIBLE_PATHS:
    if os.path.exists(path):
        TESSERACT_PATH = path
        break

if not TESSERACT_PATH:
    print(">>> [ARC ERROR] Tesseract NOT FOUND in expected locations")
    TESSERACT_PATH = "tesseract"  # fallback to system PATH

TESSERACT_DIR = os.path.dirname(TESSERACT_PATH)

print(f">>> [ARC] USING TESSERACT PATH: {TESSERACT_PATH}")


# ------------------------------------------------------------
# PDF EXTRACTION
# ------------------------------------------------------------
async def extract_pdf_text(data: bytes) -> str:

    def _work():
        try:
            # ----------------------------------------------------
            # 🔥 ARC_ENV_SWAP (runtime path injection)
            # ----------------------------------------------------
            if TESSERACT_DIR:
                os.environ["PATH"] += os.pathsep + TESSERACT_DIR

            pytesseract.pytesseract.tesseract_cmd = TESSERACT_PATH

            print(">>> [ARC] OCR USING:", pytesseract.pytesseract.tesseract_cmd)

            doc = fitz.open(stream=data, filetype="pdf")
            final_output = []

            for i, page in enumerate(doc):
                try:
                    text = page.get_text("text")

                    # -------- Embedded text --------
                    if text and text.strip():
                        final_output.append(text.strip())
                        continue

                    # -------- OCR fallback --------
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