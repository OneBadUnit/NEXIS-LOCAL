from pydantic import BaseModel, AnyUrl
from typing import Optional
from uuid import UUID
from datetime import datetime
from app.models.source import SourceType, SourceStatus


class SourceCreate(BaseModel):
    project_id: UUID
    type: SourceType
    raw_location: str  # URL, path, or text identifier


class SourceRead(BaseModel):
    id: UUID
    project_id: UUID
    type: SourceType
    status: SourceStatus
    raw_location: str

    class Config:
        from_attributes = True
