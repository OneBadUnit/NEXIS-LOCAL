from fastapi import APIRouter, HTTPException
from fastapi.responses import StreamingResponse
from pydantic import BaseModel
import requests
import json

from app.ai_helper_memory import load_ai_memory, save_ai_memory
from app.ai_helper_adaptive import analyze_interaction

router = APIRouter()

OLLAMA_URL = "http://localhost:11434/api/chat"
MODEL_NAME = "qwen2.5:14b"


class AIHelperRequest(BaseModel):
    message: str


@router.post("/ai-helper/respond")
async def ai_helper_respond(payload: AIHelperRequest):
    user_message = payload.message.strip()

    if not user_message:
        raise HTTPException(status_code=400, detail="Message cannot be empty.")

    # Load persistent memory
    memory = load_ai_memory()
    system_prompt = build_system_prompt(memory)

    # Prepare chat request for Qwen
    body = {
        "model": MODEL_NAME,
        "messages": [
            {"role": "system", "content": system_prompt},
            {"role": "user", "content": user_message}
        ],
        "stream": True
    }

    try:
        # Stream from Ollama
        ollama_response = requests.post(OLLAMA_URL, json=body, stream=True)
        ollama_response.raise_for_status()

        def stream_generator():
            ai_reply_full = ""

            for line in ollama_response.iter_lines():
                if not line:
                    continue

                try:
                    chunk = json.loads(line.decode("utf-8"))
                    delta = chunk.get("message", {}).get("content", "")
                except:
                    delta = ""

                ai_reply_full += delta
                yield delta  # send chunk to frontend

            # Save memory AFTER full reply is complete
            memory["history"].append({"user": user_message, "assistant": ai_reply_full})

            updated_memory = analyze_interaction(user_message, ai_reply_full, memory)
            if updated_memory:
                save_ai_memory(updated_memory)
            else:
                save_ai_memory(memory)

        return StreamingResponse(stream_generator(), media_type="text/plain")

    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


def build_system_prompt(memory: dict) -> str:
    rules = "\n".join(f"- {r}" for r in memory.get("rules", []))
    always_do = "\n".join(f"- {a}" for a in memory.get("always_do", []))
    never_do = "\n".join(f"- {n}" for n in memory.get("never_do", []))
    notes = "\n".join(f"- {n}" for n in memory.get("behavior", {}).get("notes", []))

    return f"""
You are the ARC‑NEXUS Resident AI Helper.

Your behavior mode is: {memory.get("behavior", {}).get("mode", "adaptive")}

Follow these rules:
{rules}

Always do:
{always_do}

Never do:
{never_do}

Behavior notes:
{notes}

Your job:
- Assist Kevin with ARC‑NEXUS development.
- Follow his architectural preferences.
- Return complete, ready‑to‑paste files when modifying code.
- Keep responses minimal unless he asks for detail.
- Maintain consistency across sessions.
- Adapt your behavior based on his patterns.

Stay focused. No fluff. No generic AI behavior.
"""
