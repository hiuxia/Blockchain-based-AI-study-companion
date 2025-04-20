# backend/app/main.py
from app.api import history, notes, process, sources, summaries
from app.core.config import settings
from app.core.cors import add_cors
from app.core.database import Base, engine
from app.core.logger import logger
from app.models import history as history_model
from app.models import note, source, summary
from fastapi import FastAPI

# 创建所有数据库表
Base.metadata.create_all(bind=engine)

app = FastAPI(title=settings.app_name)
app = add_cors(app)

app.include_router(sources.router)
app.include_router(process.router)
app.include_router(history.router)
app.include_router(summaries.router)
app.include_router(notes.router)

logger.info(f"Starting {settings.app_name} application")

@app.get("/health")
def health_check():
    logger.debug("Health check endpoint called")
    return {"status": "healthy"}
