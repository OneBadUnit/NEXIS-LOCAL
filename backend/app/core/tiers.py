# ============================================================
# NEXIS - ACCOUNT TIER CONFIGURATION
# File: app/core/tiers.py
# ============================================================
# Defines plan limits for the NEXIS workflow system.
# This covers workflow usage only — not AI/token billing.
# Users supply their own local model or provider API key.
# ============================================================

TIERS: dict[str, dict] = {
    "free": {
        "name": "Free",
        "price": 0.0,
        "projects": 1,
        "saved_raw_inputs": 4,
        "saved_outputs": 4,
        "raw_inputs_per_month": 4,
        "actions_per_month": 4,
    },
    "base": {
        "name": "Base Tier",
        "price": 9.99,
        "projects": 2,
        "saved_raw_inputs": 8,
        "saved_outputs": 8,
        "raw_inputs_per_month": 8,
        "actions_per_month": 12,
    },
    "middle": {
        "name": "Middle Tier",
        "price": 14.99,
        "projects": 3,
        "saved_raw_inputs": 12,
        "saved_outputs": 12,
        "raw_inputs_per_month": 12,
        "actions_per_month": 36,
    },
    "high": {
        "name": "High Tier",
        "price": 19.99,
        "projects": 5,
        "saved_raw_inputs": 36,
        "saved_outputs": 36,
        "raw_inputs_per_month": 36,
        "actions_per_month": 108,
    },
}


def get_tier(tier_key: str) -> dict:
    """Return tier config for the given key, falling back to free."""
    return TIERS.get(tier_key, TIERS["free"])
