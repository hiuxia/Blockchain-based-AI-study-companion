# backend/app/main.py
from fastapi import FastAPI
from app.core.config import settings
from app.core.database import engine, Base
from app.core.cors import add_cors
from app.api import sources, process, history
from app.models import source, summary, history as history_model

# 创建所有数据库表
Base.metadata.create_all(bind=engine)

app = FastAPI(title=settings.app_name)
app = add_cors(app)

app.include_router(sources.router)
app.include_router(process.router)
app.include_router(history.router)

@app.get("/health")
def health_check():
    return {"status": "healthy"}
