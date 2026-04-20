from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from typing import Literal

from app.services.llm_service import run_llm

router = APIRouter()


# -----------------------------
# Request / Response Models
# -----------------------------

class ReconstructionRequest(BaseModel):
    text: str
    mode: Literal["summarize", "rewrite", "extract", "transform", "clean"]
    option: str


class ReconstructionResponse(BaseModel):
    output: str


# -----------------------------
# Prompt Builder
# -----------------------------

def build_prompt(text: str, mode: str, option: str) -> str:
    """
    Build a clear, minimal, instruction-first prompt
    based on mode + option.
    """

    base_instruction = "You are a precise, reliable text reconstruction engine."

    if mode == "summarize":
        if option == "Short":
            task = "Summarize the text in 1–2 sentences."
        elif option == "Medium":
            task = "Summarize the text in a single concise paragraph."
        elif option == "Long":
            task = "Summarize the text in multiple paragraphs, covering all major points."
        elif option == "Narrative":
            task = "Summarize the text as a flowing, narrative-style overview."
        elif option == "Academic":
            task = "Summarize the text in a formal, academic tone with clear structure."
        else:
            raise HTTPException(status_code=400, detail=f"Unsupported summarize option: {option}")

    elif mode == "rewrite":
        if option == "Improve Clarity":
            task = "Rewrite the text to improve clarity and readability while preserving meaning."
        elif option == "Make Concise":
            task = "Rewrite the text to be more concise while preserving key information."
        elif option == "Make Engaging":
            task = "Rewrite the text to be more engaging and smooth, without adding new facts."
        elif option == "Make Professional":
            task = "Rewrite the text in a professional, formal tone."
        elif option == "Simplify":
            task = "Rewrite the text in simpler, plain language suitable for a general audience."
        else:
            raise HTTPException(status_code=400, detail=f"Unsupported rewrite option: {option}")

    elif mode == "extract":
        if option == "Key Points":
            task = "Extract the key points from the text as a clear bullet list."
        elif option == "Entities":
            task = "Extract named entities (people, organizations, locations, dates) in a structured list."
        elif option == "Timeline":
            task = "Extract a chronological timeline of events from the text."
        elif option == "Topics / Themes":
            task = "Extract the main topics and themes from the text."
        elif option == "Quotes":
            task = "Extract notable quotes from the text."
        elif option == "JSON Structured Data":
            task = "Extract structured information from the text and output valid JSON only."
        else:
            raise HTTPException(status_code=400, detail=f"Unsupported extract option: {option}")

    elif mode == "transform":
        if option == "Into Bullet Points":
            task = "Transform the text into a clear, well-structured bullet list."
        elif option == "Into a Paragraph":
            task = "Transform the text into a single coherent paragraph."
        elif option == "Into a Study Guide":
            task = "Transform the text into a study guide with sections and bullet points."
        elif option == "Into a Table":
            task = "Transform the text into a logical table description (rows and columns) in plain text."
        elif option == "Into JSON":
            task = "Transform the text into valid JSON only, no explanation."
        elif option == "Into a Script / Dialogue":
            task = "Transform the text into a script-style dialogue between relevant speakers."
        else:
            raise HTTPException(status_code=400, detail=f"Unsupported transform option: {option}")

    elif mode == "clean":
        if option == "Remove Filler":
            task = "Remove filler words and phrases while preserving meaning."
        elif option == "Remove Timestamps":
            task = "Remove timestamps and timecodes from the text."
        elif option == "Normalize Spacing":
            task = "Normalize spacing, line breaks, and basic formatting."
        elif option == "Deduplicate":
            task = "Remove duplicate lines or repeated content."
        elif option == "Fix Formatting":
            task = "Fix basic formatting issues (spacing, line breaks, bullet consistency)."
        else:
            raise HTTPException(status_code=400, detail=f"Unsupported clean option: {option}")

    else:
        raise HTTPException(status_code=400, detail=f"Unsupported mode: {mode}")

    prompt = (
        f"{base_instruction}\n\n"
        f"{task}\n\n"
        f"Output ONLY the final result, with no extra commentary.\n\n"
        f"---\n\n"
        f"Text:\n{text}"
    )

    return prompt


# -----------------------------
# Route
# -----------------------------

@router.post("/reconstruct", response_model=ReconstructionResponse)
def reconstruct(request: ReconstructionRequest):
    prompt = build_prompt(request.text, request.mode, request.option)
    output = run_llm(prompt)
    return ReconstructionResponse(output=output)
