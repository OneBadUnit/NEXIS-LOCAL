# ============================================================
# ARC-NEXUS - USAGE ENFORCEMENT
# File: app/core/usage.py
# Version: 002 (Database-backed, server-side enforcement)
# ============================================================
# All user data and counters are stored in the database.
# No local file storage.  No client-reported counts.
#
# "default" is the user_id used in the single-user phase.
# When authentication is added, replace it with the
# authenticated user ID.
#
# Rules enforced here:
#   - Deleting items frees stored counts only.
#   - Deleting NEVER reduces monthly usage counters.
#   - Monthly counters reset after 30 days.
#   - All limit checks and increments are committed atomically.
# ============================================================

from datetime import date
from typing import Optional

from sqlalchemy.orm import Session

from app.models.account import UserAccount
from app.core.tiers import get_tier


DEFAULT_USER_ID = "default"


# ------------------------------------------------------------
# Internal helpers
# ------------------------------------------------------------

def _get_or_create(db: Session, user_id: str) -> UserAccount:
    """Return the account row, creating it if it does not exist."""
    account = db.get(UserAccount, user_id)
    if account is None:
        account = UserAccount(
            user_id=user_id,
            billing_cycle_start=date.today().isoformat(),
        )
        db.add(account)
        db.flush()
    return account


def _maybe_reset_monthly(account: UserAccount) -> None:
    """Reset monthly counters when 30 days have elapsed."""
    today = date.today()

    if not account.billing_cycle_start:
        account.billing_cycle_start = today.isoformat()
        account.raw_inputs_this_month = 0
        account.actions_this_month = 0
        return

    cycle_start = date.fromisoformat(account.billing_cycle_start)
    if (today - cycle_start).days >= 30:
        account.billing_cycle_start = today.isoformat()
        account.raw_inputs_this_month = 0
        account.actions_this_month = 0


# ------------------------------------------------------------
# Read
# ------------------------------------------------------------

def load_usage(db: Session, user_id: str = DEFAULT_USER_ID) -> dict:
    """Return a snapshot of usage and limits for the given user."""
    account = _get_or_create(db, user_id)
    _maybe_reset_monthly(account)
    db.commit()

    limits = get_tier(account.tier)
    return {
        "tier": account.tier,
        "tier_name": limits["label"],
        "limits": limits,
        "current": {
            "projects": account.project_count,
            "raw_inputs": account.raw_input_count,
            "outputs": account.output_count,
            "raw_inputs_this_month": account.raw_inputs_this_month,
            "actions_this_month": account.actions_this_month,
        },
        "billing_cycle_start": account.billing_cycle_start,
    }


# ------------------------------------------------------------
# Atomic check + increment
# Returns None on success; an error message string on failure.
# ------------------------------------------------------------

def check_and_increment_project(
    db: Session, user_id: str = DEFAULT_USER_ID
) -> Optional[str]:
    account = _get_or_create(db, user_id)
    limits = get_tier(account.tier)

    if account.project_count >= limits["max_projects"]:
        return (
            f"Project limit reached "
            f"({account.project_count}/{limits['max_projects']}). "
            "Delete a project or upgrade your plan."
        )

    account.project_count += 1
    db.commit()
    return None


def check_and_increment_raw_input(
    db: Session, user_id: str = DEFAULT_USER_ID
) -> Optional[str]:
    """Checks both storage and monthly raw input limits."""
    account = _get_or_create(db, user_id)
    _maybe_reset_monthly(account)
    limits = get_tier(account.tier)

    if account.raw_input_count >= limits["max_saved_raw_inputs"]:
        db.rollback()
        return (
            f"Saved raw input limit reached "
            f"({account.raw_input_count}/{limits['max_saved_raw_inputs']}). "
            "Delete a raw input or upgrade your plan."
        )

    if account.raw_inputs_this_month >= limits["monthly_raw_inputs"]:
        db.rollback()
        return (
            f"Monthly raw input limit reached "
            f"({account.raw_inputs_this_month}/{limits['monthly_raw_inputs']}). "
            "Resets next billing cycle."
        )

    account.raw_input_count += 1
    account.raw_inputs_this_month += 1
    db.commit()
    return None


def check_and_increment_convert(
    db: Session, user_id: str = DEFAULT_USER_ID
) -> Optional[str]:
    """
    Checks action limit and output storage limit for a package creation.
    Increments both action counter and output_count if allowed.
    """
    account = _get_or_create(db, user_id)
    _maybe_reset_monthly(account)
    limits = get_tier(account.tier)

    if account.actions_this_month >= limits["monthly_actions"]:
        db.rollback()
        return (
            f"Monthly action limit reached "
            f"({account.actions_this_month}/{limits['monthly_actions']}). "
            "Resets next billing cycle."
        )

    if account.output_count >= limits["max_saved_outputs"]:
        db.rollback()
        return (
            f"Saved output limit reached "
            f"({account.output_count}/{limits['max_saved_outputs']}). "
            "Delete an output or upgrade your plan."
        )

    account.actions_this_month += 1
    account.output_count += 1
    db.commit()
    return None


def check_and_increment_action(
    db: Session, user_id: str = DEFAULT_USER_ID
) -> Optional[str]:
    """
    Checks and increments the monthly action counter only.
    Used for refine (output is saved separately).
    """
    account = _get_or_create(db, user_id)
    _maybe_reset_monthly(account)
    limits = get_tier(account.tier)

    if account.actions_this_month >= limits["monthly_actions"]:
        db.rollback()
        return (
            f"Monthly action limit reached "
            f"({account.actions_this_month}/{limits['monthly_actions']}). "
            "Resets next billing cycle."
        )

    account.actions_this_month += 1
    db.commit()
    return None


def check_and_increment_output(
    db: Session, user_id: str = DEFAULT_USER_ID
) -> Optional[str]:
    """
    Checks and increments output_count.
    Used when saving a refined output.
    """
    account = _get_or_create(db, user_id)
    limits = get_tier(account.tier)

    if account.output_count >= limits["max_saved_outputs"]:
        db.rollback()
        return (
            f"Saved output limit reached "
            f"({account.output_count}/{limits['max_saved_outputs']}). "
            "Delete an output or upgrade your plan."
        )

    account.output_count += 1
    db.commit()
    return None


# ------------------------------------------------------------
# Decrement helpers (storage freed on delete; no monthly refund)
# ------------------------------------------------------------

def decrement_project(db: Session, user_id: str = DEFAULT_USER_ID) -> None:
    account = _get_or_create(db, user_id)
    account.project_count = max(0, account.project_count - 1)
    db.commit()


def decrement_raw_input(db: Session, user_id: str = DEFAULT_USER_ID) -> None:
    account = _get_or_create(db, user_id)
    account.raw_input_count = max(0, account.raw_input_count - 1)
    db.commit()


def decrement_output(db: Session, user_id: str = DEFAULT_USER_ID) -> None:
    account = _get_or_create(db, user_id)
    account.output_count = max(0, account.output_count - 1)
    db.commit()


# ------------------------------------------------------------
# Sync helpers
# Sets storage counts to the exact values reported by the
# frontend.  Used on workspace load to correct any drift
# between localStorage and the DB counters.
# Monthly usage counters are NOT modified here.
# ------------------------------------------------------------

def sync_storage_counts(
    db: Session,
    user_id: str = DEFAULT_USER_ID,
    *,
    projects: Optional[int] = None,
    raw_inputs: Optional[int] = None,
    outputs: Optional[int] = None,
    tier: Optional[str] = None,
) -> None:
    from app.core.tiers import PLANS  # local import to avoid circular ref
    account = _get_or_create(db, user_id)
    if projects is not None:
        account.project_count = max(0, projects)
    if raw_inputs is not None:
        account.raw_input_count = max(0, raw_inputs)
    if outputs is not None:
        account.output_count = max(0, outputs)
    # Update tier from Supabase profile when provided and valid
    if tier is not None and tier in PLANS:
        account.tier = tier
    db.commit()


# ------------------------------------------------------------
# Manual monthly reset (dev/support only)
# Resets ONLY monthly counters.
# Storage counts (projects, raw_inputs, outputs) are NOT touched.
# Use for development or manual support resets — not exposed publicly.
# ------------------------------------------------------------

def reset_monthly_usage(db: Session, user_id: str = DEFAULT_USER_ID) -> None:
    """Reset monthly counters only. Does NOT affect storage counts."""
    account = _get_or_create(db, user_id)
    account.raw_inputs_this_month = 0
    account.actions_this_month = 0
    account.billing_cycle_start = date.today().isoformat()
    db.commit()


# ------------------------------------------------------------
# Two-phase helpers: check-only, then increment-only.
# This separates the gate check from the commit so monthly
# counters are only incremented after a successful operation.
# ------------------------------------------------------------

def check_raw_input_limits(
    db: Session, user_id: str = DEFAULT_USER_ID
) -> Optional[str]:
    """
    Check raw input storage and monthly limits without modifying counters.
    Handles monthly reset.  Returns an error string on failure, None on pass.
    """
    account = _get_or_create(db, user_id)
    _maybe_reset_monthly(account)
    db.commit()
    limits = get_tier(account.tier)

    if account.raw_input_count >= limits["max_saved_raw_inputs"]:
        return (
            f"Saved raw input limit reached "
            f"({account.raw_input_count}/{limits['max_saved_raw_inputs']}). "
            "Delete a raw input or upgrade your plan."
        )

    if account.raw_inputs_this_month >= limits["monthly_raw_inputs"]:
        return (
            f"Monthly raw input limit reached "
            f"({account.raw_inputs_this_month}/{limits['monthly_raw_inputs']}). "
            "Resets next billing cycle."
        )

    return None


def increment_raw_input(
    db: Session, user_id: str = DEFAULT_USER_ID
) -> None:
    """
    Increment both the storage count and monthly counter after a raw input
    is successfully saved.  Call only after extraction succeeds.
    """
    account = _get_or_create(db, user_id)
    account.raw_input_count += 1
    account.raw_inputs_this_month += 1
    db.commit()


def check_create_limits(
    db: Session, user_id: str = DEFAULT_USER_ID
) -> Optional[str]:
    """
    Check the monthly action limit AND saved-output storage limit before
    running the LLM.  Returns an error string on failure, None on pass.

    Handles monthly reset.  Does NOT increment any counter.
    Call increment_action (and increment_output_count for convert) after
    the LLM returns successfully.
    """
    account = _get_or_create(db, user_id)
    _maybe_reset_monthly(account)
    db.commit()
    limits = get_tier(account.tier)

    if account.actions_this_month >= limits["monthly_actions"]:
        return (
            f"Monthly action limit reached "
            f"({account.actions_this_month}/{limits['monthly_actions']}). "
            "Resets next billing cycle."
        )

    if account.output_count >= limits["max_saved_outputs"]:
        return (
            f"Saved output limit reached "
            f"({account.output_count}/{limits['max_saved_outputs']}). "
            "Delete an output or upgrade your plan."
        )

    return None


def increment_action(
    db: Session, user_id: str = DEFAULT_USER_ID
) -> None:
    """Increment the monthly action counter after a successful LLM run."""
    account = _get_or_create(db, user_id)
    account.actions_this_month += 1
    db.commit()


def increment_output_count(
    db: Session, user_id: str = DEFAULT_USER_ID
) -> None:
    """Increment the saved-output storage counter (used by convert)."""
    account = _get_or_create(db, user_id)
    account.output_count += 1
    db.commit()


# ------------------------------------------------------------
# Media / content size checks
# These enforce the type-specific ingestion limits that live
# in tiers.py (max_file_upload_mb, max_url_extracted_kb,
# max_audio_video_minutes).  Call before processing; do NOT
# increment any usage counter here.
# ------------------------------------------------------------

def check_file_upload_size(
    db: Session, file_size_mb: float, user_id: str = DEFAULT_USER_ID
) -> Optional[str]:
    """Return an error string if file_size_mb exceeds the plan limit."""
    account = _get_or_create(db, user_id)
    limits = get_tier(account.tier)
    max_mb = limits["max_file_upload_mb"]
    if file_size_mb > max_mb:
        return (
            f"File size ({file_size_mb:.1f} MB) exceeds your plan limit "
            f"({max_mb} MB). Compress the file or upgrade your plan."
        )
    return None


def check_url_content_size(
    db: Session, content_kb: float, user_id: str = DEFAULT_USER_ID
) -> Optional[str]:
    """Return an error string if extracted URL content exceeds the plan limit."""
    account = _get_or_create(db, user_id)
    limits = get_tier(account.tier)
    max_kb = limits["max_url_extracted_kb"]
    if content_kb > max_kb:
        return (
            f"Extracted content ({content_kb:.0f} KB) exceeds your plan limit "
            f"({max_kb} KB). Try a shorter article or upgrade your plan."
        )
    return None


def check_audio_video_duration(
    db: Session, duration_minutes: float, user_id: str = DEFAULT_USER_ID
) -> Optional[str]:
    """Return an error string if media duration exceeds the plan limit."""
    account = _get_or_create(db, user_id)
    limits = get_tier(account.tier)
    max_min = limits["max_audio_video_minutes"]
    if duration_minutes > max_min:
        return (
            f"Media duration ({duration_minutes:.1f} min) exceeds your plan limit "
            f"({max_min} min). Trim the file or upgrade your plan."
        )
    return None


# ------------------------------------------------------------
# Package-level convert helpers
# Limit check is called once before the package run starts.
# Completion is called once after all sections succeed.
# This ensures one package run = one action + one output slot.
# ------------------------------------------------------------

def complete_package_convert(
    db: Session, user_id: str = DEFAULT_USER_ID
) -> None:
    """
    Atomically increment the monthly action counter and the saved-output
    storage counter after a successful package run.
    Called once per package, never once per section.
    """
    account = _get_or_create(db, user_id)
    account.actions_this_month += 1
    account.output_count += 1
    db.commit()
