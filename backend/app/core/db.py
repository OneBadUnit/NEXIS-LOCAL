# ============================================================
# ARC-NEXUS - DATABASE CORE
# File: app/core/db.py
# Version: 003 (Always-on - SQLite default, PostgreSQL ready)
# ============================================================
# Defaults to a local SQLite file (nexis.db) when no
# DATABASE_URL is configured.  Set DATABASE_URL in .env to
# switch to PostgreSQL for production.
# ============================================================

from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker, declarative_base

from app.core.config import settings


# ------------------------------------------------------------
# Resolved database URL
# Falls back to SQLite so the app works out of the box.
# ------------------------------------------------------------
_DATABASE_URL = settings.DATABASE_URL or "sqlite:///./nexis.db"

# SQLite requires check_same_thread=False for multi-threaded use
_connect_args = {"check_same_thread": False} if _DATABASE_URL.startswith("sqlite") else {}

engine = create_engine(
    _DATABASE_URL,
    future=True,
    connect_args=_connect_args,
)

SessionLocal = sessionmaker(
    bind=engine,
    autoflush=False,
    autocommit=False,
)


# ------------------------------------------------------------
# Base (always available for model declarations)
# ------------------------------------------------------------
Base = declarative_base()


# ------------------------------------------------------------
# Table initialisation
# Called once at application startup.
# ------------------------------------------------------------
def init_db() -> None:
    """Create all tables that are not yet present in the database."""
    # Import every model so SQLAlchemy sees their table definitions
    from app.models import account  # noqa: F401
    Base.metadata.create_all(bind=engine)


# ------------------------------------------------------------
# FastAPI dependency helper
# ------------------------------------------------------------
def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
