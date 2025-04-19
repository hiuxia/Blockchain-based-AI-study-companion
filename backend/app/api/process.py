# backend/app/api/process.py
from fastapi import APIRouter, BackgroundTasks, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List
from app.core.database import get_db
from app.models.schemas import ProcessingRequest, TaskStatus
from app.services import task_manager, file_storage
from app.crud.source import get_source
import asyncio

router = APIRouter(prefix="/process", tags=["processing"])

@router.post("", status_code=202)
async def start_processing(
    request: ProcessingRequest,
    background_tasks: BackgroundTasks,
    db: Session = Depends(get_db)
):
    # 验证每个上传的文件是否存在
    for source_id in request.source_ids:
        if not get_source(db, source_id):
            raise HTTPException(404, detail=f"Source {source_id} not found")
    task_id = task_manager.create_task()
    # 后台任务中重新创建 Session 避免请求结束后已关闭
    background_tasks.add_task(
        process_documents_background,
        task_id,
        request.source_ids,
        request.llm_model
    )
    return {"task_id": task_id}

@router.get("/results/{task_id}", response_model=TaskStatus)
def get_processing_result(task_id: str):
    status = task_manager.get_task(task_id)
    if not status:
        raise HTTPException(404, detail="Task not found")
    return {"task_id": task_id, **status}

def process_documents_background(task_id: str, source_ids: List[str], llm_model: str):
    try:
        from app.services.task_manager import update_task
        update_task(task_id, status="processing")
        
        file_paths = []
        for source_id in source_ids:
            file_path = file_storage.file_storage.get_file_path(source_id)
            if not file_path.exists():
                raise HTTPException(404, detail=f"File with ID {source_id} not found")
            file_paths.append(str(file_path))
        
        # 输出调试信息
        print("File paths:", file_paths)
        # 调用异步函数生成 Markdown 摘要（不含引用）
        from app.langchain_agent.agent import process_documents
        markdown = asyncio.run(process_documents(file_paths, llm_model))
        print("Generated markdown:", markdown)
        
        # 使用新的数据库 Session 写入摘要记录
        from app.core.database import SessionLocal
        new_db = SessionLocal()
        try:
            from app.crud.summary import create_summary
            summary_record = create_summary(new_db, source_ids, markdown, vector_index_path=None)
            print("Summary record created, ID:", summary_record.id)
        finally:
            new_db.close()
        
        update_task(task_id, status="completed", result={
            "markdown": markdown,
            "summary_id": summary_record.id,
            "created_at": summary_record.created_at.isoformat()
        })
    except Exception as e:
        update_task(task_id, status="failed", error=str(e))
