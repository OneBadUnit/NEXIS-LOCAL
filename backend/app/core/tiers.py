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

        "max_projects": 99999,
        "max_saved_raw_inputs": 99999,
        "max_saved_outputs": 99999,

        "monthly_raw_inputs": 99999,
        "monthly_actions": 99999,

        "max_file_upload_mb": 99999,
        "max_url_extracted_kb": 99999,
        "max_audio_video_minutes": 99999,
    },

    "base": {
        "label": "Core",
        "price": 9.99,

        "max_projects": 99999,
        "max_saved_raw_inputs": 99999,
        "max_saved_outputs": 99999,

        "monthly_raw_inputs": 99999,
        "monthly_actions": 99999,

        "max_file_upload_mb": 99999,
        "max_url_extracted_kb": 99999,
        "max_audio_video_minutes": 99999,
    },

    "middle": {
        "label": "Pro",
        "price": 14.99,

        "max_projects": 99999,
        "max_saved_raw_inputs": 99999,
        "max_saved_outputs": 99999,

        "monthly_raw_inputs": 99999,
        "monthly_actions": 99999,

        "max_file_upload_mb": 99999,
        "max_url_extracted_kb": 99999,
        "max_audio_video_minutes": 99999,
    },

    "high": {
        "label": "Max",
        "price": 19.99,

        "max_projects": 99999,
        "max_saved_raw_inputs": 99999,
        "max_saved_outputs": 99999,

        "monthly_raw_inputs": 99999,
        "monthly_actions": 99999,

        "max_file_upload_mb": 99999,
        "max_url_extracted_kb": 99999,
        "max_audio_video_minutes": 99999,
    },
}

# Backward-compatible alias
TIERS = PLANS


def get_tier(tier_key: str) -> dict:
    """Return plan config for the given key, falling back to free."""
    return PLANS.get(tier_key, PLANS["free"])
