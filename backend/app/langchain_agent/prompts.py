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
