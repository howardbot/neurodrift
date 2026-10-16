"""Application settings, read from environment variables (see .env.example)."""

from functools import lru_cache
from pathlib import Path

from pydantic import Field
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(env_file=".env", extra="ignore")

    environment: str = "development"
    log_level: str = "INFO"

    database_url: str = "postgresql+psycopg://neurodrift:neurodrift@localhost:5432/neurodrift"
    redis_url: str = "redis://localhost:6379/0"
    data_dir: Path = Path("./data")

    cors_origins: list[str] = Field(default_factory=lambda: ["http://localhost:3000"])

    max_upload_mb: int = 500
    # Guards against zip bombs: total uncompressed size of all arrays in one .npz.
    max_uncompressed_mb: int = 4096
    max_sessions_per_project: int = 30

    @property
    def is_production(self) -> bool:
        return self.environment == "production"

    @property
    def max_upload_bytes(self) -> int:
        return self.max_upload_mb * 1024 * 1024

    @property
    def max_uncompressed_bytes(self) -> int:
        return self.max_uncompressed_mb * 1024 * 1024


@lru_cache
def get_settings() -> Settings:
    return Settings()
