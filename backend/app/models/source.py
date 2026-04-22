# ============================================================
# SOURCE MODEL (SQLAlchemy ORM)
# Represents an ingested source (URL, file, text, etc.) that
# belongs to a Project. Tracks ingestion type, status, and
# original location. Used by the Assimilation pipeline and
# the Sources API.
# ============================================================

from sqlalchemy import Column, String, Enum, ForeignKey
from sqlalchemy.dialects.postgresql import UUID
from app.core.db import Base
import uuid
import enum


# ------------------------------------------------------------
# SourceType Enum
# Defines the type of source being ingested.
# ------------------------------------------------------------
class SourceType(str, enum.Enum):
    url = "url"
    file = "file"
    text = "text"
    # Future expansion:
    # picture = "picture"
    # pdf = "pdf"
    # audio = "audio"


# ------------------------------------------------------------
# SourceStatus Enum
# Tracks ingestion progress for a source.
# ------------------------------------------------------------
class SourceStatus(str, enum.Enum):
    queued = "queued"
    processing = "processing"
    done = "done"
    error = "error"


# ------------------------------------------------------------
# Source ORM Model
# Represents a single ingested item associated with a Project.
# raw_location stores the original identifier (URL, filename,
# text snippet ID, etc.).
# ------------------------------------------------------------
class Source(Base):
    __tablename__ = "sources"

    # Unique source identifier
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)

    # Parent project
    project_id = Column(UUID(as_uuid=True), ForeignKey("projects.id"), nullable=False)

    # Type of source (URL, file, text, etc.)
    type = Column(Enum(SourceType), nullable=False)

    # Ingestion status
    status = Column(Enum(SourceStatus), default=SourceStatus.queued)

    # Original identifier (URL, path, filename, etc.)
    raw_location = Column(String, nullable=False)
