# backend/app/core/config.py
import os
from pathlib import Path
from typing import Optional

from pydantic_settings import BaseSettings

openai_api_key: Optional[str] = None

# Get the base project directory (where backend is located)
CURRENT_DIR = Path(__file__).resolve().parent.parent.parent
# Sets the PROJECT_ROOT one level up from the backend directory
# This accommodates the merged frontend/backend structure
PROJECT_ROOT = CURRENT_DIR.parent


class Settings(BaseSettings):
    app_name: str = "Document Processor"
    database_url: str = f"sqlite:///{CURRENT_DIR}/documents.db"
    # Store user uploaded files in an absolute path
    upload_dir: Path = CURRENT_DIR / "uploaded_sources"
    # 配置相关 API Key
    openai_api_key: Optional[str] = None
    openrouter_api_key: str
    gemini_api_key: str

    class Config:
        env_file = ".env"
        env_file_encoding = "utf-8"
        # Pydantic V2 中将 orm_mode 改为 from_attributes
        from_attributes = True

settings = Settings()
