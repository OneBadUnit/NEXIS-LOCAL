# ============================================================
# ARC-NEXUS - NEXIS ENGINE
# File: app/reconstruction.py
# Version: 015 (Summary + Creator Package Refinement)
# ============================================================

from fastapi import APIRouter, HTTPException, Depends
from pydantic import BaseModel
from typing import Literal
from sqlalchemy.orm import Session

from app.services.llm_service import run_llm
from app.core.db import get_db
from app.core import usage as usage_tracker
from app.core.usage import DEFAULT_USER_ID

router = APIRouter(tags=["nexis-understand"])

PresetType = Literal["summary", "creator", "explained", "analysis"]
ActionType = Literal["summarize", "extract", "transform"]


class ReconstructionRequest(BaseModel):
    text: str
    preset: PresetType
    action: ActionType
    option: str


class ReconstructionResponse(BaseModel):
    output: str


def sanitize(text: str) -> str:
    return text.replace("\u0000", "").replace("\r", "").replace("```", "").strip()


# ============================================================
# VALIDATION
# ============================================================

def validate(preset: str, action: str, option: str):
    allowed = {
        "summary": {
            "summarize": ["Short", "Medium", "Long"],
            "extract": ["Quotes", "Entities"],
            "transform": ["Outline", "Timeline", "Key Points", "Summary"],
        },
        "creator": {
            "summarize": ["Short", "Medium"],
            "extract": ["Key Points", "Quotes", "Timeline"],
            "transform": ["Make Engaging", "Hook Script", "Dialogue Script", "Title Suggestions", "Keywords"],
        },
        "explained": {
            "summarize": ["Short", "Medium"],
            "extract": ["Key Points", "Entities"],
            "transform": ["Simplify", "Improve Clarity", "Study Guide", "Paragraph"],
        },
        "analysis": {
            "summarize": ["Long"],
            "extract": ["Key Points", "Entities", "Timeline"],
            "transform": ["Make Professional", "Improve Clarity", "JSON", "Paragraph"],
        },
    }

    if preset not in allowed:
        raise HTTPException(400, f"Invalid preset: {preset}")

    if action not in allowed[preset]:
        raise HTTPException(400, f"{action} not allowed for {preset}")

    if option not in allowed[preset][action]:
        raise HTTPException(400, f"{option} not valid for {preset}.{action}")


# ============================================================
# 🔥 TRANSFORM PROMPTS
# FIXED ONLY: now routes by preset + option.
# ============================================================

def transform_prompt(text: str, preset: str, option: str) -> str:

    # ------------------------------------------------------------
    # SUMMARY PACKAGE — OUTLINE
    # ------------------------------------------------------------
    if option == "Outline":
        return f"""SOURCE TEXT:
{text}

TASK:
Create a structured outline of the source material.

CRITICAL:
- Do NOT summarize or compress
- Do NOT describe the source
- Do NOT add information not in the source
- Use only content that is present in the source

RETURN ONLY:

Title:
<clear title derived from source>

I. <main section or topic>
   A. <supporting detail>
   B. <supporting detail>

II. <main section or topic>
   A. <supporting detail>
   B. <supporting detail>

III. <main section or topic>
   A. <supporting detail>
   B. <supporting detail>
"""

    # ------------------------------------------------------------
    # SUMMARY PACKAGE — TIMELINE
    # (also available as extract for other presets)
    # ------------------------------------------------------------
    if option == "Timeline":
        return f"""SOURCE TEXT:
{text}

TASK:
Extract a chronological timeline of events from the source.

FORMAT:
<date or period> — <event>
<date or period> — <event>

RULES:
- Use only what is stated in the source
- Do NOT infer or add events
- Order chronologically
- If no dates are present, use relative markers (e.g. \"Before X\", \"After Y\")
"""

    # ------------------------------------------------------------
    # SUMMARY PACKAGE — KEY POINTS
    # ------------------------------------------------------------
    if option == "Key Points":
        return f"""SOURCE TEXT:
{text}

TASK:
Extract the key points as a numbered list.

RULES:
- Each point must be a complete, standalone sentence
- Use only content from the source
- Do NOT add commentary or explanation
- Do NOT infer or summarize beyond what is stated
"""

    # ------------------------------------------------------------
    # SUMMARY PACKAGE — SUMMARY
    # ------------------------------------------------------------
    if option == "Summary":
        return f"""SOURCE TEXT:
{text}

TASK:
Write a structured summary of the source material.

STRICT OUTPUT RULES:
- Use ONLY content present in the source — do NOT add outside knowledge
- Do NOT infer, speculate, or assume anything not stated
- Do NOT include opinions, recommendations, or analysis
- Keep tone strictly neutral and factual
- Remove repetition and filler
- Combine overlapping or repeated information into single, information-dense sentences
- Preserve important names, numbers, dates, and specifics whenever present
- Write in full sentences — do NOT use bullet points
- Do NOT create a conclusion section
- Do NOT describe the document, source, or structure (e.g., "the source covers", "this document explains")
- Write as if directly stating the events or information itself

RETURN ONLY:

Topic:
<one sentence stating what this source is about, using only source content>

Coverage:
<2–3 sentences describing what the source covers, in the order it appears>

Key Information:
<a tightly written set of sentences that preserves the most important information while minimizing redundancy; prioritize information density over brevity>
"""

    # ------------------------------------------------------------
    # SIMPLIFY
    # ------------------------------------------------------------
    if option == "Simplify":
        return f"""SOURCE TEXT:
{text}

TASK:
Rewrite in simpler language.

RULES:
- Keep meaning identical
- Use shorter sentences and common words
- Do NOT remove key information
- Do NOT summarize
- Do NOT add ideas

OUTPUT:
Return simplified text only.
"""

    # ------------------------------------------------------------
    # IMPROVE CLARITY
    # ------------------------------------------------------------
    if option == "Improve Clarity":
        return f"""SOURCE TEXT:
{text}

TASK:
Rewrite the text to improve clarity.

RULES:
- Preserve ALL original meaning exactly
- Do NOT add interpretation or new ideas
- Do NOT summarize or remove important detail
- Remove redundancy and vague language
- Strengthen cause and effect relationships
- Improve sentence structure and flow
- Keep neutral, professional tone

FORBIDDEN:
- "This appears to be"
- "The instructor explains"
- Any summarizing language

OUTPUT:
Return ONLY the rewritten text.
"""

    # ------------------------------------------------------------
    # MAKE ENGAGING
    # ------------------------------------------------------------
    if option == "Make Engaging":
        return f"""SOURCE TEXT:
{text}

TASK:
Rewrite to be more engaging and readable.

RULES:
- Keep all facts accurate
- Add natural, active tone
- Improve sentence rhythm and variety
- Do NOT invent information
- Do NOT change meaning
- Do NOT summarize

OUTPUT:
Return rewritten text only.
"""

    # ------------------------------------------------------------
    # MAKE PROFESSIONAL
    # ------------------------------------------------------------
    if option == "Make Professional":
        return f"""SOURCE TEXT:
{text}

TASK:
Rewrite in a formal, professional tone.

RULES:
- Use precise, formal language
- Remove slang, casual phrasing, and filler
- Maintain logical structure
- Preserve meaning exactly
- Do NOT summarize

OUTPUT:
Return rewritten text only.
"""

    # ------------------------------------------------------------
    # STUDY GUIDE
    # ------------------------------------------------------------
    if option == "Study Guide":
        return f"""SOURCE TEXT:
{text}

TASK:
Create a structured study guide.

CRITICAL:
- Do NOT summarize
- Do NOT describe the source
- Do NOT say "this appears to be"
- Extract concrete, testable content

RETURN ONLY:

Title:
<clear title>

Core Concepts:
- <definition or concept>
- <definition or concept>
- <definition or concept>

Key Rules:
- <decision rule or principle>
- <decision rule or principle>

Examples:
- <scenario-based example>
- <scenario-based example>

Quick Review:
- <test-style takeaway>
- <test-style takeaway>
"""

    # ------------------------------------------------------------
    # PARAGRAPH — STUDENT / EXPLAINED / ANALYSIS
    # ------------------------------------------------------------
    if option == "Paragraph":
        return f"""SOURCE TEXT:
{text}

TASK:
Rewrite into ONE clean paragraph.

RULES:
- No headings
- No bullets
- Preserve meaning
- Do not summarize aggressively
- Do not add new information
"""

    # ------------------------------------------------------------
    # CREATOR — DIALOGUE SCRIPT
    # ------------------------------------------------------------
    if option == "Dialogue Script":
        return f"""SOURCE TEXT:
{text}

TASK:
Transform the source into a dialogue script.

CRITICAL:
- Do NOT summarize
- Do NOT describe the source
- Do NOT say "this appears to be"
- Do NOT write an overview
- Create usable dialogue based only on source content

RETURN ONLY:

Title:
<short title>

Speaker 1:
<spoken line>

Speaker 2:
<spoken line>

Speaker 1:
<spoken line>

Speaker 2:
<spoken line>

Speaker 1:
<spoken line>

Speaker 2:
<spoken line>
"""

    # ------------------------------------------------------------
    # CREATOR — HOOK SCRIPT
    # ------------------------------------------------------------
    if option == "Hook Script":
        return f"""SOURCE TEXT:
{text}

TASK:
Transform the source into creator-ready hook content.

CRITICAL:
- Do NOT summarize
- Do NOT describe the source
- Do NOT say "this appears to be"
- Do NOT write an overview
- Write directly to an audience
- Use tension, stakes, surprise, warning, or practical insight

RETURN ONLY:

Hook:
<one or two high-impact spoken lines>

Why it matters:
<one or two lines explaining the stakes>

Script:
<short spoken line>
<short spoken line>
<short spoken line>
<short spoken line>

CTA:
<one short closing line>
"""

    # ------------------------------------------------------------
    # CREATOR PACKAGE — TITLE SUGGESTIONS
    # ------------------------------------------------------------
    if option == "Title Suggestions":
        return f"""SOURCE TEXT:
{text}

TASK:
Generate 5 concise, attention-grabbing title options based strictly on the source content.

RULES:
- Each title must be grounded in the source material
- Do NOT invent angles or claims not present in the source
- No clickbait, no speculation
- Vary the style across the 5 options

RETURN ONLY:

1. <title option>
2. <title option>
3. <title option>
4. <title option>
5. <title option>
"""

    # ------------------------------------------------------------
    # CREATOR PACKAGE — KEYWORDS
    # ------------------------------------------------------------
    if option == "Keywords":
        return f"""SOURCE TEXT:
{text}

TASK:
Extract the most relevant keywords and key phrases from the source.

RULES:
- Use only terms present in or directly stated by the source
- Do NOT invent or infer keywords
- Include both single words and short phrases where relevant
- Order by relevance (most important first)

RETURN ONLY:

Keywords:
<keyword>, <keyword>, <keyword>, <keyword>, <keyword>, <keyword>, <keyword>, <keyword>, <keyword>, <keyword>
"""

    # ------------------------------------------------------------
    # ANALYSIS — JSON
    # ------------------------------------------------------------
    if option == "JSON":
        return f"""SOURCE TEXT:
{text}

TASK:
Transform the source into valid JSON.

CRITICAL:
- Return ONLY valid JSON
- No markdown
- No explanation
- No text before JSON
- No text after JSON
- Use only source content
- Do not invent information

RETURN ONLY THIS JSON SHAPE:

{{
  "events": [
    {{
      "date": "",
      "event": "",
      "source_detail": ""
    }}
  ],
  "entities": [
    {{
      "name": "",
      "type": "",
      "role_or_relevance": ""
    }}
  ],
  "claims": [
    {{
      "claim": "",
      "supporting_detail": "",
      "confidence": "source-stated"
    }}
  ]
}}
"""

    raise HTTPException(400, f"No transform prompt for {preset}.{option}")


# ============================================================
# PROMPT BUILDER
# ============================================================

def build_prompt(text: str, preset: str, action: str, option: str) -> str:

    if action == "transform":
        return transform_prompt(text, preset, option)

    if action == "summarize":
        if option == "Short":
            return f"""SOURCE TEXT:
{text}

TASK:
Write a 2–3 sentence summary.

RULES:
- Preserve all key facts
- No bullets, no headings
- Do NOT add information not in the source
"""
        elif option == "Medium":
            return f"""SOURCE TEXT:
{text}

TASK:
Write a 2-paragraph summary.

RULES:
- First paragraph: main idea and context
- Second paragraph: supporting detail and outcome
- No bullets, no headings
- Do NOT add information not in the source
"""
        elif option == "Long":
            return f"""SOURCE TEXT:
{text}

TASK:
Write a structured detailed summary.

RETURN ONLY:

Overview:
<1 paragraph covering the main idea>

Key Points:
- <key point>
- <key point>
- <key point>

Notable Details:
- <important detail>
- <important detail>

Conclusion:
<1–2 sentences>

RULES:
- Use only source content
- Do NOT add information not in the source
"""
        else:
            raise HTTPException(400, "Invalid summarize option")

    elif action == "extract":
        if option == "Key Points":
            return f"""SOURCE TEXT:
{text}

TASK:
Extract the key points as a numbered list.

RULES:
- Each point must be a complete, standalone sentence
- Use only content from the source
- No commentary, no added explanation
"""
        elif option == "Quotes":
            return f"""SOURCE TEXT:
{text}

TASK:
Extract direct quotes only.

RULES:
- Format each quote as: "<quote>"
- Do NOT paraphrase
- Do NOT add commentary
- Only include text that appears verbatim in the source
"""
        elif option == "Entities":
            return f"""SOURCE TEXT:
{text}

TASK:
Extract all named entities from the source.

RETURN ONLY:

People:
- <name> — <role or context>

Places:
- <name> — <context>

Organizations:
- <name> — <context>

RULES:
- Skip any category with no entries
- Use only what is stated in the source
"""
        elif option == "Timeline":
            return f"""SOURCE TEXT:
{text}

TASK:
Extract a chronological timeline of events.

FORMAT:
<date or period> — <event>
<date or period> — <event>

RULES:
- Use only what is stated in the source
- Do NOT infer or add events
- Order chronologically
"""
        else:
            raise HTTPException(400, "Invalid extract option")

    else:
        raise HTTPException(400, "Invalid action")


# ============================================================
# SHARED INNER LOGIC
# Used by both /convert and /understand (legacy) endpoints
# so DB enforcement runs exactly once per request.
# ============================================================

async def _run_convert(
    request: ReconstructionRequest,
    db: Session,
) -> ReconstructionResponse:

    clean_text = sanitize(request.text)

    if not clean_text:
        raise HTTPException(400, "Text cannot be empty.")

    # SERVER-SIDE LIMIT CHECK
    # Check both monthly action limit and saved-output storage limit
    # before running the LLM.  Neither counter is incremented here.
    limit_error = usage_tracker.check_create_limits(db, DEFAULT_USER_ID)
    if limit_error:
        raise HTTPException(status_code=429, detail=limit_error)

    validate(request.preset, request.action, request.option)

    prompt = build_prompt(
        clean_text,
        request.preset,
        request.action,
        request.option,
    )

    output = await run_llm(prompt)

    # Increment both counters only after a successful LLM response.
    # Convert always produces a saved output, so both action and output
    # storage are committed here.
    usage_tracker.increment_action(db, DEFAULT_USER_ID)
    usage_tracker.increment_output_count(db, DEFAULT_USER_ID)

    return ReconstructionResponse(output=output)


# ============================================================
# ROUTE
# ============================================================

@router.post("/convert", response_model=ReconstructionResponse)
async def convert(request: ReconstructionRequest, db: Session = Depends(get_db)):
    return await _run_convert(request, db)


# ------------------------------------------------------------
# Legacy support
# ------------------------------------------------------------

@router.post("/understand", response_model=ReconstructionResponse)
async def understand_legacy(request: ReconstructionRequest, db: Session = Depends(get_db)):
    return await _run_convert(request, db)