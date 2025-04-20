# backend/app/langchain_agent/llm_config.py
import os

from app.core.config import settings
from app.core.logger import logger
from google.generativeai.types import HarmBlockThreshold, HarmCategory
from langchain_community.llms import HuggingFaceTextGenInference
from langchain_core.language_models import BaseChatModel
from langchain_google_genai import ChatGoogleGenerativeAI
from pydantic import SecretStr


def get_llm(model_name: str = "gemma3") -> BaseChatModel:
    """
    根据提供的模型名称初始化并返回对应的 LLM 模型实例。

    参数:
      - model_name: 模型名称，支持 'gemma3' 和 'llama4'

    返回:
      - 一个 BaseChatModel 实例
    """
    logger.info(f"Initializing LLM with model: {model_name}")

    if model_name == "llama4":
        try:
            # This is a placeholder for LLaMA 4 integration
            # In a real implementation, you would configure the actual endpoint
            logger.info("Using Llama 4 model")
            return HuggingFaceTextGenInference(
                inference_server_url="http://localhost:8080/",
                max_new_tokens=512,
                temperature=0.7,
                stop_sequences=["\n\n"],
                timeout=120,
            )
        except Exception as e:
            logger.error(
                f"Failed to initialize Llama 4 model: {str(e)}. Falling back to Gemma 3."
            )
            # Fall back to Gemma 3 if Llama 4 fails
            return get_gemini_model()
    else:
        # Default to Gemma 3
        return get_gemini_model()

def get_gemini_model() -> BaseChatModel:
    """
    初始化并返回 Gemma 模型实例。

    参数说明：
      - 使用 ChatGoogleGenerativeAI 调用 Gemma 3 模型。
      - convert_system_message_to_human 设置为 True，有助于适应对话场景。
      - safety_settings 参数使用数字枚举值，以符合 API 要求。
      - temperature 参数设为 0.7，用于控制输出的随机性。

    返回：
      - 一个 BaseChatModel 实例。
    """
    logger.info("Using Gemma 3-27B model")
    gemini_api_key = settings.gemini_api_key
    if not gemini_api_key:
        logger.warning("GEMINI_API_KEY not found in settings")

    safety_settings = {
        HarmCategory.HARM_CATEGORY_HARASSMENT: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE,
        HarmCategory.HARM_CATEGORY_HATE_SPEECH: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE,
        HarmCategory.HARM_CATEGORY_SEXUALLY_EXPLICIT: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE,
        HarmCategory.HARM_CATEGORY_DANGEROUS_CONTENT: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE,
    }
    return ChatGoogleGenerativeAI(
        model="models/gemma-3-27b-it",  # Using Gemma 3 27B model as specified
        temperature=0.7,
        convert_system_message_to_human=True,
        safety_settings=safety_settings,
        google_api_key=SecretStr(gemini_api_key) if gemini_api_key else None,
    )

# For backward compatibility
load_llm = get_gemini_model
