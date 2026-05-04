# ============================================================
# ARC-NEXUS - BACKEND MAIN ENTRYPOINT
# File: app/main.py
# Version: 004 (Removed misplaced frontend CSS)
# ============================================================

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

# ------------------------------------------------------------
# CORE ROUTES
# ------------------------------------------------------------
from app.assimilation import router as assimilation_router
from app.vision import router as vision_router

from app.reconstruction import router as understand_router
from app.creation import router as create_router

from app.api.routes.system import router as system_router
from app.api.routes.usage import router as usage_router


# ------------------------------------------------------------
# App Initialization
# ------------------------------------------------------------
app = FastAPI(
    title="ARC-NEXUS Backend",
    version="3.0",
)


# ------------------------------------------------------------
# Startup: create database tables
# ------------------------------------------------------------
@app.on_event("startup")
def startup_event():
    from app.core.db import init_db
    init_db()


# ------------------------------------------------------------
# CORS
# ------------------------------------------------------------
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],   # tighten later if needed
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# ------------------------------------------------------------
# ROUTES
# ------------------------------------------------------------

# --- INGESTION ---
app.include_router(assimilation_router, prefix="/collect")

# --- VISION ---
app.include_router(vision_router, prefix="/vision")

# --- NEXIS CORE ---
app.include_router(understand_router, prefix="/nexis")
app.include_router(create_router, prefix="/nexis")

# --- SYSTEM ---
app.include_router(system_router, prefix="/api/system")

# --- USAGE / LIMITS ---
app.include_router(usage_router, prefix="/api")


# ------------------------------------------------------------
# ROOT
# ------------------------------------------------------------
@app.get("/")
def root():
    return {
        "status": "ARC-NEXUS backend running",
        "routes": {
            "collect": "/collect/process",
            "understand": "/nexis/understand",
            "create": "/nexis/create",
            "vision": "/vision/analyze",
            "system": "/api/system/check",
        }
    }