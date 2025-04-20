# backend/app/crud/source.py
import os

from app.core.logger import logger
from app.models.source import DBSource
from app.services.file_storage import file_storage
from sqlalchemy.orm import Session


def get_source(db: Session, source_id: str):
    logger.debug(f"Getting source with ID: {source_id}")
    return db.query(DBSource).filter(DBSource.id == source_id).first()

def get_all_sources(db: Session):
    logger.debug("Getting all sources")
    return db.query(DBSource).all()


def create_source(db: Session, filename: str, content_type: str) -> str:
    import uuid

    logger.info(f"Creating new source: {filename}")
    source = DBSource(id=str(uuid.uuid4()), filename=filename, content_type=content_type)
    db.add(source)
    db.commit()
    db.refresh(source)
    logger.debug(f"Created source with ID: {source.id}")
    return source.id

def delete_source(db: Session, source_id: str) -> bool:
    """
    Delete a source record and its associated file.

    Args:
        db: Database session
        source_id: ID of the source to delete

    Returns:
        True if deletion was successful, False otherwise
    """
    source = get_source(db, source_id)
    if not source:
        logger.warning(f"Failed to delete source: source with ID {source_id} not found")
        return False

    logger.info(f"Deleting source {source_id} (filename: {str(source.filename)})")

    # Delete the physical file
    file_path = file_storage.get_file_path(source_id)
    if file_path.exists():
        try:
            logger.debug(f"Removing physical file: {file_path}")
            os.remove(file_path)
            logger.debug(f"Successfully removed file: {file_path}")
        except (OSError, PermissionError) as e:
            # Log the error but continue to delete the DB record
            logger.error(f"Error deleting file {file_path}: {e}")
    else:
        logger.warning(f"Physical file does not exist: {file_path}")

    # Delete the database record
    logger.debug(f"Removing database record for source {source_id}")
    db.delete(source)
    db.commit()
    logger.info(f"Successfully deleted source {source_id}")
    return True


def rename_source(db: Session, source_id: str, new_filename: str) -> bool:
    """
    Rename a source by updating its filename in the database.
    Note: This only updates the database record, not the physical file.

    Args:
        db: Database session
        source_id: ID of the source to rename
        new_filename: New filename to set

    Returns:
        True if update was successful, False otherwise
    """
    source = get_source(db, source_id)
    if not source:
        logger.warning(f"Failed to rename source: source with ID {source_id} not found")
        return False

    old_filename = str(source.filename)
    logger.info(
        f"Renaming source {source_id} from '{old_filename}' to '{new_filename}'"
    )
    source.filename = new_filename
    db.commit()
    db.refresh(source)
    logger.debug(f"Successfully renamed source {source_id}")
    return True
