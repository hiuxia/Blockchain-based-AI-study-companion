# backend/app/core/config.py
from pydantic_settings import BaseSettings
from pathlib import Path

class Settings(BaseSettings):
    app_name: str = "Document Processor"
    database_url: str = "sqlite:///./documents.db"
    upload_dir: Path = Path("uploaded_sources")
    # 配置相关 API Key
    openai_api_key: str
    openrouter_api_key: str
    gemini_api_key: str

    class Config:
        env_file = ".env"
        env_file_encoding = "utf-8"
        # Pydantic V2 中将 orm_mode 改为 from_attributes
        from_attributes = True

settings = Settings()
