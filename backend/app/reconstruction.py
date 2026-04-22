# ============================================================
# RECONSTRUCTION MODULE (Backend)
# Handles text transformation tasks such as summarization,
# rewriting, extraction, cleaning, and structural conversion.
# Builds a precise instruction-first prompt and sends it to
# the local LLM via run_llm(). Returns clean output only.
# ============================================================

from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from typing import Literal
from app.services.llm_service import run_llm

# ------------------------------------------------------------
# Router Configuration
# ------------------------------------------------------------
router = APIRouter(tags=["reconstruction"])

# ------------------------------------------------------------
# Request / Response Models
# ------------------------------------------------------------
class ReconstructionRequest(BaseModel):
    text: str
    mode: Literal["summarize", "rewrite", "extract", "transform", "clean"]
    option: str


class ReconstructionResponse(BaseModel):
    output: str


# ------------------------------------------------------------
# Input Sanitizer
# ------------------------------------------------------------
def sanitize(text: str) -> str:
    return (
        text.replace("\u0000", "")
            .replace("\r", "")
            .replace("```", "")
            .strip()
    )


# ------------------------------------------------------------
# Prompt Builder
# ------------------------------------------------------------
def build_prompt(text: str, mode: str, option: str) -> str:
    base_instruction = "You are a precise, reliable text reconstruction engine."

    # ============================================================
    # SUMMARIZATION MODES
    # ============================================================
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

    # ============================================================
    # REWRITE MODES
    # ============================================================
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

    # ============================================================
    # EXTRACTION MODES
    # ============================================================
    elif mode == "extract":

        # ------------------------------
        # STRICT QUOTES MODE
        # ------------------------------
        normalized = option.strip().lower()
        if normalized in ["quotes", "quote", "extract quotes", "quote(s)"]:
            return (
                "You are a STRICT quote extractor.\n\n"
                "Your job is to scan the ORIGINAL SOURCE TEXT and return ONLY literal, direct quotes.\n\n"
                "A \"literal quote\" means:\n"
                "- text enclosed in double quotes: \"...\"\n"
                "- text enclosed in single quotes: '...'\n"
                "- Markdown blockquotes beginning with \">\"\n"
                "- indented quote blocks\n"
                "- lines that begin or end with quotation marks\n\n"
                "RULES:\n"
                "1. Do NOT rewrite, summarize, paraphrase, or interpret the text.\n"
                "2. Do NOT extract “important lines,” “representative statements,” or “key points.”\n"
                "3. Do NOT generate outlines, bullets, or summaries unless the original text contains them INSIDE a quoted block.\n"
                "4. Do NOT add commentary, explanations, or concluding paragraphs.\n"
                "5. Do NOT fabricate quotes or infer what “should” be quoted.\n"
                "6. Maintain the original order of appearance.\n"
                "7. Preserve the exact wording, punctuation, and formatting of each quote.\n\n"
                "IF NO LITERAL QUOTES ARE FOUND:\n"
                "Return EXACTLY the following:\n\n"
                "No direct quotes were found in the source material.\n\n"
                "You may want to try:\n"
                "• Narrative Summary\n"
                "• Key Points Extraction\n"
                "• Topic Breakdown\n"
                "• Rewrite for Clarity\n\n"
                "OUTPUT FORMAT:\n"
                "- If quotes exist: return them as a simple list, one quote per line.\n"
                "- If no quotes exist: return the null-response block above.\n\n"
                f"Text:\n{text}"
            )

        # ------------------------------
        # OTHER EXTRACTION MODES
        # ------------------------------
        if option == "Key Points":
            task = "Extract the key points from the text as a clear bullet list."
        elif option == "Entities":
            task = "Extract named entities (people, organizations, locations, dates) in a structured list."
        elif option == "Timeline":
            task = "Extract a chronological timeline of events from the text."
        elif option in ["Topics and Themes", "Topics / Themes", "Topics & Themes"]:
            task = "Extract the main topics and themes from the text."
        elif option == "JSON Structured Data":
            task = "Extract structured information from the text and output valid JSON only."
        else:
            raise HTTPException(status_code=400, detail=f"Unsupported extract option: {option}")

    # ============================================================
    # TRANSFORM MODES
    # ============================================================
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

    # ============================================================
    # CLEANING MODES
    # ============================================================
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

    # ============================================================
    # DEFAULT PROMPT BUILDER
    # ============================================================
    prompt = (
        f"{base_instruction}\n\n"
        f"{task}\n\n"
        f"Output ONLY the final result, with no extra commentary.\n\n"
        f"---\n\n"
        f"Text:\n{text}"
    )

    return prompt


# ------------------------------------------------------------
# POST /reconstruction/reconstruct
# ------------------------------------------------------------
@router.post("/reconstruct", response_model=ReconstructionResponse)
async def reconstruct(request: ReconstructionRequest):
    clean_text = sanitize(request.text)
    prompt = build_prompt(clean_text, request.mode, request.option)
    output = await run_llm(prompt)
    return ReconstructionResponse(output=output)


# ------------------------------------------------------------
# POST /reconstruction/refine
# ------------------------------------------------------------
class RefinementRequest(BaseModel):
    text: str
    instruction: str


class RefinementResponse(BaseModel):
    refinedText: str


@router.post("/refine", response_model=RefinementResponse)
async def refine(request: RefinementRequest):
    clean_text = sanitize(request.text)
    clean_instruction = sanitize(request.instruction)

    prompt = (
        "You are a precise text‑refinement engine.\n\n"
        "Apply the user's refinement instruction to the provided text.\n"
        "Do NOT rewrite unrelated sections.\n"
        "Do NOT add commentary.\n"
        "Output ONLY the refined text.\n\n"
        f"Instruction:\n{clean_instruction}\n\n"
        f"---\n\n"
        f"Text:\n{clean_text}"
    )

    output = await run_llm(prompt)
    return RefinementResponse(refinedText=output)
