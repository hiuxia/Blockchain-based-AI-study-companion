# backend/app/crud/source.py
from sqlalchemy.orm import Session
from app.models.source import DBSource

def get_source(db: Session, source_id: str):
    return db.query(DBSource).filter(DBSource.id == source_id).first()

def create_source(db: Session, filename: str, content_type: str) -> str:
    import uuid
    source = DBSource(id=str(uuid.uuid4()), filename=filename, content_type=content_type)
    db.add(source)
    db.commit()
    db.refresh(source)
    return source.id
