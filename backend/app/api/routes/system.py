# ============================================================
# ARC-NEXUS - SYSTEM CHECK API
# File: app/api/routes/system.py
# Version: 002 (Model Alignment + Safer Diagnostics)
# ============================================================

from fastapi import APIRouter
import os
import subprocess
import shutil
import json


# ------------------------------------------------------------
# Router Configuration
# ------------------------------------------------------------
router = APIRouter(tags=["system"])


# ------------------------------------------------------------
# Paths & Constants
# ------------------------------------------------------------
CONFIG_PATH = os.path.expanduser("~/.arc_nexus/config.json")

# Must match the models currently used by services:
# - app/services/llm_service.py
# - app/services/vision_service.py
REQUIRED_MODELS = [
    "llama3.1:8b",
    "llava:34b",
]


# ------------------------------------------------------------
# Safe Command Helper
# ------------------------------------------------------------
def run_command(command: list[str]) -> str:
    try:
        return subprocess.check_output(
            command,
            stderr=subprocess.STDOUT,
            timeout=20,
        ).decode(errors="ignore")
    except Exception:
        return ""


# ------------------------------------------------------------
# Check Functions
# ------------------------------------------------------------
def check_ollama_installed() -> bool:
    return shutil.which("ollama") is not None


def check_ollama_running() -> bool:
    if not check_ollama_installed():
        return False

    output = run_command(["ollama", "ps"])
    return bool(output)


def get_available_models() -> list[str]:
    if not check_ollama_installed():
        return []

    output = run_command(["ollama", "list"])

    if not output:
        return []

    return output.split()


def check_models_available() -> bool:
    available_text = " ".join(get_available_models())
    return all(model in available_text for model in REQUIRED_MODELS)


def check_config_ready() -> bool:
    return os.path.exists(CONFIG_PATH)


# ------------------------------------------------------------
# GET /api/system/check
# ------------------------------------------------------------
@router.get("/check")
def system_check():
    available_models = get_available_models()

    return {
        "ollama": {
            "installed": check_ollama_installed(),
            "running": check_ollama_running(),
        },
        "models": {
            "required": REQUIRED_MODELS,
            "available": available_models,
            "ready": check_models_available(),
        },
        "config": {
            "path": CONFIG_PATH,
            "isReady": check_config_ready(),
        },
    }


# ------------------------------------------------------------
# POST /api/system/fix/config
# ------------------------------------------------------------
@router.post("/fix/config")
def fix_config():
    os.makedirs(os.path.dirname(CONFIG_PATH), exist_ok=True)

    default_config = {
        "initialized": True,
        "version": 2,
        "required_models": REQUIRED_MODELS,
    }

    with open(CONFIG_PATH, "w", encoding="utf-8") as f:
        json.dump(default_config, f, indent=2)

    return {
        "success": True,
        "configCreated": True,
        "path": CONFIG_PATH,
    }


# ------------------------------------------------------------
# POST /api/system/fix/models
# ------------------------------------------------------------
@router.post("/fix/models")
def fix_models():
    pulled = []
    failed = []

    if not check_ollama_installed():
        return {
            "success": False,
            "error": "Ollama is not installed or not on PATH.",
            "modelsPulled": pulled,
            "modelsFailed": REQUIRED_MODELS,
        }

    for model in REQUIRED_MODELS:
        try:
            subprocess.check_call(["ollama", "pull", model])
            pulled.append(model)
        except Exception:
            failed.append(model)

    return {
        "success": len(failed) == 0,
        "modelsPulled": pulled,
        "modelsFailed": failed,
    }