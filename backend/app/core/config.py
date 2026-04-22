# ============================================================
# APPLICATION SETTINGS (Pydantic Settings)
# Centralized configuration for ARC‑NEXUS. Loads environment
# variables from .env and provides strongly-typed access to
# database URLs, API keys, and runtime flags.
# ============================================================

from pydantic_settings import BaseSettings


# ------------------------------------------------------------
# Settings Model
# Values can be overridden via environment variables or .env.
# ------------------------------------------------------------
class Settings(BaseSettings):
    # Database connection string (PostgreSQL)
    DATABASE_URL: str = "postgresql://user:pass@localhost:5432/arcn"

    # Redis connection (for queues, caching, jobs)
    REDIS_URL: str = "redis://localhost:6379/0"

    # Optional OpenAI API key (if cloud LLMs are used)
    OPENAI_API_KEY: str = ""

    # Global GPU toggle for modules that support CUDA
    USE_GPU: bool = True

    class Config:
        # Load environment variables from .env file
        env_file = ".env"


# ------------------------------------------------------------
# Global settings instance
# Imported throughout the backend for configuration access.
# ------------------------------------------------------------
settings = Settings()
