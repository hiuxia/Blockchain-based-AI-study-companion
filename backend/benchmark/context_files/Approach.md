# RAG System Evaluation Approach

This document details the methodology used in the benchmark scripts (`test_response_quality.py` and `test_chunking_impact.py`) to evaluate the RAG system. The approach is based on the findings of the "RAG Testing Script Development" research report and the CS6493 project requirements.

## Evaluation Goals

1.  **Assess Response Quality (Baseline):** Measure the relevance, faithfulness, and completion/refusal accuracy of the RAG system using its default configuration.
2.  **Analyze Chunking Impact:** Evaluate how different `chunk_size` and `chunk_overlap` settings affect response quality, API latency, and backend memory usage.

## Metrics

The following metrics are calculated:

1.  **Relevance Score (LLM-as-Judge):**
    * **Definition:** How pertinent the generated answer is to the user's query intent.
    * **Method:** A separate LLM (DeepSeek V3, accessed via API key stored in `.env`) acts as a judge.
    * **Prompting:** The judge is prompted with the original `question_text` and the RAG system's generated `answer`. It's asked to rate relevance on a scale (e.g., 1-5) and provide reasoning, focusing only on pertinence, not factual accuracy.
    * **Output:** A numerical score (parsed from the judge's response).

2.  **Faithfulness Score (LLM-as-Judge):**
    * **Definition:** The factual consistency of the generated answer with the retrieved context chunks. Measures hallucination.
    * **Method:** DeepSeek V3 acts as a judge.
    * **Prompting:** The judge is prompted with the `question_text`, the generated `answer`, and the list of `contexts` (text chunks retrieved by the RAG system from the source documents). It's asked to verify if each statement in the answer is supported *only* by the provided contexts and assign a score/verdict.
    * **Output:** A numerical score or binary verdict (parsed from the judge's response).
    * **Prerequisite:** Requires the backend `/qa` endpoint to return the `contexts`.

3.  **Task Completion Rate (TCR):**
    * **Definition:** Percentage of test questions handled correctly (answered appropriately when answerable, refused correctly when unanswerable).
    * **Method:** Compares the generated `answer` against the `is_answerable` ground truth flag from `test_questions.csv`.
    * **Logic:** Uses predefined `refusal_phrases` (e.g., "I cannot answer", "unable to find information").
        * If `is_answerable` is `True`: Correct if no refusal phrase is present. Incorrect if refusal phrase is present.
        * If `is_answerable` is `False`: Correct if refusal phrase is present. Incorrect if no refusal phrase is present.
    * **Output:** Overall percentage of correct handling.

4.  **Refusal Accuracy (RA):**
    * **Definition:** Percentage of *unanswerable* questions (where `is_answerable` is `False`) that were correctly refused by the system.
    * **Method:** Subset of TCR calculation, focusing only on questions marked as `refusal` type / `is_answerable=False`.
    * **Output:** Percentage of correct refusals for unanswerable questions.

5.  **API Latency:**
    * **Definition:** End-to-end time taken for the `/qa` API endpoint to respond to a query.
    * **Method:** Measured for each API call using `requests.elapsed.total_seconds()` or `time.perf_counter()`.
    * **Output:** Latency in seconds per query. Aggregated statistics (average, median, p95, p99) are calculated per run/configuration.

6.  **Memory Usage (RSS):**
    * **Definition:** Peak and average Resident Set Size (RSS) memory consumed by the backend FastAPI process during a test run for a specific configuration. RSS is a practical measure of physical RAM usage.
    * **Method:** Uses the `psutil` library to monitor the backend process's `memory_info().rss` periodically (e.g., every 0.5 seconds) during the execution of test queries for one chunking configuration.
    * **Output:** Peak and average RSS values (in MB) per configuration. Comparisons focus on relative differences between configurations.
    * **Prerequisite:** Requires identifying the Process ID (PID) of the backend server.

## Testing Workflow

1.  **Baseline Quality (`test_response_quality.py`):** Runs all questions from `test_questions.csv` against the backend using its default chunking settings. Calculates Relevance, Faithfulness, TCR, RA, and Latency.
2.  **Chunking Impact (`test_chunking_impact.py`):**
    * Iterates through a predefined list of `(chunk_size, chunk_overlap)` configurations.
    * For each configuration:
        * Sets backend chunking parameters (via environment variables, requiring backend restart).
        * Monitors backend memory usage using `psutil`.
        * Runs all test questions.
        * Calculates all metrics (Relevance, Faithfulness, TCR, RA, Latency, Memory Usage).
        * Logs results specific to that configuration.

## Chunking Strategy Configuration

* The `test_chunking_impact.py` script relies on the backend's chunking logic (in `app/langchain_agent/tools.py` or a modified version) being sensitive to environment variables `CHUNK_SIZE` and `CHUNK_OVERLAP`.
* The script manages setting these variables and potentially restarting the backend between testing different configurations.

## Analysis and Visualization

* Results from all runs are collected into `pandas` DataFrames.
* Aggregate statistics are computed for each metric per configuration.
* Plots are generated using `matplotlib`/`seaborn` to visualize:
    * Quality metrics vs. Chunk Size.
    * Completion/Refusal rates vs. Chunk Size.
    * Latency distribution vs. Chunk Size.
    * Memory usage vs. Chunk Size.
    * Trade-offs (e.g., Relevance vs. Latency).

This systematic approach allows for empirical analysis of how chunking choices impact the different facets of the RAG system's performance and quality.

*(Refer to the "RAG Testing Script Development" research report for more in-depth discussion of evaluation frameworks like RAGAS and LLM-as-a-judge prompting techniques.)*
