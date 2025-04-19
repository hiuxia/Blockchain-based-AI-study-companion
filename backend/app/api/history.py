# backend/app/api/history.py
from fastapi import APIRouter, HTTPException, Depends
from sqlalchemy.orm import Session
from app.models.schemas import HistoryCreate, HistoryResponse
from app.crud.history import create_history, list_histories, get_history
from app.core.database import get_db

router = APIRouter(prefix="/history", tags=["history"])

@router.post("", response_model=HistoryResponse)
def save_history(history: HistoryCreate, db: Session = Depends(get_db)):
    return create_history(db, history.conversation)

@router.get("", response_model=list[HistoryResponse])
def get_all_histories(db: Session = Depends(get_db)):
    return list_histories(db)

@router.get("/{history_id}", response_model=HistoryResponse)
def read_history(history_id: str, db: Session = Depends(get_db)):
    h = get_history(db, history_id)
    if not h:
       raise HTTPException(status_code=404, detail="History not found")
    return h
