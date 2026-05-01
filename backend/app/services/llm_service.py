# ============================================================
# ARC-NEXUS - LLM SERVICE
# File: app/services/llm_service.py
# Version: 003 (Ollama Non-Streaming + Prompt Fidelity)
# ============================================================

import asyncio
from functools import partial

import requests


# ------------------------------------------------------------
# Ollama Configuration
# ------------------------------------------------------------
LLM_URL = "http://localhost:11434/api/generate"
DEFAULT_MODEL = "llama3.1:8b"


# ------------------------------------------------------------
# Sync Ollama Request
# ------------------------------------------------------------
def _run_llm_sync(prompt: str, model: str = DEFAULT_MODEL) -> str:
    payload = {
        "model": model,
        "prompt": prompt,
        "stream": False,
        "options": {
            "temperature": 0.2,
            "top_p": 0.9,
        },
    }

    try:
        response = requests.post(
            LLM_URL,
            json=payload,
            timeout=180,
        )

        response.raise_for_status()

        data = response.json()
        output = data.get("response", "")

        if not isinstance(output, str):
            return "[LLM ERROR] Invalid response from Ollama."

        clean_output = output.strip()

        if not clean_output:
            return "[LLM ERROR] Empty response from Ollama."

        return clean_output

    except requests.exceptions.Timeout:
        return "[LLM ERROR] Request to Ollama timed out."

    except requests.exceptions.ConnectionError:
        return "[LLM ERROR] Could not connect to Ollama. Make sure Ollama is running."

    except requests.exceptions.HTTPError as error:
        return f"[LLM ERROR] Ollama returned HTTP error: {str(error)}"

    except Exception as error:
        return f"[LLM ERROR] {str(error)}"


# ------------------------------------------------------------
# Async Wrapper
# ------------------------------------------------------------
async def run_llm(prompt: str, model: str = DEFAULT_MODEL) -> str:
    loop = asyncio.get_event_loop()

    return await loop.run_in_executor(
        None,
        partial(_run_llm_sync, prompt, model),
    )