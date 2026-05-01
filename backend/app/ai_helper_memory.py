# ============================================================
# ARC-NEXUS - AI HELPER MEMORY
# File: app/ai_helper_memory.py
# Version: 002 (Safety + Corruption Protection)
# ============================================================

import json
from pathlib import Path
from typing import Any, Dict


# ------------------------------------------------------------
# Path
# ------------------------------------------------------------
MEMORY_PATH = Path(__file__).parent / "ai_helper_memory.json"


# ------------------------------------------------------------
# Default Structure
# ------------------------------------------------------------
def default_memory() -> Dict[str, Any]:
    return {
        "rules": [],
        "preferences": {},
        "never_do": [],
        "always_do": [],
        "behavior": {
            "mode": "adaptive",
            "notes": [],
        },
        "history": [],
    }


# ------------------------------------------------------------
# Load Memory (safe)
# ------------------------------------------------------------
def load_ai_memory() -> Dict[str, Any]:
    try:
        if not MEMORY_PATH.exists():
            memory = default_memory()
            save_ai_memory(memory)
            return memory

        with MEMORY_PATH.open("r", encoding="utf-8") as f:
            data = json.load(f)

        # Basic validation
        if not isinstance(data, dict):
            raise ValueError("Memory file corrupted")

        # Ensure required keys exist
        base = default_memory()
        for key in base:
            if key not in data:
                data[key] = base[key]

        return data

    except Exception:
        # If anything breaks, reset safely
        memory = default_memory()
        save_ai_memory(memory)
        return memory


# ------------------------------------------------------------
# Save Memory (safe)
# ------------------------------------------------------------
def save_ai_memory(memory: Dict[str, Any]) -> None:
    try:
        MEMORY_PATH.write_text(
            json.dumps(memory, indent=2),
            encoding="utf-8"
        )
    except Exception:
        # Fail silently to avoid crashing the system
        pass