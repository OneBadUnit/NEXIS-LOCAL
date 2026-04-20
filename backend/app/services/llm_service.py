import requests

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


def run_llm(prompt: str, model: str = DEFAULT_MODEL) -> str:
    """
    Send a prompt to the local Ollama model and return the response text.
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
