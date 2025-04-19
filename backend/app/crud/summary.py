# backend/app/crud/summary.py
import uuid
from sqlalchemy.orm import Session
from app.models.summary import DBSummary

def create_summary(db: Session, source_ids: list[str], markdown: str, vector_index_path: str = None) -> DBSummary:
    summary = DBSummary(
        id=str(uuid.uuid4()),
        source_ids=",".join(source_ids),
        markdown=markdown,
        vector_index_path=vector_index_path
    )
    db.add(summary)
    db.commit()
    db.refresh(summary)
    return summary
