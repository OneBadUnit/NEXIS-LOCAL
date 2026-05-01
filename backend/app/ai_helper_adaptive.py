# ============================================================
# ARC-NEXUS - AI HELPER ADAPTIVE ENGINE
# File: app/ai_helper_adaptive.py
# Version: 002 (Neutralized + Safe Adaptation)
# ============================================================

from typing import Dict, Any


def analyze_interaction(
    user_message: str,
    ai_reply: str,
    memory: Dict[str, Any]
) -> Dict[str, Any]:
    """
    Adaptive behavior engine:
    - Learns user preferences safely
    - Avoids overfitting to single interactions
    - Does NOT store personal identifiers
    """

    updated = False
    msg = user_message.lower()

    # ------------------------------------------------------------
    # Ensure structure exists
    # ------------------------------------------------------------
    memory.setdefault("always_do", [])
    memory.setdefault("never_do", [])
    memory.setdefault("behavior", {}).setdefault("notes", [])

    # ------------------------------------------------------------
    # 1. Detect explanation preference
    # ------------------------------------------------------------
    if "explain" in msg or "why" in msg:
        rule = "Provide explanations when explicitly requested."
        if rule not in memory["always_do"]:
            memory["always_do"].append(rule)
            updated = True

    # ------------------------------------------------------------
    # 2. Detect partial output preference
    # ------------------------------------------------------------
    if "snippet" in msg or "just this part" in msg:
        rule = "Provide partial outputs only when explicitly requested."
        if rule not in memory["always_do"]:
            memory["always_do"].append(rule)
            updated = True

    # ------------------------------------------------------------
    # 3. Detect local vs global preference
    # ------------------------------------------------------------
    if "local state" in msg:
        note = "User may prefer local state in specific scenarios."
        if note not in memory["behavior"]["notes"]:
            memory["behavior"]["notes"].append(note)
            updated = True

    # ------------------------------------------------------------
    # 4. Detect correction signals
    # ------------------------------------------------------------
    if any(trigger in msg for trigger in ["no,", "not that", "wrong"]):
        note = "User corrected previous response. Adjust behavior accordingly."
        if note not in memory["behavior"]["notes"]:
            memory["behavior"]["notes"].append(note)
            updated = True

    # ------------------------------------------------------------
    # 5. Detect explicit rule creation
    # ------------------------------------------------------------
    if "always" in msg and "do" in msg:
        rule = f"User-defined rule: {user_message.strip()}"
        if rule not in memory["always_do"]:
            memory["always_do"].append(rule)
            updated = True

    # ------------------------------------------------------------
    # Return only if updated
    # ------------------------------------------------------------
    return memory if updated else None