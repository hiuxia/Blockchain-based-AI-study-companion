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
