# backend/app/models/schemas.py
from datetime import datetime
from typing import List, Optional

from pydantic import BaseModel


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

class SourceUpdate(BaseModel):
    filename: str


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

class SummaryUpdate(BaseModel):
    name: str


class HistoryCreate(BaseModel):
    conversation: str

class HistoryResponse(BaseModel):
    id: str
    conversation: str
    created_at: datetime

    class Config:
        from_attributes = True

class NoteCreate(BaseModel):
    name: str
    content: str
    content_type: str = "text/markdown"
    source_summary_id: Optional[str] = None


class NoteUpdate(BaseModel):
    name: Optional[str] = None
    content: Optional[str] = None


class NoteResponse(BaseModel):
    id: str
    name: str
    content: str
    content_type: str
    source_summary_id: Optional[str] = None
    created_at: datetime
    updated_at: Optional[datetime] = None

    class Config:
        from_attributes = True
