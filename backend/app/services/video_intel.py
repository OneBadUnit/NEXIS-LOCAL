# ============================================================
# VIDEO INTELLIGENCE SERVICE
# File: app/services/video_intel.py
# Version: 002 (Return dict {raw, brief} — stored separately)
#
# Converts raw video/YouTube transcripts into structured
# intelligence briefs using a local Ollama model.
#
# PIPELINE
# ─────────────────────────────────────────────────────────
# Short transcript  (≤ CHUNK_DIRECT_LIMIT words)
#   └─ single LLM pass → brief
#
# Long transcript   (> CHUNK_DIRECT_LIMIT words)
#   ├─ split into CHUNK_WORD_LIMIT-word chunks
#   ├─ summarize each chunk concurrently via Ollama
#   └─ feed combined chunk summaries → final brief
#
# Graceful degradation:
#   If Ollama is offline or the model isn't loaded, the raw
#   transcript is returned as-is with a clear note — no
#   silent failure, no cloud fallback.
#
# Output:
#   dict {
#     "raw":   full transcript (no AI content)
#     "brief": metadata header + structured sections + timestamps
#              (raw transcript stored separately, NOT embedded here)
#   }
# ============================================================

import asyncio

import requests

# ─────────────────────────────────────────────────────────────
# Constants
# ─────────────────────────────────────────────────────────────

# Transcripts ≤ this word count are sent to the brief prompt directly.
CHUNK_DIRECT_LIMIT = 1200

# Transcripts above the direct limit are split into chunks of this size.
CHUNK_WORD_LIMIT = 1500

SEP_WIDE = "═" * 52
SEP_THIN = "─" * 52


# ─────────────────────────────────────────────────────────────
# Internal Ollama caller  (sync — run in an executor)
# No FastAPI exceptions; returns "[LLM ...]" strings on failure
# so the caller can detect and handle gracefully.
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
You are summarizing one section of a video transcript for research purposes.
Section {n} of {total}:
---
{text}
---

Write 4-6 concise sentences covering:
- The main topic(s) discussed in this section
- Specific claims or assertions made
- Any named people, organizations, locations, or events mentioned

Stay factual. Do not add opinions or draw conclusions not present in the text."""


_BRIEF_PROMPT = """\
You are creating a structured video intelligence brief for research and analysis.

Video: {title}
URL: {url}
Transcript via: {transcript_source}

Content to analyze (from transcript{chunk_note}):
---
{content}
---

Write the brief using EXACTLY these section headers (no extras, no deviations):

OVERVIEW
[2-3 sentences describing what this video is and what it covers]

KEY POINTS
[Bullet list of the most important points made — prefix each with •]

CLAIMS MADE
[Bullet list of specific claims, arguments, or assertions made — prefix each with •]

TOPICS & ENTITIES
[Comma-separated list of topics, named people, organizations, places, and events]

FRAMING & TONE
[1-2 sentences on the apparent framing, rhetorical tone, or bias indicators visible in the transcript]

SUGGESTED FOLLOW-UP QUESTIONS
[3-5 questions a researcher might investigate based on this content — prefix each with •]

Be analytical and factual. Do not editorialize. Do not quote large blocks of raw transcript."""


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
# Brief text builder  (AI analysis only — no raw transcript)
# ─────────────────────────────────────────────────────────────
def _build_brief_text(
    url: str,
    title: str,
    transcript_source: str,
    brief_sections: str,
    timestamps: str,
) -> str:
    lines = [
        "VIDEO INTELLIGENCE BRIEF",
        SEP_WIDE,
        f"Source:         {url}",
        f"Title:          {title or 'Unknown'}",
        f"Transcript via: {transcript_source}",
        "",
    ]

    # Brief body — or graceful degradation if LLM was unavailable
    if brief_sections.startswith("[LLM"):
        lines += [
            "NOTE: Intelligence brief could not be generated.",
            f"Reason: {brief_sections}",
            "",
            "To enable: ensure Ollama is running and a text model is installed.",
            "The raw transcript is available separately via Show Raw Source.",
            "",
        ]
    else:
        lines.append(brief_sections)
        lines.append("")

    # Timestamps
    lines += [
        "NOTABLE TIMESTAMPS",
        (timestamps.strip() if timestamps else "Timestamps unavailable."),
        "",
        "Note: Raw transcript is preserved separately in this collection item.",
    ]

    return "\n".join(lines)


# ─────────────────────────────────────────────────────────────
# Public async entry point
# ─────────────────────────────────────────────────────────────
async def generate_video_brief(
    url: str,
    title: str,
    transcript: str,
    transcript_source: str,
    timestamps: str,
    ollama_url: str,
    model: str,
) -> dict:
    """Build a VIDEO INTELLIGENCE BRIEF from a transcript.

    Returns a dict with two separate fields:
      "raw":   the full transcript text (no AI content)
      "brief": metadata header + structured analysis + timestamps
               (raw transcript is NOT embedded in the brief)

    Short transcripts (≤ CHUNK_DIRECT_LIMIT words): single LLM pass.
    Long transcripts: chunked → each chunk summarized concurrently →
    combined chunk summaries fed into the final brief prompt.

    If Ollama is unavailable, the brief contains a clear note and
    the raw transcript is always preserved in the "raw" field.
    """
    loop = asyncio.get_event_loop()
    word_count = len(transcript.split())

    if word_count <= CHUNK_DIRECT_LIMIT:
        # Short transcript — pass directly to the brief prompt
        content = transcript
        chunk_note = ""
    else:
        # Long transcript — chunk and pre-summarize
        chunks = _chunk_text(transcript)

        # Summarize all chunks concurrently
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
            f"[Chunk {i + 1}/{len(chunks)}]\n{s}"
            for i, s in enumerate(chunk_summaries)
        )
        chunk_note = f" ({len(chunks)} chunks, each pre-summarized)"

    # Generate final brief
    prompt = _BRIEF_PROMPT.format(
        title=title or "Unknown",
        url=url,
        transcript_source=transcript_source,
        content=content,
        chunk_note=chunk_note,
    )

    brief_text = await loop.run_in_executor(
        None,
        _call_ollama_text_sync,
        prompt, ollama_url, model, 300,
    )

    brief = _build_brief_text(
        url=url,
        title=title,
        transcript_source=transcript_source,
        brief_sections=brief_text,
        timestamps=timestamps,
    )

    return {
        "raw": transcript,
        "brief": brief,
    }
