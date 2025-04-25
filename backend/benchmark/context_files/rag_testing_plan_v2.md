# Detailed Phased RAG Testing Plan

This plan breaks down the RAG evaluation process into distinct phases with detailed steps.

---

## Phase 1: Setup and Preparation

**Objective:** Prepare the environment, data, code modifications, and utilities needed for testing.

### Steps

1. **Create Directory Structure**
    - Establish the `backend/benchmark/` directory and its subdirectories:
      - `sources`
      - `data`
      - `results`
      - `common`
      - `modified_backend`

2. **Populate Source Documents**
    - Copy 10-15 diverse PDF documents relevant to the course/project into `benchmark/sources/`.

3. **Finalize Test Questions**
    - Generate, review, and save the final `test_questions.csv` file in `benchmark/data/` with columns:
      - `question_id`
      - `question_text`
      - `question_type`
      - `source_docs`
      - `is_answerable`

4. **Install Dependencies**
    - Create a virtual environment.
    - Install all packages listed in `backend/benchmark/requirements_benchmark.txt` (e.g., `pytest`, `pandas`, `requests`, `psutil`, `python-dotenv`, `matplotlib`, `seaborn`, `openai` for DeepSeek, optionally `ragas`).
    - Ensure backend dependencies from `backend/requirements.txt` are also installed if running the backend locally.

5. **Configure Environment**
    - Create or update the `.env` file in the `backend/` root directory.
    - Add/verify:
      - `DEEPSEEK_API_KEY="your_actual_deepseek_api_key"`
      - Any other necessary API keys (e.g., `GEMINI_API_KEY`).

6. **Implement Backend Modifications**
    - **Return Context:**  
      Modify the backend's `/qa` endpoint (`app/api/qa.py`) to include the retrieved contexts (list of text chunk strings) in its JSON response.
    - **Configurable Chunking:**  
      Modify the chunking logic in `app/langchain_agent/tools.py` (or use a copy in `benchmark/modified_backend/`) to read `chunk_size` and `chunk_overlap` from environment variables (`CHUNK_SIZE`, `CHUNK_OVERLAP`), with defaults if unset.

7. **Implement Common Utilities (`benchmark/common/`)**
    - `api_client.py`: Functions to call the backend `/sources` and modified `/qa` endpoint (fetching answer, contexts, latency, handling errors).
    - `utils.py`: Helper functions for:
      - Loading test data from `test_questions.csv`.
      - Initializing the DeepSeek V3 client (using `openai.OpenAI`, reading `DEEPSEEK_API_KEY`, setting `base_url`).
      - (For Script 2) Finding the backend process PID.
      - (For Script 2) Managing backend server start/stop/restart for environment variable changes.

8. **Implement Judge Functions**
    - In test scripts or `common/utils.py`, implement:
      - `judge_relevance_deepseek(client, question, answer, model_name="deepseek-v3-250324")`
      - `judge_faithfulness_deepseek(client, question, answer, contexts, model_name="deepseek-v3-250324")`
    - Functions should:
      - Accept the initialized DeepSeek client.
      - Construct prompt messages (system + user prompt).
      - Call `client.chat.completions.create(...)` (non-streaming).
      - Parse score/verdict from `completion.choices[0].message.content`.
      - Handle API errors/unexpected formats robustly.

9. **Implement Completion Check**
    - Implement `check_completion(generated_answer, is_answerable_ground_truth, refusal_phrases)` as defined in the research report/approach document.

---

## Phase 2: Response Quality Evaluation (Baseline)

**Objective:** Evaluate RAG quality metrics using the default backend chunking settings.

**Script:** `benchmark/test_response_quality.py`

### Steps

1. **Setup**
    - Ensure backend server is running with default chunking configuration (`CHUNK_SIZE` and `CHUNK_OVERLAP` unset or ignored).
    - Load test questions from `benchmark/data/test_questions.csv` using pandas.
    - Initialize DeepSeek V3 client using helper function from `common/utils.py`.
    - Define list of `refusal_phrases`.
    - Initialize empty list/DataFrame for results.

2. **Execution Loop**
    - For each question in test data:
      - Identify `source_ids` for `source_docs` (pre-upload or fixed mapping).
      - Call `common.api_client.query_qa` with `question_text` and `source_ids`.
      - Record answer, contexts, latency; handle API errors.
      - If successful:
         - Call `judge_relevance_deepseek` for relevance score.
         - Call `judge_faithfulness_deepseek` for faithfulness score.
         - Call `check_completion` for completion/refusal status.
      - Store all collected data for this question.

3. **Logging**
    - Save results to a pandas DataFrame and export to CSV (e.g., `results/baseline_quality_results.csv`).

4. **Analysis (Optional)**
    - Calculate and print aggregate metrics:
      - Average relevance
      - Average faithfulness
      - Overall TCR
      - Refusal accuracy
      - Average/p95 latency

---

## Phase 3: Chunking Strategy Evaluation

**Objective:** Evaluate quality and performance metrics across various chunking configurations.

**Script:** `benchmark/test_chunking_impact.py`

### Steps

1. **Define Configurations**
    - Create a list of `(chunk_size, chunk_overlap)` tuples to test (include default, e.g., 500/50).

2. **Load Test Data**
    - Load `test_questions.csv`.

3. **Initialize**
    - Initialize DeepSeek V3 client.
    - Define `refusal_phrases`.
    - Initialize results list/DataFrame.

4. **Configuration Loop**
    - For each `(cs, co)` configuration:
      1. **Configure Backend**
          - Stop current backend server (if any).
          - Set environment variables:  
             `os.environ['CHUNK_SIZE'] = str(cs)`  
             `os.environ['CHUNK_OVERLAP'] = str(co)`
          - Start backend server using modified code.
          - Obtain PID using `common.utils`.
          - Wait for server initialization.
      2. **Monitor Memory**
          - Start background thread (using `threading` and `psutil`) to poll backend PID's RSS memory usage at intervals (e.g., 0.5s).
      3. **Execute Tests**
          - For each question:
             - Call `common.api_client.query_qa`.
             - Record answer, contexts, latency.
             - Calculate relevance, faithfulness, completion status.
             - Store results with current chunk config.
      4. **Stop Monitoring & Log**
          - Signal memory monitoring thread to stop and join.
          - Process memory readings (peak/avg RSS).
          - Append test and memory stats to overall results.
          - Optionally save intermediate results for this config (e.g., `results/results_{cs}_{co}.csv`).

5. **Overall Logging**
    - Save complete results DataFrame to main CSV (e.g., `results/chunking_impact_all_results.csv`).

---

## Phase 4: Analysis and Visualization

**Objective:** Analyze the collected results to understand trade-offs and visualize findings.

**Script:** Can be part of `test_chunking_impact.py` or a separate `analyze_results.py`.

### Steps

1. **Load Data**
    - Load main results CSV (`results/chunking_impact_all_results.csv`) into pandas DataFrame.

2. **Calculate Aggregates**
    - Group by `chunk_size` and `chunk_overlap`.
    - Calculate aggregate statistics (mean, median, std, p95, p99) for:
      - Relevance Score
      - Faithfulness Score
      - TCR & RA (from completion status counts)
      - Latency
      - Peak & Average RSS

3. **Generate Plots**
    - Use matplotlib/seaborn to create and save plots in `results/`:
      - Bar charts: Avg Quality Metrics (Relevance, Faithfulness) vs. Chunk Size
      - Bar charts: Avg Completion Rates (TCR, RA) vs. Chunk Size
      - Box/Line plots: Latency (Avg, P95) vs. Chunk Size
      - Bar/Line charts: Memory Usage (Peak/Avg RSS) vs. Chunk Size
      - Scatter plot: Avg Relevance vs. Avg Latency (points marked by chunk size)

4. **Analyze Trade-offs**
    - Review statistics and plots to identify optimal chunking configuration(s) balancing quality, performance, and resource usage.

5. **Document**
    - Summarize key findings and recommended configuration.

