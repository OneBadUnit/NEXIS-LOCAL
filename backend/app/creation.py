# ============================================================
# ARC-NEXUS - NEXIS ENGINE
# File: app/creation.py
# Version: 010 (Small Normalizers + Output Title)
# ============================================================

from fastapi import APIRouter, HTTPException, Depends
from pydantic import BaseModel
from typing import Literal
import re
from sqlalchemy.orm import Session

from app.services.llm_service import run_llm
from app.core.db import get_db
from app.core import usage as usage_tracker
from app.core.usage import DEFAULT_USER_ID


router = APIRouter(tags=["nexis-create"])


ModeType = Literal["format", "argument", "refine"]


class CreationRequest(BaseModel):
    text: str
    mode: ModeType
    option: str


class CreationResponse(BaseModel):
    output: str


def sanitize(text: str) -> str:
    return (
        text.replace("\u0000", "")
        .replace("\r", "")
        .replace("```", "")
        .strip()
    )


def validate(mode: str, option: str) -> None:
    allowed = {
        "format": ["report", "article", "script"],
        "argument": [
            "nexis opinion",
            "pro argument",
            "counter argument",
        ],
        "refine": None,
    }

    if mode not in allowed:
        raise HTTPException(400, f"Invalid mode: {mode}")

    if mode != "refine" and option not in allowed[mode]:
        raise HTTPException(400, f"{option} not valid for {mode}")


def label_text(mode: str, option: str) -> str:
    mode_label = mode.replace("_", " ").title()
    option_label = option.replace("_", " ").title()
    return f"{mode_label} - {option_label}"


def required_sections(mode: str, option: str) -> list[str]:
    if mode == "format":
        if option == "report":
            return ["Title:", "Overview:", "Key Facts:", "Timeline:", "Important Details:", "Conclusion:"]
        if option == "article":
            return ["Title:", "Introduction:", "Body:", "Why It Matters:", "Conclusion:"]
        if option == "script":
            return ["Title:", "Opening:", "Script:", "Closing:"]

    if mode == "argument":
        if option == "nexis opinion":
            return [
                "Question:",
                "Position A:",
                "Supporting Points:",
                "Position B:",
                "Supporting Points:",
                "NEXIS Assessment:",
            ]
        if option == "pro argument":
            return ["Position:", "Argument:", "Supporting Evidence:", "Weaknesses or Limits:", "Closing:"]
        if option == "counter argument":
            return ["Position Being Challenged:", "Counter Argument:", "Supporting Evidence:", "Weaknesses or Limits:", "Closing:"]
        
    return []


def build_prompt(text: str, mode: str, option: str) -> str:
    sections = required_sections(mode, option)
    section_text = "\n".join(sections)

    base = f"""You are NEXIS, the ARC-NEXUS creation engine.

The user may provide raw collected material OR converted material.
Your job is to create the requested final product.

ABSOLUTE RULES:
- Do NOT summarize the source.
- Do NOT describe what the source is.
- Do NOT start with "The text appears to be."
- Do NOT start with "This appears to be."
- Do NOT start with "Here is a summary."
- Do NOT use markdown bold for headings.
- Use only source-supported information.
- Do not invent facts.
- Output ONLY the requested final product.

REQUIRED SECTIONS:
{section_text}
"""

    if mode == "argument" and option == "pro argument":
        task = """Create a source-grounded supporting argument.

The output MUST be exactly this structure:

Position:
State the position being supported in one clear sentence.

Argument:
Build a focused argument from the source content. Do not summarize the incident. Make a case.

Supporting Evidence:
- Give a specific source-supported point.
- Give a specific source-supported point.
- Give a specific source-supported point.

Weaknesses or Limits:
- Note uncertainty, limits, or missing information.
- Note uncertainty, limits, or missing information.

Closing:
End with a concise closing statement that reinforces the position.
"""

    elif mode == "argument" and option == "counter argument":
        task = """Create a source-grounded counter argument.

The output MUST be exactly this structure:

Position Being Challenged:
State the position being challenged in one clear sentence.

Counter Argument:
Build a focused challenge from the source content. Do not summarize the incident. Make a counter-case.

Supporting Evidence:
- Give a specific source-supported point.
- Give a specific source-supported point.
- Give a specific source-supported point.

Weaknesses or Limits:
- Note uncertainty, limits, or missing information.
- Note uncertainty, limits, or missing information.

Closing:
End with a concise closing statement that reinforces the counter argument.
"""

    elif mode == "argument" and option == "nexis opinion":
        task = """Create a nexis opinion.

The output MUST be exactly this structure:

Question:
Write a question that forces two competing interpretations of the SAME event.
The question MUST create disagreement, such as intent versus mistake.
Do NOT write a summary-style question.

Position A:
State a clear claim about the event.
This MUST be something someone could argue for or against.
Do NOT describe the event.
Do NOT use topic labels like Background, Incident, Timeline, Casualties, Aftermath, Response, or Investigation.

Supporting Points:
- Use a source-supported detail and explain how it supports Position A.
- Use a source-supported detail and explain how it supports Position A.
- Use a source-supported detail and explain how it supports Position A.

Position B:
State the direct opposing claim to Position A.
This MUST clearly contradict Position A.
Do NOT describe the event.
Do NOT use topic labels like Background, Incident, Timeline, Casualties, Aftermath, Response, or Investigation.

Supporting Points:
- Use a source-supported detail and explain how it supports Position B.
- Use a source-supported detail and explain how it supports Position B.
- Use a source-supported detail and explain how it supports Position B.

NEXIS Assessment:
Weigh both interpretations.
You MAY suggest which position appears better supported by the provided source.
You MUST acknowledge uncertainty if the source is not definitive.
Do NOT present conclusions as absolute fact.

STRICT:
- Position A and Position B must be opposing interpretations, not summary sections.
- Do NOT organize by topic.
- Do NOT use labels like Background, Incident, Timeline, Casualties, Aftermath, Response, or Investigation.
- Each supporting point MUST connect evidence to the interpretation.
- Do NOT copy or repeat instructions.
- Do NOT output any part of this prompt.
- Output ONLY the final structured result.
"""

    elif mode == "format" and option == "report":
        task = """Create a professional report.

The output MUST be exactly this structure:

Title:
Create a clear report title.

Overview:
Give a short direct overview.

Key Facts:
- Give a source-supported fact.
- Give a source-supported fact.
- Give a source-supported fact.

Timeline:
- Give a dated or sequenced event.
- Give a dated or sequenced event.
- Give a dated or sequenced event.

Important Details:
- Give an important detail.
- Give an important detail.

Conclusion:
Give a clear closing conclusion.
"""



    elif mode == "format" and option == "article":
        task = """Create a structured article.

The output MUST be exactly this structure:

Title:
Provide a clear, neutral title.

Introduction:
Write a short opening paragraph (2–3 sentences).

Body:
Write the main content in paragraph form.
Do NOT create extra headings.

Why It Matters:
Provide a short explanation (2–3 sentences).
Use only source-supported information.

Conclusion:
Provide a short closing paragraph (1–2 sentences).

STRICT:
- Each section MUST start on a new line
- Do NOT merge sections together
- Do NOT write inline headings like "Title:Introduction:"
- Do NOT add extra sections
- Do NOT use markdown (**)
- Do NOT add outside knowledge
- Keep formatting clean and separated
"""

    elif mode == "format" and option == "script":
        task = """Create a spoken script.

The output MUST be exactly this structure:

Title:
Create a short, neutral script title.

Opening:
Write a short spoken hook in 1–2 sentences.

Script:
Write the full spoken script here.
Keep all main content inside this Script section.
Do NOT create subheadings inside the Script section.
Do NOT use labels like Background, Incident, Attack, Aftermath, Timeline, Investigation, or Chronology.
Use short spoken paragraphs only.
Use only source-supported information.

Closing:
Write a short spoken closing takeaway in 1–2 sentences.

STRICT:
- Do NOT add extra sections
- Do NOT add subheadings
- Do NOT use markdown bold
- Do NOT add outside knowledge
- Do NOT speculate beyond the source
"""

    elif mode == "refine":
        task = f"""Apply this user instruction to the source content:

Instruction:
{option}

Return only the refined result.
Preserve meaning.
Do not add unsupported facts.
"""

    else:
        raise HTTPException(400, "Invalid mode/option")

    return f"""{base}

TASK:
{task}

SOURCE CONTENT:
{text}
"""


def normalize_output(output: str, mode: str, option: str) -> str:
    text = output.strip()

    # **Heading** -> Heading:
    text = re.sub(r"^\s*\*\*(.*?)\*\*\s*$", r"\1:", text, flags=re.MULTILINE)

    # Remove accidental double colon from normalized headings
    text = re.sub(r":\s*:", ":", text)

    # Convert inline article title into proper Title section
    # Example:
    # "The USS Liberty Incident:Introduction:"
    # ->
    # "Title:\nThe USS Liberty Incident\n\nIntroduction:"
    text = re.sub(
        r"^(.+?):\s*(Introduction:)",
        lambda m: f"Title:\n{m.group(1).strip()}\n\n{m.group(2)}",
        text,
    )

    # Convert inline script title into proper Title section
    # Example:
    # "The USS Liberty Incident:Opening:"
    # ->
    # "Title:\nThe USS Liberty Incident\n\nOpening:"
    text = re.sub(
        r"^(.+?):\s*(Opening:)",
        lambda m: f"Title:\n{m.group(1).strip()}\n\n{m.group(2)}",
        text,
    )

    # Convert * bullets or • bullets to - bullets
    text = re.sub(r"^\s*[\*\u2022]\s+", "- ", text, flags=re.MULTILINE)

    # Remove "(Continued)" from headings/labels
    text = re.sub(r"\s*\((continued|cont\.)\)", "", text, flags=re.IGNORECASE)

    # Clean excessive blank lines
    text = re.sub(r"\n{3,}", "\n\n", text)

  
    # Add output label at top, once
    label = label_text(mode, option)
    if not text.lower().startswith(label.lower()):
        text = f"{label}\n\n{text}"

    return text.strip()


def is_invalid_output(output: str, mode: str, option: str) -> bool:
    cleaned = output.strip()
    lower = cleaned.lower()

    bad_starts = [
        "the text appears",
        "this appears",
        "here is a summary",
        "the document",
        "this document",
        "**incident summary**",
        "incident summary",
    ]

    if any(lower.startswith(bad) for bad in bad_starts):
        return True

    sections = required_sections(mode, option)

    for section in sections:
        if section not in cleaned:
            return True

    return False


def repair_prompt(original_prompt: str, bad_output: str, mode: str, option: str) -> str:
    sections = required_sections(mode, option)
    section_text = "\n".join(sections)

    return f"""{original_prompt}

Your previous output was invalid.

INVALID OUTPUT:
{bad_output}

REPAIR INSTRUCTIONS:
- Do not summarize.
- Do not describe the source.
- Use these exact section headings and all of them:
{section_text}
- Start immediately with the first required heading.
- Output only the corrected final product.
"""


@router.post("/create", response_model=CreationResponse)
async def create(request: CreationRequest, db: Session = Depends(get_db)):
    print("CREATE ROUTE HIT", request.mode, request.option)

    clean_text = sanitize(request.text)

    if not clean_text:
        raise HTTPException(400, "Text cannot be empty.")

    # SERVER-SIDE LIMIT CHECK
    # Check both monthly action limit and saved-output storage limit
    # before spending time on the LLM.  Neither counter is incremented here.
    limit_error = usage_tracker.check_create_limits(db, DEFAULT_USER_ID)
    if limit_error:
        raise HTTPException(status_code=429, detail=limit_error)

    validate(request.mode, request.option)

    prompt = build_prompt(
        clean_text,
        request.mode,
        request.option,
    )

    output = await run_llm(prompt)

    if is_invalid_output(output, request.mode, request.option):
        print("⚠️ RETRYING CREATE DUE TO INVALID STRUCTURE")

        output = await run_llm(
            repair_prompt(
                original_prompt=prompt,
                bad_output=output,
                mode=request.mode,
                option=request.option,
            )
        )

    output = normalize_output(output, request.mode, request.option)

    # Increment action counter only after a successful LLM response.
    # Output storage count is incremented separately when the user saves.
    usage_tracker.increment_action(db, DEFAULT_USER_ID)

    return CreationResponse(output=output)