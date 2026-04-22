# ============================================================
# CREATION MODULE (Backend)
# Generates new text based on user instructions.
# Uses run_llm() to produce creative or structured output.
# ============================================================

from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from app.services.llm_service import run_llm

router = APIRouter(tags=["creation"])

# ------------------------------------------------------------
# Request / Response Models
# ------------------------------------------------------------
class CreationRequest(BaseModel):
    instruction: str

class CreationResponse(BaseModel):
    output: str

# ------------------------------------------------------------
# POST /creation/generate
# Sends instruction directly to LLM and returns output.
# ------------------------------------------------------------
@router.post("/generate", response_model=CreationResponse)
async def generate(request: CreationRequest):
    if not request.instruction.strip():
        raise HTTPException(status_code=400, detail="Instruction cannot be empty.")

    output = await run_llm(request.instruction)
    return CreationResponse(output=output)

@router.post("/tags")
async def generate_tags(payload: dict):
    text = payload.get("text", "")
    # call your LLM or tag generator here
    return {"tags": ["example", "tags", "go", "here"]}
