# ============================================================
# SOURCE SCHEMAS
# Defines the data models for creating and reading Source
# objects. A Source represents any ingested item (URL, file,
# text, etc.) associated with a Project. Used by the Sources
# API and the Assimilation pipeline.
# ============================================================

from pydantic import BaseModel
from typing import Optional
from uuid import UUID
from datetime import datetime

from app.models.source import SourceType, SourceStatus


# ------------------------------------------------------------
# SourceCreate
# Used when adding a new source to a project.
#   project_id: the owning project
#   type:       URL | file | text | picture | etc.
#   raw_location: original identifier (URL, path, filename)
# ------------------------------------------------------------
class SourceCreate(BaseModel):
    project_id: UUID
    type: SourceType
    raw_location: str  # URL, path, or text identifier


# ------------------------------------------------------------
# SourceRead
# Returned when reading an existing source from the database.
# Includes status so the frontend can track ingestion progress.
# from_attributes=True allows ORM → Pydantic conversion.
# ------------------------------------------------------------
class SourceRead(BaseModel):
    id: UUID
    project_id: UUID
    type: SourceType
    status: SourceStatus
    raw_location: str

    class Config:
        from_attributes = True
