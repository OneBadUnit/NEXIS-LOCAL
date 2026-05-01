# ============================================================
# ARC-NEXUS - BACKEND MAIN ENTRYPOINT
# File: app/main.py
# Version: 003 (Route Stability + Prefix Consistency)
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
from app.api.routes.ai_helper import router as ai_helper_router


# ------------------------------------------------------------
# App Initialization
# ------------------------------------------------------------
app = FastAPI(
    title="ARC-NEXUS Backend",
    version="3.0",
)


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

# --- OPTIONAL / LEGACY SUPPORT ---
# Keep this LAST so it doesn't override newer routes
app.include_router(ai_helper_router)


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