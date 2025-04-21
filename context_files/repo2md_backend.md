# Backend Documentation

 of NLP ProjectGenerated on 4/21/2025

This doc provides a comprehensive overview of the backend of the NLP Project.

## Table of Contents

- 📁 app/
  - 📁 api/
    - 📄 [history.py](#app-api-history-py)
    - 📄 [notes.py](#app-api-notes-py)
    - 📄 [process.py](#app-api-process-py)
    - 📄 [qa.py](#app-api-qa-py)
    - 📄 [sources.py](#app-api-sources-py)
    - 📄 [summaries.py](#app-api-summaries-py)
  - 📁 core/
    - 📄 [config.py](#app-core-config-py)
    - 📄 [cors.py](#app-core-cors-py)
    - 📄 [database.py](#app-core-database-py)
    - 📄 [logger.py](#app-core-logger-py)
  - 📁 crud/
    - 📄 [history.py](#app-crud-history-py)
    - 📄 [note.py](#app-crud-note-py)
    - 📄 [source.py](#app-crud-source-py)
    - 📄 [summary.py](#app-crud-summary-py)
  - 📁 langchain_agent/
    - 📄 [agent.py](#app-langchain_agent-agent-py)
    - 📄 [evaluation.py](#app-langchain_agent-evaluation-py)
    - 📄 [llm_config.py](#app-langchain_agent-llm_config-py)
    - 📄 [memory.py](#app-langchain_agent-memory-py)
    - 📄 [prompts.py](#app-langchain_agent-prompts-py)
    - 📄 [rag_agent.py](#app-langchain_agent-rag_agent-py)
    - 📄 [tools.py](#app-langchain_agent-tools-py)
  - 📄 [main.py](#app-main-py)
  - 📁 models/
    - 📄 [history.py](#app-models-history-py)
    - 📄 [note.py](#app-models-note-py)
    - 📄 [schemas.py](#app-models-schemas-py)
    - 📄 [source.py](#app-models-source-py)
    - 📄 [summary.py](#app-models-summary-py)
  - 📁 services/
    - 📄 [file_storage.py](#app-services-file_storage-py)
    - 📄 [task_manager.py](#app-services-task_manager-py)
- 📄 [list_gemini_models.py](#list_gemini_models-py)
- 📄 [migrate_files.py](#migrate_files-py)
- 📄 [new_requirements.txt](#new_requirements-txt)
- 📄 [requirements.txt](#requirements-txt)
- 📄 [start.py](#start-py)
- 📄 [test_env.py](#test_env-py)

## Source Code

### <a id="app-api-history-py"></a>app/api/history.py

```python
# backend/app/api/history.py
from fastapi import APIRouter, HTTPException, Depends
from sqlalchemy.orm import Session
from app.models.schemas import HistoryCreate, HistoryResponse
from app.crud.history import create_history, list_histories, get_history
from app.core.database import get_db

router = APIRouter(prefix="/history", tags=["history"])

@router.post("", response_model=HistoryResponse)
def save_history(history: HistoryCreate, db: Session = Depends(get_db)):
    return create_history(db, history.conversation)

@router.get("", response_model=list[HistoryResponse])
def get_all_histories(db: Session = Depends(get_db)):
    return list_histories(db)

@router.get("/{history_id}", response_model=HistoryResponse)
def read_history(history_id: str, db: Session = Depends(get_db)):
    h = get_history(db, history_id)
    if not h:
       raise HTTPException(status_code=404, detail="History not found")
    return h

```

### <a id="app-api-notes-py"></a>app/api/notes.py

```python
# backend/app/api/notes.py
from typing import List, Optional

from app.core.database import get_db
from app.crud.note import create_note, delete_note, get_note, list_notes, update_note
from app.models.schemas import NoteCreate, NoteResponse, NoteUpdate
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

router = APIRouter(prefix="/notes", tags=["notes"])


@router.post("", response_model=NoteResponse, status_code=status.HTTP_201_CREATED)
async def create_new_note(note: NoteCreate, db: Session = Depends(get_db)):
    """
    Create a new note

    Args:
        note: Note data
        db: Database session
    """
    try:
        created_note = create_note(
            db=db,
            name=note.name,
            content=note.content,
            content_type=note.content_type,
            source_summary_id=note.source_summary_id,
        )
        return created_note
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.get("", response_model=List[NoteResponse])
async def get_notes(
    source_summary_id: Optional[str] = None, db: Session = Depends(get_db)
):
    """
    Get all notes, optionally filtered by source/summary ID

    Args:
        source_summary_id: Optional ID to filter by
        db: Database session
    """
    try:
        notes = list_notes(db, source_summary_id)
        return notes
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/{note_id}", response_model=NoteResponse)
async def get_note_by_id(note_id: str, db: Session = Depends(get_db)):
    """
    Get a note by ID

    Args:
        note_id: ID of the note to get
        db: Database session
    """
    try:
        note = get_note(db, note_id)
        if not note:
            raise HTTPException(status_code=404, detail="Note not found")
        return note
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.patch("/{note_id}", response_model=NoteResponse)
async def update_note_by_id(
    note_id: str, note_update: NoteUpdate, db: Session = Depends(get_db)
):
    """
    Update a note

    Args:
        note_id: ID of the note to update
        note_update: Update data
        db: Database session
    """
    try:
        updated_note = update_note(
            db=db, note_id=note_id, name=note_update.name, content=note_update.content
        )
        if not updated_note:
            raise HTTPException(status_code=404, detail="Note not found")
        return updated_note
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.delete("/{note_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_note_by_id(note_id: str, db: Session = Depends(get_db)):
    """
    Delete a note

    Args:
        note_id: ID of the note to delete
        db: Database session
    """
    try:
        note = get_note(db, note_id)
        if not note:
            raise HTTPException(status_code=404, detail="Note not found")

        success = delete_note(db, note_id)
        if not success:
            raise HTTPException(status_code=500, detail="Failed to delete note")

        return None  # 204 No Content
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

```

### <a id="app-api-process-py"></a>app/api/process.py

```python
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

```

### <a id="app-api-qa-py"></a>app/api/qa.py

```python
# backend/app/api/qa.py
from typing import List

from app.core.database import get_db
from app.core.logger import logger
from app.langchain_agent.rag_agent import create_rag_chain
from app.services.file_storage import FileStorageService
from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from sqlalchemy.orm import Session

# Initialize the router with a prefix
router = APIRouter(prefix="/qa", tags=["qa"])

# Initialize the file storage service
file_storage = FileStorageService()


class QARequest(BaseModel):
    question: str
    source_ids: List[str]
    llm_model: str


class QAResponse(BaseModel):
    answer: str
    references: List[str]


@router.post("", response_model=QAResponse)
async def ask_question(request: QARequest, db: Session = Depends(get_db)):
    """
    Process a question using the RAG model with the specified sources.
    """
    logger.info(
        f"Received QA request with {len(request.source_ids)} sources and model {request.llm_model}"
    )

    try:
        # Validate that source_ids are provided
        if not request.source_ids:
            raise HTTPException(status_code=400, detail="No source documents selected")

        # Resolve file paths from source IDs
        paths = []
        for source_id in request.source_ids:
            try:
                file_path = file_storage.get_file_path(source_id)
                paths.append(str(file_path))
            except Exception as e:
                logger.error(
                    f"Error retrieving file path for source ID {source_id}: {str(e)}"
                )
                raise HTTPException(
                    status_code=404,
                    detail=f"File with ID {source_id} not found. Error: {str(e)}",
                )

        # Validate the LLM model selection
        valid_models = ["gemma3", "llama4"]
        if request.llm_model not in valid_models:
            request.llm_model = "gemma3"  # Default to gemma3 if not valid

        # Create RAG chain and run question
        logger.info(
            f"Creating RAG chain with model {request.llm_model} and paths: {paths}"
        )
        chain = create_rag_chain(paths, request.llm_model)
        logger.info(f"Invoking RAG chain with question: {request.question}")
        result = chain.invoke({"input": request.question})
        logger.info(f"RAG chain result keys: {result.keys()}")

        # Extract answer and source information
        answer = result.get("answer", "No answer generated")
        logger.info(f"Generated answer: {answer[:100]}...")  # Log first 100 chars

        # Extract source references
        references = []
        if "context" in result:
            logger.info(f"Context has {len(result['context'])} documents")
            for i, doc in enumerate(result["context"]):
                # Extract metadata or create a default reference
                if hasattr(doc, "metadata") and doc.metadata:
                    # Use the filename or a default name if not available
                    source_name = doc.metadata.get("source", f"Source {i + 1}")
                    references.append(source_name)
                else:
                    references.append(f"Source {i + 1}")

        logger.info(f"Generated answer with {len(references)} references")

        return QAResponse(answer=answer, references=references)

    except HTTPException:
        # Re-raise HTTP exceptions
        raise
    except Exception as e:
        logger.error(f"Error in QA processing: {str(e)}")
        raise HTTPException(
            status_code=500, detail=f"Error processing QA request: {str(e)}"
        )

```

### <a id="app-api-sources-py"></a>app/api/sources.py

```python
# backend/app/api/sources.py
import os
from typing import List

import aiofiles
from app.core.database import get_db
from app.core.logger import logger
from app.crud.source import (
    create_source,
    delete_source,
    get_all_sources,
    get_source,
    rename_source,
)
from app.models.schemas import SourceResponse, SourceUpdate
from app.models.source import DBSource
from app.services.file_storage import file_storage
from fastapi import APIRouter, Depends, File, HTTPException, UploadFile, status
from sqlalchemy.orm import Session

router = APIRouter(prefix="/sources", tags=["sources"])

@router.get("", response_model=List[SourceResponse])
async def get_sources(db: Session = Depends(get_db)):
    try:
        logger.info("API request: Get all sources")
        sources = get_all_sources(db)
        logger.debug(f"Retrieved {len(sources)} sources")
        return [
            {"id": src.id, "filename": src.filename, "content_type": src.content_type}
            for src in sources
        ]
    except Exception as e:
        logger.error(f"Error getting sources: {str(e)}", exc_info=True)
        raise HTTPException(status_code=500, detail=str(e))


@router.post("", response_model=SourceResponse)
async def upload_source(file: UploadFile = File(...), db: Session = Depends(get_db)):
    try:
        logger.info(f"API request: Upload source file: {file.filename}")

        # Read file content
        contents = await file.read()

        # Auto-rename logic if filename already exists in database
        original_filename = file.filename
        if original_filename is None:
            original_filename = "unnamed_file.pdf"
            logger.warning(
                "Uploaded file has no filename, using default: unnamed_file.pdf"
            )

        base_name, extension = os.path.splitext(original_filename)
        counter = 1
        new_filename = original_filename

        # Check if filename exists and rename if needed
        existing_files = (
            db.query(DBSource).filter(DBSource.filename == new_filename).all()
        )
        while existing_files:
            new_filename = f"{base_name}({counter}){extension}"
            logger.debug(
                f"File with name '{original_filename}' already exists, using '{new_filename}' instead"
            )
            counter += 1
            existing_files = (
                db.query(DBSource).filter(DBSource.filename == new_filename).all()
            )

        # Generate source_id
        import uuid

        source_id = str(uuid.uuid4())
        logger.debug(f"Generated source ID: {source_id}")

        # Create source in database first
        source_id = create_source(
            db,
            new_filename,
            content_type=file.content_type or "application/octet-stream",
        )
        logger.debug(f"Created source record with ID: {source_id}")

        # Now get file path - this ensures we're working with correct source ID
        file_path = file_storage.get_file_path(source_id)
        logger.debug(f"File will be saved to: {file_path}")

        # Ensure parent directory exists
        os.makedirs(os.path.dirname(file_path), exist_ok=True)

        # Save file content to disk
        async with aiofiles.open(file_path, "wb") as out_file:
            await out_file.write(contents)
        logger.debug(f"Successfully saved file to disk: {file_path}")

        # Verify file was actually saved
        if os.path.exists(file_path):
            logger.debug(f"Verified file exists at: {file_path}")
        else:
            logger.warning(f"Could not verify file exists at: {file_path}")
            # Try to save again with absolute path
            absolute_path = os.path.abspath(file_path)
            logger.debug(f"Trying with absolute path: {absolute_path}")
            os.makedirs(os.path.dirname(absolute_path), exist_ok=True)
            async with aiofiles.open(absolute_path, "wb") as out_file:
                await out_file.write(contents)

            if os.path.exists(absolute_path):
                logger.debug(
                    f"Successfully saved file to alternate location: {absolute_path}"
                )
            else:
                logger.error(f"Failed to save file to either location")

        logger.info(f"Successfully uploaded source: {new_filename} (ID: {source_id})")

        return {
            "id": source_id,
            "filename": new_filename,
            "content_type": file.content_type or "application/octet-stream",
        }
    except Exception as e:
        logger.error(f"Error uploading source: {str(e)}", exc_info=True)
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/{source_id}", response_model=SourceResponse)
async def get_source_by_id(source_id: str, db: Session = Depends(get_db)):
    try:
        logger.info(f"API request: Get source by ID: {source_id}")
        source = get_source(db, source_id)
        if not source:
            logger.warning(f"Source not found: {source_id}")
            raise HTTPException(status_code=404, detail="Source not found")

        logger.debug(f"Retrieved source: {source.filename} (ID: {source_id})")
        return {
            "id": source.id,
            "filename": source.filename,
            "content_type": source.content_type,
        }
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error getting source {source_id}: {str(e)}", exc_info=True)
        raise HTTPException(status_code=500, detail=str(e))


@router.delete("/{source_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_source_by_id(source_id: str, db: Session = Depends(get_db)):
    try:
        logger.info(f"API request: Delete source by ID: {source_id}")

        # Check if source exists
        source = get_source(db, source_id)
        if not source:
            logger.warning(f"Cannot delete: Source not found: {source_id}")
            raise HTTPException(status_code=404, detail="Source not found")

        logger.debug(f"Found source to delete: {source.filename} (ID: {source_id})")

        # Delete the source and its file
        success = delete_source(db, source_id)
        if not success:
            logger.error(f"Failed to delete source: {source_id}")
            raise HTTPException(status_code=500, detail="Failed to delete source")

        logger.info(f"Successfully deleted source: {source_id}")
        return None  # 204 No Content response
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error deleting source {source_id}: {str(e)}", exc_info=True)
        raise HTTPException(status_code=500, detail=str(e))


@router.patch("/{source_id}", response_model=SourceResponse)
async def update_source(
    source_id: str, source_update: SourceUpdate, db: Session = Depends(get_db)
):
    try:
        logger.info(
            f"API request: Update source {source_id} with filename: {source_update.filename}"
        )

        # Check if source exists
        source = get_source(db, source_id)
        if not source:
            logger.warning(f"Cannot update: Source not found: {source_id}")
            raise HTTPException(status_code=404, detail="Source not found")

        logger.debug(f"Found source to update: {source.filename} (ID: {source_id})")

        # Auto-rename logic if the new filename already exists in database
        new_filename = source_update.filename
        base_name, extension = os.path.splitext(new_filename)
        counter = 1

        # Check if filename exists (excluding the current source) and rename if needed
        existing_files = (
            db.query(DBSource)
            .filter(DBSource.filename == new_filename, DBSource.id != source_id)
            .all()
        )

        while existing_files:
            new_filename = f"{base_name}({counter}){extension}"
            logger.debug(
                f"Name '{source_update.filename}' already in use, using '{new_filename}' instead"
            )
            counter += 1
            existing_files = (
                db.query(DBSource)
                .filter(DBSource.filename == new_filename, DBSource.id != source_id)
                .all()
            )

        # Update the source name
        success = rename_source(db, source_id, new_filename)
        if not success:
            logger.error(f"Failed to update source: {source_id}")
            raise HTTPException(status_code=500, detail="Failed to update source")

        # Get updated source
        updated_source = get_source(db, source_id)
        if updated_source is None:
            logger.error(f"Source {source_id} not found after update")
            raise HTTPException(status_code=404, detail="Source not found after update")

        logger.info(
            f"Successfully updated source {source_id} to filename: {new_filename}"
        )
        return {
            "id": updated_source.id,
            "filename": updated_source.filename,
            "content_type": updated_source.content_type,
        }
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error updating source {source_id}: {str(e)}", exc_info=True)
        raise HTTPException(status_code=500, detail=str(e))

```

### <a id="app-api-summaries-py"></a>app/api/summaries.py

```python
from typing import List

from app.core.database import get_db
from app.crud.summary import (
    delete_summary,
    get_summary,
    list_named_summaries,
    list_summaries,
    update_summary_name,
)
from app.models.schemas import SummaryResponse, SummaryUpdate
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

router = APIRouter(prefix="/summaries", tags=["summaries"])


@router.get("", response_model=List[SummaryResponse])
async def get_summaries(named_only: bool = False, db: Session = Depends(get_db)):
    """
    Get all summaries, optionally filtered by named only

    Args:
        named_only: If True, only return summaries with a name
        db: Database session
    """
    try:
        if named_only:
            summaries = list_named_summaries(db)
        else:
            summaries = list_summaries(db)

        # Convert DB model to response schema with List[str] for source_ids
        return [
            {
                "id": summary.id,
                "name": summary.name,
                "source_ids": summary.source_ids.split(",")
                if summary.source_ids
                else [],
                "markdown": summary.markdown,
                "vector_index_path": summary.vector_index_path,
                "created_at": summary.created_at,
            }
            for summary in summaries
        ]
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/{summary_id}", response_model=SummaryResponse)
async def get_summary_by_id(summary_id: str, db: Session = Depends(get_db)):
    """
    Get a summary by ID

    Args:
        summary_id: ID of the summary to get
        db: Database session
    """
    try:
        summary = get_summary(db, summary_id)
        if not summary:
            raise HTTPException(status_code=404, detail="Summary not found")

        return {
            "id": summary.id,
            "name": summary.name,
            "source_ids": summary.source_ids.split(",") if summary.source_ids else [],
            "markdown": summary.markdown,
            "vector_index_path": summary.vector_index_path,
            "created_at": summary.created_at,
        }
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.patch("/{summary_id}", response_model=SummaryResponse)
async def update_summary(
    summary_id: str, summary_update: SummaryUpdate, db: Session = Depends(get_db)
):
    """
    Update a summary's name

    Args:
        summary_id: ID of the summary to update
        summary_update: Update data
        db: Database session
    """
    try:
        updated_summary = update_summary_name(db, summary_id, summary_update.name)
        if not updated_summary:
            raise HTTPException(status_code=404, detail="Summary not found")

        return {
            "id": updated_summary.id,
            "name": updated_summary.name,
            "source_ids": updated_summary.source_ids.split(",")
            if updated_summary.source_ids
            else [],
            "markdown": updated_summary.markdown,
            "vector_index_path": updated_summary.vector_index_path,
            "created_at": updated_summary.created_at,
        }
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.delete("/{summary_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_summary_by_id(summary_id: str, db: Session = Depends(get_db)):
    """
    Delete a summary

    Args:
        summary_id: ID of the summary to delete
        db: Database session
    """
    try:
        # Check if summary exists
        summary = get_summary(db, summary_id)
        if not summary:
            raise HTTPException(status_code=404, detail="Summary not found")

        # Delete the summary
        success = delete_summary(db, summary_id)
        if not success:
            raise HTTPException(status_code=500, detail="Failed to delete summary")

        return None  # 204 No Content response
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

```

### <a id="app-core-config-py"></a>app/core/config.py

```python
# backend/app/core/config.py
import os
from pathlib import Path
from typing import Optional

from pydantic_settings import BaseSettings

openai_api_key: Optional[str] = None

# Get the base project directory (where backend is located)
CURRENT_DIR = Path(__file__).resolve().parent.parent.parent
# Sets the PROJECT_ROOT one level up from the backend directory
# This accommodates the merged frontend/backend structure
PROJECT_ROOT = CURRENT_DIR.parent


class Settings(BaseSettings):
    app_name: str = "Document Processor"
    database_url: str = f"sqlite:///{CURRENT_DIR}/documents.db"
    # Store user uploaded files in an absolute path
    upload_dir: Path = CURRENT_DIR / "uploaded_sources"
    # 配置相关 API Key
    openai_api_key: Optional[str] = None
    openrouter_api_key: str
    gemini_api_key: str

    class Config:
        env_file = ".env"
        env_file_encoding = "utf-8"
        # Pydantic V2 中将 orm_mode 改为 from_attributes
        from_attributes = True

settings = Settings()

```

### <a id="app-core-cors-py"></a>app/core/cors.py

```python
# backend/app/core/cors.py
from fastapi.middleware.cors import CORSMiddleware

def add_cors(app):
    app.add_middleware(
        CORSMiddleware,
        allow_origins=["*"],  # 开发阶段允许所有跨域请求，生产环境建议限制具体来源
        allow_credentials=True,
        allow_methods=["*"],
        allow_headers=["*"],
    )
    return app

```

### <a id="app-core-database-py"></a>app/core/database.py

```python
# backend/app/core/database.py
from sqlalchemy import create_engine
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker
from app.core.config import settings

engine = create_engine(settings.database_url, connect_args={"check_same_thread": False})
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
Base = declarative_base()

def get_db():
    """
    FastAPI 依赖，用于生成数据库 Session，并确保请求结束后关闭。
    使用方法：
      db: Session = Depends(get_db)
    """
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


```

### <a id="app-core-logger-py"></a>app/core/logger.py

```python
import datetime
import logging
import os
from logging.handlers import RotatingFileHandler
from pathlib import Path

# Create logging directory if it doesn't exist
LOG_DIR = Path("logging")
if not LOG_DIR.exists():
    LOG_DIR.mkdir(parents=True, exist_ok=True)

# Generate log file name with date stamp
current_date = datetime.datetime.now().strftime("%Y-%m-%d")
LOG_FILE = LOG_DIR / f"app_{current_date}.log"


# Configure logger
def setup_logger():
    """Configure the application logger."""
    logger = logging.getLogger("app")
    logger.setLevel(logging.DEBUG)

    # File handler for all logs (DEBUG and above)
    file_handler = RotatingFileHandler(
        LOG_FILE,
        maxBytes=10 * 1024 * 1024,  # 10MB
        backupCount=5,
    )
    file_handler.setLevel(logging.DEBUG)
    file_format = logging.Formatter(
        "%(asctime)s - %(name)s - %(levelname)s - %(module)s:%(lineno)d - %(message)s"
    )
    file_handler.setFormatter(file_format)

    # Stream handler (console) for INFO and above
    console_handler = logging.StreamHandler()
    console_handler.setLevel(logging.INFO)
    console_format = logging.Formatter("%(levelname)s - %(message)s")
    console_handler.setFormatter(console_format)

    # Add handlers to logger
    logger.addHandler(file_handler)
    logger.addHandler(console_handler)

    return logger


# Create the application logger
logger = setup_logger()

```

### <a id="app-crud-history-py"></a>app/crud/history.py

```python
# backend/app/crud/history.py
import uuid
from sqlalchemy.orm import Session
from app.models.history import DBHistory

def create_history(db: Session, conversation: str) -> DBHistory:
    history = DBHistory(
        id=str(uuid.uuid4()),
        conversation=conversation
    )
    db.add(history)
    db.commit()
    db.refresh(history)
    return history

def get_history(db: Session, history_id: str) -> DBHistory:
    return db.query(DBHistory).filter(DBHistory.id == history_id).first()

def list_histories(db: Session):
    return db.query(DBHistory).all()

```

### <a id="app-crud-note-py"></a>app/crud/note.py

```python
# backend/app/crud/note.py
import uuid
from typing import List, Optional

from app.models.note import DBNote
from sqlalchemy.orm import Session


def create_note(
    db: Session,
    name: str,
    content: str,
    content_type: str = "text/markdown",
    source_summary_id: Optional[str] = None,
) -> DBNote:
    """
    Create a new note

    Args:
        db: Database session
        name: Name of the note
        content: Content of the note
        content_type: MIME type of the content, defaults to text/markdown
        source_summary_id: Optional ID of a related source or summary

    Returns:
        The created note
    """
    note = DBNote(
        id=str(uuid.uuid4()),
        name=name,
        content=content,
        content_type=content_type,
        source_summary_id=source_summary_id,
    )
    db.add(note)
    db.commit()
    db.refresh(note)
    return note


def get_note(db: Session, note_id: str) -> Optional[DBNote]:
    """
    Get a note by ID

    Args:
        db: Database session
        note_id: ID of the note to retrieve

    Returns:
        The note or None if not found
    """
    return db.query(DBNote).filter(DBNote.id == note_id).first()


def list_notes(db: Session, source_summary_id: Optional[str] = None) -> List[DBNote]:
    """
    List all notes, optionally filtered by source_summary_id

    Args:
        db: Database session
        source_summary_id: Optional ID to filter by related source/summary

    Returns:
        List of notes
    """
    if source_summary_id:
        return (
            db.query(DBNote).filter(DBNote.source_summary_id == source_summary_id).all()
        )
    return db.query(DBNote).all()


def update_note(
    db: Session, note_id: str, name: Optional[str] = None, content: Optional[str] = None
) -> Optional[DBNote]:
    """
    Update a note

    Args:
        db: Database session
        note_id: ID of the note to update
        name: Optional new name
        content: Optional new content

    Returns:
        Updated note or None if not found
    """
    note = get_note(db, note_id)
    if not note:
        return None

    if name is not None:
        note.name = name
    if content is not None:
        note.content = content

    db.commit()
    db.refresh(note)
    return note


def delete_note(db: Session, note_id: str) -> bool:
    """
    Delete a note

    Args:
        db: Database session
        note_id: ID of the note to delete

    Returns:
        True if successful, False otherwise
    """
    note = get_note(db, note_id)
    if not note:
        return False

    db.delete(note)
    db.commit()
    return True

```

### <a id="app-crud-source-py"></a>app/crud/source.py

```python
# backend/app/crud/source.py
import os
import shutil
from pathlib import Path

from app.core.logger import logger
from app.models.source import DBSource
from app.services.file_storage import file_storage
from sqlalchemy.orm import Session


def get_source(db: Session, source_id: str):
    logger.debug(f"Getting source with ID: {source_id}")
    return db.query(DBSource).filter(DBSource.id == source_id).first()


def get_all_sources(db: Session):
    logger.debug("Getting all sources")
    return db.query(DBSource).all()


def create_source(db: Session, filename: str, content_type: str) -> str:
    import uuid

    logger.info(f"Creating new source: {filename}")
    source_id = str(uuid.uuid4())
    source = DBSource(id=source_id, filename=filename, content_type=content_type)
    db.add(source)
    db.commit()
    db.refresh(source)
    logger.debug(f"Created source with ID: {source_id}")
    return source_id


def delete_source(db: Session, source_id: str) -> bool:
    """
    Delete a source record and its associated file.

    Args:
        db: Database session
        source_id: ID of the source to delete

    Returns:
        True if deletion was successful, False otherwise
    """
    source = get_source(db, source_id)
    if not source:
        logger.warning(f"Failed to delete source: source with ID {source_id} not found")
        return False

    # Get the filename from the database record for logging
    stored_filename = source.filename
    logger.info(f"Deleting source {source_id} (filename: {stored_filename})")

    # Check if file exists using the new method
    file_exists = file_storage.file_exists(source_id)

    # Get file path from the service
    file_path = file_storage.get_file_path(source_id)

    # Try to delete the file if it exists according to our check
    if file_exists:
        try:
            logger.debug(f"Removing physical file: {file_path}")
            os.remove(file_path)
            logger.debug(f"Successfully removed file: {file_path}")
        except (OSError, PermissionError) as e:
            # Log the error but continue to delete the DB record
            logger.error(f"Error deleting file {file_path}: {e}")
    else:
        # Try alternative locations as a fallback
        found = False

        # Try current working directory
        cwd_path = Path.cwd() / "uploaded_sources" / f"{source_id}.pdf"
        if cwd_path.exists():
            try:
                logger.warning(f"Found file in alternate location: {cwd_path}")
                os.remove(cwd_path)
                logger.debug(
                    f"Successfully removed file from alternate location: {cwd_path}"
                )
                found = True
            except (OSError, PermissionError) as e:
                logger.error(
                    f"Error deleting file from alternate location {cwd_path}: {e}"
                )

        if not found:
            logger.warning(f"Physical file does not exist: {file_path}")

    # Delete the database record
    logger.debug(f"Removing database record for source {source_id}")
    db.delete(source)
    db.commit()
    logger.info(f"Successfully deleted source {source_id}")
    return True


def rename_source(db: Session, source_id: str, new_filename: str) -> bool:
    """
    Rename a source by updating its filename in the database.
    Note: This only updates the database record, not the physical file.

    Args:
        db: Database session
        source_id: ID of the source to rename
        new_filename: New filename to set

    Returns:
        True if update was successful, False otherwise
    """
    source = get_source(db, source_id)
    if not source:
        logger.warning(f"Failed to rename source: source with ID {source_id} not found")
        return False

    # Store the old filename for logging
    old_filename = source.filename
    logger.info(
        f"Renaming source {source_id} from '{old_filename}' to '{new_filename}'"
    )

    # Update the filename in the database
    source.filename = new_filename
    db.commit()
    db.refresh(source)
    logger.debug(f"Successfully renamed source {source_id}")
    return True

```

### <a id="app-crud-summary-py"></a>app/crud/summary.py

```python
# backend/app/crud/summary.py
import uuid
from typing import List, Optional

from app.models.summary import DBSummary
from sqlalchemy.orm import Session


def create_summary(
    db: Session,
    source_ids: list[str],
    markdown: str,
    name: Optional[str] = None,
    vector_index_path: str = None,
) -> DBSummary:
    """
    Create a new summary record

    Args:
        db: Database session
        source_ids: List of source IDs associated with this summary
        markdown: Markdown content of the summary
        name: Optional name for the summary
        vector_index_path: Optional path to vector index file

    Returns:
        The created DBSummary object
    """
    summary = DBSummary(
        id=str(uuid.uuid4()),
        name=name,
        source_ids=",".join(source_ids),
        markdown=markdown,
        vector_index_path=vector_index_path,
    )
    db.add(summary)
    db.commit()
    db.refresh(summary)
    return summary

def get_summary(db: Session, summary_id: str) -> Optional[DBSummary]:
    """
    Get a summary by ID

    Args:
        db: Database session
        summary_id: ID of the summary

    Returns:
        The summary or None if not found
    """
    return db.query(DBSummary).filter(DBSummary.id == summary_id).first()


def list_summaries(db: Session) -> List[DBSummary]:
    """
    List all summaries

    Args:
        db: Database session

    Returns:
        List of all summaries
    """
    return db.query(DBSummary).all()


def list_named_summaries(db: Session) -> List[DBSummary]:
    """
    List all named summaries (where name is not null)

    Args:
        db: Database session

    Returns:
        List of named summaries
    """
    return db.query(DBSummary).filter(DBSummary.name != None).all()


def update_summary_name(db: Session, summary_id: str, name: str) -> Optional[DBSummary]:
    """
    Update the name of a summary

    Args:
        db: Database session
        summary_id: ID of the summary to update
        name: New name for the summary

    Returns:
        Updated summary or None if not found
    """
    summary = get_summary(db, summary_id)
    if not summary:
        return None

    summary.name = name
    db.commit()
    db.refresh(summary)
    return summary


def delete_summary(db: Session, summary_id: str) -> bool:
    """
    Delete a summary

    Args:
        db: Database session
        summary_id: ID of the summary to delete

    Returns:
        True if deletion successful, False otherwise
    """
    summary = get_summary(db, summary_id)
    if not summary:
        return False

    db.delete(summary)
    db.commit()
    return True

```

### <a id="app-langchain_agent-agent-py"></a>app/langchain_agent/agent.py

```python
# backend/app/langchain_agent/agent.py
import asyncio
from typing import List
from langchain.chains import LLMChain
from langchain.output_parsers import StrOutputParser
from langchain.schema import Document
from .llm_config import get_llm
from .prompts import SUMMARY_PROMPT, CONVERSATION_PROMPT
from .tools import load_documents

async def process_documents(file_paths: List[str], llm_model: str) -> str:
    """
    根据给定的 PDF 文件路径列表，加载文件内容并拆分，
    调用 LLM 生成结构化的 Markdown 摘要（不含引用）。
    """
    docs: List[Document] = load_documents(file_paths)
    content = "\n\n".join([doc.page_content for doc in docs])
    llm = get_llm(llm_model)
    chain = LLMChain(
        llm=llm,
        prompt=SUMMARY_PROMPT,
        output_parser=StrOutputParser()
    )
    output = await chain.ainvoke({"context": content})
    return output

def create_conversational_agent(memory_type: str = "buffer", llm_model: str = "gemini-flash"):
    """
    创建一个带记忆的交互式对话代理，
    在与用户多轮对话中生成回答时会包含引用，
    同时保留对话历史。
    """
    from langchain.agents import initialize_agent, AgentType
    from .memory import get_conversation_memory
    memory = get_conversation_memory(memory_type)
    llm = get_llm(llm_model)
    agent = initialize_agent(
        tools=[],  # 如有需要，可增加额外工具
        llm=llm,
        agent=AgentType.CONVERSATIONAL_REACT_DESCRIPTION,
        memory=memory,
        verbose=True,
        prompt=CONVERSATION_PROMPT
    )
    return agent

```

### <a id="app-langchain_agent-evaluation-py"></a>app/langchain_agent/evaluation.py

```python
# backend/app/langchain_agent/evaluation.py
from langchain.chains import LLMChain
from langchain.prompts import ChatPromptTemplate
from langchain.output_parsers import StrOutputParser
from .llm_config import get_llm

EVALUATION_PROMPT = ChatPromptTemplate.from_messages([
    ("system", "你是一位严谨的评估员。请基于下方检索结果，对生成的答案的准确性、逻辑性及相关性做出详细评价。"),
    ("human", "检索结果:\n{search_results}\n\n生成答案:\n{answer}\n\n请详细评价并提供改进建议。")
])

def evaluate_answer(answer: str, search_results: str, llm_model: str = "gemini-flash") -> str:
    """
    利用 LLM 对生成的答案进行评价，返回详细的评价文本。
    """
    llm = get_llm(llm_model)
    chain = LLMChain(
        llm=llm,
        prompt=EVALUATION_PROMPT,
        output_parser=StrOutputParser()
    )
    evaluation = chain.run({"search_results": search_results, "answer": answer})
    return evaluation

```

### <a id="app-langchain_agent-llm_config-py"></a>app/langchain_agent/llm_config.py

```python
# backend/app/langchain_agent/llm_config.py
import os

from app.core.config import settings
from app.core.logger import logger
from google.generativeai.types import HarmBlockThreshold, HarmCategory
from langchain_community.llms import HuggingFaceTextGenInference
from langchain_core.language_models import BaseChatModel
from langchain_google_genai import ChatGoogleGenerativeAI
from pydantic import SecretStr


def get_llm(model_name: str = "gemma3") -> BaseChatModel:
    """
    根据提供的模型名称初始化并返回对应的 LLM 模型实例。

    参数:
      - model_name: 模型名称，支持 'gemma3' 和 'llama4'

    返回:
      - 一个 BaseChatModel 实例
    """
    logger.info(f"Initializing LLM with model: {model_name}")

    if model_name == "llama4":
        try:
            # This is a placeholder for LLaMA 4 integration
            # In a real implementation, you would configure the actual endpoint
            logger.info("Using Llama 4 model")
            return HuggingFaceTextGenInference(
                inference_server_url="http://localhost:8080/",
                max_new_tokens=512,
                temperature=0.7,
                stop_sequences=["\n\n"],
                timeout=120,
            )
        except Exception as e:
            logger.error(
                f"Failed to initialize Llama 4 model: {str(e)}. Falling back to Gemma 3."
            )
            # Fall back to Gemma 3 if Llama 4 fails
            return get_gemini_model()
    else:
        # Default to Gemma 3
        return get_gemini_model()

def get_gemini_model() -> BaseChatModel:
    """
    初始化并返回 Gemma 模型实例。

    参数说明：
      - 使用 ChatGoogleGenerativeAI 调用 Gemma 3 模型。
      - convert_system_message_to_human 设置为 True，有助于适应对话场景。
      - safety_settings 参数使用数字枚举值，以符合 API 要求。
      - temperature 参数设为 0.7，用于控制输出的随机性。

    返回：
      - 一个 BaseChatModel 实例。
    """
    logger.info("Using Gemma 3-27B model")
    gemini_api_key = settings.gemini_api_key
    if not gemini_api_key:
        logger.warning("GEMINI_API_KEY not found in settings")

    safety_settings = {
        HarmCategory.HARM_CATEGORY_HARASSMENT: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE,
        HarmCategory.HARM_CATEGORY_HATE_SPEECH: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE,
        HarmCategory.HARM_CATEGORY_SEXUALLY_EXPLICIT: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE,
        HarmCategory.HARM_CATEGORY_DANGEROUS_CONTENT: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE,
    }
    return ChatGoogleGenerativeAI(
        model="models/gemma-3-27b-it",  # Using Gemma 3 27B model as specified
        temperature=0.7,
        convert_system_message_to_human=True,
        safety_settings=safety_settings,
        google_api_key=SecretStr(gemini_api_key) if gemini_api_key else None,
    )

# For backward compatibility
load_llm = get_gemini_model

```

### <a id="app-langchain_agent-memory-py"></a>app/langchain_agent/memory.py

```python
# backend/app/langchain_agent/memory.py

from langchain.memory import ConversationBufferMemory
from langchain.chains.conversation.base import ConversationChain
from langchain_core.language_models import BaseChatModel

def get_conversation_memory() -> ConversationBufferMemory:
    """
    返回一个基于缓冲区的对话记忆实例，用于保存所有对话历史。
    """
    return ConversationBufferMemory(return_messages=True)

def build_memory_chain(llm: BaseChatModel) -> ConversationChain:
    """
    构造一个带有内存记录的对话链。
    
    参数：
      - llm: 已初始化的语言模型实例。
      
    返回:
      - ConversationChain 对象，该对象可以用于多轮对话，并保留对话历史。
    """
    memory = get_conversation_memory()
    return ConversationChain(
        llm=llm,
        memory=memory,
        verbose=True
    )

```

### <a id="app-langchain_agent-prompts-py"></a>app/langchain_agent/prompts.py

```python
# backend/app/langchain_agent/prompts.py
from langchain_core.prompts import ChatPromptTemplate

# 针对 PDF 文档生成 Markdown 摘要（不含引用）
SUMMARY_PROMPT = ChatPromptTemplate.from_messages([
    ("system", "你是一位学习助理，请根据以下文档内容生成结构化的 Markdown 笔记，要求内容准确、层次清晰。"),
    ("human", "{context}")
])

# 针对对话交互，要求回答中包含引用，并且只基于提供的文档内容回答
CONVERSATION_PROMPT = ChatPromptTemplate.from_messages(
    [
        (
            "system",
            """你是一位智能学习助理，将帮助用户理解他们上传的文档。

重要规则：
1. 只使用提供的文档内容回答问题
2. 如果问题无法从提供的文档内容中回答，请明确告知用户："我无法从提供的文档中找到这个问题的答案"
3. 不要使用你的训练数据或背景知识来回答没有在文档中找到的内容
4. 在回答中引用相关文档的出处，例如："根据[文档X]，..."
5. 回答应当准确、简洁、条理清晰

请为用户提供有帮助且仅基于所提供文档的回答。""",
        ),
        ("human", "问题: {input}\n\n以下是相关的文档内容:\n{context}"),
    ]
)

```

### <a id="app-langchain_agent-rag_agent-py"></a>app/langchain_agent/rag_agent.py

```python
# backend/app/langchain_agent/rag_agent.py
from typing import Any, Dict, List

# Updated imports for new LangChain structure
from langchain.chains import create_retrieval_chain
from langchain.chains.combine_documents import create_stuff_documents_chain
from langchain_community.embeddings import HuggingFaceEmbeddings

# Update imports to use langchain_core instead of langchain when possible
from langchain_community.vectorstores import FAISS
from langchain_core.documents import Document
from langchain_core.embeddings import Embeddings

from .llm_config import get_llm
from .prompts import CONVERSATION_PROMPT
from .tools import load_documents


def load_documents_for_rag(paths: List[str]) -> List[Document]:
    """
    从给定的 PDF 文件路径列表中加载文档，并拆分为多个文本块，
    返回所有文本块（chunk）的列表。
    """
    docs = load_documents(paths)
    return docs


def create_vectorstore_from_docs(docs: List[Document]) -> FAISS:
    """
    根据文档列表计算嵌入向量，并利用 FAISS 构建向量存储。
    """
    embeddings = HuggingFaceEmbeddings(model_name="all-MiniLM-L6-v2")
    vectorstore = FAISS.from_documents(docs, embeddings)
    return vectorstore


def create_rag_chain(paths: List[str], llm_model: str, top_k: int = 3):
    """
    构建 Retrieval-Augmented Generation（RAG）问答链：
    1. 加载 PDF 并拆分为文本块；
    2. 根据文本块计算嵌入并构建 FAISS 向量存储；
    3. 配置检索器，返回与查询最相关的 top_k 个文本块；
    4. 利用 LLM 生成答案（"stuff" 模式）。
    """
    # 加载文档
    docs = load_documents_for_rag(paths)

    # 构建向量存储
    vectorstore = create_vectorstore_from_docs(docs)

    # 获取 LLM
    llm = get_llm(llm_model)

    # 配置检索器
    retriever = vectorstore.as_retriever(search_kwargs={"k": top_k})

    # 使用新的 create_retrieval_chain 方法构建 RAG 链
    combine_docs_chain = create_stuff_documents_chain(llm, CONVERSATION_PROMPT)
    qa_chain = create_retrieval_chain(retriever, combine_docs_chain)

    return qa_chain

if __name__ == "__main__":
    file_paths = ["uploaded_sources/sample.pdf"]  # 确保该文件存在
    rag_chain = create_rag_chain(file_paths, "gemma3")
    query = "请总结这份文档的主要内容。"
    result = rag_chain.invoke({"input": query})
    print("RAG Chain Answer:\n", result["answer"])
    print("\nSources:\n", [doc.metadata for doc in result["context"]])

```

### <a id="app-langchain_agent-tools-py"></a>app/langchain_agent/tools.py

```python
# backend/app/langchain_agent/tools.py

import os
from pathlib import Path
from typing import List

from app.core.config import settings
from app.core.logger import logger
from langchain_community.document_loaders import PyPDFLoader
from langchain_community.embeddings import OpenAIEmbeddings
from langchain_community.vectorstores import FAISS
from langchain_core.documents import Document
from langchain_google_genai import GoogleGenerativeAIEmbeddings
from langchain_text_splitters import RecursiveCharacterTextSplitter
from pydantic import SecretStr

# 设置向量数据库的本地保存目录
VECTORSTORE_DIR = Path("vectorstore")


def load_documents(pdf_paths: List[str]) -> List[Document]:
    """
    加载 PDF 文档并拆分为文本块。

    参数:
        - pdf_paths: PDF 文件路径列表

    返回:
        - 拆分后的文档块列表
    """
    return load_and_split_pdfs(pdf_paths)


def load_and_split_pdfs(pdf_paths: List[str]) -> List[Document]:
    """
    根据给定的 PDF 文件路径列表，加载文件内容并拆分成多个文本块（chunk）。
    """
    documents: List[Document] = []
    for path in pdf_paths:
        loader = PyPDFLoader(path)
        raw_docs = loader.load()
        documents.extend(raw_docs)
    splitter = RecursiveCharacterTextSplitter(chunk_size=500, chunk_overlap=50)
    return splitter.split_documents(documents)


def embed_documents(
    chunks: List[Document], store_name: str, embedding_model: str = "google"
) -> FAISS:
    """
    对拆分好的文本块计算嵌入向量，并利用 FAISS 构建一个向量存储，持久化存储到本地。

    参数：
      - chunks: 文本块列表，每个元素为一个 Document 对象。
      - store_name: 指定存储的名称（文件名），用于后续加载。
      - embedding_model: 选择使用的嵌入模型，默认为 "openai"，可选 "google"。

    返回:
      - 构建好的 FAISS 向量存储对象。
    """
    if embedding_model == "google":
        gemini_api_key = settings.gemini_api_key
        if not gemini_api_key:
            logger.warning("GEMINI_API_KEY not found in settings")
        embedding = GoogleGenerativeAIEmbeddings(
            model="models/embedding-001",
            google_api_key=SecretStr(gemini_api_key) if gemini_api_key else None,
        )
    else:
        embedding = OpenAIEmbeddings()
    vectorstore = FAISS.from_documents(chunks, embedding)
    save_path = VECTORSTORE_DIR / store_name
    vectorstore.save_local(str(save_path))
    return vectorstore


def load_vectorstore(store_name: str, embedding_model: str = "openai") -> FAISS:
    """
    加载指定名称的本地 FAISS 向量存储。

    参数：
      - store_name: 向量存储保存的文件名。
      - embedding_model: 使用的嵌入模型。

    返回:
      - 加载后的 FAISS 向量存储对象。
    """
    if embedding_model == "google":
        gemini_api_key = settings.gemini_api_key
        if not gemini_api_key:
            logger.warning("GEMINI_API_KEY not found in settings")
        embedding = GoogleGenerativeAIEmbeddings(
            model="models/embedding-001",
            google_api_key=SecretStr(gemini_api_key) if gemini_api_key else None,
        )
    else:
        embedding = OpenAIEmbeddings()
    return FAISS.load_local(str(VECTORSTORE_DIR / store_name), embeddings=embedding)

```

### <a id="app-main-py"></a>app/main.py

```python
# backend/app/main.py
from app.api import history, notes, process, qa, sources, summaries
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
app.include_router(qa.router)

logger.info(f"Starting {settings.app_name} application")

@app.get("/health")
def health_check():
    logger.debug("Health check endpoint called")
    return {"status": "healthy"}

```

### <a id="app-models-history-py"></a>app/models/history.py

```python
# backend/app/models/history.py
from sqlalchemy import Column, String, Text, DateTime, func
from app.core.database import Base

class DBHistory(Base):
    __tablename__ = "histories"
    id = Column(String, primary_key=True, index=True)
    conversation = Column(Text, nullable=False)  # 存储对话历史（用户与 LLM 的交互内容）
    created_at = Column(DateTime(timezone=True), server_default=func.now())

```

### <a id="app-models-note-py"></a>app/models/note.py

```python
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

```

### <a id="app-models-schemas-py"></a>app/models/schemas.py

```python
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

```

### <a id="app-models-source-py"></a>app/models/source.py

```python
# backend/app/models/source.py
from sqlalchemy import Column, String, DateTime, func
from app.core.database import Base

class DBSource(Base):
    __tablename__ = "sources"
    id = Column(String, primary_key=True, index=True)
    filename = Column(String, nullable=False)
    content_type = Column(String, nullable=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now())

```

### <a id="app-models-summary-py"></a>app/models/summary.py

```python
# backend/app/models/summary.py
from app.core.database import Base
from sqlalchemy import Column, DateTime, String, Text, func


class DBSummary(Base):
    __tablename__ = "summaries"
    id = Column(String, primary_key=True, index=True)
    name = Column(String, nullable=True)  # Optional name field for saving summaries
    source_ids = Column(String, nullable=False)  # 存储关联的多个源文件 ID（以逗号分隔）
    markdown = Column(Text, nullable=False)      # LLM 生成的 Markdown 摘要
    vector_index_path = Column(String, nullable=True)  # 可选：持久化 FAISS 索引的文件路径
    created_at = Column(DateTime(timezone=True), server_default=func.now())

```

### <a id="app-services-file_storage-py"></a>app/services/file_storage.py

```python
# backend/app/services/file_storage.py
import os
from pathlib import Path

from app.core.config import settings
from app.core.logger import logger


class FileStorageService:
    def __init__(self):
        # Get absolute path to upload directory
        self.upload_dir = settings.upload_dir.resolve()
        logger.debug(f"Initializing file storage with directory: {self.upload_dir}")

        # Ensure the upload directory exists
        if not self.upload_dir.exists():
            logger.info(f"Creating upload directory: {self.upload_dir}")
            self.upload_dir.mkdir(parents=True, exist_ok=True)
            # Ensure the directory is readable/writable
            os.chmod(self.upload_dir, 0o755)
        else:
            logger.debug(f"Upload directory already exists: {self.upload_dir}")

        # Double-check that the directory is accessible
        if not os.access(self.upload_dir, os.R_OK | os.W_OK):
            logger.warning(
                f"Upload directory has incorrect permissions: {self.upload_dir}"
            )
            try:
                os.chmod(self.upload_dir, 0o755)
                logger.info(
                    f"Fixed permissions for upload directory: {self.upload_dir}"
                )
            except Exception as e:
                logger.error(f"Failed to fix permissions: {str(e)}")

    def get_file_path(self, source_id: str) -> Path:
        # Generate the absolute path to the file
        file_path = self.upload_dir / f"{source_id}.pdf"
        logger.debug(f"Generated file path for source {source_id}: {file_path}")

        # Ensure the parent directory exists
        if not file_path.parent.exists():
            logger.warning(
                f"Parent directory doesn't exist, creating: {file_path.parent}"
            )
            file_path.parent.mkdir(parents=True, exist_ok=True)

        return file_path

    def file_exists(self, source_id: str) -> bool:
        """Verify if a source file physically exists."""
        file_path = self.get_file_path(source_id)
        exists = file_path.exists()
        if not exists:
            # Log alternative paths that were checked to aid debugging
            logger.debug(f"File not found at expected path: {file_path}")

            # Check if file exists in current working directory as fallback
            cwd_path = Path.cwd() / "uploaded_sources" / f"{source_id}.pdf"
            if cwd_path.exists():
                logger.warning(
                    f"File found in CWD but not in configured path: {cwd_path}"
                )

        return exists


file_storage = FileStorageService()
logger.info(
    f"File storage service initialized with upload directory: {file_storage.upload_dir}"
)

```

### <a id="app-services-task_manager-py"></a>app/services/task_manager.py

```python
# backend/app/services/task_manager.py
import threading
from typing import Optional, Dict

_lock = threading.Lock()
_tasks: Dict[str, dict] = {}

def create_task() -> str:
    import uuid
    task_id = str(uuid.uuid4())
    with _lock:
        _tasks[task_id] = {"status": "pending", "result": None, "error": None}
    return task_id

def update_task(task_id: str, status: str, result: Optional[dict] = None, error: Optional[str] = None):
    with _lock:
        if task_id in _tasks:
            _tasks[task_id].update({"status": status, "result": result, "error": error})
        else:
            _tasks[task_id] = {"status": status, "result": result, "error": error}

def get_task(task_id: str) -> Optional[dict]:
    with _lock:
        return _tasks.get(task_id)

```

### <a id="list_gemini_models-py"></a>list_gemini_models.py

```python
#!/usr/bin/env python3
"""
A simple script to list all available Google Gemini models.
This helps identify which models can be used with langchain_google_genai.
"""

import os
import sys

from dotenv import load_dotenv

# Load environment variables from .env file
load_dotenv()

# Check if GEMINI_API_KEY is available
api_key = os.environ.get("GEMINI_API_KEY")
if not api_key:
    print("Error: GEMINI_API_KEY environment variable not found.")
    print("Make sure you have a .env file with GEMINI_API_KEY set.")
    sys.exit(1)

try:
    import google.generativeai as genai
except ImportError:
    print("Error: google-generativeai package is not installed.")
    print("Install it using: pip install google-generativeai")
    sys.exit(1)

# Configure the Gemini API
genai.configure(api_key=api_key)


def main():
    try:
        # List available models
        models = genai.list_models()

        print(f"\n{'=' * 70}")
        print("AVAILABLE GEMINI MODELS".center(70))
        print(f"{'=' * 70}")

        for model in models:
            if "generateContent" in model.supported_generation_methods:
                print(f"\nModel Name: {model.name}")
                print(f"Display Name: {model.display_name}")
                print(f"Description: {model.description}")
                print(
                    f"Generation Methods: {', '.join(model.supported_generation_methods)}"
                )
                print(f"Input Token Limit: {model.input_token_limit}")
                print(f"Output Token Limit: {model.output_token_limit}")
                print("-" * 70)

        print("\nUse these model names in your application config.\n")

    except Exception as e:
        print(f"Error occurred while fetching models: {str(e)}")
        sys.exit(1)


if __name__ == "__main__":
    main()

```

### <a id="migrate_files-py"></a>migrate_files.py

```python
#!/usr/bin/env python
"""
File migration utility for AI Study Companion.

This script migrates files from potential old locations to the correct location
after the frontend and backend were merged.
"""

import logging
import os
import shutil
import sqlite3
from pathlib import Path

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s - %(levelname)s - %(message)s",
    handlers=[
        logging.FileHandler("logging/migration.log"),
        logging.StreamHandler(),
    ],
)
logger = logging.getLogger("migrate")

# Ensure logging directory exists
if not os.path.exists("logging"):
    os.makedirs("logging")

# Define possible file locations
# We'll search for files in these directories
POSSIBLE_PATHS = [
    "uploaded_sources",  # Old relative path
    "../uploaded_sources",  # Old path from backend dir
    "./uploaded_sources",  # Explicit current dir
    os.path.abspath("uploaded_sources"),  # Absolute path
]

# Get the absolute path to the backend directory
BACKEND_DIR = Path(__file__).resolve().parent
# Set the correct target directory (as defined in config.py)
TARGET_DIR = BACKEND_DIR / "uploaded_sources"


def ensure_target_dir():
    """Ensure target directory exists with correct permissions."""
    if not TARGET_DIR.exists():
        logger.info(f"Creating target directory: {TARGET_DIR}")
        TARGET_DIR.mkdir(parents=True, exist_ok=True)
        # Set permissions
        os.chmod(TARGET_DIR, 0o755)
    return TARGET_DIR


def get_sources_from_db():
    """Get all source IDs from the database."""
    db_path = BACKEND_DIR / "documents.db"
    if not db_path.exists():
        logger.error(f"Database not found at: {db_path}")
        return []

    try:
        logger.info(f"Connecting to database: {db_path}")
        conn = sqlite3.connect(db_path)
        cursor = conn.cursor()
        cursor.execute("SELECT id, filename FROM sources")
        sources = cursor.fetchall()
        logger.info(f"Found {len(sources)} sources in database")
        return sources
    except Exception as e:
        logger.error(f"Error reading from database: {e}")
        return []
    finally:
        if conn:
            conn.close()


def find_file_in_paths(source_id):
    """Search for a file in possible locations."""
    filename = f"{source_id}.pdf"
    found_paths = []

    for base_path in POSSIBLE_PATHS:
        path = Path(base_path) / filename
        if path.exists():
            found_paths.append(path)
            logger.info(f"Found file at: {path}")

    return found_paths


def migrate_files():
    """Migrate all files to the correct location."""
    # Ensure target directory exists
    target_dir = ensure_target_dir()
    logger.info(f"Target directory: {target_dir}")

    # Get sources from database
    sources = get_sources_from_db()
    if not sources:
        logger.warning("No sources found in database")
        return

    migrated = 0
    for source_id, filename in sources:
        logger.info(f"Processing source: {source_id} ({filename})")

        # Check if file already exists in target location
        target_path = target_dir / f"{source_id}.pdf"
        if target_path.exists():
            logger.info(f"File already exists at target location: {target_path}")
            continue

        # Find file in possible locations
        found_paths = find_file_in_paths(source_id)

        if not found_paths:
            logger.warning(f"File not found for source: {source_id} ({filename})")
            continue

        # Copy the first found file to target location
        try:
            source_path = found_paths[0]
            logger.info(f"Copying {source_path} -> {target_path}")
            shutil.copy2(source_path, target_path)
            logger.info(f"Successfully migrated file for source: {source_id}")
            migrated += 1
        except Exception as e:
            logger.error(f"Error migrating file: {e}")

    logger.info(
        f"Migration complete. Migrated {migrated} files out of {len(sources)} sources."
    )


if __name__ == "__main__":
    logger.info("Starting file migration")
    migrate_files()
    logger.info("Migration complete")

```

### <a id="new_requirements-txt"></a>new_requirements.txt

```plaintext
fastapi==0.115.12
uvicorn==0.34.0
SQLAlchemy==2.0.34
pydantic-settings==2.8.1
python-dotenv==0.21.0
langchain==0.2.*
langchain-core==0.2.*
langchain-community==0.2.*
langchain-google-genai==0.1.*
numpy==1.26.4
python-multipart==0.0.9
aiofiles==23.1.0

```

### <a id="requirements-txt"></a>requirements.txt

```plaintext
fastapi==0.115.12
uvicorn==0.34.0
SQLAlchemy==2.0.34
pydantic-settings==2.8.1
python-dotenv==0.21.0

# --- LangChain stack (2025-Q2) ---
langchain==0.3.23
langchain-core==0.3.54
langchain-community==0.3.21
langchain-google-genai==2.1.3

numpy==1.26.4
python-multipart==0.0.9
aiofiles==23.1.0
pypdf==5.4.0
sentence_transformers==4.1.0
faiss-cpu==1.10.0
```

### <a id="start-py"></a>start.py

```python
import os

import uvicorn

if __name__ == "__main__":
    # Make sure logging directory exists
    if not os.path.exists("logging"):
        os.makedirs("logging")

    # Run the FastAPI application
    uvicorn.run("app.main:app", host="0.0.0.0", port=8000, reload=True)

```

### <a id="test_env-py"></a>test_env.py

```python
import os

from app.core.config import settings
from app.core.logger import logger


def test_env_vars():
    print(f"Direct environment access: {os.environ.get('GEMINI_API_KEY') is not None}")
    print(f"Settings access: {settings.gemini_api_key is not None}")
    print(f"GEMINI_API_KEY from settings: {settings.gemini_api_key}")
    print(f"GEMINI_API_KEY from os.environ: {os.environ.get('GEMINI_API_KEY')}")


if __name__ == "__main__":
    test_env_vars()

```

