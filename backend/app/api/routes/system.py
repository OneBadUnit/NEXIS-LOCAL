# app/api/routes/system.py
from fastapi import APIRouter
import os
import subprocess
import shutil
import json

router = APIRouter()

# -----------------------------
# PATHS & CONSTANTS
# -----------------------------
CONFIG_PATH = os.path.expanduser("~/.arc_nexus/config.json")
REQUIRED_MODELS = ["llama3.2", "llama3.2:1b"]


# -----------------------------
# CHECK FUNCTIONS
# -----------------------------
def check_ollama_installed():
    """Return True if Ollama binary exists on PATH."""
    return shutil.which("ollama") is not None


def check_ollama_running():
    """Return True if 'ollama ps' executes successfully."""
    try:
        subprocess.check_output(["ollama", "ps"], stderr=subprocess.STDOUT)
        return True
    except Exception:
        return False


def check_models_available():
    """Return True if all required models appear in 'ollama list'."""
    try:
        output = subprocess.check_output(["ollama", "list"]).decode()
        return all(model in output for model in REQUIRED_MODELS)
    except Exception:
        return False


def check_config_ready():
    """Return True if ARC‑N config file exists."""
    return os.path.exists(CONFIG_PATH)


# -----------------------------
# SYSTEM CHECK ENDPOINT
# -----------------------------
@router.get("/check")
def system_check():
    return {
        "ollama": {
            "installed": check_ollama_installed(),
            "running": check_ollama_running()
        },
        "models": {
            "available": check_models_available()
        },
        "config": {
            "isReady": check_config_ready()
        }
    }


# -----------------------------
# FIX CONFIG ENDPOINT
# -----------------------------
@router.post("/fix/config")
def fix_config():
    """Create ~/.arc_nexus/config.json if missing."""
    os.makedirs(os.path.dirname(CONFIG_PATH), exist_ok=True)

    default_config = {
        "initialized": True,
        "version": 1
    }

    with open(CONFIG_PATH, "w") as f:
        json.dump(default_config, f, indent=2)

    return {"success": True, "configCreated": True}


# -----------------------------
# FIX MODELS ENDPOINT
# -----------------------------
@router.post("/fix/models")
def fix_models():
    """Pull required models using Ollama."""
    pulled = []

    for model in REQUIRED_MODELS:
        try:
            subprocess.call(["ollama", "pull", model])
            pulled.append(model)
        except Exception:
            pass

    return {"success": True, "modelsPulled": pulled}
