# ============================================================
# ARC-NEXUS - USER ACCOUNT MODEL
# File: app/models/account.py
# Version: 001 (Tier + Usage Tracking)
# ============================================================
# Stores per-user tier and usage counters.
#
# user_id: opaque string key.  "default" is used in the
#          single-user phase; swap for a real auth user ID
#          once authentication is implemented.
#
# Storage counts (reduced on delete, never by action):
#   project_count, raw_input_count, output_count
#
# Monthly counters (reset after 30 days, never on delete):
#   raw_inputs_this_month, actions_this_month
# ============================================================

from datetime import datetime
from sqlalchemy import Column, String, Integer, DateTime

from app.core.db import Base


class UserAccount(Base):
    __tablename__ = "user_accounts"

    # Unique user identifier
    user_id = Column(String, primary_key=True, nullable=False)

    # Active plan key - must match a key in app/core/tiers.py
    tier = Column(String, nullable=False, default="free")

    # ----------------------------------------------------------
    # Current storage counts
    # ----------------------------------------------------------
    project_count = Column(Integer, nullable=False, default=0)
    raw_input_count = Column(Integer, nullable=False, default=0)
    output_count = Column(Integer, nullable=False, default=0)

    # ----------------------------------------------------------
    # Monthly usage counters
    # ----------------------------------------------------------
    raw_inputs_this_month = Column(Integer, nullable=False, default=0)
    actions_this_month = Column(Integer, nullable=False, default=0)

    # ISO-format date string of current billing cycle start
    billing_cycle_start = Column(String, nullable=True)

    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
