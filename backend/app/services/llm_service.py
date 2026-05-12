# ============================================================
# ARC-NEXUS - LLM SERVICE
# File: app/services/llm_service.py
# Version: 004 (env-var URL — no hardcoded Ollama host)
#
# NEXIS is local-AI-first. Ollama runs on the USER's machine,
# not on this Render server. LLM_URL must be explicitly set
# via the OLLAMA_URL environment variable. If it is not set,
# all run_llm() calls raise HTTP 503 so the caller knows to
# route through the NEXIS Local Companion instead.
# ============================================================

import asyncio
import os
from functools import partial

import requests
from fastapi import HTTPException


# ------------------------------------------------------------
# Ollama Configuration
# LLM_URL is read from env. Empty string means "not configured".
# ------------------------------------------------------------
LLM_URL = os.environ.get("OLLAMA_URL", "")
DEFAULT_MODEL = "qwen2.5:7b"


# ------------------------------------------------------------
# Sync Ollama Request
# ------------------------------------------------------------
def _run_llm_sync(prompt: str, model: str = DEFAULT_MODEL) -> str:
    # Guard: no Ollama backend configured on this server.
    # Ollama runs on the user's machine — local generation goes
    # through the NEXIS Local Companion, not this endpoint.
    if not LLM_URL:
        raise HTTPException(
            status_code=503,
            detail=(
                "No LLM backend configured on this server. "
                "Configure a local model using the NEXIS Local Companion."
            ),
        )

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