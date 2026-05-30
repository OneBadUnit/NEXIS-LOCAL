# ============================================================
# ARC-NEXUS - APP CONFIG
# File: app/core/config.py
# Version: 005 (NEXIS_VISION_MODEL for multimodal image collect)
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
    LLM_MODEL: str = "qwen2.5:7b"
    VISION_MODEL: str = "llava:34b"
    OLLAMA_URL: str = "http://localhost:11434"

    # --------------------------------------------------------
    # FUTURE (not active yet)
    # --------------------------------------------------------
    DATABASE_URL: str = ""
    REDIS_URL: str = ""
    OPENAI_API_KEY: str = ""

    # --------------------------------------------------------
    # FEATURE FLAGS
    # Default false — enable via env vars for local dev.
    # Keep false on hosted (Render) unless explicitly enabled.
    # --------------------------------------------------------
    WHISPER_ENABLED: bool = False
    OCR_ENABLED: bool = False
    VISION_ENABLED: bool = False
    YOUTUBE_INGESTION_ENABLED: bool = False
    NEXIS_HOSTED_MODE: bool = False

    # --------------------------------------------------------
    # TESSERACT OCR PATH
    # Override via NEXIS_TESSERACT_PATH env var.
    # Recommended Windows setting:
    # NEXIS_TESSERACT_PATH=C:\Program Files\Tesseract-OCR\tesseract.exe
    # If empty, ocr_utils.py resolves via shutil.which("tesseract")
    # --------------------------------------------------------
    NEXIS_TESSERACT_PATH: str = ""

    # --------------------------------------------------------
    # LOCAL VISION MODEL (Ollama)
    # Name must match exactly what `ollama list` shows.
    # Override via NEXIS_VISION_MODEL env var.
    # If this model is not installed, vision description is
    # skipped gracefully and OCR-only output is returned.
    # --------------------------------------------------------
    NEXIS_VISION_MODEL: str = "llava:13b"

    class Config:
        env_file = ".env"


# ------------------------------------------------------------
# Global Instance
# ------------------------------------------------------------
settings = Settings()