# ============================================================
# SYSTEM CHECK API
# Provides diagnostics for local ARC‑NEXUS environment:
# - Ollama installation
# - Ollama running state
# - Required model availability
# - ARC‑NEXUS config readiness
#
# Also provides "fix" endpoints to bootstrap missing config
# and pull required models.
# ============================================================

from fastapi import APIRouter
import os
import subprocess
import shutil
import json


# ------------------------------------------------------------
# Router Configuration
# ------------------------------------------------------------
router = APIRouter(
    prefix="/system",
    tags=["system"]
)


# ------------------------------------------------------------
# PATHS & CONSTANTS
# ------------------------------------------------------------
CONFIG_PATH = os.path.expanduser("~/.arc_nexus/config.json")
REQUIRED_MODELS = ["llama3.2", "llama3.2:1b"]


# ------------------------------------------------------------
# CHECK FUNCTIONS
# ------------------------------------------------------------
def check_ollama_installed() -> bool:
    """Return True if Ollama binary exists on PATH."""
    return shutil.which("ollama") is not None


def check_ollama_running() -> bool:
    """Return True if 'ollama ps' executes successfully."""
    try:
        subprocess.check_output(["ollama", "ps"], stderr=subprocess.STDOUT)
        return True
    except Exception:
        return False


def check_models_available() -> bool:
    """Return True if all required models appear in 'ollama list'."""
    try:
        output = subprocess.check_output(["ollama", "list"]).decode()
        return all(model in output for model in REQUIRED_MODELS)
    except Exception:
        return False


def check_config_ready() -> bool:
    """Return True if ARC‑NEXUS config file exists."""
    return os.path.exists(CONFIG_PATH)


# ------------------------------------------------------------
# GET /system/check
# Returns full system diagnostic status.
# ------------------------------------------------------------
@router.get("/check")
def system_check():
    return {
        "ollama": {
            "installed": check_ollama_installed(),
            "running": check_ollama_running(),
        },
        "models": {
            "available": check_models_available(),
        },
        "config": {
            "isReady": check_config_ready(),
        },
    }


# ------------------------------------------------------------
# POST /system/fix/config
# Creates ~/.arc_nexus/config.json if missing.
# ------------------------------------------------------------
@router.post("/fix/config")
def fix_config():
    os.makedirs(os.path.dirname(CONFIG_PATH), exist_ok=True)

    default_config = {
        "initialized": True,
        "version": 1,
    }

    with open(CONFIG_PATH, "w") as f:
        json.dump(default_config, f, indent=2)

    return {"success": True, "configCreated": True}


# ------------------------------------------------------------
# POST /system/fix/models
# Pulls required models using Ollama.
# ------------------------------------------------------------
@router.post("/fix/models")
def fix_models():
    pulled = []

    for model in REQUIRED_MODELS:
        try:
            subprocess.call(["ollama", "pull", model])
            pulled.append(model)
        except Exception:
            pass

    return {"success": True, "modelsPulled": pulled}
