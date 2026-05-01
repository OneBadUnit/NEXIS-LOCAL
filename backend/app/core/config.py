# ============================================================
# ARC-NEXUS - APP CONFIG
# File: app/core/config.py
# Version: 002 (Minimal + Future-Safe)
# ============================================================

from pydantic_settings import BaseSettings


# ------------------------------------------------------------
# Settings Model
# ------------------------------------------------------------
class Settings(BaseSettings):
    # --------------------------------------------------------
    # CORE FLAGS
    # --------------------------------------------------------
    APP_NAME: str = "ARC-NEXUS"
    DEBUG: bool = True

    # --------------------------------------------------------
    # MODEL CONFIG (matches current services)
    # --------------------------------------------------------
    LLM_MODEL: str = "llama3.1:8b"
    VISION_MODEL: str = "llava:34b"
    OLLAMA_URL: str = "http://localhost:11434"

    # --------------------------------------------------------
    # FUTURE (not active yet)
    # --------------------------------------------------------
    DATABASE_URL: str = ""
    REDIS_URL: str = ""
    OPENAI_API_KEY: str = ""

    class Config:
        env_file = ".env"


# ------------------------------------------------------------
# Global Instance
# ------------------------------------------------------------
settings = Settings()