# ============================================================
# ARC-NEXUS - BACKEND MAIN ENTRYPOINT
# File: app/main.py
# Version: 005 (CORS before routers + preflight debug middleware)
# ============================================================

from fastapi import FastAPI, Request
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
# CORS — registered immediately after app creation,
# before any routers, so preflight OPTIONS is handled first.
# ------------------------------------------------------------
ALLOWED_ORIGINS = [
    # Local development
    "http://localhost:3000",
    "http://127.0.0.1:3000",
    # Hosted frontend (Vercel)
    "https://nexis-td1ezngfa-onebadunits-projects.vercel.app",
]

print("[CORS] Allowed origins:", ALLOWED_ORIGINS)

app.add_middleware(
    CORSMiddleware,
    allow_origins=ALLOWED_ORIGINS,
    allow_credentials=True,
    allow_methods=["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
    allow_headers=["*"],
)


# ------------------------------------------------------------
# TEMPORARY REQUEST DEBUG MIDDLEWARE
# Logs preflight details. Remove after CORS is confirmed.
# ------------------------------------------------------------
@app.middleware("http")
async def _debug_request(request: Request, call_next):
    print(
        f"[REQ DEBUG] {request.method} {request.url.path}"
        f" | origin={request.headers.get('origin')}"
        f" | acr-method={request.headers.get('access-control-request-method')}"
        f" | acr-headers={request.headers.get('access-control-request-headers')}"
    )
    response = await call_next(request)
    print(f"[REQ DEBUG] response status={response.status_code}")
    return response


# ------------------------------------------------------------
# Startup: create database tables
# ------------------------------------------------------------
@app.on_event("startup")
def startup_event():
    from app.core.db import init_db
    init_db()


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