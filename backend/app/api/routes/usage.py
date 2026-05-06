# ============================================================
# ARC-NEXUS - USAGE API ROUTES
# File: app/api/routes/usage.py
# Version: 002 (Database-backed, server-side enforcement)
# ============================================================
# Exposes endpoints for:
#   - Reading current usage and limits (GET /api/usage)
#   - Project lifecycle management (storage count only)
#   - Output storage management (save refined / delete)
#   - Raw input storage decrement (delete)
#
# Collect, convert, and refine limits are enforced DIRECTLY
# in their action endpoints (assimilation.py, reconstruction.py,
# creation.py).  No separate reservation step is needed here.
# ============================================================

from typing import Optional

from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from sqlalchemy.orm import Session

from app.core.db import get_db
from app.core import usage as tracker
from app.core.usage import DEFAULT_USER_ID

router = APIRouter(prefix="/usage", tags=["usage"])


# ------------------------------------------------------------
# GET /api/usage
# Returns tier, limits, and all current counters.
# ------------------------------------------------------------
@router.get("")
def get_usage(db: Session = Depends(get_db)):
    return tracker.load_usage(db, DEFAULT_USER_ID)


# ------------------------------------------------------------
# POST /api/usage/project/add
# Called by the frontend before creating a project in
# localStorage.  Enforces the project limit server-side.
# ------------------------------------------------------------
@router.post("/project/add")
def add_project(db: Session = Depends(get_db)):
    error = tracker.check_and_increment_project(db, DEFAULT_USER_ID)
    if error:
        raise HTTPException(status_code=429, detail=error)
    return {"ok": True}


# ------------------------------------------------------------
# POST /api/usage/project/remove
# Called after a project is deleted.
# Frees the storage slot; does NOT refund monthly usage.
# ------------------------------------------------------------
@router.post("/project/remove")
def remove_project(db: Session = Depends(get_db)):
    tracker.decrement_project(db, DEFAULT_USER_ID)
    return {"ok": True}


# ------------------------------------------------------------
# POST /api/usage/output/add
# Called when saving a REFINED output to storage.
# (Package-creation outputs are counted in /nexis/convert.)
# ------------------------------------------------------------
@router.post("/output/add")
def add_output(db: Session = Depends(get_db)):
    error = tracker.check_and_increment_output(db, DEFAULT_USER_ID)
    if error:
        raise HTTPException(status_code=429, detail=error)
    return {"ok": True}


# ------------------------------------------------------------
# POST /api/usage/output/remove
# Called after an output is deleted.
# Frees the storage slot; does NOT refund monthly usage.
# ------------------------------------------------------------
@router.post("/output/remove")
def remove_output(db: Session = Depends(get_db)):
    tracker.decrement_output(db, DEFAULT_USER_ID)
    return {"ok": True}


# ------------------------------------------------------------
# POST /api/usage/raw-input/remove
# Called after a raw input is deleted.
# Frees the storage slot; does NOT refund monthly usage.
# ------------------------------------------------------------
@router.post("/raw-input/remove")
def remove_raw_input(db: Session = Depends(get_db)):
    tracker.decrement_raw_input(db, DEFAULT_USER_ID)
    return {"ok": True}


# ------------------------------------------------------------
# POST /api/usage/sync
# Called on workspace load and after each operation to keep
# the DB storage counters in sync with localStorage reality.
# Only storage counts are updated; monthly counters are not.
# ------------------------------------------------------------
class SyncPayload(BaseModel):
    projects: Optional[int] = None
    raw_inputs: Optional[int] = None
    outputs: Optional[int] = None
    tier: Optional[str] = None


@router.post("/sync")
def sync_usage(payload: SyncPayload, db: Session = Depends(get_db)):
    tracker.sync_storage_counts(
        db,
        DEFAULT_USER_ID,
        projects=payload.projects,
        raw_inputs=payload.raw_inputs,
        outputs=payload.outputs,
        tier=payload.tier,
    )
    return tracker.load_usage(db, DEFAULT_USER_ID)


# ------------------------------------------------------------
# GET /api/usage/convert/check
# Called once before a package run starts.
# Verifies that the user has not hit the action or output limit.
# Does NOT increment any counter — just a gate check.
# ------------------------------------------------------------
@router.get("/convert/check")
def check_convert_limits(db: Session = Depends(get_db)):
    error = tracker.check_create_limits(db, DEFAULT_USER_ID)
    if error:
        raise HTTPException(status_code=429, detail=error)
    return {"ok": True}


# ------------------------------------------------------------
# POST /api/usage/convert/complete
# Called once after all package sections succeed.
# Atomically increments the monthly action counter and the
# saved-output storage counter (one per package, not per section).
# ------------------------------------------------------------
@router.post("/convert/complete")
def complete_convert(db: Session = Depends(get_db)):
    tracker.complete_package_convert(db, DEFAULT_USER_ID)
    return {"ok": True}


# ------------------------------------------------------------
# POST /api/usage/dev/reset-monthly
# DEV/SUPPORT ONLY — resets monthly usage counters for the
# default user.  Does NOT touch storage counts (projects,
# raw inputs, outputs).
# Do NOT expose publicly to end users.
# ------------------------------------------------------------
@router.post("/dev/reset-monthly")
def dev_reset_monthly_usage(db: Session = Depends(get_db)):
    tracker.reset_monthly_usage(db, DEFAULT_USER_ID)
    return tracker.load_usage(db, DEFAULT_USER_ID)
