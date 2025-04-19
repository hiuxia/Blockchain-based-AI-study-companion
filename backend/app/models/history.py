# backend/app/models/history.py
from sqlalchemy import Column, String, Text, DateTime, func
from app.core.database import Base

class DBHistory(Base):
    __tablename__ = "histories"
    id = Column(String, primary_key=True, index=True)
    conversation = Column(Text, nullable=False)  # 存储对话历史（用户与 LLM 的交互内容）
    created_at = Column(DateTime(timezone=True), server_default=func.now())
