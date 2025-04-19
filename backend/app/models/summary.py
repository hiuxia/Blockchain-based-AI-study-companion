# backend/app/models/summary.py
from sqlalchemy import Column, String, Text, DateTime, func
from app.core.database import Base

class DBSummary(Base):
    __tablename__ = "summaries"
    id = Column(String, primary_key=True, index=True)
    source_ids = Column(String, nullable=False)  # 存储关联的多个源文件 ID（以逗号分隔）
    markdown = Column(Text, nullable=False)      # LLM 生成的 Markdown 摘要
    vector_index_path = Column(String, nullable=True)  # 可选：持久化 FAISS 索引的文件路径
    created_at = Column(DateTime(timezone=True), server_default=func.now())
