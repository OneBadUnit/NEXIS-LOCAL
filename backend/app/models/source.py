# ============================================================
# ARC-NEXUS - SOURCE MODEL
# File: app/models/source.py
# Version: 002 (Optional DB + Future-Safe Enums)
# ============================================================

import uuid
import enum

from sqlalchemy import Column, String, Enum, ForeignKey
from sqlalchemy.dialects.postgresql import UUID

from app.core.db import Base


# ------------------------------------------------------------
# SourceType Enum
# ------------------------------------------------------------
class SourceType(str, enum.Enum):
    url = "url"
    file = "file"
    text = "text"


# ------------------------------------------------------------
# SourceStatus Enum
# ------------------------------------------------------------
class SourceStatus(str, enum.Enum):
    queued = "queued"
    processing = "processing"
    done = "done"
    error = "error"


# ------------------------------------------------------------
# Source ORM Model
# ------------------------------------------------------------
class Source(Base):
    __tablename__ = "sources"

    # Unique source identifier
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)

    # Parent project (optional if DB not active yet)
    project_id = Column(
        UUID(as_uuid=True),
        ForeignKey("projects.id"),
        nullable=True
    )

    # Source type
    type = Column(Enum(SourceType), nullable=False)

    # Processing status
    status = Column(Enum(SourceStatus), default=SourceStatus.queued)

    # Original reference (URL, filename, etc.)
    raw_location = Column(String, nullable=False)