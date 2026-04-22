# ============================================================
# ARC‑NEXUS LLM SERVICE (Ollama Backend)
# Streaming-safe version (prevents hangs)
# ============================================================

import requests
import asyncio
import json
from functools import partial

LLM_URL = "http://localhost:11434/api/generate"
DEFAULT_MODEL = "llama3.1:8b"

def _run_llm_sync(prompt: str, model: str = DEFAULT_MODEL) -> str:
    payload = {
        "model": model,
        "prompt": prompt,
        "stream": True
    }

    try:
        response = requests.post(LLM_URL, json=payload, stream=True, timeout=30)

        output = ""

        for line in response.iter_lines():
            if not line:
                continue
            try:
                data = json.loads(line.decode("utf-8"))
                chunk = data.get("response", "")
                if isinstance(chunk, str):
                    output += chunk
            except Exception as e:
                print("LLM stream decode error:", e)
                continue

        return output.strip()

    except requests.exceptions.Timeout:
        return "[LLM ERROR] Request to Ollama timed out."

    except Exception as e:
        return f"[LLM ERROR] {str(e)}"


async def run_llm(prompt: str, model: str = DEFAULT_MODEL) -> str:
    loop = asyncio.get_event_loop()
    return await loop.run_in_executor(
        None,
        partial(_run_llm_sync, prompt, model)
    )
