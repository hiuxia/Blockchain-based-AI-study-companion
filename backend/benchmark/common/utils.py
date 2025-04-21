import os
import re
import subprocess
import time
from typing import Any, Dict, List, Optional, Tuple, Union

import openai
import pandas as pd
import psutil
from dotenv import load_dotenv

# Load environment variables from .env file
load_dotenv(dotenv_path="../../.env")  # Adjust path as needed to find backend/.env


def load_test_data(csv_path: str = "../data/test_questions.csv") -> pd.DataFrame:
    """
    Load test questions from a CSV file.

    Args:
        csv_path: Path to the CSV file containing test questions

    Returns:
        DataFrame containing test questions with columns:
        - question_id
        - question_text
        - question_type
        - source_docs
        - is_answerable
    """
    try:
        df = pd.read_csv(csv_path)

        # Validate required columns
        required_columns = [
            "question_id",
            "question_text",
            "question_type",
            "source_docs",
            "is_answerable",
        ]
        missing_columns = [col for col in required_columns if col not in df.columns]

        if missing_columns:
            raise ValueError(
                f"CSV is missing required columns: {', '.join(missing_columns)}"
            )

        # Convert is_answerable to boolean if it's not already
        if df["is_answerable"].dtype != bool:
            df["is_answerable"] = df["is_answerable"].map(
                lambda x: str(x).lower() == "true"
            )

        return df

    except FileNotFoundError:
        raise FileNotFoundError(f"Test data file not found at {csv_path}")
    except Exception as e:
        raise Exception(f"Error loading test data: {str(e)}")


def initialize_deepseek_client(model_name: str = "deepseek-v3-250324") -> openai.OpenAI:
    """
    Initialize the DeepSeek API client.

    Args:
        model_name: DeepSeek model name to use

    Returns:
        Initialized OpenAI-compatible client for DeepSeek API
    """
    # Get API key from environment variables
    ark_api_key = os.environ.get("ARK_API_KEY")

    if not ark_api_key:
        raise ValueError(
            "ARK_API_KEY environment variable not found. Please add it to your .env file."
        )

    # Initialize client with DeepSeek's API endpoint
    client = openai.OpenAI(
        base_url="https://ark.cn-beijing.volces.com/api/v3", api_key=ark_api_key
    )

    return client


def judge_relevance_deepseek(
    client: openai.OpenAI,
    question: str,
    answer: str,
    model_name: str = "deepseek-v3-250324",
) -> Optional[float]:
    """
    Use DeepSeek to judge the relevance of an answer to a question.

    Args:
        client: Initialized DeepSeek client
        question: The original question text
        answer: The generated answer to evaluate
        model_name: DeepSeek model to use

    Returns:
        Relevance score (1-5 scale) or None if evaluation failed
    """
    system_prompt = """You are an expert evaluator assessing the relevance of an answer to a user's question.
Evaluate ONLY how well the answer addresses the specific question asked, regardless of factual accuracy.
Relevance means the answer directly addresses what the question is asking about.

Rate the relevance on a scale of 1-5:
1: Completely irrelevant - The answer does not address the question at all.
2: Mostly irrelevant - The answer barely touches on the question's topic.
3: Somewhat relevant - The answer addresses the general topic but misses key aspects of the question.
4: Mostly relevant - The answer addresses most aspects of the question well.
5: Completely relevant - The answer directly and comprehensively addresses exactly what was asked.

Provide your verdict using this exact format:
Score: [1-5]
Reasoning: [Your reasoning here]
"""

    user_prompt = f"Question: {question}\n\nAnswer: {answer}"

    try:
        completion = client.chat.completions.create(
            model=model_name,
            messages=[
                {"role": "system", "content": system_prompt},
                {"role": "user", "content": user_prompt},
            ],
            temperature=0.0,
        )

        # Extract response content
        response_text = completion.choices[0].message.content

        # Extract score using regex
        score_match = re.search(r"Score:\s*(\d+)", response_text)
        if score_match:
            score = int(score_match.group(1))
            # Validate score range
            if 1 <= score <= 5:
                return float(score)
            else:
                print(f"Warning: Score {score} out of expected range (1-5)")
                return None
        else:
            print(
                f"Warning: Could not extract score from response: {response_text[:100]}..."
            )
            return None

    except Exception as e:
        print(f"Error in relevance evaluation: {str(e)}")
        return None


def judge_faithfulness_deepseek(
    client: openai.OpenAI,
    question: str,
    answer: str,
    contexts: List[str],
    model_name: str = "deepseek-v3-250324",
) -> Optional[Union[float, bool]]:
    """
    Use DeepSeek to judge the faithfulness (factual consistency) of an answer.

    Args:
        client: Initialized DeepSeek client
        question: The original question text
        answer: The generated answer to evaluate
        contexts: List of context chunks used to generate the answer
        model_name: DeepSeek model to use

    Returns:
        Faithfulness score (0-1 scale) or True/False, or None if evaluation failed
    """
    # Join contexts with separator for clarity
    formatted_contexts = "\n---\n".join(contexts)

    system_prompt = """You are an expert evaluator assessing if an answer is faithful to the provided context.
Faithfulness means every claim or statement in the answer is supported by the provided context chunks.
The answer should not contain information or claims that cannot be derived from the context chunks.

Evaluate ONLY whether the answer is supported by the provided context, ignoring whether the answer is relevant to the question.

Your verdict should be one of these two options:
- Faithful (1): The answer is fully supported by and consistent with the provided context.
- Unfaithful (0): The answer contains claims or information not supported by the provided context.

Provide your verdict using this exact format:
Verdict: [Faithful/Unfaithful]
Score: [1 for Faithful, 0 for Unfaithful]
Reasoning: [Your reasoning, highlighting any unsupported claims if unfaithful]
"""

    user_prompt = (
        f"Context:\n{formatted_contexts}\n\nQuestion: {question}\n\nAnswer: {answer}"
    )

    try:
        completion = client.chat.completions.create(
            model=model_name,
            messages=[
                {"role": "system", "content": system_prompt},
                {"role": "user", "content": user_prompt},
            ],
            temperature=0.0,
        )

        # Extract response content
        response_text = completion.choices[0].message.content

        # Try to extract numeric score
        score_match = re.search(r"Score:\s*(\d+)", response_text)
        if score_match:
            score = int(score_match.group(1))
            return float(score)

        # If no numeric score, try to extract verdict
        verdict_match = re.search(r"Verdict:\s*(Faithful|Unfaithful)", response_text)
        if verdict_match:
            verdict = verdict_match.group(1)
            return verdict == "Faithful"

        # If neither found, look for patterns in the text
        if (
            "faithful" in response_text.lower()
            and not "unfaithful" in response_text.lower()
        ):
            return True
        elif "unfaithful" in response_text.lower():
            return False

        # If still not determined
        print(
            f"Warning: Could not extract faithfulness verdict from response: {response_text[:100]}..."
        )
        return None

    except Exception as e:
        print(f"Error in faithfulness evaluation: {str(e)}")
        return None


def check_completion(
    generated_answer: str, is_answerable_ground_truth: bool, refusal_phrases: List[str]
) -> Dict[str, Any]:
    """
    Check if the system's completion/refusal behavior is correct.

    Args:
        generated_answer: The answer generated by the RAG system
        is_answerable_ground_truth: Ground truth on whether the question is answerable
        refusal_phrases: List of phrases indicating the system refused to answer

    Returns:
        Dictionary with results:
        - "status": One of "Correct Answer", "Correct Refusal",
                    "Incorrect Refusal", or "Incorrect Answer (Missing Refusal)"
        - "is_refusal": Whether the system refused to answer
        - "is_correct": Whether the behavior was correct
    """
    # Convert answer to lowercase for case-insensitive matching
    answer_lower = generated_answer.lower()

    # Check if answer contains any refusal phrases
    is_refusal = any(phrase.lower() in answer_lower for phrase in refusal_phrases)

    # Determine correctness based on ground truth and whether system refused
    if is_answerable_ground_truth:
        # Question should be answered
        if not is_refusal:
            status = "Correct Answer"
            is_correct = True
        else:
            status = "Incorrect Refusal"
            is_correct = False
    else:
        # Question should be refused
        if is_refusal:
            status = "Correct Refusal"
            is_correct = True
        else:
            status = "Incorrect Answer (Missing Refusal)"
            is_correct = False

    return {"status": status, "is_refusal": is_refusal, "is_correct": is_correct}


def find_backend_pid(process_name: str = "uvicorn") -> Optional[int]:
    """
    Find the process ID (PID) of the running backend server.

    Args:
        process_name: Process name to search for (default: "uvicorn")

    Returns:
        PID of the backend server if found, None otherwise
    """
    for proc in psutil.process_iter(["pid", "name", "cmdline"]):
        try:
            # Check if process name contains the target string
            if process_name.lower() in proc.info["name"].lower():
                # Check if command line arguments are as expected for our backend
                cmdline = proc.info.get("cmdline", [])
                cmdline_str = " ".join(cmdline).lower()

                # Look for uvicorn main:app or similar pattern
                if "main:app" in cmdline_str or "app.main:app" in cmdline_str:
                    return proc.info["pid"]

        except (psutil.NoSuchProcess, psutil.AccessDenied, psutil.ZombieProcess):
            continue

    return None


def manage_backend_process(
    action: str = "status", env_vars: Optional[Dict[str, str]] = None, timeout: int = 30
) -> Dict[str, Any]:
    """
    Manage the backend server process (start, stop, restart, or check status).

    Args:
        action: Action to perform ('start', 'stop', 'restart', 'status')
        env_vars: Dictionary of environment variables to set when starting the server
        timeout: Timeout in seconds for each action

    Returns:
        Dictionary with results:
        - "success": Whether the action was successful
        - "pid": PID of the backend server (if running)
        - "status": Current status of the backend server
        - "error": Error message (if any)
    """
    result = {"success": False, "pid": None, "status": "unknown", "error": None}

    # Check current status
    current_pid = find_backend_pid()
    if current_pid:
        result["pid"] = current_pid
        result["status"] = "running"
    else:
        result["status"] = "stopped"

    # Return if only checking status
    if action == "status":
        result["success"] = True
        return result

    # Handle stop action
    if action in ["stop", "restart"] and current_pid:
        try:
            # Try graceful termination
            process = psutil.Process(current_pid)
            process.terminate()

            # Wait for process to end
            start_time = time.time()
            while time.time() - start_time < timeout:
                if not psutil.pid_exists(current_pid):
                    break
                time.sleep(0.5)

            # Force kill if still running
            if psutil.pid_exists(current_pid):
                process.kill()

            # Update status
            if not psutil.pid_exists(current_pid):
                result["status"] = "stopped"
            else:
                result["error"] = f"Failed to stop backend process (PID: {current_pid})"
                return result

        except psutil.NoSuchProcess:
            result["status"] = "stopped"
        except Exception as e:
            result["error"] = f"Error stopping backend: {str(e)}"
            return result

    # Return if only stopping
    if action == "stop":
        result["success"] = True
        return result

    # Handle start action
    if action in ["start", "restart"]:
        try:
            # Set environment variables for backend
            my_env = os.environ.copy()
            if env_vars:
                for key, value in env_vars.items():
                    my_env[key] = str(value)

            # Start backend server
            # Adjust the command as needed for your specific setup
            backend_root = os.path.abspath(
                os.path.join(os.path.dirname(__file__), "../../..")
            )
            cmd = ["uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8000"]

            # Start process
            process = subprocess.Popen(
                cmd,
                env=my_env,
                cwd=backend_root,
                stdout=subprocess.PIPE,
                stderr=subprocess.PIPE,
            )

            # Wait for server to start
            start_time = time.time()
            while time.time() - start_time < timeout:
                new_pid = find_backend_pid()
                if new_pid:
                    result["pid"] = new_pid
                    result["status"] = "running"
                    result["success"] = True
                    return result
                time.sleep(1)

            # If we got here, server didn't start in time
            result["error"] = "Backend server failed to start within timeout"
            return result

        except Exception as e:
            result["error"] = f"Error starting backend: {str(e)}"
            return result

    # Invalid action
    result["error"] = f"Invalid action: {action}"
    return result
