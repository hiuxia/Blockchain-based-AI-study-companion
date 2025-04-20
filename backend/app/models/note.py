from app.core.database import Base
from sqlalchemy import Column, DateTime, String, Text, func


class DBNote(Base):
    __tablename__ = "notes"
    id = Column(String, primary_key=True, index=True)
    name = Column(String, nullable=False)
    content = Column(Text, nullable=False)
    content_type = Column(String, nullable=False, default="text/markdown")
    source_summary_id = Column(
        String, nullable=True
    )  # Optional link to a source or summary
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())
