# ============================================================
# ARC-NEXUS - DATABASE CORE
# File: app/core/db.py
# Version: 002 (Disabled by Default + Safe Initialization)
# ============================================================

from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker, declarative_base

from app.core.config import settings


# ------------------------------------------------------------
# Flags
# ------------------------------------------------------------
DB_ENABLED = bool(settings.DATABASE_URL)


# ------------------------------------------------------------
# Engine (only if configured)
# ------------------------------------------------------------
engine = None
SessionLocal = None

if DB_ENABLED:
    try:
        engine = create_engine(
            settings.DATABASE_URL,
            future=True
        )

        SessionLocal = sessionmaker(
            bind=engine,
            autoflush=False,
            autocommit=False
        )

    except Exception:
        engine = None
        SessionLocal = None


# ------------------------------------------------------------
# Base (always available for models)
# ------------------------------------------------------------
Base = declarative_base()


# ------------------------------------------------------------
# Dependency Helper (optional use)
# ------------------------------------------------------------
def get_db():
    if not SessionLocal:
        raise RuntimeError("Database is not configured.")

    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()