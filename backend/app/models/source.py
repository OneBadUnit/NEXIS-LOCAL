from sqlalchemy import Column, String, Enum, ForeignKey
from sqlalchemy.dialects.postgresql import UUID
from app.core.db import Base
import uuid
import enum


class SourceType(str, enum.Enum):
    url = "url"
    file = "file"
    text = "text"


class SourceStatus(str, enum.Enum):
    queued = "queued"
    processing = "processing"
    done = "done"
    error = "error"


class Source(Base):
    __tablename__ = "sources"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    project_id = Column(UUID(as_uuid=True), ForeignKey("projects.id"), nullable=False)
    type = Column(Enum(SourceType), nullable=False)
    status = Column(Enum(SourceStatus), default=SourceStatus.queued)
    raw_location = Column(String, nullable=False)  # URL, path, or raw text id
