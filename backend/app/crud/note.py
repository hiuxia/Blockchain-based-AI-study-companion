# backend/app/crud/note.py
import uuid
from typing import List, Optional

from app.models.note import DBNote
from sqlalchemy.orm import Session


def create_note(
    db: Session,
    name: str,
    content: str,
    content_type: str = "text/markdown",
    source_summary_id: Optional[str] = None,
) -> DBNote:
    """
    Create a new note

    Args:
        db: Database session
        name: Name of the note
        content: Content of the note
        content_type: MIME type of the content, defaults to text/markdown
        source_summary_id: Optional ID of a related source or summary

    Returns:
        The created note
    """
    note = DBNote(
        id=str(uuid.uuid4()),
        name=name,
        content=content,
        content_type=content_type,
        source_summary_id=source_summary_id,
    )
    db.add(note)
    db.commit()
    db.refresh(note)
    return note


def get_note(db: Session, note_id: str) -> Optional[DBNote]:
    """
    Get a note by ID

    Args:
        db: Database session
        note_id: ID of the note to retrieve

    Returns:
        The note or None if not found
    """
    return db.query(DBNote).filter(DBNote.id == note_id).first()


def list_notes(db: Session, source_summary_id: Optional[str] = None) -> List[DBNote]:
    """
    List all notes, optionally filtered by source_summary_id

    Args:
        db: Database session
        source_summary_id: Optional ID to filter by related source/summary

    Returns:
        List of notes
    """
    if source_summary_id:
        return (
            db.query(DBNote).filter(DBNote.source_summary_id == source_summary_id).all()
        )
    return db.query(DBNote).all()


def update_note(
    db: Session, note_id: str, name: Optional[str] = None, content: Optional[str] = None
) -> Optional[DBNote]:
    """
    Update a note

    Args:
        db: Database session
        note_id: ID of the note to update
        name: Optional new name
        content: Optional new content

    Returns:
        Updated note or None if not found
    """
    note = get_note(db, note_id)
    if not note:
        return None

    if name is not None:
        note.name = name
    if content is not None:
        note.content = content

    db.commit()
    db.refresh(note)
    return note


def delete_note(db: Session, note_id: str) -> bool:
    """
    Delete a note

    Args:
        db: Database session
        note_id: ID of the note to delete

    Returns:
        True if successful, False otherwise
    """
    note = get_note(db, note_id)
    if not note:
        return False

    db.delete(note)
    db.commit()
    return True
