# backend/app/langchain_agent/rag_agent.py
from typing import Any, Dict, List

# Updated imports for new LangChain structure
from langchain.chains import create_retrieval_chain
from langchain.chains.combine_documents import create_stuff_documents_chain

# Update imports to use langchain_core instead of langchain when possible
from langchain_community.vectorstores import FAISS
from langchain_core.documents import Document
from langchain_core.embeddings import Embeddings
from langchain_huggingface import HuggingFaceEmbeddings

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

    # Check if docs is empty
    if not docs or len(docs) == 0:
        raise ValueError(
            "No documents were loaded. Please check the file paths or file formats."
        )

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
