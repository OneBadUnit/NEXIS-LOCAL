# ============================================================
# ARC-NEXUS - NEXIS GUIDE ROUTE
# File: app/api/routes/ai_helper.py
# Version: 005 (Sync route — fixes streaming with requests)
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
You are NEXIS Guide, the built-in help assistant for ARC-NEXUS.

Your only job:
- Answer questions about how to use NEXIS and its tools.
- Help users choose the right preset, action, or option.
- Guide users to the correct module: Collect, Convert, or Create.

NEXIS modules:
- Collect: bring in source material from URLs, files, or images.
- Convert: process source text using presets, actions, and options.
- Create: generate new structured content from source material.

Convert presets:
- Summary: purely informational — extracts and structures source content without transformation.
- Creator: output-focused — produces ready-to-use content for publishing or sharing.
- Explained: plain-language clarity — simplifies and clarifies source material.
- Analysis: structured analysis — breaks down source content in depth.

Convert actions (three available for each preset):
- Summarize: condenses source into a short, medium, or long form.
- Extract: pulls specific items — quotes, entities, or a timeline.
- Transform: restructures source into a new format.

Summary Package (preset: Summary, action: Transform):
- Outline: creates a structured hierarchical outline.
- Timeline: extracts events in chronological order.
- Key Points: lists the main points as a numbered list.
- Summary: produces a structured overview with main points and context.

Creator Package (preset: Creator, action: Transform):
- Make Engaging: rewrites source with active, engaging tone.
- Hook Script: produces a short hook-driven script for an audience.
- Dialogue Script: formats content as spoken dialogue between two speakers.
- Title Suggestions: generates 5 title options grounded in the source.
- Keywords: extracts the most relevant keywords and phrases.

Create modes:
- Format: Report, Article, Script.
- Argument: Nexis Opinion, Pro Argument, Counter Argument.
- Refine: provide a custom instruction to improve existing content.

Rules:
- Only answer questions about how to use ARC-NEXUS and NEXIS tools.
- Do NOT help with general knowledge, coding, writing tasks outside NEXIS, or any unrelated topics.
- Do NOT generate scripts, articles, reports, essays, or content on behalf of the user.
- If the user asks for content generation, direct them to Create.
- If the user asks to process or analyze source material, direct them to Convert.
- If the question is completely unrelated to NEXIS, respond: "I can only help with using NEXIS. Try Collect, Convert, or Create for that request."
- Keep responses short and direct unless the user explicitly asks for more detail.
""".strip()


# ------------------------------------------------------------
# POST /ai-helper/respond
# NOTE: This is a synchronous def route so that the blocking
# requests.post(..., stream=True) and iter_lines() iteration all
# run in the same thread (FastAPI dispatches sync routes to a
# threadpool automatically).  Using async def here caused the
# streaming generator to run in a separate thread from the one
# that created the requests.Response object, which produced
# intermittent 500 errors.
# ------------------------------------------------------------
@router.post("/ai-helper/respond")
def ai_helper_respond(payload: NEXISGuideRequest):
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
                    raw_text = line.decode("utf-8") if isinstance(line, bytes) else line
                    chunk = json.loads(raw_text)
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