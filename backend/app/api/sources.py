# backend/app/api/sources.py
import os
from typing import List

import aiofiles
from app.core.database import get_db
from app.core.logger import logger
from app.crud.source import (
    create_source,
    delete_source,
    get_all_sources,
    get_source,
    rename_source,
)
from app.models.schemas import SourceResponse, SourceUpdate
from app.models.source import DBSource
from app.services.file_storage import file_storage
from fastapi import APIRouter, Depends, File, HTTPException, UploadFile, status
from sqlalchemy.orm import Session

router = APIRouter(prefix="/sources", tags=["sources"])

@router.get("", response_model=List[SourceResponse])
async def get_sources(db: Session = Depends(get_db)):
    try:
        logger.info("API request: Get all sources")
        sources = get_all_sources(db)
        logger.debug(f"Retrieved {len(sources)} sources")
        return [
            {"id": src.id, "filename": src.filename, "content_type": src.content_type}
            for src in sources
        ]
    except Exception as e:
        logger.error(f"Error getting sources: {str(e)}", exc_info=True)
        raise HTTPException(status_code=500, detail=str(e))


@router.post("", response_model=SourceResponse)
async def upload_source(file: UploadFile = File(...), db: Session = Depends(get_db)):
    try:
        logger.info(f"API request: Upload source file: {file.filename}")

        # Read file content
        contents = await file.read()

        # Auto-rename logic if filename already exists in database
        original_filename = file.filename
        if original_filename is None:
            original_filename = "unnamed_file.pdf"
            logger.warning(
                "Uploaded file has no filename, using default: unnamed_file.pdf"
            )

        base_name, extension = os.path.splitext(original_filename)
        counter = 1
        new_filename = original_filename

        # Check if filename exists and rename if needed
        existing_files = (
            db.query(DBSource).filter(DBSource.filename == new_filename).all()
        )
        while existing_files:
            new_filename = f"{base_name}({counter}){extension}"
            logger.debug(
                f"File with name '{original_filename}' already exists, using '{new_filename}' instead"
            )
            counter += 1
            existing_files = (
                db.query(DBSource).filter(DBSource.filename == new_filename).all()
            )

        # Generate source_id
        import uuid

        source_id = str(uuid.uuid4())
        logger.debug(f"Generated source ID: {source_id}")

        # Get file path using service
        file_path = file_storage.get_file_path(source_id)
        logger.debug(f"File will be saved to: {file_path}")

        # Save file content to disk
        async with aiofiles.open(file_path, "wb") as out_file:
            await out_file.write(contents)
        logger.debug(f"Successfully saved file to disk: {file_path}")

        # Ensure content_type is not None
        content_type = file.content_type
        if content_type is None:
            content_type = "application/octet-stream"
            logger.warning(f"File has no content_type, using default: {content_type}")

        # Save record to database with potentially renamed file
        source_id = create_source(db, new_filename, content_type)
        logger.info(f"Successfully uploaded source: {new_filename} (ID: {source_id})")

        return {"id": source_id, "filename": new_filename, "content_type": content_type}
    except Exception as e:
        logger.error(f"Error uploading source: {str(e)}", exc_info=True)
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/{source_id}", response_model=SourceResponse)
async def get_source_by_id(source_id: str, db: Session = Depends(get_db)):
    try:
        logger.info(f"API request: Get source by ID: {source_id}")
        source = get_source(db, source_id)
        if not source:
            logger.warning(f"Source not found: {source_id}")
            raise HTTPException(status_code=404, detail="Source not found")

        logger.debug(f"Retrieved source: {source.filename} (ID: {source_id})")
        return {
            "id": source.id,
            "filename": source.filename,
            "content_type": source.content_type,
        }
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error getting source {source_id}: {str(e)}", exc_info=True)
        raise HTTPException(status_code=500, detail=str(e))


@router.delete("/{source_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_source_by_id(source_id: str, db: Session = Depends(get_db)):
    try:
        logger.info(f"API request: Delete source by ID: {source_id}")

        # Check if source exists
        source = get_source(db, source_id)
        if not source:
            logger.warning(f"Cannot delete: Source not found: {source_id}")
            raise HTTPException(status_code=404, detail="Source not found")

        logger.debug(f"Found source to delete: {source.filename} (ID: {source_id})")

        # Delete the source and its file
        success = delete_source(db, source_id)
        if not success:
            logger.error(f"Failed to delete source: {source_id}")
            raise HTTPException(status_code=500, detail="Failed to delete source")

        logger.info(f"Successfully deleted source: {source_id}")
        return None  # 204 No Content response
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error deleting source {source_id}: {str(e)}", exc_info=True)
        raise HTTPException(status_code=500, detail=str(e))


@router.patch("/{source_id}", response_model=SourceResponse)
async def update_source(
    source_id: str, source_update: SourceUpdate, db: Session = Depends(get_db)
):
    try:
        logger.info(
            f"API request: Update source {source_id} with filename: {source_update.filename}"
        )

        # Check if source exists
        source = get_source(db, source_id)
        if not source:
            logger.warning(f"Cannot update: Source not found: {source_id}")
            raise HTTPException(status_code=404, detail="Source not found")

        logger.debug(f"Found source to update: {source.filename} (ID: {source_id})")

        # Auto-rename logic if the new filename already exists in database
        new_filename = source_update.filename
        base_name, extension = os.path.splitext(new_filename)
        counter = 1

        # Check if filename exists (excluding the current source) and rename if needed
        existing_files = (
            db.query(DBSource)
            .filter(DBSource.filename == new_filename, DBSource.id != source_id)
            .all()
        )

        while existing_files:
            new_filename = f"{base_name}({counter}){extension}"
            logger.debug(
                f"Name '{source_update.filename}' already in use, using '{new_filename}' instead"
            )
            counter += 1
            existing_files = (
                db.query(DBSource)
                .filter(DBSource.filename == new_filename, DBSource.id != source_id)
                .all()
            )

        # Update the source name
        success = rename_source(db, source_id, new_filename)
        if not success:
            logger.error(f"Failed to update source: {source_id}")
            raise HTTPException(status_code=500, detail="Failed to update source")

        # Get updated source
        updated_source = get_source(db, source_id)
        if updated_source is None:
            logger.error(f"Source {source_id} not found after update")
            raise HTTPException(status_code=404, detail="Source not found after update")

        logger.info(
            f"Successfully updated source {source_id} to filename: {new_filename}"
        )
        return {
            "id": updated_source.id,
            "filename": updated_source.filename,
            "content_type": updated_source.content_type,
        }
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error updating source {source_id}: {str(e)}", exc_info=True)
        raise HTTPException(status_code=500, detail=str(e))
