# backend/app/models/source.py
from sqlalchemy import Column, String, DateTime, func
from app.core.database import Base

class DBSource(Base):
    __tablename__ = "sources"
    id = Column(String, primary_key=True, index=True)
    filename = Column(String, nullable=False)
    content_type = Column(String, nullable=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
