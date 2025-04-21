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
