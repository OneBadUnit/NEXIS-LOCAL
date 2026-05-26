# ============================================================
# ARC-NEXUS - SYSTEM CHECK API
# File: app/api/routes/system.py
# Version: 004 (OCR diagnostics added to /check)
#
# Ollama runs on the USER's machine, not on this Render server.
# Subprocess calls to `ollama` were removed because they always
# fail silently on Render (ollama is not installed there).
# Ollama status is reported by the NEXIS Local Companion bridge
# (localhost:8765 on the user's machine), not from this API.
# ============================================================

from fastapi import APIRouter, HTTPException
import os
import json


# ------------------------------------------------------------
# Router Configuration
# ------------------------------------------------------------
router = APIRouter(tags=["system"])


# ------------------------------------------------------------
# Paths & Constants
# ------------------------------------------------------------
CONFIG_PATH = os.path.expanduser("~/.arc_nexus/config.json")


def check_config_ready() -> bool:
    return os.path.exists(CONFIG_PATH)


# ------------------------------------------------------------
# GET /api/system/check
# Ollama status is NOT reported here — it runs on the user's
# machine, not this server. Check via NEXIS Local Companion.
# ------------------------------------------------------------
@router.get("/check")
def system_check():
    from ingestion.ocr_utils import get_ocr_diagnostics
    ocr = get_ocr_diagnostics()
    return {
        "ollama": {
            "note": (
                "Ollama runs on the user's machine, not this server. "
                "Check Ollama status via the NEXIS Local Companion (localhost:8765)."
            ),
        },
        "config": {
            "path": CONFIG_PATH,
            "isReady": check_config_ready(),
        },
        "ocr": {
            "executable_found": ocr["executable_found"],
            "ocr_available": ocr["ocr_available"],
            "tesseract_path": ocr["tesseract_path"],
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
# Ollama model management is done on the user's machine.
# This endpoint cannot install or pull Ollama models from
# the Render server — Ollama is not installed here.
# ------------------------------------------------------------
@router.post("/fix/models")
def fix_models():
    raise HTTPException(
        status_code=503,
        detail=(
            "Ollama runs on your machine, not this server. "
            "Open the Ollama app and download models from there, "
            "or use the NEXIS Local Companion to manage local models."
        ),
    )


# ------------------------------------------------------------
# GET /api/system/gpu
# Reports whether CUDA/GPU is available on this machine.
# Uses app/utils/gpu_detection.py (PyTorch-based check).
# Note: this is a system-level check, separate from Ollama's
# /api/ps which reports per-model processor usage.
# ------------------------------------------------------------
@router.get("/gpu")
def gpu_status():
    from app.utils.gpu_detection import get_gpu_info

    info = get_gpu_info()
    if info.get("has_gpu_acceleration"):
        return {
            "ok": True,
            "processor": "gpu",
            "message": "GPU acceleration detected",
            "detail": info,
        }
    return {
        "ok": True,
        "processor": "cpu",
        "message": "CPU mode: supported, may be slower",
        "detail": info,
    }