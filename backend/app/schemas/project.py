from pydantic import BaseModel
from typing import Optional
from uuid import UUID
from datetime import datetime


class ProjectCreate(BaseModel):
    name: str
    settings: Optional[dict] = None


class ProjectRead(BaseModel):
    id: UUID
    name: str
    settings: Optional[dict]
    created_at: datetime

    class Config:
        from_attributes = True
