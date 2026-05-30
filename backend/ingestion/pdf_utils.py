# ============================================================
# PDF INGESTION MODULE
# Version: 010 (Phase 1 contamination cleaning — page number
#               removal and repeated-line deduplication)
#
# SEARCH TAGS:
#   ARC_TESSERACT_PATH
#   ARC_ENV_SWAP
#   ARC_PDF_CLEAN
#
# fitz (PyMuPDF), PIL, and pytesseract are imported lazily
# inside extract_pdf_text so this module can be imported
# without loading those libraries at startup.
# ============================================================

import io
import os
import re
import asyncio
import collections


# ------------------------------------------------------------
# PDF BOILERPLATE DETECTION (Phase 1)
#
# Two complementary passes applied after per-page extraction,
# before final text assembly:
#
#   Pass 1 — count how many pages each unique non-empty line
#             appears on (using a per-page set to avoid double-
#             counting a line that appears twice on one page).
#
#   Pass 2 — rebuild pages, dropping:
#             (a) lines that match page-number patterns, and
#             (b) lines whose page-frequency meets the repeat
#                 threshold (boilerplate).
#
# Activation guard: deduplication only runs when the document
# has at least _MIN_PAGES_FOR_DEDUP pages. Short documents have
# too few pages to distinguish boilerplate from body content.
# ------------------------------------------------------------

_MIN_PAGES_FOR_DEDUP    = 5      # minimum pages before dedup activates
_REPEAT_THRESHOLD_ABS   = 5      # absolute page count floor
_REPEAT_THRESHOLD_PCT   = 0.40   # fraction of total pages (40%)
# threshold = max(_REPEAT_THRESHOLD_ABS, int(total_pages * _REPEAT_THRESHOLD_PCT))
# A line must appear on at least this many pages to be flagged.

_WARN_CONTAMINATION_PCT = 5.0    # surface warning when >5% of lines removed

# Page-number line patterns — matched against individual stripped lines.
_PAGE_NUM_PATTERNS = (
    re.compile(r'^\s*\d+\s*$'),                                            # 42
    re.compile(r'^\s*[Pp]age\s+\d+(?:\s+of\s+\d+)?\s*$'),                 # Page 5  /  Page 5 of 12
    re.compile(r'^\s*[-\u2013\u2014\[]\s*\d+\s*[-\u2013\u2014\]]\s*$'),   # - 5 -  /  [ 5 ]
    re.compile(r'^\s*\d+\s*/\s*\d+\s*$'),                                  # 5 / 12
)


def _is_page_number_line(line: str) -> bool:
    return any(p.match(line) for p in _PAGE_NUM_PATTERNS)


# ------------------------------------------------------------
# PDF EXTRACTION
# ------------------------------------------------------------
async def extract_pdf_text(data: bytes) -> dict:
    """
    Returns:
        {
            "text":              str,    # cleaned extracted content
            "warning":           str,    # non-empty when contamination was removed
            "lines_removed":     int,
            "contamination_pct": float,
        }
    """

    def _work():
        try:
            import fitz                  # lazy — PyMuPDF
            from PIL import Image        # lazy
            import pytesseract           # lazy

            from app.core.config import settings

            # ----------------------------------------------------
            # 🔥 ARC_TESSERACT_PATH — resolved from settings/env
            # ----------------------------------------------------
            from ingestion.ocr_utils import resolve_tesseract_path
            tesseract_path = resolve_tesseract_path()

            tesseract_dir = os.path.dirname(tesseract_path)

            # ----------------------------------------------------
            # 🔥 ARC_ENV_SWAP (runtime path injection)
            # ----------------------------------------------------
            if tesseract_dir:
                os.environ["PATH"] += os.pathsep + tesseract_dir

            pytesseract.pytesseract.tesseract_cmd = tesseract_path

            doc = fitz.open(stream=data, filetype="pdf")
            page_texts = []   # one raw-text string per page

            for i, page in enumerate(doc):
                try:
                    text = page.get_text("text")

                    # -------- Embedded text --------
                    if text and text.strip():
                        page_texts.append(text.strip())
                        continue

                    # -------- OCR fallback (only when enabled) --------
                    if not settings.OCR_ENABLED:
                        page_texts.append(f"[Page {i+1}: OCR disabled — set OCR_ENABLED=True in .env to enable]")
                        continue

                    pix = page.get_pixmap(dpi=300)
                    img_bytes = pix.tobytes("png")
                    pil_img = Image.open(io.BytesIO(img_bytes))

                    ocr_text = pytesseract.image_to_string(pil_img).strip()

                    if ocr_text:
                        page_texts.append(ocr_text)
                    else:
                        page_texts.append(f"[Page {i+1}: No text detected]")

                except Exception as page_error:
                    page_texts.append(f"[Page {i+1} ERROR: {str(page_error)}]")

            # -------- Phase 1: contamination cleaning --------
            total_pages = len(page_texts)
            total_lines = 0
            lines_removed = 0

            # Pass 1 — build per-line page-frequency map.
            # Lines starting with '[' are system placeholders (OCR/error
            # messages); exclude them so they cannot enter the boilerplate set.
            if total_pages >= _MIN_PAGES_FOR_DEDUP:
                line_page_count: collections.Counter = collections.Counter()
                for page_text in page_texts:
                    seen_this_page: set = set()
                    for raw_line in page_text.splitlines():
                        norm = raw_line.strip()
                        if norm and not norm.startswith('[') and norm not in seen_this_page:
                            line_page_count[norm] += 1
                            seen_this_page.add(norm)

                repeat_threshold = max(
                    _REPEAT_THRESHOLD_ABS,
                    int(total_pages * _REPEAT_THRESHOLD_PCT),
                )
                boilerplate = {
                    line for line, count in line_page_count.items()
                    if count >= repeat_threshold
                }
            else:
                boilerplate = set()

            # Pass 2 — rebuild pages, removing boilerplate and page numbers.
            # Empty lines are preserved as-is and not counted toward metrics.
            clean_pages = []
            for page_text in page_texts:
                clean_lines = []
                for raw_line in page_text.splitlines():
                    norm = raw_line.strip()
                    if not norm:
                        clean_lines.append(raw_line)   # preserve blank lines
                        continue
                    total_lines += 1
                    if _is_page_number_line(norm) or norm in boilerplate:
                        lines_removed += 1
                        continue
                    clean_lines.append(raw_line)
                clean_pages.append("\n".join(clean_lines))

            combined = "\n\n".join(p for p in clean_pages if p.strip())
            result_text = combined if combined.strip() else "No text detected in PDF."

            # -------- Contamination warning --------
            contamination_pct = (
                (lines_removed / total_lines * 100) if total_lines > 0 else 0.0
            )
            warning = ""
            if lines_removed > 0 and contamination_pct >= _WARN_CONTAMINATION_PCT:
                warning = (
                    f"PDF contained repeated boilerplate text that was removed before processing "
                    f"({lines_removed} lines removed, {contamination_pct:.1f}% of extracted content). "
                    f"Review the original source if output seems incomplete."
                )

            return {
                "text":              result_text,
                "warning":           warning,
                "lines_removed":     lines_removed,
                "contamination_pct": round(contamination_pct, 2),
            }

        except Exception as e:
            return {
                "text":              f"PDF processing error: {str(e)}",
                "warning":           "",
                "lines_removed":     0,
                "contamination_pct": 0.0,
            }

    loop = asyncio.get_event_loop()
    return await loop.run_in_executor(None, _work)