from typing import List

from app.core.database import get_db
from app.crud.summary import (
    delete_summary,
    get_summary,
    list_named_summaries,
    list_summaries,
    update_summary_name,
)
from app.models.schemas import SummaryResponse, SummaryUpdate
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

router = APIRouter(prefix="/summaries", tags=["summaries"])


@router.get("", response_model=List[SummaryResponse])
async def get_summaries(named_only: bool = False, db: Session = Depends(get_db)):
    """
    Get all summaries, optionally filtered by named only

    Args:
        named_only: If True, only return summaries with a name
        db: Database session
    """
    try:
        if named_only:
            summaries = list_named_summaries(db)
        else:
            summaries = list_summaries(db)

        # Convert DB model to response schema with List[str] for source_ids
        return [
            {
                "id": summary.id,
                "name": summary.name,
                "source_ids": summary.source_ids.split(",")
                if summary.source_ids
                else [],
                "markdown": summary.markdown,
                "vector_index_path": summary.vector_index_path,
                "created_at": summary.created_at,
            }
            for summary in summaries
        ]
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/{summary_id}", response_model=SummaryResponse)
async def get_summary_by_id(summary_id: str, db: Session = Depends(get_db)):
    """
    Get a summary by ID

    Args:
        summary_id: ID of the summary to get
        db: Database session
    """
    try:
        summary = get_summary(db, summary_id)
        if not summary:
            raise HTTPException(status_code=404, detail="Summary not found")

        return {
            "id": summary.id,
            "name": summary.name,
            "source_ids": summary.source_ids.split(",") if summary.source_ids else [],
            "markdown": summary.markdown,
            "vector_index_path": summary.vector_index_path,
            "created_at": summary.created_at,
        }
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.patch("/{summary_id}", response_model=SummaryResponse)
async def update_summary(
    summary_id: str, summary_update: SummaryUpdate, db: Session = Depends(get_db)
):
    """
    Update a summary's name

    Args:
        summary_id: ID of the summary to update
        summary_update: Update data
        db: Database session
    """
    try:
        updated_summary = update_summary_name(db, summary_id, summary_update.name)
        if not updated_summary:
            raise HTTPException(status_code=404, detail="Summary not found")

        return {
            "id": updated_summary.id,
            "name": updated_summary.name,
            "source_ids": updated_summary.source_ids.split(",")
            if updated_summary.source_ids
            else [],
            "markdown": updated_summary.markdown,
            "vector_index_path": updated_summary.vector_index_path,
            "created_at": updated_summary.created_at,
        }
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.delete("/{summary_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_summary_by_id(summary_id: str, db: Session = Depends(get_db)):
    """
    Delete a summary

    Args:
        summary_id: ID of the summary to delete
        db: Database session
    """
    try:
        # Check if summary exists
        summary = get_summary(db, summary_id)
        if not summary:
            raise HTTPException(status_code=404, detail="Summary not found")

        # Delete the summary
        success = delete_summary(db, summary_id)
        if not success:
            raise HTTPException(status_code=500, detail="Failed to delete summary")

        return None  # 204 No Content response
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
