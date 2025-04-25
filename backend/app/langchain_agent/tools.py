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
            # Check if file exists
            if not os.path.exists(path):
                logger.error(f"File does not exist: {path}")
                continue

            # Create Path object for better path handling
            path_obj = Path(path)
            if not path_obj.exists():
                logger.error(f"Path object verification failed: {path_obj}")
                continue

            logger.info(f"Attempting to load PDF from: {path_obj.absolute()}")
            loader = PyPDFLoader(str(path_obj.absolute()))
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
