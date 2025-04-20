# backend/app/services/file_storage.py
import os
from pathlib import Path

from app.core.config import settings
from app.core.logger import logger


class FileStorageService:
    def __init__(self):
        self.upload_dir = settings.upload_dir
        if not self.upload_dir.exists():
            logger.info(f"Creating upload directory: {self.upload_dir}")
            self.upload_dir.mkdir(parents=True, exist_ok=True)
        else:
            logger.debug(f"Upload directory already exists: {self.upload_dir}")

    def get_file_path(self, source_id: str) -> Path:
        # 假设上传文件命名规则为 source_id + ".pdf"
        file_path = self.upload_dir / f"{source_id}.pdf"
        logger.debug(f"Generated file path for source {source_id}: {file_path}")
        return file_path

file_storage = FileStorageService()
logger.info(
    f"File storage service initialized with upload directory: {file_storage.upload_dir}"
)
