from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List
from uuid import UUID

from app.core.db import SessionLocal
from app.models.source import Source, SourceStatus
from app.schemas.source import SourceCreate, SourceRead

router = APIRouter()


def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


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


@router.get("/project/{project_id}", response_model=List[SourceRead])
def list_sources_for_project(project_id: UUID, db: Session = Depends(get_db)):
    return db.query(Source).filter(Source.project_id == project_id).all()
