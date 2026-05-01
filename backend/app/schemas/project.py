# ============================================================
# ARC-NEXUS - PROJECT SCHEMAS
# File: app/schemas/project.py
# Version: 002 (Consistency + Future Safety)
# ============================================================

from pydantic import BaseModel
from typing import Optional, Dict, Any
from uuid import UUID
from datetime import datetime


# ------------------------------------------------------------
# ProjectCreate
# ------------------------------------------------------------
class ProjectCreate(BaseModel):
    name: str
    settings: Optional[Dict[str, Any]] = None


# ------------------------------------------------------------
# ProjectRead
# ------------------------------------------------------------
class ProjectRead(BaseModel):
    id: UUID
    name: str
    settings: Optional[Dict[str, Any]] = None
    created_at: datetime

    class Config:
        from_attributes = True