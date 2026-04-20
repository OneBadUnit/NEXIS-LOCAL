from fastapi import APIRouter
from app.reconstruction import router as reconstruction_router

router = APIRouter()
router.include_router(reconstruction_router, prefix="/reconstruction", tags=["Reconstruction"])
