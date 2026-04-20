from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from typing import List

from app.core.db import SessionLocal
from app.models.project import Project
from app.schemas.project import ProjectCreate, ProjectRead

router = APIRouter()


def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


@router.post("/", response_model=ProjectRead)
def create_project(payload: ProjectCreate, db: Session = Depends(get_db)):
    project = Project(name=payload.name, settings=payload.settings)
    db.add(project)
    db.commit()
    db.refresh(project)
    return project


@router.get("/", response_model=List[ProjectRead])
def list_projects(db: Session = Depends(get_db)):
    return db.query(Project).all()
