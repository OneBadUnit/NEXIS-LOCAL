# ============================================================
# ARC-NEXUS - SOURCE SCHEMAS
# File: app/schemas/source.py
# Version: 002 (Optional Project + Consistency)
# ============================================================

from pydantic import BaseModel
from typing import Optional
from uuid import UUID

from app.models.source import SourceType, SourceStatus


# ------------------------------------------------------------
# SourceCreate
# ------------------------------------------------------------
class SourceCreate(BaseModel):
    project_id: Optional[UUID] = None
    type: SourceType
    raw_location: str


# ------------------------------------------------------------
# SourceRead
# ------------------------------------------------------------
class SourceRead(BaseModel):
    id: UUID
    project_id: Optional[UUID] = None
    type: SourceType
    status: SourceStatus
    raw_location: str

    class Config:
        from_attributes = True