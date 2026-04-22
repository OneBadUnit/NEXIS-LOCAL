from typing import Dict, Any


def analyze_interaction(user_message: str, ai_reply: str, memory: Dict[str, Any]) -> Dict[str, Any]:
    """
    Adaptive behavior engine:
    - Detects when Kevin overrides a rule
    - Learns new preferences
    - Updates memory accordingly
    """

    updated = False

    # 1. Detect if Kevin explicitly asks for explanations
    if "explain" in user_message.lower() or "why" in user_message.lower():
        if "Provide explanations when Kevin asks for them." not in memory["always_do"]:
            memory["always_do"].append("Provide explanations when Kevin asks for them.")
            updated = True

    # 2. Detect if Kevin requests partial files
    if "snippet" in user_message.lower() or "just this part" in user_message.lower():
        if "Provide partial files only when Kevin explicitly requests them." not in memory["always_do"]:
            memory["always_do"].append("Provide partial files only when Kevin explicitly requests them.")
            updated = True

    # 3. Detect if Kevin overrides global-state preference
    if "local state" in user_message.lower():
        note = "Kevin occasionally prefers local state when explicitly stated."
        if note not in memory["behavior"]["notes"]:
            memory["behavior"]["notes"].append(note)
            updated = True

    # 4. Detect if Kevin corrects the helper
    if "no," in user_message.lower() or "not that" in user_message.lower():
        correction_note = f"Correction observed: '{user_message}'. Adjust future behavior."
        if correction_note not in memory["behavior"]["notes"]:
            memory["behavior"]["notes"].append(correction_note)
            updated = True

    # 5. Detect if Kevin requests a new rule
    if "always" in user_message.lower() and "do" in user_message.lower():
        memory["always_do"].append(f"User-defined rule: {user_message}")
        updated = True

    return memory if updated else None
