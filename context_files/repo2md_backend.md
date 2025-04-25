# Backend Documentation

 of NLP ProjectGenerated on 4/22/2025

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
- 📁 benchmark/
  - 📁 common/
    - 📄 [api_client.py](#benchmark-common-api_client-py)
    - 📄 [utils.py](#benchmark-common-utils-py)
  - 📁 context_files/
    - 📁 prompts/
  - 📁 data/
  - 📁 modified_backend/
  - 📁 results/
    - 📁 figures/
  - 📁 scripts/
  - 📁 sources/
  - 📄 [test_chunking_impact.py](#benchmark-test_chunking_impact-py)
  - 📄 [test_response_quality.py](#benchmark-test_response_quality-py)
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
    contexts: List[str]


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

        # Extract context chunks for response
        retrieved_contexts = []
        if "context" in result and isinstance(result["context"], list):
            retrieved_contexts = [doc.page_content for doc in result["context"]]
            logger.info(f"Retrieved {len(retrieved_contexts)} context chunks.")
        else:
            logger.warning("Could not find or parse 'context' in RAG chain result.")

        # Extract source references
        references = []
        if "context" in result and isinstance(result["context"], list):
            logger.info(f"Context has {len(result['context'])} documents")
            seen_sources = set()
            for i, doc in enumerate(result["context"]):
                # Extract metadata or create a default reference
                if hasattr(doc, "metadata") and doc.metadata:
                    source_name = doc.metadata.get("source", f"Source Document {i + 1}")
                    # Attempt to get just the filename
                    source_name = source_name.split("/")[-1].split("\\")[-1]
                    if source_name not in seen_sources:
                        references.append(source_name)
                        seen_sources.add(source_name)
                else:
                    ref_name = f"Source Document {i + 1}"
                    if ref_name not in seen_sources:
                        references.append(ref_name)
                        seen_sources.add(ref_name)

        logger.info(f"Generated answer with {len(references)} unique source references")

        # Return the extracted contexts in the response
        return QAResponse(
            answer=answer, references=references, contexts=retrieved_contexts
        )

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
        try:
            loader = PyPDFLoader(path)
            raw_docs = loader.load()
            # Add metadata enrichment
            for doc in raw_docs:
                if not hasattr(doc, "metadata") or not doc.metadata:
                    doc.metadata = {}
                doc.metadata["source"] = path  # Add source path to metadata
            documents.extend(raw_docs)
            logger.debug(f"Loaded {len(raw_docs)} pages from {path}")
        except Exception as e:
            logger.error(f"Failed to load PDF {path}: {e}")
            # Decide whether to skip or raise
            # continue # Option: skip problematic file

    if not documents:
        logger.warning("No documents were successfully loaded.")
        return []

    # Read chunk size and overlap from environment variables
    default_chunk_size = 500
    default_chunk_overlap = 50

    try:
        chunk_size = int(os.getenv("CHUNK_SIZE", default_chunk_size))
        chunk_overlap = int(os.getenv("CHUNK_OVERLAP", default_chunk_overlap))

        # Validate values
        if chunk_size <= 0:
            logger.warning(
                f"Invalid CHUNK_SIZE '{os.getenv('CHUNK_SIZE')}', using default {default_chunk_size}."
            )
            chunk_size = default_chunk_size

        if chunk_overlap < 0 or chunk_overlap >= chunk_size:
            logger.warning(
                f"Invalid CHUNK_OVERLAP '{os.getenv('CHUNK_OVERLAP')}' for chunk size {chunk_size}, using default {default_chunk_overlap}."
            )
            chunk_overlap = default_chunk_overlap

    except ValueError:
        logger.warning(
            f"Non-integer value for CHUNK_SIZE or CHUNK_OVERLAP in environment variables. Using defaults."
        )
        chunk_size = default_chunk_size
        chunk_overlap = default_chunk_overlap

    logger.info(f"Using chunk_size={chunk_size}, chunk_overlap={chunk_overlap}")

    splitter = RecursiveCharacterTextSplitter(
        chunk_size=chunk_size,
        chunk_overlap=chunk_overlap,
        # Consider adding separators relevant to your documents if needed
        # separators=["\n\n", "\n", ". ", " ", ""]
        length_function=len,  # Default, measures in characters
    )

    split_docs = splitter.split_documents(documents)
    logger.info(f"Split {len(documents)} pages into {len(split_docs)} chunks.")
    return split_docs


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

### <a id="benchmark-common-api_client-py"></a>benchmark/common/api_client.py

```python
import json
import time
from typing import Any, Dict, List, Optional, Union

import requests
from requests.exceptions import RequestException, Timeout

# Configuration
API_BASE_URL = "http://localhost:8000"  # Default backend URL
DEFAULT_TIMEOUT = 120  # Default timeout in seconds for API calls


def query_qa(
    question_text: str,
    source_ids: List[str],
    llm_model: str = "gemma3",
    timeout: int = DEFAULT_TIMEOUT,
) -> Dict[str, Any]:
    """
    Query the backend QA endpoint with a question.

    Args:
        question_text: The question to ask
        source_ids: List of document IDs to use as sources
        llm_model: The LLM model to use (default: "gemma3")
        timeout: Request timeout in seconds

    Returns:
        Dictionary containing:
        - answer: The generated answer (str)
        - contexts: List of retrieved contexts (List[str])
        - references: List of source references (List[str])
        - latency: Time taken for the API call (float)
        - status_code: HTTP status code (int)
        - error: Error message if any (Optional[str])
    """
    endpoint_url = f"{API_BASE_URL}/qa"

    # Prepare request payload
    payload = {
        "question": question_text,
        "source_ids": source_ids,
        "llm_model": llm_model,
    }

    # Initialize result dictionary with defaults
    result = {
        "answer": "",
        "contexts": [],
        "references": [],
        "latency": 0.0,
        "status_code": 0,
        "error": None,
    }

    try:
        # Start timer for accurate latency measurement
        start_time = time.perf_counter()

        # Make the API call
        response = requests.post(endpoint_url, json=payload, timeout=timeout)

        # Calculate latency
        latency = time.perf_counter() - start_time
        result["latency"] = latency

        # Record status code
        result["status_code"] = response.status_code

        # Parse response if successful
        if response.status_code == 200:
            response_data = response.json()

            # Extract data from response
            result["answer"] = response_data.get("answer", "")
            result["contexts"] = response_data.get("contexts", [])
            result["references"] = response_data.get("references", [])
        else:
            result["error"] = f"API error: HTTP {response.status_code}"
            try:
                error_detail = response.json().get("detail", "No detail provided")
                result["error"] += f" - {error_detail}"
            except ValueError:
                # If response is not JSON
                result["error"] += f" - {response.text[:100]}"

    except Timeout:
        result["error"] = f"Request timed out after {timeout} seconds"
    except RequestException as e:
        result["error"] = f"Request failed: {str(e)}"
    except Exception as e:
        result["error"] = f"Unexpected error: {str(e)}"

    return result


def upload_source(
    file_path: str, filename: Optional[str] = None, timeout: int = DEFAULT_TIMEOUT
) -> Dict[str, Any]:
    """
    Upload a source file to the backend.

    Args:
        file_path: Path to the file to upload
        filename: Optional filename to use (defaults to basename of file_path)
        timeout: Request timeout in seconds

    Returns:
        Dictionary containing:
        - source_id: ID of the uploaded source (str) if successful
        - success: Whether the upload was successful (bool)
        - status_code: HTTP status code (int)
        - error: Error message if any (Optional[str])
    """
    endpoint_url = f"{API_BASE_URL}/sources"

    if filename is None:
        # Use the basename of the file path
        import os

        filename = os.path.basename(file_path)

    result = {"source_id": "", "success": False, "status_code": 0, "error": None}

    try:
        with open(file_path, "rb") as file:
            files = {"file": (filename, file, "application/pdf")}

            response = requests.post(endpoint_url, files=files, timeout=timeout)

            result["status_code"] = response.status_code

            if response.status_code == 200:
                response_data = response.json()
                result["source_id"] = response_data.get("source_id", "")
                result["success"] = True
            else:
                result["error"] = f"API error: HTTP {response.status_code}"
                try:
                    error_detail = response.json().get("detail", "No detail provided")
                    result["error"] += f" - {error_detail}"
                except ValueError:
                    result["error"] += f" - {response.text[:100]}"

    except Timeout:
        result["error"] = f"Request timed out after {timeout} seconds"
    except RequestException as e:
        result["error"] = f"Request failed: {str(e)}"
    except FileNotFoundError:
        result["error"] = f"File not found: {file_path}"
    except Exception as e:
        result["error"] = f"Unexpected error: {str(e)}"

    return result


def list_sources(timeout: int = DEFAULT_TIMEOUT) -> Dict[str, Any]:
    """
    Get a list of all sources from the backend.

    Args:
        timeout: Request timeout in seconds

    Returns:
        Dictionary containing:
        - sources: List of source objects (if successful)
        - success: Whether the request was successful (bool)
        - status_code: HTTP status code (int)
        - error: Error message if any (Optional[str])
    """
    endpoint_url = f"{API_BASE_URL}/sources"

    result = {"sources": [], "success": False, "status_code": 0, "error": None}

    try:
        response = requests.get(endpoint_url, timeout=timeout)

        result["status_code"] = response.status_code

        if response.status_code == 200:
            result["sources"] = response.json()
            result["success"] = True
        else:
            result["error"] = f"API error: HTTP {response.status_code}"
            try:
                error_detail = response.json().get("detail", "No detail provided")
                result["error"] += f" - {error_detail}"
            except ValueError:
                result["error"] += f" - {response.text[:100]}"

    except Timeout:
        result["error"] = f"Request timed out after {timeout} seconds"
    except RequestException as e:
        result["error"] = f"Request failed: {str(e)}"
    except Exception as e:
        result["error"] = f"Unexpected error: {str(e)}"

    return result

```

### <a id="benchmark-common-utils-py"></a>benchmark/common/utils.py

```python
import os
import re
import subprocess
import time
from typing import Any, Dict, List, Optional, Tuple, Union

import pandas as pd
import psutil
from dotenv import load_dotenv
from openai import OpenAI

# Load environment variables from .env file
load_dotenv(
    dotenv_path="/Users/wanghaonan/WebstormProjects/np_project/backend/.env"
)  # Adjust path as needed to find backend/.env


def load_test_data(
    csv_path: str = "/Users/wanghaonan/WebstormProjects/np_project/backend/benchmark/data/test_questions.csv",
) -> pd.DataFrame:
    """
    Load test questions from a CSV file.

    Args:
        csv_path: Path to the CSV file containing test questions

    Returns:
        DataFrame containing test questions with columns:
        - question_id
        - question_text
        - question_type
        - source_docs
        - is_answerable
    """
    try:
        df = pd.read_csv(csv_path)

        # Validate required columns
        required_columns = [
            "question_id",
            "question_text",
            "question_type",
            "source_docs",
            "is_answerable",
        ]
        missing_columns = [col for col in required_columns if col not in df.columns]

        if missing_columns:
            raise ValueError(
                f"CSV is missing required columns: {', '.join(missing_columns)}"
            )

        # Convert is_answerable to boolean if it's not already
        if df["is_answerable"].dtype != bool:
            df["is_answerable"] = df["is_answerable"].map(
                lambda x: str(x).lower() == "true"
            )

        return df

    except FileNotFoundError:
        raise FileNotFoundError(f"Test data file not found at {csv_path}")
    except Exception as e:
        raise Exception(f"Error loading test data: {str(e)}")


def initialize_deepseek_client(model_name: str = "deepseek-v3-250324") -> OpenAI:
    """
    Initialize the DeepSeek API client.

    Args:
        model_name: DeepSeek model name to use

    Returns:
        Initialized OpenAI-compatible client for DeepSeek API
    """
    # Get API key from environment variables
    ark_api_key = os.environ.get("DEEPSEEK_API_KEY")

    if not ark_api_key:
        raise ValueError(
            "DEEPSEEK_API_KEY environment variable not found. Please add it to your .env file."
        )

    # Initialize client with DeepSeek's API endpoint
    client = OpenAI(
        base_url="https://ark.cn-beijing.volces.com/api/v3", api_key=ark_api_key
    )

    return client


def judge_relevance_deepseek(
    client: OpenAI,
    question: str,
    answer: str,
    model_name: str = "deepseek-v3-250324",
) -> Optional[float]:
    """
    Use DeepSeek to judge the relevance of an answer to a question.

    Args:
        client: Initialized DeepSeek client
        question: The original question text
        answer: The generated answer to evaluate
        model_name: DeepSeek model to use

    Returns:
        Relevance score (1-5 scale) or None if evaluation failed
    """
    system_prompt = """You are an expert evaluator assessing the relevance of an answer to a user's question.
Evaluate ONLY how well the answer addresses the specific question asked, regardless of factual accuracy.
Relevance means the answer directly addresses what the question is asking about.

Rate the relevance on a scale of 1-5:
1: Completely irrelevant - The answer does not address the question at all.
2: Mostly irrelevant - The answer barely touches on the question's topic.
3: Somewhat relevant - The answer addresses the general topic but misses key aspects of the question.
4: Mostly relevant - The answer addresses most aspects of the question well.
5: Completely relevant - The answer directly and comprehensively addresses exactly what was asked.

Provide your verdict using this exact format:
Score: [1-5]
Reasoning: [Your reasoning here]
"""

    user_prompt = f"Question: {question}\n\nAnswer: {answer}"

    try:
        completion = client.chat.completions.create(
            model=model_name,
            messages=[
                {"role": "system", "content": system_prompt},
                {"role": "user", "content": user_prompt},
            ],
            temperature=0.0,
        )

        # Extract response content
        response_text = completion.choices[0].message.content

        # Extract score using regex
        score_match = re.search(r"Score:\s*(\d+)", response_text)
        if score_match:
            score = int(score_match.group(1))
            # Validate score range
            if 1 <= score <= 5:
                return float(score)
            else:
                print(f"Warning: Score {score} out of expected range (1-5)")
                return None
        else:
            print(
                f"Warning: Could not extract score from response: {response_text[:100]}..."
            )
            return None

    except Exception as e:
        print(f"Error in relevance evaluation: {str(e)}")
        return None


def judge_faithfulness_deepseek(
    client: OpenAI,
    question: str,
    answer: str,
    contexts: List[str],
    model_name: str = "deepseek-v3-250324",
) -> Optional[Union[float, bool]]:
    """
    Use DeepSeek to judge the faithfulness (factual consistency) of an answer.

    Args:
        client: Initialized DeepSeek client
        question: The original question text
        answer: The generated answer to evaluate
        contexts: List of context chunks used to generate the answer
        model_name: DeepSeek model to use

    Returns:
        Faithfulness score (0-1 scale) or True/False, or None if evaluation failed
    """
    # Join contexts with separator for clarity
    formatted_contexts = "\n---\n".join(contexts)

    system_prompt = """You are an expert evaluator assessing if an answer is faithful to the provided context.
Faithfulness means every claim or statement in the answer is supported by the provided context chunks.
The answer should not contain information or claims that cannot be derived from the context chunks.

Evaluate ONLY whether the answer is supported by the provided context, ignoring whether the answer is relevant to the question.

Your verdict should be one of these two options:
- Faithful (1): The answer is fully supported by and consistent with the provided context.
- Unfaithful (0): The answer contains claims or information not supported by the provided context.

Provide your verdict using this exact format:
Verdict: [Faithful/Unfaithful]
Score: [1 for Faithful, 0 for Unfaithful]
Reasoning: [Your reasoning, highlighting any unsupported claims if unfaithful]
"""

    user_prompt = (
        f"Context:\n{formatted_contexts}\n\nQuestion: {question}\n\nAnswer: {answer}"
    )

    try:
        completion = client.chat.completions.create(
            model=model_name,
            messages=[
                {"role": "system", "content": system_prompt},
                {"role": "user", "content": user_prompt},
            ],
            temperature=0.0,
        )

        # Extract response content
        response_text = completion.choices[0].message.content

        # Try to extract numeric score
        score_match = re.search(r"Score:\s*(\d+)", response_text)
        if score_match:
            score = int(score_match.group(1))
            return float(score)

        # If no numeric score, try to extract verdict
        verdict_match = re.search(r"Verdict:\s*(Faithful|Unfaithful)", response_text)
        if verdict_match:
            verdict = verdict_match.group(1)
            return verdict == "Faithful"

        # If neither found, look for patterns in the text
        if (
            "faithful" in response_text.lower()
            and not "unfaithful" in response_text.lower()
        ):
            return True
        elif "unfaithful" in response_text.lower():
            return False

        # If still not determined
        print(
            f"Warning: Could not extract faithfulness verdict from response: {response_text[:100]}..."
        )
        return None

    except Exception as e:
        print(f"Error in faithfulness evaluation: {str(e)}")
        return None


def check_completion(
    generated_answer: str, is_answerable_ground_truth: bool, refusal_phrases: List[str]
) -> Dict[str, Any]:
    """
    Check if the system's completion/refusal behavior is correct.

    Args:
        generated_answer: The answer generated by the RAG system
        is_answerable_ground_truth: Ground truth on whether the question is answerable
        refusal_phrases: List of phrases indicating the system refused to answer

    Returns:
        Dictionary with results:
        - "status": One of "Correct Answer", "Correct Refusal",
                    "Incorrect Refusal", or "Incorrect Answer (Missing Refusal)"
        - "is_refusal": Whether the system refused to answer
        - "is_correct": Whether the behavior was correct
    """
    # Convert answer to lowercase for case-insensitive matching
    answer_lower = generated_answer.lower()

    # Check if answer contains any refusal phrases
    is_refusal = any(phrase.lower() in answer_lower for phrase in refusal_phrases)

    # Determine correctness based on ground truth and whether system refused
    if is_answerable_ground_truth:
        # Question should be answered
        if not is_refusal:
            status = "Correct Answer"
            is_correct = True
        else:
            status = "Incorrect Refusal"
            is_correct = False
    else:
        # Question should be refused
        if is_refusal:
            status = "Correct Refusal"
            is_correct = True
        else:
            status = "Incorrect Answer (Missing Refusal)"
            is_correct = False

    return {"status": status, "is_refusal": is_refusal, "is_correct": is_correct}


def find_backend_pid(process_name: str = "uvicorn") -> Optional[int]:
    """
    Find the process ID (PID) of the running backend server.

    Args:
        process_name: Process name to search for (default: "uvicorn")

    Returns:
        PID of the backend server if found, None otherwise
    """
    for proc in psutil.process_iter(["pid", "name", "cmdline"]):
        try:
            # Check if process name contains the target string
            if process_name.lower() in proc.info["name"].lower():
                # Check if command line arguments are as expected for our backend
                cmdline = proc.info.get("cmdline", [])
                cmdline_str = " ".join(cmdline).lower()

                # Look for uvicorn main:app or similar pattern
                if "main:app" in cmdline_str or "app.main:app" in cmdline_str:
                    return proc.info["pid"]

        except (psutil.NoSuchProcess, psutil.AccessDenied, psutil.ZombieProcess):
            continue

    return None


def manage_backend_process(
    action: str = "status", env_vars: Optional[Dict[str, str]] = None, timeout: int = 30
) -> Dict[str, Any]:
    """
    Manage the backend server process (start, stop, restart, or check status).

    Args:
        action: Action to perform ('start', 'stop', 'restart', 'status')
        env_vars: Dictionary of environment variables to set when starting the server
        timeout: Timeout in seconds for each action

    Returns:
        Dictionary with results:
        - "success": Whether the action was successful
        - "pid": PID of the backend server (if running)
        - "status": Current status of the backend server
        - "error": Error message (if any)
    """
    result = {"success": False, "pid": None, "status": "unknown", "error": None}

    # Check current status
    current_pid = find_backend_pid()
    if current_pid:
        result["pid"] = current_pid
        result["status"] = "running"
    else:
        result["status"] = "stopped"

    # Return if only checking status
    if action == "status":
        result["success"] = True
        return result

    # Handle stop action
    if action in ["stop", "restart"] and current_pid:
        try:
            # Try graceful termination
            process = psutil.Process(current_pid)
            process.terminate()

            # Wait for process to end
            start_time = time.time()
            while time.time() - start_time < timeout:
                if not psutil.pid_exists(current_pid):
                    break
                time.sleep(0.5)

            # Force kill if still running
            if psutil.pid_exists(current_pid):
                process.kill()

            # Update status
            if not psutil.pid_exists(current_pid):
                result["status"] = "stopped"
            else:
                result["error"] = f"Failed to stop backend process (PID: {current_pid})"
                return result

        except psutil.NoSuchProcess:
            result["status"] = "stopped"
        except Exception as e:
            result["error"] = f"Error stopping backend: {str(e)}"
            return result

    # Return if only stopping
    if action == "stop":
        result["success"] = True
        return result

    # Handle start action
    if action in ["start", "restart"]:
        try:
            # Set environment variables for backend
            my_env = os.environ.copy()
            if env_vars:
                for key, value in env_vars.items():
                    my_env[key] = str(value)

            # Start backend server
            # Adjust the command as needed for your specific setup
            backend_root = os.path.abspath(
                os.path.join(os.path.dirname(__file__), "../../..")
            )
            cmd = ["uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8000"]

            # Start process
            process = subprocess.Popen(
                cmd,
                env=my_env,
                cwd=backend_root,
                stdout=subprocess.PIPE,
                stderr=subprocess.PIPE,
            )

            # Wait for server to start
            start_time = time.time()
            while time.time() - start_time < timeout:
                new_pid = find_backend_pid()
                if new_pid:
                    result["pid"] = new_pid
                    result["status"] = "running"
                    result["success"] = True
                    return result
                time.sleep(1)

            # If we got here, server didn't start in time
            result["error"] = "Backend server failed to start within timeout"
            return result

        except Exception as e:
            result["error"] = f"Error starting backend: {str(e)}"
            return result

    # Invalid action
    result["error"] = f"Invalid action: {action}"
    return result

```

### <a id="benchmark-test_chunking_impact-py"></a>benchmark/test_chunking_impact.py

```python

```

### <a id="benchmark-test_response_quality-py"></a>benchmark/test_response_quality.py

```python
#!/usr/bin/env python3
"""
Phase 2 - Response Quality Evaluation (Baseline)

This script evaluates the RAG system's response quality using its default chunking configuration.
It processes test questions from test_questions.csv, calls the backend API, and evaluates
responses using DeepSeek judge functions for both gemma3 and llama4 models.

Prerequisites:
- Backend server must be running with DEFAULT chunking settings
- DEEPSEEK_API_KEY must be set in .env file for DeepSeek evaluation
- OPENROUTER_API_KEY must be set in .env file for llama4 model
- test_questions.csv must exist in benchmark/data/ directory
"""

import logging
import os
import sys
import time
from pathlib import Path

import matplotlib.pyplot as plt
import numpy as np
import pandas as pd
import pytest
import seaborn as sns

# Add parent directory to path to import common modules
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
from benchmark.common.api_client import query_qa
from benchmark.common.utils import (
    check_completion,
    initialize_deepseek_client,
    judge_faithfulness_deepseek,
    judge_relevance_deepseek,
    load_test_data,
)

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s - %(levelname)s - %(message)s",
    handlers=[
        logging.FileHandler(Path(__file__).parent / "results" / "baseline_quality.log"),
        logging.StreamHandler(),
    ],
)
logger = logging.getLogger(__name__)

# Define path constants
RESULTS_DIR = Path(__file__).parent / "results"
RESULTS_DIR.mkdir(exist_ok=True)
FIGURES_DIR = RESULTS_DIR / "figures"
FIGURES_DIR.mkdir(exist_ok=True)

# Define output files for each model
GEMMA3_OUTPUT_CSV_PATH = RESULTS_DIR / "baseline_quality_results_gemma3.csv"
LLAMA4_OUTPUT_CSV_PATH = RESULTS_DIR / "baseline_quality_results_llama4.csv"
COMBINED_OUTPUT_CSV_PATH = RESULTS_DIR / "baseline_quality_results_combined.csv"

# Define supported models
SUPPORTED_MODELS = ["gemma3", "llama4"]

# Define refusal phrases for completion check
REFUSAL_PHRASES = [
    "I cannot answer",
    "I don't have enough information",
    "I don't have the information",
    "I can't provide an answer",
    "unable to find information",
    "not enough context",
    "insufficient information",
    "cannot determine",
    "don't know",
    "no information provided",
    "not mentioned in",
    "not specified in",
    "not found in the",
    "not present in",
    "not included in",
]


def verify_prerequisites():
    """Verify that prerequisites are met before running the test."""
    logger.info("Verifying prerequisites...")

    # Check if the results directory exists
    if not RESULTS_DIR.exists():
        logger.info(f"Creating results directory: {RESULTS_DIR}")
        RESULTS_DIR.mkdir(parents=True, exist_ok=True)

    if not FIGURES_DIR.exists():
        logger.info(f"Creating figures directory: {FIGURES_DIR}")
        FIGURES_DIR.mkdir(parents=True, exist_ok=True)

    # Check if test questions exist
    try:
        test_data = load_test_data()
        logger.info(f"Loaded {len(test_data)} test questions")
    except Exception as e:
        logger.error(f"Failed to load test questions: {e}")
        return False

    # Check if DeepSeek client can be initialized
    try:
        deepseek_client = initialize_deepseek_client()
        logger.info("DeepSeek client initialized successfully")
    except Exception as e:
        logger.error(f"Failed to initialize DeepSeek client: {e}")
        return False

    # Check if backend is reachable with a simple query for each model
    for model in SUPPORTED_MODELS:
        try:
            # Use the first question as a test
            test_question = test_data.iloc[0]["question_text"]
            source_docs = test_data.iloc[0]["source_docs"]
            # Assuming source_id is the same as the filename for simplicity
            # In a real setup, you might have a mapping or database lookup
            source_ids = [doc.strip() for doc in source_docs.split("|")]

            # Try to query with a short timeout to test connectivity
            logger.info(f"Testing connectivity with model: {model}")
            result = query_qa(test_question, source_ids, model, timeout=5)
            if result.get("error"):
                logger.error(f"Backend API error with {model}: {result['error']}")
                logger.error(f"Is the backend server running and supporting {model}?")
                return False
            logger.info(f"Backend API is reachable with model: {model}")
        except Exception as e:
            logger.error(f"Failed to connect to backend with model {model}: {e}")
            return False

    return True


def run_test_for_model(llm_model):
    """Run the response quality test for a specific model."""
    logger.info(f"Starting response quality evaluation for model: {llm_model}...")

    # Load test questions
    test_data_df = load_test_data()
    logger.info(f"Loaded {len(test_data_df)} test questions")

    # Initialize DeepSeek client
    deepseek_client = initialize_deepseek_client()
    logger.info("DeepSeek client initialized")

    # Initialize results list
    results_list = []

    # Track overall progress
    total_questions = len(test_data_df)
    start_time = time.time()

    # Process each question
    for index, row in test_data_df.iterrows():
        question_id = row["question_id"]
        question_text = row["question_text"]
        question_type = row["question_type"]
        source_docs = row["source_docs"]
        is_answerable = row["is_answerable"]

        # Log progress
        logger.info(
            f"Processing {index + 1}/{total_questions} with {llm_model}: {question_id}"
        )

        # Convert source_docs to source_ids (assuming direct mapping for simplicity)
        # In a real scenario, you might have a database lookup or mapping
        source_ids = [doc.strip() for doc in source_docs.split("|")]

        # Query the backend API
        api_result = query_qa(question_text, source_ids, llm_model)

        # Initialize result dictionary
        result_dict = {
            "question_id": question_id,
            "question_text": question_text,
            "question_type": question_type,
            "source_docs": source_docs,
            "is_answerable": is_answerable,
            "model": llm_model,
            "generated_answer": api_result.get("answer", ""),
            "retrieved_contexts": api_result.get("contexts", []),
            "references": api_result.get("references", []),
            "latency": api_result.get("latency", 0),
            "api_status_code": api_result.get("status_code", 0),
            "api_error": api_result.get("error", None),
            "relevance_score": None,
            "faithfulness_score": None,
            "completion_status": None,
            "completion_is_correct": None,
            "judge_error": None,
        }

        # Check if API call was successful
        if api_result.get("error") is None and api_result.get("status_code") == 200:
            try:
                # Evaluate relevance
                relevance_score = judge_relevance_deepseek(
                    deepseek_client, question_text, api_result["answer"]
                )
                result_dict["relevance_score"] = relevance_score

                # Evaluate faithfulness if contexts are available
                if api_result.get("contexts"):
                    faithfulness_result = judge_faithfulness_deepseek(
                        deepseek_client,
                        question_text,
                        api_result["answer"],
                        api_result["contexts"],
                    )
                    result_dict["faithfulness_score"] = faithfulness_result

                # Check completion status
                completion_result = check_completion(
                    api_result["answer"], is_answerable, REFUSAL_PHRASES
                )
                result_dict["completion_status"] = completion_result["status"]
                result_dict["completion_is_correct"] = completion_result["is_correct"]

            except Exception as e:
                logger.error(f"Error during evaluation for {question_id}: {str(e)}")
                result_dict["judge_error"] = str(e)

        # Add result to results list
        results_list.append(result_dict)

        # Log completion of this question
        logger.info(f"Completed {question_id} with {llm_model}")

    # Calculate total execution time
    execution_time = time.time() - start_time
    logger.info(
        f"Finished processing all {total_questions} questions with {llm_model} in {execution_time:.2f} seconds"
    )

    # Convert results to DataFrame
    results_df = pd.DataFrame(results_list)

    # Save results to CSV
    output_path = RESULTS_DIR / f"baseline_quality_results_{llm_model}.csv"
    results_df.to_csv(output_path, index=False)
    logger.info(f"Results for {llm_model} saved to {output_path}")

    return results_df


def run_test():
    """Run the response quality test for all supported models."""
    all_results_dfs = []

    # Run test for each model
    for model in SUPPORTED_MODELS:
        results_df = run_test_for_model(model)
        results_df["model"] = model  # Ensure model column is added
        all_results_dfs.append(results_df)

    # Combine results
    combined_results_df = pd.concat(all_results_dfs, ignore_index=True)

    # Save combined results
    combined_results_df.to_csv(COMBINED_OUTPUT_CSV_PATH, index=False)
    logger.info(f"Combined results saved to {COMBINED_OUTPUT_CSV_PATH}")

    return combined_results_df


def analyze_results(results_df):
    """Analyze and print aggregate metrics from the results."""
    logger.info("Analyzing results...")

    # Calculate metrics for each model
    metrics_by_model = {}

    for model in SUPPORTED_MODELS:
        model_df = results_df[results_df["model"] == model]
        model_metrics = calculate_metrics_for_df(model_df, f"{model} metrics")
        metrics_by_model[model] = model_metrics

    # Calculate overall metrics
    overall_metrics = calculate_metrics_for_df(results_df, "Overall metrics")

    # Combine metrics into a single DataFrame for easy comparison
    comparison_metrics = {}
    metric_keys = overall_metrics.keys()

    for key in metric_keys:
        comparison_metrics[key] = {}
        comparison_metrics[key]["overall"] = overall_metrics[key]
        for model in SUPPORTED_MODELS:
            comparison_metrics[key][model] = metrics_by_model[model][key]

    comparison_df = pd.DataFrame(comparison_metrics)
    comparison_df = comparison_df.transpose()

    # Save comparison metrics
    comparison_df.to_csv(RESULTS_DIR / "baseline_quality_metrics_comparison.csv")
    logger.info(
        f"Comparison metrics saved to {RESULTS_DIR}/baseline_quality_metrics_comparison.csv"
    )

    # Create visualizations comparing models
    create_comparative_visualizations(results_df, metrics_by_model)

    return metrics_by_model, comparison_df


def calculate_metrics_for_df(results_df, metrics_name="metrics"):
    """Calculate metrics for a given DataFrame."""
    logger.info(f"Calculating {metrics_name}...")

    # Filter out rows with judge errors for metric calculations
    valid_results = results_df[results_df["judge_error"].isna()]

    # Calculate aggregate metrics
    metrics = {}

    # Relevance metrics
    relevance_scores = valid_results["relevance_score"].dropna()
    if not relevance_scores.empty:
        metrics["avg_relevance"] = relevance_scores.mean()
        metrics["median_relevance"] = relevance_scores.median()
        metrics["min_relevance"] = relevance_scores.min()
        metrics["max_relevance"] = relevance_scores.max()
    else:
        logger.warning(f"No valid relevance scores found for {metrics_name}")

    # Faithfulness metrics
    # Convert boolean faithfulness results to 1.0/0.0 for averaging
    faithfulness_scores = (
        valid_results["faithfulness_score"]
        .apply(
            lambda x: float(x)
            if isinstance(x, (int, float))
            else (1.0 if x is True else 0.0 if x is False else None)
        )
        .dropna()
    )

    if not faithfulness_scores.empty:
        metrics["avg_faithfulness"] = faithfulness_scores.mean()
        metrics["faithfulness_true_rate"] = (faithfulness_scores == 1.0).mean()
    else:
        logger.warning(f"No valid faithfulness scores found for {metrics_name}")

    # Task Completion Rate (TCR)
    if "completion_is_correct" in valid_results.columns:
        correct_completions = valid_results["completion_is_correct"].sum()
        total_completions = len(valid_results)
        metrics["tcr"] = (
            correct_completions / total_completions if total_completions > 0 else 0
        )

    # Refusal Accuracy (RA)
    refusal_subset = valid_results[~valid_results["is_answerable"]]
    if not refusal_subset.empty:
        correct_refusals = refusal_subset["completion_is_correct"].sum()
        total_refusals = len(refusal_subset)
        metrics["refusal_accuracy"] = (
            correct_refusals / total_refusals if total_refusals > 0 else 0
        )
    else:
        logger.warning(f"No refusal questions found for {metrics_name}")

    # Latency metrics
    latencies = valid_results["latency"].dropna()
    if not latencies.empty:
        metrics["avg_latency"] = latencies.mean()
        metrics["median_latency"] = latencies.median()
        metrics["p95_latency"] = latencies.quantile(0.95)
        metrics["p99_latency"] = latencies.quantile(0.99)
    else:
        logger.warning(f"No valid latency values found for {metrics_name}")

    # Completion status breakdown
    status_counts = valid_results["completion_status"].value_counts()
    for status, count in status_counts.items():
        metrics[f"status_{status.replace(' ', '_').lower()}"] = count

    # Print metrics
    logger.info(f"=== {metrics_name} ===")
    for key, value in metrics.items():
        if isinstance(value, float):
            logger.info(f"{key}: {value:.4f}")
        else:
            logger.info(f"{key}: {value}")

    return metrics


def create_comparative_visualizations(results_df, metrics_by_model):
    """Create visualizations comparing results between models."""
    try:
        # Set up plotting style
        plt.style.use("ggplot")
        sns.set(style="whitegrid")

        # Define color palette for consistent colors across plots
        model_colors = {
            "gemma3": "#1f77b4",  # Blue
            "llama4": "#ff7f0e",  # Orange
        }

        # 1. Compare relevance scores between models
        plt.figure(figsize=(12, 8))
        relevance_data = []

        for model in SUPPORTED_MODELS:
            model_df = results_df[results_df["model"] == model]
            relevance_scores = model_df["relevance_score"].dropna()
            if not relevance_scores.empty:
                # Create data for boxplot
                for score in relevance_scores:
                    relevance_data.append({"Model": model, "Relevance Score": score})

        if relevance_data:
            relevance_plot_df = pd.DataFrame(relevance_data)
            # Create boxplot
            ax = sns.boxplot(
                x="Model",
                y="Relevance Score",
                data=relevance_plot_df,
                palette=model_colors,
            )
            # Add individual points with jitter
            sns.stripplot(
                x="Model",
                y="Relevance Score",
                data=relevance_plot_df,
                size=4,
                alpha=0.3,
                jitter=True,
                color="gray",
            )

            # Add mean as text
            for i, model in enumerate(SUPPORTED_MODELS):
                avg = metrics_by_model[model].get("avg_relevance")
                if avg is not None:
                    ax.text(
                        i,
                        relevance_plot_df["Relevance Score"].max() + 0.2,
                        f"Mean: {avg:.2f}",
                        ha="center",
                    )

            plt.title("Comparison of Relevance Scores Between Models", fontsize=14)
            plt.tight_layout()
            plt.savefig(FIGURES_DIR / "relevance_score_comparison.png")
            plt.close()

        # 2. Compare faithfulness scores between models
        plt.figure(figsize=(12, 8))
        faithfulness_data = []

        for model in SUPPORTED_MODELS:
            model_df = results_df[results_df["model"] == model]
            faithfulness_scores = (
                model_df["faithfulness_score"]
                .apply(
                    lambda x: float(x)
                    if isinstance(x, (int, float))
                    else (1.0 if x is True else 0.0 if x is False else None)
                )
                .dropna()
            )

            if not faithfulness_scores.empty:
                # Create data for boxplot
                for score in faithfulness_scores:
                    faithfulness_data.append(
                        {"Model": model, "Faithfulness Score": score}
                    )

        if faithfulness_data:
            faithfulness_plot_df = pd.DataFrame(faithfulness_data)
            # Create boxplot
            ax = sns.barplot(
                x="Model",
                y="Faithfulness Score",
                data=faithfulness_plot_df,
                palette=model_colors,
            )

            # Add mean as text
            for i, model in enumerate(SUPPORTED_MODELS):
                avg = metrics_by_model[model].get("avg_faithfulness")
                if avg is not None:
                    ax.text(i, avg + 0.05, f"{avg:.2f}", ha="center")

            plt.title("Comparison of Faithfulness Scores Between Models", fontsize=14)
            plt.ylim(0, 1.1)  # Set y-axis limit
            plt.tight_layout()
            plt.savefig(FIGURES_DIR / "faithfulness_score_comparison.png")
            plt.close()

        # 3. Compare TCR and Refusal Accuracy between models
        plt.figure(figsize=(14, 8))

        # Extract metrics
        metric_names = ["tcr", "refusal_accuracy"]
        model_metrics = {}

        for model in SUPPORTED_MODELS:
            model_metrics[model] = [
                metrics_by_model[model].get(m, 0) for m in metric_names
            ]

        # Set up the bar plot
        x = np.arange(len(metric_names))
        width = 0.35

        fig, ax = plt.subplots(figsize=(12, 8))

        # Plot bars for each model
        bars = []
        for i, (model, values) in enumerate(model_metrics.items()):
            bar = ax.bar(
                x + (i - len(model_metrics) / 2 + 0.5) * width,
                values,
                width,
                label=model,
                color=model_colors.get(model),
            )
            bars.append(bar)

        # Add labels and title
        ax.set_xlabel("Metric", fontsize=12)
        ax.set_ylabel("Score", fontsize=12)
        ax.set_title("Task Completion Rate and Refusal Accuracy by Model", fontsize=14)
        ax.set_xticks(x)
        ax.set_xticklabels(["Task Completion Rate", "Refusal Accuracy"])
        ax.legend()

        # Add values above bars
        for bar in bars:
            for rect in bar:
                height = rect.get_height()
                ax.annotate(
                    f"{height:.2f}",
                    xy=(rect.get_x() + rect.get_width() / 2, height),
                    xytext=(0, 3),  # 3 points vertical offset
                    textcoords="offset points",
                    ha="center",
                    va="bottom",
                )

        plt.ylim(0, 1.1)  # Set y-axis limit
        plt.tight_layout()
        plt.savefig(FIGURES_DIR / "task_completion_comparison.png")
        plt.close()

        # 4. Compare latency distributions between models
        plt.figure(figsize=(14, 8))

        for model in SUPPORTED_MODELS:
            model_df = results_df[results_df["model"] == model]
            latencies = model_df["latency"].dropna()
            if not latencies.empty:
                sns.kdeplot(
                    latencies,
                    label=model,
                    fill=True,
                    alpha=0.3,
                    color=model_colors.get(model),
                )
                plt.axvline(
                    latencies.mean(),
                    color=model_colors.get(model),
                    linestyle="--",
                    label=f"{model} Mean: {latencies.mean():.2f}s",
                )

        plt.title("Distribution of API Latency by Model", fontsize=14)
        plt.xlabel("Latency (seconds)", fontsize=12)
        plt.ylabel("Density", fontsize=12)
        plt.legend()
        plt.tight_layout()
        plt.savefig(FIGURES_DIR / "latency_distribution_comparison.png")
        plt.close()

        # 5. Performance by question type - heatmap of relevance scores
        plt.figure(figsize=(14, 10))

        # Get average relevance by question type and model
        type_relevance = pd.pivot_table(
            results_df,
            values="relevance_score",
            index="question_type",
            columns="model",
            aggfunc="mean",
        ).fillna(0)

        # Create heatmap
        sns.heatmap(
            type_relevance,
            annot=True,
            cmap="YlGnBu",
            fmt=".2f",
            linewidths=0.5,
            cbar_kws={"label": "Average Relevance Score"},
        )

        plt.title("Average Relevance Score by Question Type and Model", fontsize=14)
        plt.tight_layout()
        plt.savefig(FIGURES_DIR / "relevance_by_question_type_heatmap.png")
        plt.close()

        # 6. Create per-source document comparison
        plt.figure(figsize=(16, 10))

        # Get unique source documents
        all_sources = []
        for sources in results_df["source_docs"].unique():
            for source in sources.split("|"):
                source = source.strip()
                if source not in all_sources:
                    all_sources.append(source)

        # Process results by source
        source_performance = {}

        for source in all_sources:
            source_performance[source] = {}
            for model in SUPPORTED_MODELS:
                # Find questions related to this source
                source_mask = results_df["source_docs"].apply(
                    lambda x: source in x.split("|")
                )
                model_mask = results_df["model"] == model
                source_model_df = results_df[source_mask & model_mask]

                if not source_model_df.empty:
                    # Calculate average relevance
                    avg_relevance = source_model_df["relevance_score"].dropna().mean()
                    source_performance[source][f"{model}_relevance"] = avg_relevance

                    # Calculate TCR
                    if "completion_is_correct" in source_model_df.columns:
                        correct = source_model_df["completion_is_correct"].sum()
                        total = len(source_model_df)
                        tcr = correct / total if total > 0 else 0
                        source_performance[source][f"{model}_tcr"] = tcr

        # Convert to DataFrame for plotting
        source_perf_df = pd.DataFrame(source_performance).transpose()
        source_perf_df = source_perf_df.fillna(0)

        # Plot relevance comparison by source
        if any(col.endswith("_relevance") for col in source_perf_df.columns):
            relevance_cols = [
                col for col in source_perf_df.columns if col.endswith("_relevance")
            ]
            source_perf_df[relevance_cols].plot(
                kind="bar",
                figsize=(16, 8),
                color=[model_colors.get(model) for model in SUPPORTED_MODELS],
            )
            plt.title(
                "Average Relevance Score by Source Document and Model", fontsize=14
            )
            plt.xlabel("Source Document", fontsize=12)
            plt.ylabel("Average Relevance Score", fontsize=12)
            plt.xticks(rotation=45, ha="right")
            plt.tight_layout()
            plt.savefig(FIGURES_DIR / "relevance_by_source_comparison.png")
            plt.close()

        # Plot TCR comparison by source
        if any(col.endswith("_tcr") for col in source_perf_df.columns):
            tcr_cols = [col for col in source_perf_df.columns if col.endswith("_tcr")]
            source_perf_df[tcr_cols].plot(
                kind="bar",
                figsize=(16, 8),
                color=[model_colors.get(model) for model in SUPPORTED_MODELS],
            )
            plt.title("Task Completion Rate by Source Document and Model", fontsize=14)
            plt.xlabel("Source Document", fontsize=12)
            plt.ylabel("Task Completion Rate", fontsize=12)
            plt.xticks(rotation=45, ha="right")
            plt.ylim(0, 1.1)  # Set y-axis limit
            plt.tight_layout()
            plt.savefig(FIGURES_DIR / "tcr_by_source_comparison.png")
            plt.close()

        logger.info(f"Comparative visualizations saved to {FIGURES_DIR}")

    except Exception as e:
        logger.error(f"Error creating comparative visualizations: {str(e)}")
        import traceback

        logger.error(traceback.format_exc())


@pytest.mark.skip(
    reason="Manual check: only run this when backend is confirmed running with default settings"
)
def test_response_quality():
    """Pytest function to run the response quality evaluation."""
    if not verify_prerequisites():
        pytest.fail("Prerequisites not met. See logs for details.")

    results_df = run_test()
    analyze_results(results_df)


if __name__ == "__main__":
    if verify_prerequisites():
        results_df = run_test()
        analyze_results(results_df)
    else:
        logger.error("Prerequisites check failed. Aborting test.")
        sys.exit(1)

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

