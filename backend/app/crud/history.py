# backend/app/crud/history.py
import uuid
from sqlalchemy.orm import Session
from app.models.history import DBHistory

def create_history(db: Session, conversation: str) -> DBHistory:
    history = DBHistory(
        id=str(uuid.uuid4()),
        conversation=conversation
    )
    db.add(history)
    db.commit()
    db.refresh(history)
    return history

def get_history(db: Session, history_id: str) -> DBHistory:
    return db.query(DBHistory).filter(DBHistory.id == history_id).first()

def list_histories(db: Session):
    return db.query(DBHistory).all()
