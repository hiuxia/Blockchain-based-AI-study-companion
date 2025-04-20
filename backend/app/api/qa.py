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
        valid_models = ["gemini2", "llama4"]
        if request.llm_model not in valid_models:
            request.llm_model = "gemini2"  # Default to gemini2 if not valid

        # Create RAG chain and run question
        chain = create_rag_chain(paths, request.llm_model)
        result = chain.invoke({"input": request.question})

        # Extract answer and source information
        answer = result.get("answer", "No answer generated")

        # Extract source references
        references = []
        if "context" in result:
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
