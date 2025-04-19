# backend/app/models/schemas.py
from pydantic import BaseModel
from datetime import datetime
from typing import Optional, List

class ProcessingRequest(BaseModel):
    source_ids: List[str]
    llm_model: str = "gemini-flash"

class TaskStatus(BaseModel):
    task_id: str
    status: str
    result: Optional[dict] = None
    error: Optional[str] = None

class SourceCreate(BaseModel):
    filename: str
    content_type: str

class SourceResponse(BaseModel):
    id: str
    filename: str
    content_type: str

class SummaryResponse(BaseModel):
    id: str
    source_ids: List[str]
    markdown: str
    vector_index_path: Optional[str] = None
    created_at: datetime

    class Config:
        from_attributes = True

class HistoryCreate(BaseModel):
    conversation: str

class HistoryResponse(BaseModel):
    id: str
    conversation: str
    created_at: datetime

    class Config:
        from_attributes = True
