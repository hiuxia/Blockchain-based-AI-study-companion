# backend/app/services/file_storage.py
import os
from pathlib import Path

from app.core.config import settings
from app.core.logger import logger


class FileStorageService:
    def __init__(self):
        # Get absolute path to upload directory
        self.upload_dir = settings.upload_dir.resolve()
        logger.debug(f"Initializing file storage with directory: {self.upload_dir}")

        # Ensure the upload directory exists
        if not self.upload_dir.exists():
            logger.info(f"Creating upload directory: {self.upload_dir}")
            self.upload_dir.mkdir(parents=True, exist_ok=True)
            # Ensure the directory is readable/writable
            os.chmod(self.upload_dir, 0o755)
        else:
            logger.debug(f"Upload directory already exists: {self.upload_dir}")

        # Double-check that the directory is accessible
        if not os.access(self.upload_dir, os.R_OK | os.W_OK):
            logger.warning(
                f"Upload directory has incorrect permissions: {self.upload_dir}"
            )
            try:
                os.chmod(self.upload_dir, 0o755)
                logger.info(
                    f"Fixed permissions for upload directory: {self.upload_dir}"
                )
            except Exception as e:
                logger.error(f"Failed to fix permissions: {str(e)}")

    def get_file_path(self, source_id: str) -> Path:
        # Generate the absolute path to the file
        file_path = self.upload_dir / f"{source_id}.pdf"
        logger.debug(f"Generated file path for source {source_id}: {file_path}")

        # Ensure the parent directory exists
        if not file_path.parent.exists():
            logger.warning(
                f"Parent directory doesn't exist, creating: {file_path.parent}"
            )
            file_path.parent.mkdir(parents=True, exist_ok=True)

        return file_path

    def file_exists(self, source_id: str) -> bool:
        """Verify if a source file physically exists."""
        file_path = self.get_file_path(source_id)
        exists = file_path.exists()
        if not exists:
            # Log alternative paths that were checked to aid debugging
            logger.debug(f"File not found at expected path: {file_path}")

            # Check if file exists in current working directory as fallback
            cwd_path = Path.cwd() / "uploaded_sources" / f"{source_id}.pdf"
            if cwd_path.exists():
                logger.warning(
                    f"File found in CWD but not in configured path: {cwd_path}"
                )

        return exists


file_storage = FileStorageService()
logger.info(
    f"File storage service initialized with upload directory: {file_storage.upload_dir}"
)
