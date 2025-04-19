# backend/app/crud/source.py
from app.models.source import DBSource
from sqlalchemy.orm import Session


def get_source(db: Session, source_id: str):
    return db.query(DBSource).filter(DBSource.id == source_id).first()

def get_all_sources(db: Session):
    return db.query(DBSource).all()


def create_source(db: Session, filename: str, content_type: str) -> str:
    import uuid
    source = DBSource(id=str(uuid.uuid4()), filename=filename, content_type=content_type)
    db.add(source)
    db.commit()
    db.refresh(source)
    return source.id
