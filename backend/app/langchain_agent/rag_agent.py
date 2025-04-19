# backend/app/langchain_agent/rag_agent.py
from typing import List
from langchain.embeddings import HuggingFaceEmbeddings
from langchain.vectorstores import FAISS
from langchain.chains import RetrievalQA
from .llm_config import get_llm
from .tools import load_documents

def load_documents_for_rag(paths: List[str]) -> List[str]:
    """
    从给定的 PDF 文件路径列表中加载文档，并拆分为多个文本块，
    返回所有文本块（chunk）的列表。
    """
    docs = load_documents(paths)
    return [doc.page_content for doc in docs]

def create_vectorstore_from_texts(texts: List[str]) -> FAISS:
    """
    根据文本列表计算嵌入向量，并利用 FAISS 构建向量存储。
    """
    embeddings = HuggingFaceEmbeddings(model_name="all-MiniLM-L6-v2")
    vectorstore = FAISS.from_texts(texts, embeddings)
    return vectorstore

def create_rag_chain(paths: List[str], llm_model: str, top_k: int = 3) -> RetrievalQA:
    """
    构建 Retrieval-Augmented Generation（RAG）问答链：
    1. 加载 PDF 并拆分为文本块；
    2. 根据文本块计算嵌入并构建 FAISS 向量存储；
    3. 配置检索器，返回与查询最相关的 top_k 个文本块；
    4. 利用 LLM 生成答案（"stuff" 模式）。
    """
    texts = load_documents_for_rag(paths)
    vectorstore = create_vectorstore_from_texts(texts)
    llm = get_llm(llm_model)
    retriever = vectorstore.as_retriever(search_kwargs={"k": top_k})
    qa_chain = RetrievalQA.from_chain_type(
        llm=llm,
        chain_type="stuff",
        retriever=retriever,
        verbose=True
    )
    return qa_chain

if __name__ == "__main__":
    file_paths = ["uploaded_sources/sample.pdf"]  # 确保该文件存在
    rag_chain = create_rag_chain(file_paths, "gemini-flash")
    query = "请总结这份文档的主要内容。"
    answer = rag_chain.run(query)
    print("RAG Chain Answer:\n", answer)
