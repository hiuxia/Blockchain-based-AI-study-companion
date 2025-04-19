# backend/app/services/file_storage.py
import os
from pathlib import Path
from app.core.config import settings

class FileStorageService:
    def __init__(self):
        self.upload_dir = settings.upload_dir
        if not self.upload_dir.exists():
            self.upload_dir.mkdir(parents=True, exist_ok=True)
    
    def get_file_path(self, source_id: str) -> Path:
        # 假设上传文件命名规则为 source_id + ".pdf"
        return self.upload_dir / f"{source_id}.pdf"

file_storage = FileStorageService()
