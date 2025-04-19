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
