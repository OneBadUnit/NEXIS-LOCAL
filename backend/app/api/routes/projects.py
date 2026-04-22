# ============================================================
# PROJECTS API
# Provides CRUD operations for Project objects. Projects act
# as containers for sources, settings, and generated artifacts.
# ============================================================

from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from typing import List

from app.core.db import SessionLocal
from app.models.project import Project
from app.schemas.project import ProjectCreate, ProjectRead


# ------------------------------------------------------------
# Router Configuration
# ------------------------------------------------------------
router = APIRouter(
    prefix="/projects",
    tags=["projects"]
)


# ------------------------------------------------------------
# Database Dependency
# Creates a session for each request and ensures cleanup.
# ------------------------------------------------------------
def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


# ------------------------------------------------------------
# POST /projects
# Create a new project.
# ------------------------------------------------------------
@router.post("/", response_model=ProjectRead)
def create_project(payload: ProjectCreate, db: Session = Depends(get_db)):
    project = Project(
        name=payload.name,
        settings=payload.settings
    )
    db.add(project)
    db.commit()
    db.refresh(project)
    return project


# ------------------------------------------------------------
# GET /projects
# Return all projects.
# ------------------------------------------------------------
@router.get("/", response_model=List[ProjectRead])
def list_projects(db: Session = Depends(get_db)):
    return db.query(Project).all()
