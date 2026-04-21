from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
import subprocess

from app.assimilation import router as assimilation_router
from app.api.vision import router as vision_router
from app.api.routes.system import router as system_router
from app.api.routes.reconstruction import router as reconstruction_router
from app.api.routes.creation import router as creation_router  # <-- correct import

app = FastAPI()  # <-- MUST be before include_router()


# -------------------------------
# AUTO-UPDATE YT-DLP ON STARTUP
# -------------------------------
def auto_update_ytdlp():
    try:
        print(">>> Checking for yt-dlp updates...")
        subprocess.run(["yt-dlp", "-U"], check=False)
        print(">>> yt-dlp update check complete.")
    except Exception as e:
        print(">>> yt-dlp auto-update failed:", e)

@app.on_event("startup")
async def startup_event():
    auto_update_ytdlp()


# -------------------------------
# CORS + ROUTERS
# -------------------------------
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# No prefixes — frontend expects exact paths
app.include_router(assimilation_router)
app.include_router(vision_router)
app.include_router(system_router, prefix="/system")
app.include_router(reconstruction_router)
app.include_router(creation_router)  # <-- correct placement


@app.get("/")
def root():
    return {"status": "ARC-NEXUS backend running"}
