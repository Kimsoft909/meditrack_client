"""
Centralized configuration using Pydantic Settings.
Reads from .env.local and validates all environment variables.
"""

import os
from dotenv import load_dotenv
from functools import lru_cache
from typing import List, Set

from pydantic import Field, field_validator
from pydantic_settings import BaseSettings, SettingsConfigDict

# Load environment variables from .env.local
load_dotenv(".env.local")


class Settings(BaseSettings):
    """Application settings with type validation and defaults."""

    # Application
    APP_NAME: str = "MEDITRACK API"
    VERSION: str = "1.0.0"
    DEBUG: bool = False
    ENVIRONMENT: str = "production"

    # Security
    SECRET_KEY: str = Field(..., min_length=32)
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 30
    REFRESH_TOKEN_EXPIRE_DAYS: int = 7

    # Database
    DATABASE_URL: str = Field(
        ..., description="PostgreSQL async connection string"
    )
    DB_POOL_SIZE: int = 10
    DB_MAX_OVERFLOW: int = 20

    # Redis
    REDIS_URL: str = "redis://localhost:6379/0"
    CACHE_TTL_SECONDS: int = 300

    # CORS
    CORS_ORIGINS: List[str] = [
        "http://localhost:5173",
        "http://localhost:3000",
    ]

    @field_validator("CORS_ORIGINS", mode="before")
    @classmethod
    def parse_cors_origins(cls, v):
        if isinstance(v, str):
            return [origin.strip() for origin in v.strip("[]").split(",")]
        return v

    # AI Integration (Using HuggingFace Inference API - keep GROK_ prefix for compatibility)
    GROK_API_KEY: str = Field(..., description="HuggingFace Inference API key")
    GROK_API_BASE_URL: str = "https://api-inference.huggingface.co/models"
    GROK_MODEL: str = "mistralai/Mistral-7B-Instruct-v0.2"
    GROK_MAX_TOKENS: int = 2048
    GROK_TEMPERATURE: float = 0.7
    GROK_TIMEOUT_SECONDS: int = 120  # HF can be slower on cold starts

    # FDA API
    FDA_API_KEY: str | None = None
    FDA_API_BASE_URL: str = "https://api.fda.gov"

    # Logging
    LOG_LEVEL: str = "INFO"
    LOG_FORMAT: str = "json"

    # Rate Limiting
    RATE_LIMIT_PER_MINUTE: int = 60

    # File Upload
    MAX_UPLOAD_SIZE_MB: int = 10
    ALLOWED_EXTENSIONS: Set[str] = {"pdf", "csv", "txt"}

    model_config = SettingsConfigDict(
        env_file=".env.local", env_file_encoding="utf-8", case_sensitive=True
    )


@lru_cache
def get_settings() -> Settings:
    """Cached settings instance (singleton pattern)."""
    return Settings()


settings = get_settings()
