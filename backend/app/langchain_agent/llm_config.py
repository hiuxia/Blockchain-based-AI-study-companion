# backend/app/langchain_agent/llm_config.py
from app.core.logger import logger
from langchain_community.llms import HuggingFaceTextGenInference
from langchain_core.language_models import BaseChatModel
from langchain_google_genai import ChatGoogleGenerativeAI


def get_llm(model_name: str = "gemini2") -> BaseChatModel:
    """
    根据提供的模型名称初始化并返回对应的 LLM 模型实例。

    参数:
      - model_name: 模型名称，支持 'gemini2' 和 'llama4'

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
                f"Failed to initialize Llama 4 model: {str(e)}. Falling back to Gemini 2."
            )
            # Fall back to Gemini 2 if Llama 4 fails
            return get_gemini_model()
    else:
        # Default to Gemini 2
        return get_gemini_model()

def get_gemini_model() -> BaseChatModel:
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
    logger.info("Using Gemini 2 model")
    return ChatGoogleGenerativeAI(
        model="gemini-2.0-flash-latest",
        temperature=0.7,
        convert_system_message_to_human=True,
        safety_settings={"HARASSMENT": "BLOCK_NONE"},
        generation_config={"citations": True}
    )

# For backward compatibility
load_llm = get_gemini_model
