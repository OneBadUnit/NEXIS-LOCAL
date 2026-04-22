# ============================================================
# PROJECT MODEL (SQLAlchemy ORM)
# Represents a user-created Project inside ARC‑NEXUS.
# Projects act as containers for Sources, Settings, and
# generated artifacts. Stored in PostgreSQL via SQLAlchemy.
# ============================================================

from sqlalchemy import Column, String, DateTime
from sqlalchemy.dialects.postgresql import UUID, JSONB
from datetime import datetime
import uuid

from app.core.db import Base


# ------------------------------------------------------------
# Project ORM Model
# ------------------------------------------------------------
class Project(Base):
    __tablename__ = "projects"

    # Unique project identifier (UUID v4)
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)

    # Human-readable project name
    name = Column(String, nullable=False)

    # Arbitrary settings dict (JSONB for flexibility)
    settings = Column(JSONB, nullable=True)

    # Timestamp of creation
    created_at = Column(DateTime, default=datetime.utcnow)
