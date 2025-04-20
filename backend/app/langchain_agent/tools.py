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
