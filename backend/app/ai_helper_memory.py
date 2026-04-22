import json
from pathlib import Path
from typing import Any, Dict

MEMORY_PATH = Path(__file__).parent / "ai_helper_memory.json"


def load_ai_memory() -> Dict[str, Any]:
    if not MEMORY_PATH.exists():
        # Initialize with an empty structure if missing
        default = {
            "rules": [],
            "preferences": {},
            "never_do": [],
            "always_do": [],
            "behavior": {"mode": "adaptive", "notes": []},
            "history": [],
        }
        MEMORY_PATH.write_text(json.dumps(default, indent=2), encoding="utf-8")
        return default

    with MEMORY_PATH.open("r", encoding="utf-8") as f:
        return json.load(f)


def save_ai_memory(memory: Dict[str, Any]) -> None:
    MEMORY_PATH.write_text(json.dumps(memory, indent=2), encoding="utf-8")
