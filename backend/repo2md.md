# Backend Documentation

 of NLP ProjectGenerated on 4/19/2025

This doc provides a comprehensive overview of the backend of the NLP Project.

## Table of Contents

- 📁 app/
  - 📁 api/
    - 📄 [history.py](#app-api-history-py)
    - 📄 [process.py](#app-api-process-py)
    - 📄 [sources.py](#app-api-sources-py)
  - 📁 core/
    - 📄 [config.py](#app-core-config-py)
    - 📄 [cors.py](#app-core-cors-py)
    - 📄 [database.py](#app-core-database-py)
  - 📁 crud/
    - 📄 [history.py](#app-crud-history-py)
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
    - 📄 [schemas.py](#app-models-schemas-py)
    - 📄 [source.py](#app-models-source-py)
    - 📄 [summary.py](#app-models-summary-py)
  - 📁 services/
    - 📄 [file_storage.py](#app-services-file_storage-py)
    - 📄 [task_manager.py](#app-services-task_manager-py)
- 📄 [requirements.txt](#requirements-txt)

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

### <a id="app-api-sources-py"></a>app/api/sources.py

```python
# backend/app/api/sources.py
from fastapi import APIRouter, UploadFile, File, HTTPException, Depends
from sqlalchemy.orm import Session
from app.core.database import get_db
from app.crud.source import create_source, get_source
from app.models.schemas import SourceResponse
from app.services import file_storage

router = APIRouter(prefix="/sources", tags=["sources"])

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

```

### <a id="app-core-config-py"></a>app/core/config.py

```python
# backend/app/core/config.py
from pydantic_settings import BaseSettings
from pathlib import Path

class Settings(BaseSettings):
    app_name: str = "Document Processor"
    database_url: str = "sqlite:///./documents.db"
    upload_dir: Path = Path("uploaded_sources")
    # 配置相关 API Key
    openai_api_key: str
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

### <a id="app-crud-source-py"></a>app/crud/source.py

```python
# backend/app/crud/source.py
from sqlalchemy.orm import Session
from app.models.source import DBSource

def get_source(db: Session, source_id: str):
    return db.query(DBSource).filter(DBSource.id == source_id).first()

def create_source(db: Session, filename: str, content_type: str) -> str:
    import uuid
    source = DBSource(id=str(uuid.uuid4()), filename=filename, content_type=content_type)
    db.add(source)
    db.commit()
    db.refresh(source)
    return source.id

```

### <a id="app-crud-summary-py"></a>app/crud/summary.py

```python
# backend/app/crud/summary.py
import uuid
from sqlalchemy.orm import Session
from app.models.summary import DBSummary

def create_summary(db: Session, source_ids: list[str], markdown: str, vector_index_path: str = None) -> DBSummary:
    summary = DBSummary(
        id=str(uuid.uuid4()),
        source_ids=",".join(source_ids),
        markdown=markdown,
        vector_index_path=vector_index_path
    )
    db.add(summary)
    db.commit()
    db.refresh(summary)
    return summary

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
from langchain_google_genai import ChatGoogleGenerativeAI
from langchain_core.language_models import BaseChatModel

def load_llm() -> BaseChatModel:
    """
    初始化并返回 Gemini 2.0 Flash 模型实例。
    
    参数说明：
      - 使用 ChatGoogleGenerativeAI 调用 Gemini 2.0 Flash 模型。
      - convert_system_message_to_human 设置为 True，有助于适应对话场景。
      - safety_settings 及 generation_config 可进一步控制输出，如启用引用功能（"citations": True）。
      - temperature 参数设为 0.7，用于控制输出的随机性。
    
    返回：
      - 一个 BaseChatModel 实例。
    """
    return ChatGoogleGenerativeAI(
        model="gemini-2.0-flash-latest",
        temperature=0.7,
        convert_system_message_to_human=True,
        safety_settings={"HARASSMENT": "BLOCK_NONE"},
        generation_config={"citations": True}
    )


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
from langchain.prompts import ChatPromptTemplate

# 针对 PDF 文档生成 Markdown 摘要（不含引用）
SUMMARY_PROMPT = ChatPromptTemplate.from_messages([
    ("system", "你是一位学习助理，请根据以下文档内容生成结构化的 Markdown 笔记，要求内容准确、层次清晰。"),
    ("human", "{context}")
])

# 针对对话交互，要求回答中包含引用（例如 Markdown 链接，可点击跳转）
CONVERSATION_PROMPT = ChatPromptTemplate.from_messages([
    ("system", "你是一位智能学习助理。请根据用户提问生成回答，并在回答中适当地添加引用，例如：[引用名称](https://example.com)。"),
    ("human", "{input}")
])

```

### <a id="app-langchain_agent-rag_agent-py"></a>app/langchain_agent/rag_agent.py

```python
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

```

### <a id="app-langchain_agent-tools-py"></a>app/langchain_agent/tools.py

```python
# backend/app/langchain_agent/tools.py

from pathlib import Path
from typing import List
from langchain.document_loaders import PyPDFLoader
from langchain.text_splitter import RecursiveCharacterTextSplitter
from langchain.schema import Document
from langchain.embeddings import OpenAIEmbeddings
from langchain_google_genai import GoogleGenerativeAIEmbeddings
from langchain.vectorstores import FAISS

# 设置向量数据库的本地保存目录
VECTORSTORE_DIR = Path("vectorstore")

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
    chunks: List[Document],
    store_name: str,
    embedding_model: str = "openai"
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
        embedding = GoogleGenerativeAIEmbeddings(model="models/embedding-001")
    else:
        embedding = OpenAIEmbeddings()
    vectorstore = FAISS.from_documents(chunks, embedding)
    save_path = VECTORSTORE_DIR / store_name
    vectorstore.save_local(str(save_path))
    return vectorstore

def load_vectorstore(
    store_name: str,
    embedding_model: str = "openai"
) -> FAISS:
    """
    加载指定名称的本地 FAISS 向量存储。
    
    参数：
      - store_name: 向量存储保存的文件名。
      - embedding_model: 使用的嵌入模型。
      
    返回:
      - 加载后的 FAISS 向量存储对象。
    """
    if embedding_model == "google":
        embedding = GoogleGenerativeAIEmbeddings(model="models/embedding-001")
    else:
        embedding = OpenAIEmbeddings()
    return FAISS.load_local(str(VECTORSTORE_DIR / store_name), embeddings=embedding)

```

### <a id="app-main-py"></a>app/main.py

```python
# backend/app/main.py
from fastapi import FastAPI
from app.core.config import settings
from app.core.database import engine, Base
from app.core.cors import add_cors
from app.api import sources, process, history
from app.models import source, summary, history as history_model

# 创建所有数据库表
Base.metadata.create_all(bind=engine)

app = FastAPI(title=settings.app_name)
app = add_cors(app)

app.include_router(sources.router)
app.include_router(process.router)
app.include_router(history.router)

@app.get("/health")
def health_check():
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

### <a id="app-models-schemas-py"></a>app/models/schemas.py

```python
# backend/app/models/schemas.py
from pydantic import BaseModel
from datetime import datetime
from typing import Optional, List

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

class HistoryCreate(BaseModel):
    conversation: str

class HistoryResponse(BaseModel):
    id: str
    conversation: str
    created_at: datetime

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
from sqlalchemy import Column, String, Text, DateTime, func
from app.core.database import Base

class DBSummary(Base):
    __tablename__ = "summaries"
    id = Column(String, primary_key=True, index=True)
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

class FileStorageService:
    def __init__(self):
        self.upload_dir = settings.upload_dir
        if not self.upload_dir.exists():
            self.upload_dir.mkdir(parents=True, exist_ok=True)
    
    def get_file_path(self, source_id: str) -> Path:
        # 假设上传文件命名规则为 source_id + ".pdf"
        return self.upload_dir / f"{source_id}.pdf"

file_storage = FileStorageService()

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

### <a id="requirements-txt"></a>requirements.txt

```plaintext
Name: fastapi
Version: 0.115.12

Name: uvicorn
Version: 0.34.0

Name: SQLAlchemy
Version: 2.0.34

Name: pydantic-settings
Version: 2.8.1

Name: python-dotenv
Version: 0.21.0

Name: langchain
Version: 0.1.4

Name: langchain-community
Version: 0.0.20

Name: langchain-core
Version: 0.1.23

Name: langsmith
Version: 0.0.87

Name: numpy
Version: 1.26.4
```

