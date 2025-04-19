# backend/app/api/sources.py
from fastapi import APIRouter, UploadFile, File, HTTPException, Depends
from sqlalchemy.orm import Session
from app.core.database import get_db
from app.crud.source import create_source, get_source
from app.models.schemas import SourceResponse
from app.services import file_storage

router = APIRouter(prefix="/sources", tags=["sources"])

@router.post("", response_model=SourceResponse)
async def upload_source(file: UploadFile = File(...), db: Session = Depends(get_db)):
    try:
        contents = await file.read()
        # 此处应调用文件存储服务将文件写入 uploaded_sources 文件夹，代码略
        # 此处仅生成数据库记录
        source_id = create_source(db, file.filename, file.content_type)
        return {"id": source_id, "filename": file.filename, "content_type": file.content_type}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
