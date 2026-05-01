# ============================================================
# ARC-NEXUS - NEXIS ENGINE
# File: app/reconstruction.py
# Version: 013 (Transform Routing Fix Only)
# ============================================================

from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from typing import Literal

from app.services.llm_service import run_llm

router = APIRouter(tags=["nexis-understand"])

PresetType = Literal["student", "creator", "explained", "analysis"]
ActionType = Literal["summarize", "extract", "rewrite", "transform", "clean"]


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
        "student": {
            "summarize": ["Short", "Medium", "Long"],
            "extract": ["Key Points", "Quotes", "Entities"],
            "rewrite": ["Simplify", "Improve Clarity"],
            "transform": ["Study Guide", "Paragraph"],
            "clean": ["Remove Filler", "Fix Formatting"],
        },
        "creator": {
            "summarize": ["Short", "Medium"],
            "extract": ["Key Points", "Quotes", "Timeline"],
            "rewrite": ["Make Engaging", "Improve Flow"],
            "transform": [
                "Dialogue Script",
                "Narrative Story",
                "Hook Script",
                "Social Post",
            ],
            "clean": ["Remove Filler"],
        },
        "explained": {
            "summarize": ["Short", "Medium"],
            "extract": ["Key Points", "Entities"],
            "rewrite": ["Improve Clarity", "Simplify"],
            "transform": ["Paragraph", "Study Guide"],
            "clean": ["Normalize Spacing", "Remove Filler"],
        },
        "analysis": {
            "summarize": ["Long"],
            "extract": ["Key Points", "Entities", "Timeline"],
            "rewrite": ["Make Professional", "Improve Clarity"],
            "transform": ["JSON", "Paragraph"],
            "clean": ["Deduplicate", "Fix Formatting"],
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
    # STUDENT / EXPLAINED — STUDY GUIDE
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
    if preset == "creator" and option == "Dialogue Script":
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
    # CREATOR — NARRATIVE STORY
    # ------------------------------------------------------------
    if preset == "creator" and option == "Narrative Story":
        return f"""SOURCE TEXT:
{text}

TASK:
Transform the source into a grounded narrative story.

CRITICAL:
- Do NOT summarize
- Do NOT describe the source
- Do NOT say "this appears to be"
- Do NOT invent major events
- Preserve factual accuracy

RETURN ONLY:

Title:
<short title>

Story:
<beginning, middle, and end based only on the source>

Takeaway:
<one clear lesson or meaning>
"""

    # ------------------------------------------------------------
    # CREATOR — HOOK SCRIPT
    # ------------------------------------------------------------
    if preset == "creator" and option == "Hook Script":
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
    # CREATOR — SOCIAL POST
    # ------------------------------------------------------------
    if preset == "creator" and option == "Social Post":
        return f"""SOURCE TEXT:
{text}

TASK:
Transform the source into a concise social media post.

CRITICAL:
- Do NOT summarize
- Do NOT describe the source
- Do NOT say "this appears to be"
- Write like a person posting to an audience
- Preserve factual accuracy

RETURN ONLY:

Post:
<short engaging post>

Key Point:
<one clear takeaway>

Optional Hashtags:
<3 to 5 relevant hashtags, only if useful>
"""

    # ------------------------------------------------------------
    # ANALYSIS — JSON
    # ------------------------------------------------------------
    if preset == "analysis" and option == "JSON":
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
# 🔥 REWRITE PROMPTS (FINAL LOCKED VERSION)
# ============================================================

def rewrite_prompt(text: str, option: str) -> str:

    if option == "Improve Clarity":
        return f"""SOURCE TEXT:
{text}

TASK:
Rewrite the text to improve clarity.

CRITICAL RULES:
- Preserve ALL original meaning exactly
- Do NOT add interpretation or new ideas
- Do NOT generalize or introduce framing
- Do NOT summarize
- Do NOT remove important detail
- Do NOT change intent
- Do NOT refer to instructor, speaker, or lecture
- Do NOT describe teaching context
- Convert everything into direct clinical statements

PRECISION RULES:
- Remove redundancy (no repeated ideas)
- Replace vague language with precise clinical wording
- Strengthen cause → effect relationships
- Use definitive wording where appropriate (avoid "may" when unnecessary)

STYLE RULES:
- Improve sentence structure
- Improve flow
- Keep neutral, professional tone
- Maintain original detail level

FORBIDDEN:
- "This appears to be"
- "The instructor explains"
- "The lecture"
- Any summarizing language
- Any added conclusions

OUTPUT:
Return ONLY the rewritten text.
"""

    if option == "Simplify":
        return f"""SOURCE TEXT:
{text}

TASK:
Rewrite in simpler language.

RULES:
- Keep meaning identical
- Use simpler words
- Shorten sentence structure
- Do NOT remove key information
- Do NOT summarize
- Do NOT add ideas

OUTPUT:
Return simplified text only.
"""

    if option == "Make Engaging":
        return f"""SOURCE TEXT:
{text}

TASK:
Rewrite to be more engaging.

RULES:
- Keep facts accurate
- Improve readability
- Add natural tone
- Do NOT invent information
- Do NOT summarize heavily

OUTPUT:
Return rewritten text only.
"""

    if option == "Improve Flow":
        return f"""SOURCE TEXT:
{text}

TASK:
Improve flow and readability.

RULES:
- Improve transitions
- Reduce repetition
- Maintain exact meaning
- Do NOT summarize
- Do NOT add content

OUTPUT:
Return rewritten text only.
"""

    if option == "Make Professional":
        return f"""SOURCE TEXT:
{text}

TASK:
Rewrite in professional tone.

RULES:
- Formal language
- Clear structure
- No slang
- Preserve meaning exactly
- Do NOT summarize

OUTPUT:
Return rewritten text only.
"""

    raise HTTPException(400, f"No rewrite prompt for {option}")


# ============================================================
# PROMPT BUILDER
# ============================================================

def build_prompt(text: str, preset: str, action: str, option: str) -> str:

    if action == "transform":
        return transform_prompt(text, preset, option)

    if action == "rewrite":
        return rewrite_prompt(text, option)

    if action == "summarize":
        if option == "Short":
            task = "Summarize in 2–3 sentences only."
        elif option == "Medium":
            task = "Summarize in 2 paragraphs."
        elif option == "Long":
            task = "Structured detailed summary."
        else:
            raise HTTPException(400, "Invalid summarize option")

    elif action == "extract":
        if option == "Key Points":
            task = "Extract key points as bullets."
        elif option == "Quotes":
            task = "Extract exact quotes only."
        elif option == "Entities":
            task = "Extract named entities."
        elif option == "Timeline":
            task = "Extract chronological events."
        else:
            raise HTTPException(400, "Invalid extract option")

    elif action == "clean":
        if option == "Remove Filler":
            task = "Remove filler words only."
        elif option == "Fix Formatting":
            task = "Fix formatting only."
        elif option == "Normalize Spacing":
            task = "Normalize spacing."
        elif option == "Deduplicate":
            task = "Remove duplicates."
        else:
            raise HTTPException(400, "Invalid clean option")

    else:
        raise HTTPException(400, "Invalid action")

    return f"""SOURCE TEXT:
{text}

TASK:
{task}

RULES:
- Use only the text
- No hallucination
- No explanation
"""


# ============================================================
# ROUTE
# ============================================================

@router.post("/convert", response_model=ReconstructionResponse)
async def convert(request: ReconstructionRequest):

    clean_text = sanitize(request.text)

    if not clean_text:
        raise HTTPException(400, "Text cannot be empty.")

    validate(request.preset, request.action, request.option)

    prompt = build_prompt(
        clean_text,
        request.preset,
        request.action,
        request.option,
    )

    output = await run_llm(prompt)

    return ReconstructionResponse(output=output)


# ------------------------------------------------------------
# 🔄 LEGACY SUPPORT (optional but recommended)
# Keeps old frontend calls working during transition
# ------------------------------------------------------------

@router.post("/understand", response_model=ReconstructionResponse)
async def understand_legacy(request: ReconstructionRequest):
    return await convert(request)