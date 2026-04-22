# ============================================================
# HEALTH CHECK API
# Provides a simple endpoint to verify that the backend is
# running and responsive. Used by the frontend and monitoring
# tools for quick status checks.
# ============================================================

from fastapi import APIRouter

# ------------------------------------------------------------
# Router Configuration
# ------------------------------------------------------------
router = APIRouter(
    prefix="/health",
    tags=["health"]
)


# ------------------------------------------------------------
# GET /health
# Returns a simple JSON payload indicating service status.
# ------------------------------------------------------------
@router.get("/")
def health_check():
    return {"status": "ok"}
