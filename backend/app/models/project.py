# ============================================================
# ARC-NEXUS - PROJECT MODEL
# File: app/models/project.py
# Version: 002 (Optional Database Compatibility)
# ============================================================

from datetime import datetime
import uuid

from sqlalchemy import Column, String, DateTime
from sqlalchemy.dialects.postgresql import UUID, JSONB

from app.core.db import Base


# ------------------------------------------------------------
# Project ORM Model
# ------------------------------------------------------------
class Project(Base):
    __tablename__ = "projects"

    # Unique project identifier
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)

    # Human-readable project name
    name = Column(String, nullable=False)

    # Optional project settings
    settings = Column(JSONB, nullable=True)

    # Creation timestamp
    created_at = Column(DateTime, default=datetime.utcnow)