from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.assimilation import router as assimilation_router
from app.api.vision import router as vision_router

app = FastAPI()

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

@app.get("/")
def root():
    return {"status": "ARC-NEXUS backend running"}
