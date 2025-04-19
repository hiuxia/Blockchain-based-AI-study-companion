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
