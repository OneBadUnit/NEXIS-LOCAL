from pydantic_settings import BaseSettings


class Settings(BaseSettings):
    DATABASE_URL: str = "postgresql://user:pass@localhost:5432/arcn"
    REDIS_URL: str = "redis://localhost:6379/0"
    OPENAI_API_KEY: str = ""
    USE_GPU: bool = True

    class Config:
        env_file = ".env"


settings = Settings()
