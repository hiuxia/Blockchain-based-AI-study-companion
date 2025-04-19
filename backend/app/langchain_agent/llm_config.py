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

