# ============================================================
# PROJECT SCHEMAS
# Defines the data models for creating and reading Project
# objects. Used by the Projects API and any module that needs
# to reference stored project metadata.
# ============================================================

from pydantic import BaseModel
from typing import Optional
from uuid import UUID
from datetime import datetime


# ------------------------------------------------------------
# ProjectCreate
# Used when creating a new project. Only requires a name.
# Optional settings dict allows flexible configuration.
# ------------------------------------------------------------
class ProjectCreate(BaseModel):
    name: str
    settings: Optional[dict] = None


# ------------------------------------------------------------
# ProjectRead
# Returned when reading an existing project from the database.
# from_attributes=True allows ORM objects to be converted
# directly into this schema (Pydantic v2 replacement for orm_mode).
# ------------------------------------------------------------
class ProjectRead(BaseModel):
    id: UUID
    name: str
    settings: Optional[dict]
    created_at: datetime

    class Config:
        from_attributes = True
