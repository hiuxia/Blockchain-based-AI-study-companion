# backend/app/crud/summary.py
import uuid
from typing import List, Optional

from app.models.summary import DBSummary
from sqlalchemy.orm import Session


def create_summary(
    db: Session,
    source_ids: list[str],
    markdown: str,
    name: Optional[str] = None,
    vector_index_path: str = None,
) -> DBSummary:
    """
    Create a new summary record

    Args:
        db: Database session
        source_ids: List of source IDs associated with this summary
        markdown: Markdown content of the summary
        name: Optional name for the summary
        vector_index_path: Optional path to vector index file

    Returns:
        The created DBSummary object
    """
    summary = DBSummary(
        id=str(uuid.uuid4()),
        name=name,
        source_ids=",".join(source_ids),
        markdown=markdown,
        vector_index_path=vector_index_path,
    )
    db.add(summary)
    db.commit()
    db.refresh(summary)
    return summary

def get_summary(db: Session, summary_id: str) -> Optional[DBSummary]:
    """
    Get a summary by ID

    Args:
        db: Database session
        summary_id: ID of the summary

    Returns:
        The summary or None if not found
    """
    return db.query(DBSummary).filter(DBSummary.id == summary_id).first()


def list_summaries(db: Session) -> List[DBSummary]:
    """
    List all summaries

    Args:
        db: Database session

    Returns:
        List of all summaries
    """
    return db.query(DBSummary).all()


def list_named_summaries(db: Session) -> List[DBSummary]:
    """
    List all named summaries (where name is not null)

    Args:
        db: Database session

    Returns:
        List of named summaries
    """
    return db.query(DBSummary).filter(DBSummary.name != None).all()


def update_summary_name(db: Session, summary_id: str, name: str) -> Optional[DBSummary]:
    """
    Update the name of a summary

    Args:
        db: Database session
        summary_id: ID of the summary to update
        name: New name for the summary

    Returns:
        Updated summary or None if not found
    """
    summary = get_summary(db, summary_id)
    if not summary:
        return None

    summary.name = name
    db.commit()
    db.refresh(summary)
    return summary


def delete_summary(db: Session, summary_id: str) -> bool:
    """
    Delete a summary

    Args:
        db: Database session
        summary_id: ID of the summary to delete

    Returns:
        True if deletion successful, False otherwise
    """
    summary = get_summary(db, summary_id)
    if not summary:
        return False

    db.delete(summary)
    db.commit()
    return True
