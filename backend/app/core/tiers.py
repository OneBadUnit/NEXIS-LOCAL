# ============================================================
# NEXIS - ACCOUNT PLAN CONFIGURATION
# File: app/core/tiers.py
# ============================================================
# Single source of truth for all plan limits.
# This covers workflow usage only — not AI/token billing.
# Users supply their own local model or provider API key.
#
# Field definitions:
#   label                    — display name
#   price                    — monthly price in USD
#   max_projects             — max concurrently stored projects
#   max_saved_raw_inputs     — max stored raw input items
#   max_saved_outputs        — max stored output items (creates + refines)
#   monthly_raw_inputs       — raw inputs allowed per billing cycle
#   monthly_actions          — creates + refines allowed per billing cycle
#   max_file_upload_mb       — max uploaded file size in megabytes
#   max_url_extracted_kb     — max extracted URL content size in kilobytes
#   max_audio_video_minutes  — max audio/video duration in minutes
# ============================================================

PLANS: dict[str, dict] = {
    "free": {
        "label": "Free",
        "price": 0,

        "max_projects": 1,
        "max_saved_raw_inputs": 4,
        "max_saved_outputs": 4,

        "monthly_raw_inputs": 4,
        "monthly_actions": 4,

        "max_file_upload_mb": 5,
        "max_url_extracted_kb": 100,
        "max_audio_video_minutes": 5,
    },

    "base": {
        "label": "Base",
        "price": 9.99,

        "max_projects": 2,
        "max_saved_raw_inputs": 8,
        "max_saved_outputs": 8,

        "monthly_raw_inputs": 8,
        "monthly_actions": 12,

        "max_file_upload_mb": 10,
        "max_url_extracted_kb": 250,
        "max_audio_video_minutes": 15,
    },

    "middle": {
        "label": "Middle",
        "price": 14.99,

        "max_projects": 3,
        "max_saved_raw_inputs": 12,
        "max_saved_outputs": 12,

        "monthly_raw_inputs": 12,
        "monthly_actions": 36,

        "max_file_upload_mb": 15,
        "max_url_extracted_kb": 500,
        "max_audio_video_minutes": 30,
    },

    "high": {
        "label": "High",
        "price": 19.99,

        "max_projects": 5,
        "max_saved_raw_inputs": 36,
        "max_saved_outputs": 36,

        "monthly_raw_inputs": 36,
        "monthly_actions": 108,

        "max_file_upload_mb": 25,
        "max_url_extracted_kb": 1024,
        "max_audio_video_minutes": 60,
    },
}

# Backward-compatible alias
TIERS = PLANS


def get_tier(tier_key: str) -> dict:
    """Return plan config for the given key, falling back to free."""
    return PLANS.get(tier_key, PLANS["free"])
