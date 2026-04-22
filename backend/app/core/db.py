# ============================================================
# DATABASE CORE (SQLAlchemy Engine + Session + Base)
# Initializes the PostgreSQL engine, session factory, and
# declarative base used across all ORM models in ARC‑NEXUS.
# ============================================================

from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker, declarative_base

from app.core.config import settings


# ------------------------------------------------------------
# SQLAlchemy Engine
# Connects to PostgreSQL using the DATABASE_URL from settings.
# future=True enables SQLAlchemy 2.0-style behavior.
# ------------------------------------------------------------
engine = create_engine(
    settings.DATABASE_URL,
    future=True
)


# ------------------------------------------------------------
# Session Factory
# Creates database sessions with:
#   - autoflush=False: prevents premature flushes
#   - autocommit=False: explicit commit required
# ------------------------------------------------------------
SessionLocal = sessionmaker(
    bind=engine,
    autoflush=False,
    autocommit=False
)


# ------------------------------------------------------------
# Declarative Base
# Base class for all ORM models (Project, Source, etc.)
# ------------------------------------------------------------
Base = declarative_base()
