# backend/app/api/notes.py
from typing import List, Optional

from app.core.database import get_db
from app.crud.note import create_note, delete_note, get_note, list_notes, update_note
from app.models.schemas import NoteCreate, NoteResponse, NoteUpdate
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

router = APIRouter(prefix="/notes", tags=["notes"])


@router.post("", response_model=NoteResponse, status_code=status.HTTP_201_CREATED)
async def create_new_note(note: NoteCreate, db: Session = Depends(get_db)):
    """
    Create a new note

    Args:
        note: Note data
        db: Database session
    """
    try:
        created_note = create_note(
            db=db,
            name=note.name,
            content=note.content,
            content_type=note.content_type,
            source_summary_id=note.source_summary_id,
        )
        return created_note
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.get("", response_model=List[NoteResponse])
async def get_notes(
    source_summary_id: Optional[str] = None, db: Session = Depends(get_db)
):
    """
    Get all notes, optionally filtered by source/summary ID

    Args:
        source_summary_id: Optional ID to filter by
        db: Database session
    """
    try:
        notes = list_notes(db, source_summary_id)
        return notes
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/{note_id}", response_model=NoteResponse)
async def get_note_by_id(note_id: str, db: Session = Depends(get_db)):
    """
    Get a note by ID

    Args:
        note_id: ID of the note to get
        db: Database session
    """
    try:
        note = get_note(db, note_id)
        if not note:
            raise HTTPException(status_code=404, detail="Note not found")
        return note
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.patch("/{note_id}", response_model=NoteResponse)
async def update_note_by_id(
    note_id: str, note_update: NoteUpdate, db: Session = Depends(get_db)
):
    """
    Update a note

    Args:
        note_id: ID of the note to update
        note_update: Update data
        db: Database session
    """
    try:
        updated_note = update_note(
            db=db, note_id=note_id, name=note_update.name, content=note_update.content
        )
        if not updated_note:
            raise HTTPException(status_code=404, detail="Note not found")
        return updated_note
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.delete("/{note_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_note_by_id(note_id: str, db: Session = Depends(get_db)):
    """
    Delete a note

    Args:
        note_id: ID of the note to delete
        db: Database session
    """
    try:
        note = get_note(db, note_id)
        if not note:
            raise HTTPException(status_code=404, detail="Note not found")

        success = delete_note(db, note_id)
        if not success:
            raise HTTPException(status_code=500, detail="Failed to delete note")

        return None  # 204 No Content
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
