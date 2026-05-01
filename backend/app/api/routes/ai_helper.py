# ============================================================
# ARC-NEXUS - NEXIS GUIDE ROUTE
# File: app/api/routes/ai_helper.py
# Version: 003 (Reframed as NEXIS Guide)
# ============================================================

from fastapi import APIRouter, HTTPException
from fastapi.responses import StreamingResponse
from pydantic import BaseModel

import json
import requests

from app.ai_helper_memory import load_ai_memory, save_ai_memory
from app.ai_helper_adaptive import analyze_interaction


# ------------------------------------------------------------
# Router
# ------------------------------------------------------------
router = APIRouter(tags=["nexis-guide"])


# ------------------------------------------------------------
# Ollama Configuration
# ------------------------------------------------------------
OLLAMA_URL = "http://localhost:11434/api/chat"
MODEL_NAME = "qwen2.5:14b"


# ------------------------------------------------------------
# Request Model
# ------------------------------------------------------------
class NEXISGuideRequest(BaseModel):
    message: str


# ------------------------------------------------------------
# Build System Prompt
# ------------------------------------------------------------
def build_system_prompt(memory: dict) -> str:
    return """
You are NEXIS Guide, the built-in help system for ARC-NEXUS.

Your job:
- Answer questions about how to use NEXIS.
- Explain Collect, Understand, Create, Vision, and available presets.
- Help users choose the right preset, action, or option.
- Explain differences between options like Summary, Rewrite, Extract, Transform, and Clean.
- Keep answers practical, clear, and user-friendly.

NEXIS workflow:
- Collect: bring in text, URLs, files, or images.
- Understand: process source material using presets.
- Create: turn processed material into scripts, reports, or articles.
- Vision: analyze image content.

Understand presets:
- Student: for studying, assignments, notes, and structured learning.
- Creator: for video prep, scripts, quotes, timelines, and content planning.
- Explained: for quick understanding and plain-language clarity.
- Analysis: for deeper breakdowns, structure, patterns, and detailed review.

Understand actions:
- Summarize: shortens source material.
- Extract: pulls specific items like key points, quotes, entities, or timeline.
- Rewrite: keeps meaning but improves wording, clarity, tone, or flow.
- Transform: changes the material into another structure.
- Clean: removes filler, duplicates, or formatting problems.

Create modes:
- Script: spoken/video content.
- Report: structured factual write-up.
- Article: readable publishing-style content.

Rules:
- Only answer questions about ARC-NEXUS or NEXIS.
- Do not generate full scripts, reports, articles, essays, or unrelated content.
- If the user asks for content generation, direct them to Create.
- If the user asks for processing or understanding source material, direct them to Understand.
- If the question is unrelated to NEXIS, politely redirect back to NEXIS usage.
- Do not claim certainty where the tool only provides guidance.
- Keep responses concise unless the user asks for detail.

Default redirect:
"I can help with how to use NEXIS. For that request, use the appropriate NEXIS tool: Collect, Understand, Create, or Vision."
""".strip()


# ------------------------------------------------------------
# POST /ai-helper/respond
# Streams NEXIS Guide response from local Ollama model
# ------------------------------------------------------------
@router.post("/ai-helper/respond")
async def ai_helper_respond(payload: NEXISGuideRequest):
    user_message = payload.message.strip()

    if not user_message:
        raise HTTPException(status_code=400, detail="Message cannot be empty.")

    memory = load_ai_memory()
    memory.setdefault("history", [])

    system_prompt = build_system_prompt(memory)

    body = {
        "model": MODEL_NAME,
        "messages": [
            {"role": "system", "content": system_prompt},
            {"role": "user", "content": user_message},
        ],
        "stream": True,
    }

    try:
        ollama_response = requests.post(
            OLLAMA_URL,
            json=body,
            stream=True,
            timeout=120,
        )

        ollama_response.raise_for_status()

    except requests.exceptions.Timeout:
        raise HTTPException(status_code=504, detail="NEXIS Guide request timed out.")

    except requests.exceptions.ConnectionError:
        raise HTTPException(
            status_code=503,
            detail="Could not connect to Ollama. Make sure Ollama is running.",
        )

    except requests.exceptions.HTTPError as e:
        raise HTTPException(status_code=500, detail=f"Ollama HTTP error: {str(e)}")

    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

    def stream_generator():
        guide_reply_full = ""

        try:
            for line in ollama_response.iter_lines():
                if not line:
                    continue

                try:
                    chunk = json.loads(line.decode("utf-8"))
                    delta = chunk.get("message", {}).get("content", "")

                    if isinstance(delta, str) and delta:
                        guide_reply_full += delta
                        yield delta

                    if chunk.get("done") is True:
                        break

                except json.JSONDecodeError:
                    continue

        finally:
            if guide_reply_full.strip():
                memory["history"].append(
                    {
                        "user": user_message,
                        "assistant": guide_reply_full,
                    }
                )

                updated_memory = analyze_interaction(
                    user_message,
                    guide_reply_full,
                    memory,
                )

                if updated_memory:
                    save_ai_memory(updated_memory)
                else:
                    save_ai_memory(memory)

    return StreamingResponse(stream_generator(), media_type="text/plain")