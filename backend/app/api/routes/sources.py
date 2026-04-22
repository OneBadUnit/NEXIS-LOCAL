# ============================================================
# SOURCES API
# Handles creation and retrieval of Source objects. Sources
# represent ingested items (URL, file, text, etc.) associated
# with a Project and tracked through the assimilation pipeline.
# ============================================================

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List
from uuid import UUID

from app.core.db import SessionLocal
from app.models.source import Source, SourceStatus
from app.schemas.source import SourceCreate, SourceRead


# ------------------------------------------------------------
# Router Configuration
# ------------------------------------------------------------
router = APIRouter(
    prefix="/sources",
    tags=["sources"]
)


# ------------------------------------------------------------
# Database Dependency
# Creates a session per request and ensures cleanup.
# ------------------------------------------------------------
def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


# ------------------------------------------------------------
# POST /sources
# Create a new source for a project.
# ------------------------------------------------------------
@router.post("/", response_model=SourceRead)
def create_source(payload: SourceCreate, db: Session = Depends(get_db)):
    source = Source(
        project_id=payload.project_id,
        type=payload.type,
        raw_location=payload.raw_location,
    )
    db.add(source)
    db.commit()
    db.refresh(source)
    return source


# ------------------------------------------------------------
# GET /sources/project/{project_id}
# List all sources belonging to a specific project.
# ------------------------------------------------------------
@router.get("/project/{project_id}", response_model=List[SourceRead])
def list_sources_for_project(project_id: UUID, db: Session = Depends(get_db)):
    return db.query(Source).filter(Source.project_id == project_id).all()
