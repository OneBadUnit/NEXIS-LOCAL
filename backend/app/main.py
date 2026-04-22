# ============================================================
# ARC‑NEXUS BACKEND MAIN ENTRYPOINT
# Loads all module routers and mounts them under clean prefixes.
# ============================================================

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.api.routes.ai_helper import router as ai_helper_router


# ------------------------------------------------------------
# Import module routers directly (no wrappers)
# ------------------------------------------------------------
from app.assimilation import router as assimilation_router
from app.reconstruction import router as reconstruction_router
from app.creation import router as creation_router
from app.vision import router as vision_router
from app.api.routes.system import router as system_router


# ------------------------------------------------------------
# App Initialization
# ------------------------------------------------------------
app = FastAPI(title="ARC‑NEXUS Backend")

# ------------------------------------------------------------
# CORS (Frontend → Backend)
# ------------------------------------------------------------
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # You can restrict later
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ------------------------------------------------------------
# ROUTER MOUNTING
# ------------------------------------------------------------
app.include_router(assimilation_router, prefix="/assimilation")
app.include_router(reconstruction_router, prefix="/reconstruction")
app.include_router(creation_router, prefix="/create")

app.include_router(vision_router, prefix="/vision")
app.include_router(ai_helper_router)
app.include_router(system_router, prefix="/api/system")

# ------------------------------------------------------------
# Root Endpoint
# ------------------------------------------------------------
@app.get("/")
def root():
    return {"status": "ARC‑NEXUS backend running"}
