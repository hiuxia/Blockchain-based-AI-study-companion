import json
import time
from typing import Any, Dict, List, Optional, Union

import requests
from requests.exceptions import RequestException, Timeout

# Configuration
API_BASE_URL = "http://localhost:8000"  # Default backend URL
DEFAULT_TIMEOUT = 120  # Default timeout in seconds for API calls


def query_qa(
    question_text: str,
    source_ids: List[str],
    llm_model: str = "gemma3",
    timeout: int = DEFAULT_TIMEOUT,
) -> Dict[str, Any]:
    """
    Query the backend QA endpoint with a question.

    Args:
        question_text: The question to ask
        source_ids: List of document IDs to use as sources
        llm_model: The LLM model to use (default: "gemma3")
        timeout: Request timeout in seconds

    Returns:
        Dictionary containing:
        - answer: The generated answer (str)
        - contexts: List of retrieved contexts (List[str])
        - references: List of source references (List[str])
        - latency: Time taken for the API call (float)
        - status_code: HTTP status code (int)
        - error: Error message if any (Optional[str])
    """
    endpoint_url = f"{API_BASE_URL}/qa"

    # Prepare request payload
    payload = {
        "question": question_text,
        "source_ids": source_ids,
        "llm_model": llm_model,
    }

    # Initialize result dictionary with defaults
    result = {
        "answer": "",
        "contexts": [],
        "references": [],
        "latency": 0.0,
        "status_code": 0,
        "error": None,
    }

    try:
        # Start timer for accurate latency measurement
        start_time = time.perf_counter()

        # Make the API call
        response = requests.post(endpoint_url, json=payload, timeout=timeout)

        # Calculate latency
        latency = time.perf_counter() - start_time
        result["latency"] = latency

        # Record status code
        result["status_code"] = response.status_code

        # Parse response if successful
        if response.status_code == 200:
            response_data = response.json()

            # Extract data from response
            result["answer"] = response_data.get("answer", "")
            result["contexts"] = response_data.get("contexts", [])
            result["references"] = response_data.get("references", [])
        else:
            result["error"] = f"API error: HTTP {response.status_code}"
            try:
                error_detail = response.json().get("detail", "No detail provided")
                result["error"] += f" - {error_detail}"
            except ValueError:
                # If response is not JSON
                result["error"] += f" - {response.text[:100]}"

    except Timeout:
        result["error"] = f"Request timed out after {timeout} seconds"
    except RequestException as e:
        result["error"] = f"Request failed: {str(e)}"
    except Exception as e:
        result["error"] = f"Unexpected error: {str(e)}"

    return result


def upload_source(
    file_path: str, filename: Optional[str] = None, timeout: int = DEFAULT_TIMEOUT
) -> Dict[str, Any]:
    """
    Upload a source file to the backend.

    Args:
        file_path: Path to the file to upload
        filename: Optional filename to use (defaults to basename of file_path)
        timeout: Request timeout in seconds

    Returns:
        Dictionary containing:
        - source_id: ID of the uploaded source (str) if successful
        - success: Whether the upload was successful (bool)
        - status_code: HTTP status code (int)
        - error: Error message if any (Optional[str])
    """
    endpoint_url = f"{API_BASE_URL}/sources"

    if filename is None:
        # Use the basename of the file path
        import os

        filename = os.path.basename(file_path)

    result = {"source_id": "", "success": False, "status_code": 0, "error": None}

    try:
        with open(file_path, "rb") as file:
            files = {"file": (filename, file, "application/pdf")}

            response = requests.post(endpoint_url, files=files, timeout=timeout)

            result["status_code"] = response.status_code

            if response.status_code == 200:
                response_data = response.json()
                result["source_id"] = response_data.get("source_id", "")
                result["success"] = True
            else:
                result["error"] = f"API error: HTTP {response.status_code}"
                try:
                    error_detail = response.json().get("detail", "No detail provided")
                    result["error"] += f" - {error_detail}"
                except ValueError:
                    result["error"] += f" - {response.text[:100]}"

    except Timeout:
        result["error"] = f"Request timed out after {timeout} seconds"
    except RequestException as e:
        result["error"] = f"Request failed: {str(e)}"
    except FileNotFoundError:
        result["error"] = f"File not found: {file_path}"
    except Exception as e:
        result["error"] = f"Unexpected error: {str(e)}"

    return result


def list_sources(timeout: int = DEFAULT_TIMEOUT) -> Dict[str, Any]:
    """
    Get a list of all sources from the backend.

    Args:
        timeout: Request timeout in seconds

    Returns:
        Dictionary containing:
        - sources: List of source objects (if successful)
        - success: Whether the request was successful (bool)
        - status_code: HTTP status code (int)
        - error: Error message if any (Optional[str])
    """
    endpoint_url = f"{API_BASE_URL}/sources"

    result = {"sources": [], "success": False, "status_code": 0, "error": None}

    try:
        response = requests.get(endpoint_url, timeout=timeout)

        result["status_code"] = response.status_code

        if response.status_code == 200:
            result["sources"] = response.json()
            result["success"] = True
        else:
            result["error"] = f"API error: HTTP {response.status_code}"
            try:
                error_detail = response.json().get("detail", "No detail provided")
                result["error"] += f" - {error_detail}"
            except ValueError:
                result["error"] += f" - {response.text[:100]}"

    except Timeout:
        result["error"] = f"Request timed out after {timeout} seconds"
    except RequestException as e:
        result["error"] = f"Request failed: {str(e)}"
    except Exception as e:
        result["error"] = f"Unexpected error: {str(e)}"

    return result
