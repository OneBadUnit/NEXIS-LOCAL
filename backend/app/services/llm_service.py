import requests
import asyncio
from functools import partial

# ---------------------------------------------------------
# ARC‑NEXUS LLM Service (Ollama)
# ---------------------------------------------------------
# This service sends prompts to your local Ollama server.
# Make sure Ollama is running and that the model name below
# matches one from:  `ollama list`
#
# Recommended model for ARC‑NEXUS:
#   llama3.1:8b
# ---------------------------------------------------------

LLM_URL = "http://localhost:11434/api/generate"
DEFAULT_MODEL = "llama3.1:8b"   # <-- You can change this anytime


# ---------------------------------------------------------
# SYNC FUNCTION (actual HTTP call to Ollama)
# ---------------------------------------------------------
def _run_llm_sync(prompt: str, model: str = DEFAULT_MODEL) -> str:
    """
    Perform the synchronous HTTP request to Ollama.
    This function runs inside a thread when called from FastAPI.
    """

    payload = {
        "model": model,
        "prompt": prompt,
        "stream": False
    }

    try:
        response = requests.post(LLM_URL, json=payload)
        response.raise_for_status()
        data = response.json()

        # Ollama returns: { "response": "text..." }
        return data.get("response", "")

    except Exception as e:
        return f"[LLM ERROR] {str(e)}"


# ---------------------------------------------------------
# ASYNC WRAPPER (FastAPI can await this)
# ---------------------------------------------------------
async def run_llm(prompt: str, model: str = DEFAULT_MODEL) -> str:
    """
    Async wrapper so FastAPI can await the LLM call.
    This prevents blocking the event loop.
    """
    loop = asyncio.get_event_loop()
    return await loop.run_in_executor(None, partial(_run_llm_sync, prompt, model))
