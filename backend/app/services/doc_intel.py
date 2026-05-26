# ============================================================
# DOCUMENT INTELLIGENCE SERVICE
# File: app/services/doc_intel.py
# Version: 001 (Chunked summarization + structured document brief)
#
# Converts extracted document text into a structured
# DOCUMENT COLLECTION BRIEF using a local Ollama model.
#
# PIPELINE
# ─────────────────────────────────────────────────────────────
# Short document  (≤ CHUNK_DIRECT_LIMIT words)
#   └─ single LLM pass → brief
#
# Long document   (> CHUNK_DIRECT_LIMIT words)
#   ├─ split into CHUNK_WORD_LIMIT-word sections
#   ├─ summarize each section concurrently via Ollama
#   └─ feed combined section summaries → final brief prompt
#
# Graceful degradation:
#   If Ollama is offline or the model is not loaded, the brief
#   field contains a clear note — no silent failure.
#   Raw document text is always preserved separately.
#
# Supported document types (call site checks extension):
#   .pdf  .docx  .doc  .txt  .md  .rtf  .odt
# ============================================================

import asyncio

import requests

# ─────────────────────────────────────────────────────────────
# Constants
# ─────────────────────────────────────────────────────────────

# Documents ≤ this word count are sent to the brief prompt directly.
CHUNK_DIRECT_LIMIT = 1200

# Documents above the direct limit are split into sections of this size.
CHUNK_WORD_LIMIT = 1500

SEP_WIDE = "═" * 52

# Extensions that get a document intelligence brief
BRIEF_DOC_EXT = {".pdf", ".docx", ".doc", ".txt", ".md", ".rtf", ".odt"}


# ─────────────────────────────────────────────────────────────
# Internal Ollama caller  (sync — run in executor)
# Returns "[LLM ...]" sentinel strings on failure so the caller
# can detect and handle gracefully without raising.
# ─────────────────────────────────────────────────────────────
def _call_ollama_text_sync(
    prompt: str,
    ollama_url: str,
    model: str,
    timeout: int = 300,
) -> str:
    try:
        payload = {
            "model": model,
            "prompt": prompt,
            "stream": False,
            "options": {"temperature": 0.2, "top_p": 0.9},
        }
        resp = requests.post(
            f"{ollama_url}/api/generate",
            json=payload,
            timeout=timeout,
        )
        resp.raise_for_status()
        text = resp.json().get("response", "").strip()
        return text if text else "[LLM ERROR] Empty response from model."
    except requests.exceptions.ConnectionError:
        return "[LLM UNAVAILABLE] Could not connect to Ollama. Is it running?"
    except requests.exceptions.Timeout:
        return "[LLM UNAVAILABLE] Ollama request timed out."
    except Exception as e:
        return f"[LLM ERROR] {str(e)}"


# ─────────────────────────────────────────────────────────────
# Text chunker
# ─────────────────────────────────────────────────────────────
def _chunk_text(text: str, max_words: int = CHUNK_WORD_LIMIT) -> list:
    words = text.split()
    if len(words) <= max_words:
        return [text]
    return [
        " ".join(words[i : i + max_words])
        for i in range(0, len(words), max_words)
    ]


# ─────────────────────────────────────────────────────────────
# Prompts
# ─────────────────────────────────────────────────────────────

_CHUNK_SUMMARY_PROMPT = """\
You are summarizing one section of a document for research purposes.
Section {n} of {total}:
---
{text}
---

Write 4-6 concise sentences covering:
- The main topic(s) discussed in this section
- Specific claims or key information presented
- Any named people, organizations, locations, or events mentioned

Stay factual. Do not add opinions or draw conclusions not present in the text."""


_BRIEF_PROMPT = """\
You are creating a structured document intelligence brief for research and analysis.

File: {filename}
Document type: {doc_type}

Content to analyze{chunk_note}:
---
{content}
---

Write the brief using EXACTLY these section headers in this order (no extras, no deviations):

MAIN TOPIC
[One sentence stating the primary subject of this document]

CORE THESIS / PURPOSE
[1-2 sentences on what this document is arguing, explaining, or trying to accomplish]

SHORT SUMMARY
[3-5 sentences summarizing the document at a high level]

MAJOR THEMES
[Bullet list of recurring themes or subject areas — prefix each with •]

KEY CLAIMS
[Bullet list of specific claims, assertions, or conclusions made — prefix each with •]

IMPORTANT DETAILS
[Bullet list of notable data points, dates, names, figures, or specifics — prefix each with •]

TONE / FRAMING
[1-2 sentences on the apparent rhetorical tone and how the material is framed]

POTENTIAL BIAS / LIMITATIONS
[1-2 sentences on any notable perspective bias, omissions, or methodological limitations]

SOURCE / CITATION NOTES
[Note on apparent authorship, publication context, or citation quality if discernible; \
otherwise write: Not discernible from extracted text.]

SUGGESTED PACKAGE USES
[Which NEXIS packages would best use this document — Summary Brief, Creator Package, \
or both — and why in one sentence]

EXTRACTION NOTES
[Note any anomalies in the extracted text quality: OCR artifacts, formatting loss, \
apparent truncation; otherwise write: No anomalies detected.]

Be analytical and factual. Do not editorialize. Do not reproduce large blocks of raw text."""


# ─────────────────────────────────────────────────────────────
# Chunk summarizer  (sync, run in executor)
# ─────────────────────────────────────────────────────────────
def _summarize_chunk_sync(
    chunk: str,
    n: int,
    total: int,
    ollama_url: str,
    model: str,
) -> str:
    prompt = _CHUNK_SUMMARY_PROMPT.format(n=n, total=total, text=chunk)
    return _call_ollama_text_sync(prompt, ollama_url, model, timeout=180)


# ─────────────────────────────────────────────────────────────
# Document type detection
# ─────────────────────────────────────────────────────────────
def _detect_doc_type(ext: str) -> str:
    return {
        ".pdf":  "PDF Document",
        ".docx": "Word Document (.docx)",
        ".doc":  "Word Document (.doc)",
        ".txt":  "Plain Text",
        ".md":   "Markdown Document",
        ".rtf":  "Rich Text Format",
        ".odt":  "OpenDocument Text",
    }.get(ext.lower(), "Document")


# ─────────────────────────────────────────────────────────────
# Brief text builder
# ─────────────────────────────────────────────────────────────
def _build_brief_text(
    filename: str,
    doc_type: str,
    brief_sections: str,
) -> str:
    lines = [
        "DOCUMENT COLLECTION BRIEF",
        SEP_WIDE,
        f"File:          {filename}",
        f"Document Type: {doc_type}",
        "",
    ]

    if brief_sections.startswith("[LLM"):
        lines += [
            "NOTE: Document brief could not be generated.",
            f"Reason: {brief_sections}",
            "",
            "To enable: ensure Ollama is running and a text model is installed.",
            "The raw document text is preserved separately in this collection item.",
            "",
        ]
    else:
        lines.append(brief_sections)
        lines.append("")

    lines.append("Note: Raw document text is preserved separately in this collection item.")

    return "\n".join(lines)


# ─────────────────────────────────────────────────────────────
# Public async entry point
# ─────────────────────────────────────────────────────────────
async def generate_document_brief(
    filename: str,
    extension: str,
    text: str,
    ollama_url: str,
    model: str,
) -> dict:
    """Generate a DOCUMENT COLLECTION BRIEF from extracted document text.

    Returns a dict with two separate fields:
      "raw":   the full extracted text (no AI content)
      "brief": structured analysis header + all sections

    Short documents (≤ CHUNK_DIRECT_LIMIT words): single LLM pass.
    Long documents: split into sections → each summarized concurrently →
    combined section summaries fed into the final brief prompt.

    If Ollama is unavailable, the brief contains a clear note and
    the raw document text is always preserved in the "raw" field.
    """
    loop = asyncio.get_event_loop()
    doc_type = _detect_doc_type(extension)
    word_count = len(text.split())

    if word_count <= CHUNK_DIRECT_LIMIT:
        # Short document — pass directly to the brief prompt
        content = text
        chunk_note = ""
    else:
        # Long document — split and pre-summarize each section
        chunks = _chunk_text(text)

        tasks = [
            loop.run_in_executor(
                None,
                _summarize_chunk_sync,
                chunk, i + 1, len(chunks), ollama_url, model,
            )
            for i, chunk in enumerate(chunks)
        ]
        chunk_summaries = await asyncio.gather(*tasks)

        content = "\n\n".join(
            f"[Section {i + 1}/{len(chunks)}]\n{s}"
            for i, s in enumerate(chunk_summaries)
        )
        chunk_note = f" ({len(chunks)} sections, each pre-summarized)"

    # Generate the final brief
    prompt = _BRIEF_PROMPT.format(
        filename=filename,
        doc_type=doc_type,
        content=content,
        chunk_note=chunk_note,
    )

    brief_sections = await loop.run_in_executor(
        None,
        _call_ollama_text_sync,
        prompt, ollama_url, model, 300,
    )

    brief = _build_brief_text(filename, doc_type, brief_sections)

    return {
        "raw": text,
        "brief": brief,
    }
