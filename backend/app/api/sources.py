# backend/app/api/sources.py
from typing import List

from app.core.database import get_db
from app.crud.source import create_source, get_all_sources, get_source
from app.models.schemas import SourceResponse
from app.services import file_storage
from fastapi import APIRouter, Depends, File, HTTPException, UploadFile
from sqlalchemy.orm import Session

router = APIRouter(prefix="/sources", tags=["sources"])

@router.get("", response_model=List[SourceResponse])
async def get_sources(db: Session = Depends(get_db)):
    try:
        sources = get_all_sources(db)
        return [
            {"id": src.id, "filename": src.filename, "content_type": src.content_type}
            for src in sources
        ]
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


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

@router.get("/{source_id}", response_model=SourceResponse)
async def get_source_by_id(source_id: str, db: Session = Depends(get_db)):
    try:
        source = get_source(db, source_id)
        if not source:
            raise HTTPException(status_code=404, detail="Source not found")
        return {
            "id": source.id,
            "filename": source.filename,
            "content_type": source.content_type,
        }
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
