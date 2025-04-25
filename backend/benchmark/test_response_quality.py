#!/usr/bin/env python3
"""
Phase 2 - Response Quality Evaluation (Baseline)

This script evaluates the RAG system's response quality using its default chunking configuration.
It processes test questions from test_questions.csv, calls the backend API, and evaluates
responses using DeepSeek judge functions for both gemma3 and llama4 models.

Prerequisites:
- Backend server must be running with DEFAULT chunking settings
- DEEPSEEK_API_KEY must be set in .env file for DeepSeek evaluation
- OPENROUTER_API_KEY must be set in .env file for llama4 model
- test_questions.csv must exist in benchmark/data/ directory
"""

import logging
import os
import sys
import time
from pathlib import Path

import matplotlib.pyplot as plt
import numpy as np
import pandas as pd
import pytest
import seaborn as sns

# Add parent directory to path to import common modules
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
from benchmark.common.api_client import query_qa
from benchmark.common.utils import (
    check_completion,
    initialize_deepseek_client,
    judge_faithfulness_deepseek,
    judge_relevance_deepseek,
    load_test_data,
)

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s - %(levelname)s - %(message)s",
    handlers=[
        logging.FileHandler(Path(__file__).parent / "results" / "baseline_quality.log"),
        logging.StreamHandler(),
    ],
)
logger = logging.getLogger(__name__)

# Define path constants
RESULTS_DIR = Path(__file__).parent / "results"
RESULTS_DIR.mkdir(exist_ok=True)
FIGURES_DIR = RESULTS_DIR / "figures"
FIGURES_DIR.mkdir(exist_ok=True)

# Define output files for each model
GEMMA3_OUTPUT_CSV_PATH = RESULTS_DIR / "baseline_quality_results_gemma3.csv"
LLAMA4_OUTPUT_CSV_PATH = RESULTS_DIR / "baseline_quality_results_llama4.csv"
COMBINED_OUTPUT_CSV_PATH = RESULTS_DIR / "baseline_quality_results_combined.csv"

# Define supported models
SUPPORTED_MODELS = ["gemma3", "llama4"]

# Define refusal phrases for completion check
REFUSAL_PHRASES = [
    "I cannot answer",
    "I don't have enough information",
    "I don't have the information",
    "I can't provide an answer",
    "unable to find information",
    "not enough context",
    "insufficient information",
    "cannot determine",
    "don't know",
    "no information provided",
    "not mentioned in",
    "not specified in",
    "not found in the",
    "not present in",
    "not included in",
]


def verify_prerequisites():
    """Verify that prerequisites are met before running the test."""
    logger.info("Verifying prerequisites...")

    # Check if the results directory exists
    if not RESULTS_DIR.exists():
        logger.info(f"Creating results directory: {RESULTS_DIR}")
        RESULTS_DIR.mkdir(parents=True, exist_ok=True)

    if not FIGURES_DIR.exists():
        logger.info(f"Creating figures directory: {FIGURES_DIR}")
        FIGURES_DIR.mkdir(parents=True, exist_ok=True)

    # Check if test questions exist
    try:
        test_data = load_test_data()
        logger.info(f"Loaded {len(test_data)} test questions")
    except Exception as e:
        logger.error(f"Failed to load test questions: {e}")
        return False

    # Check if DeepSeek client can be initialized
    try:
        deepseek_client = initialize_deepseek_client()
        logger.info("DeepSeek client initialized successfully")
    except Exception as e:
        logger.error(f"Failed to initialize DeepSeek client: {e}")
        return False

    # Check if backend is reachable with a simple query for each model
    for model in SUPPORTED_MODELS:
        try:
            # Use the first question as a test
            test_question = test_data.iloc[0]["question_text"]
            source_docs = test_data.iloc[0]["source_docs"]
            # Assuming source_id is the same as the filename for simplicity
            # In a real setup, you might have a mapping or database lookup
            source_ids = [doc.strip() for doc in source_docs.split("|")]

            # Try to query with a short timeout to test connectivity
            logger.info(f"Testing connectivity with model: {model}")
            result = query_qa(test_question, source_ids, model, timeout=50)
            if result.get("error"):
                logger.error(f"Backend API error with {model}: {result['error']}")
                logger.error(f"Is the backend server running and supporting {model}?")
                return False
            logger.info(f"Backend API is reachable with model: {model}")
        except Exception as e:
            logger.error(f"Failed to connect to backend with model {model}: {e}")
            return False

    return True


def run_test_for_model(llm_model):
    """Run the response quality test for a specific model."""
    logger.info(f"Starting response quality evaluation for model: {llm_model}...")

    # Load test questions
    test_data_df = load_test_data()
    logger.info(f"Loaded {len(test_data_df)} test questions")

    # Initialize DeepSeek client
    deepseek_client = initialize_deepseek_client()
    logger.info("DeepSeek client initialized")

    # Initialize results list
    results_list = []

    # Track overall progress
    total_questions = len(test_data_df)
    start_time = time.time()

    # Process each question
    for index, row in test_data_df.iterrows():
        question_id = row["question_id"]
        question_text = row["question_text"]
        question_type = row["question_type"]
        source_docs = row["source_docs"]
        is_answerable = row["is_answerable"]

        # Log progress
        logger.info(
            f"Processing {index + 1}/{total_questions} with {llm_model}: {question_id}"
        )

        # Convert source_docs to source_ids (assuming direct mapping for simplicity)
        # In a real scenario, you might have a database lookup or mapping
        source_ids = [doc.strip() for doc in source_docs.split("|")]

        # Query the backend API
        api_result = query_qa(question_text, source_ids, llm_model)

        # Initialize result dictionary
        result_dict = {
            "question_id": question_id,
            "question_text": question_text,
            "question_type": question_type,
            "source_docs": source_docs,
            "is_answerable": is_answerable,
            "model": llm_model,
            "generated_answer": api_result.get("answer", ""),
            "retrieved_contexts": api_result.get("contexts", []),
            "references": api_result.get("references", []),
            "latency": api_result.get("latency", 0),
            "api_status_code": api_result.get("status_code", 0),
            "api_error": api_result.get("error", None),
            "relevance_score": None,
            "faithfulness_score": None,
            "completion_status": None,
            "completion_is_correct": None,
            "judge_error": None,
        }

        # Check if API call was successful
        if api_result.get("error") is None and api_result.get("status_code") == 200:
            try:
                # Evaluate relevance
                relevance_score = judge_relevance_deepseek(
                    deepseek_client, question_text, api_result["answer"]
                )
                result_dict["relevance_score"] = relevance_score

                # Evaluate faithfulness if contexts are available
                if api_result.get("contexts"):
                    faithfulness_result = judge_faithfulness_deepseek(
                        deepseek_client,
                        question_text,
                        api_result["answer"],
                        api_result["contexts"],
                    )
                    result_dict["faithfulness_score"] = faithfulness_result

                # Check completion status
                completion_result = check_completion(
                    api_result["answer"], is_answerable, REFUSAL_PHRASES
                )
                result_dict["completion_status"] = completion_result["status"]
                result_dict["completion_is_correct"] = completion_result["is_correct"]

            except Exception as e:
                logger.error(f"Error during evaluation for {question_id}: {str(e)}")
                result_dict["judge_error"] = str(e)

        # Add result to results list
        results_list.append(result_dict)

        # Log completion of this question
        logger.info(f"Completed {question_id} with {llm_model}")

    # Calculate total execution time
    execution_time = time.time() - start_time
    logger.info(
        f"Finished processing all {total_questions} questions with {llm_model} in {execution_time:.2f} seconds"
    )

    # Convert results to DataFrame
    results_df = pd.DataFrame(results_list)

    # Save results to CSV
    output_path = RESULTS_DIR / f"baseline_quality_results_{llm_model}.csv"
    results_df.to_csv(output_path, index=False)
    logger.info(f"Results for {llm_model} saved to {output_path}")

    return results_df


def run_test():
    """Run the response quality test for all supported models."""
    all_results_dfs = []

    # Run test for each model
    for model in SUPPORTED_MODELS:
        results_df = run_test_for_model(model)
        results_df["model"] = model  # Ensure model column is added
        all_results_dfs.append(results_df)

    # Combine results
    combined_results_df = pd.concat(all_results_dfs, ignore_index=True)

    # Save combined results
    combined_results_df.to_csv(COMBINED_OUTPUT_CSV_PATH, index=False)
    logger.info(f"Combined results saved to {COMBINED_OUTPUT_CSV_PATH}")

    return combined_results_df


def analyze_results(results_df):
    """Analyze and print aggregate metrics from the results."""
    logger.info("Analyzing results...")

    # Calculate metrics for each model
    metrics_by_model = {}

    for model in SUPPORTED_MODELS:
        model_df = results_df[results_df["model"] == model]
        model_metrics = calculate_metrics_for_df(model_df, f"{model} metrics")
        metrics_by_model[model] = model_metrics

    # Calculate overall metrics
    overall_metrics = calculate_metrics_for_df(results_df, "Overall metrics")

    # Combine metrics into a single DataFrame for easy comparison
    comparison_metrics = {}
    metric_keys = overall_metrics.keys()

    for key in metric_keys:
        comparison_metrics[key] = {}
        comparison_metrics[key]["overall"] = overall_metrics[key]
        for model in SUPPORTED_MODELS:
            comparison_metrics[key][model] = metrics_by_model[model][key]

    comparison_df = pd.DataFrame(comparison_metrics)
    comparison_df = comparison_df.transpose()

    # Save comparison metrics
    comparison_df.to_csv(RESULTS_DIR / "baseline_quality_metrics_comparison.csv")
    logger.info(
        f"Comparison metrics saved to {RESULTS_DIR}/baseline_quality_metrics_comparison.csv"
    )

    # Create visualizations comparing models
    create_comparative_visualizations(results_df, metrics_by_model)

    return metrics_by_model, comparison_df


def calculate_metrics_for_df(results_df, metrics_name="metrics"):
    """Calculate metrics for a given DataFrame."""
    logger.info(f"Calculating {metrics_name}...")

    # Filter out rows with judge errors for metric calculations
    valid_results = results_df[results_df["judge_error"].isna()]

    # Calculate aggregate metrics
    metrics = {}

    # Relevance metrics
    relevance_scores = valid_results["relevance_score"].dropna()
    if not relevance_scores.empty:
        metrics["avg_relevance"] = relevance_scores.mean()
        metrics["median_relevance"] = relevance_scores.median()
        metrics["min_relevance"] = relevance_scores.min()
        metrics["max_relevance"] = relevance_scores.max()
    else:
        logger.warning(f"No valid relevance scores found for {metrics_name}")

    # Faithfulness metrics
    # Convert boolean faithfulness results to 1.0/0.0 for averaging
    faithfulness_scores = (
        valid_results["faithfulness_score"]
        .apply(
            lambda x: float(x)
            if isinstance(x, (int, float))
            else (1.0 if x is True else 0.0 if x is False else None)
        )
        .dropna()
    )

    if not faithfulness_scores.empty:
        metrics["avg_faithfulness"] = faithfulness_scores.mean()
        metrics["faithfulness_true_rate"] = (faithfulness_scores == 1.0).mean()
    else:
        logger.warning(f"No valid faithfulness scores found for {metrics_name}")

    # Task Completion Rate (TCR)
    if "completion_is_correct" in valid_results.columns:
        correct_completions = valid_results["completion_is_correct"].sum()
        total_completions = len(valid_results)
        metrics["tcr"] = (
            correct_completions / total_completions if total_completions > 0 else 0
        )

    # Refusal Accuracy (RA)
    refusal_subset = valid_results[~valid_results["is_answerable"]]
    if not refusal_subset.empty:
        correct_refusals = refusal_subset["completion_is_correct"].sum()
        total_refusals = len(refusal_subset)
        metrics["refusal_accuracy"] = (
            correct_refusals / total_refusals if total_refusals > 0 else 0
        )
    else:
        logger.warning(f"No refusal questions found for {metrics_name}")

    # Latency metrics
    latencies = valid_results["latency"].dropna()
    if not latencies.empty:
        metrics["avg_latency"] = latencies.mean()
        metrics["median_latency"] = latencies.median()
        metrics["p95_latency"] = latencies.quantile(0.95)
        metrics["p99_latency"] = latencies.quantile(0.99)
    else:
        logger.warning(f"No valid latency values found for {metrics_name}")

    # Completion status breakdown
    status_counts = valid_results["completion_status"].value_counts()
    for status, count in status_counts.items():
        metrics[f"status_{status.replace(' ', '_').lower()}"] = count

    # Print metrics
    logger.info(f"=== {metrics_name} ===")
    for key, value in metrics.items():
        if isinstance(value, float):
            logger.info(f"{key}: {value:.4f}")
        else:
            logger.info(f"{key}: {value}")

    return metrics


def create_comparative_visualizations(results_df, metrics_by_model):
    """Create visualizations comparing results between models."""
    try:
        # Set up plotting style
        plt.style.use("ggplot")
        sns.set(style="whitegrid")

        # Define color palette for consistent colors across plots
        model_colors = {
            "gemma3": "#1f77b4",  # Blue
            "llama4": "#ff7f0e",  # Orange
        }

        # 1. Compare relevance scores between models
        plt.figure(figsize=(12, 8))
        relevance_data = []

        for model in SUPPORTED_MODELS:
            model_df = results_df[results_df["model"] == model]
            relevance_scores = model_df["relevance_score"].dropna()
            if not relevance_scores.empty:
                # Create data for boxplot
                for score in relevance_scores:
                    relevance_data.append({"Model": model, "Relevance Score": score})

        if relevance_data:
            relevance_plot_df = pd.DataFrame(relevance_data)
            # Create boxplot
            ax = sns.boxplot(
                x="Model",
                y="Relevance Score",
                data=relevance_plot_df,
                palette=model_colors,
            )
            # Add individual points with jitter
            sns.stripplot(
                x="Model",
                y="Relevance Score",
                data=relevance_plot_df,
                size=4,
                alpha=0.3,
                jitter=True,
                color="gray",
            )

            # Add mean as text
            for i, model in enumerate(SUPPORTED_MODELS):
                avg = metrics_by_model[model].get("avg_relevance")
                if avg is not None:
                    ax.text(
                        i,
                        relevance_plot_df["Relevance Score"].max() + 0.2,
                        f"Mean: {avg:.2f}",
                        ha="center",
                    )

            plt.title("Comparison of Relevance Scores Between Models", fontsize=14)
            plt.tight_layout()
            plt.savefig(FIGURES_DIR / "relevance_score_comparison.png")
            plt.close()

        # 2. Compare faithfulness scores between models
        plt.figure(figsize=(12, 8))
        faithfulness_data = []

        for model in SUPPORTED_MODELS:
            model_df = results_df[results_df["model"] == model]
            faithfulness_scores = (
                model_df["faithfulness_score"]
                .apply(
                    lambda x: float(x)
                    if isinstance(x, (int, float))
                    else (1.0 if x is True else 0.0 if x is False else None)
                )
                .dropna()
            )

            if not faithfulness_scores.empty:
                # Create data for boxplot
                for score in faithfulness_scores:
                    faithfulness_data.append(
                        {"Model": model, "Faithfulness Score": score}
                    )

        if faithfulness_data:
            faithfulness_plot_df = pd.DataFrame(faithfulness_data)
            # Create boxplot
            ax = sns.barplot(
                x="Model",
                y="Faithfulness Score",
                data=faithfulness_plot_df,
                palette=model_colors,
            )

            # Add mean as text
            for i, model in enumerate(SUPPORTED_MODELS):
                avg = metrics_by_model[model].get("avg_faithfulness")
                if avg is not None:
                    ax.text(i, avg + 0.05, f"{avg:.2f}", ha="center")

            plt.title("Comparison of Faithfulness Scores Between Models", fontsize=14)
            plt.ylim(0, 1.1)  # Set y-axis limit
            plt.tight_layout()
            plt.savefig(FIGURES_DIR / "faithfulness_score_comparison.png")
            plt.close()

        # 3. Compare TCR and Refusal Accuracy between models
        plt.figure(figsize=(14, 8))

        # Extract metrics
        metric_names = ["tcr", "refusal_accuracy"]
        model_metrics = {}

        for model in SUPPORTED_MODELS:
            model_metrics[model] = [
                metrics_by_model[model].get(m, 0) for m in metric_names
            ]

        # Set up the bar plot
        x = np.arange(len(metric_names))
        width = 0.35

        fig, ax = plt.subplots(figsize=(12, 8))

        # Plot bars for each model
        bars = []
        for i, (model, values) in enumerate(model_metrics.items()):
            bar = ax.bar(
                x + (i - len(model_metrics) / 2 + 0.5) * width,
                values,
                width,
                label=model,
                color=model_colors.get(model),
            )
            bars.append(bar)

        # Add labels and title
        ax.set_xlabel("Metric", fontsize=12)
        ax.set_ylabel("Score", fontsize=12)
        ax.set_title("Task Completion Rate and Refusal Accuracy by Model", fontsize=14)
        ax.set_xticks(x)
        ax.set_xticklabels(["Task Completion Rate", "Refusal Accuracy"])
        ax.legend()

        # Add values above bars
        for bar in bars:
            for rect in bar:
                height = rect.get_height()
                ax.annotate(
                    f"{height:.2f}",
                    xy=(rect.get_x() + rect.get_width() / 2, height),
                    xytext=(0, 3),  # 3 points vertical offset
                    textcoords="offset points",
                    ha="center",
                    va="bottom",
                )

        plt.ylim(0, 1.1)  # Set y-axis limit
        plt.tight_layout()
        plt.savefig(FIGURES_DIR / "task_completion_comparison.png")
        plt.close()

        # 4. Compare latency distributions between models
        plt.figure(figsize=(14, 8))

        for model in SUPPORTED_MODELS:
            model_df = results_df[results_df["model"] == model]
            latencies = model_df["latency"].dropna()
            if not latencies.empty:
                sns.kdeplot(
                    latencies,
                    label=model,
                    fill=True,
                    alpha=0.3,
                    color=model_colors.get(model),
                )
                plt.axvline(
                    latencies.mean(),
                    color=model_colors.get(model),
                    linestyle="--",
                    label=f"{model} Mean: {latencies.mean():.2f}s",
                )

        plt.title("Distribution of API Latency by Model", fontsize=14)
        plt.xlabel("Latency (seconds)", fontsize=12)
        plt.ylabel("Density", fontsize=12)
        plt.legend()
        plt.tight_layout()
        plt.savefig(FIGURES_DIR / "latency_distribution_comparison.png")
        plt.close()

        # 5. Performance by question type - heatmap of relevance scores
        plt.figure(figsize=(14, 10))

        # Get average relevance by question type and model
        type_relevance = pd.pivot_table(
            results_df,
            values="relevance_score",
            index="question_type",
            columns="model",
            aggfunc="mean",
        ).fillna(0)

        # Create heatmap
        sns.heatmap(
            type_relevance,
            annot=True,
            cmap="YlGnBu",
            fmt=".2f",
            linewidths=0.5,
            cbar_kws={"label": "Average Relevance Score"},
        )

        plt.title("Average Relevance Score by Question Type and Model", fontsize=14)
        plt.tight_layout()
        plt.savefig(FIGURES_DIR / "relevance_by_question_type_heatmap.png")
        plt.close()

        # 6. Create per-source document comparison
        plt.figure(figsize=(16, 10))

        # Get unique source documents
        all_sources = []
        for sources in results_df["source_docs"].unique():
            for source in sources.split("|"):
                source = source.strip()
                if source not in all_sources:
                    all_sources.append(source)

        # Process results by source
        source_performance = {}

        for source in all_sources:
            source_performance[source] = {}
            for model in SUPPORTED_MODELS:
                # Find questions related to this source
                source_mask = results_df["source_docs"].apply(
                    lambda x: source in x.split("|")
                )
                model_mask = results_df["model"] == model
                source_model_df = results_df[source_mask & model_mask]

                if not source_model_df.empty:
                    # Calculate average relevance
                    avg_relevance = source_model_df["relevance_score"].dropna().mean()
                    source_performance[source][f"{model}_relevance"] = avg_relevance

                    # Calculate TCR
                    if "completion_is_correct" in source_model_df.columns:
                        correct = source_model_df["completion_is_correct"].sum()
                        total = len(source_model_df)
                        tcr = correct / total if total > 0 else 0
                        source_performance[source][f"{model}_tcr"] = tcr

        # Convert to DataFrame for plotting
        source_perf_df = pd.DataFrame(source_performance).transpose()
        source_perf_df = source_perf_df.fillna(0)

        # Plot relevance comparison by source
        if any(col.endswith("_relevance") for col in source_perf_df.columns):
            relevance_cols = [
                col for col in source_perf_df.columns if col.endswith("_relevance")
            ]
            source_perf_df[relevance_cols].plot(
                kind="bar",
                figsize=(16, 8),
                color=[model_colors.get(model) for model in SUPPORTED_MODELS],
            )
            plt.title(
                "Average Relevance Score by Source Document and Model", fontsize=14
            )
            plt.xlabel("Source Document", fontsize=12)
            plt.ylabel("Average Relevance Score", fontsize=12)
            plt.xticks(rotation=45, ha="right")
            plt.tight_layout()
            plt.savefig(FIGURES_DIR / "relevance_by_source_comparison.png")
            plt.close()

        # Plot TCR comparison by source
        if any(col.endswith("_tcr") for col in source_perf_df.columns):
            tcr_cols = [col for col in source_perf_df.columns if col.endswith("_tcr")]
            source_perf_df[tcr_cols].plot(
                kind="bar",
                figsize=(16, 8),
                color=[model_colors.get(model) for model in SUPPORTED_MODELS],
            )
            plt.title("Task Completion Rate by Source Document and Model", fontsize=14)
            plt.xlabel("Source Document", fontsize=12)
            plt.ylabel("Task Completion Rate", fontsize=12)
            plt.xticks(rotation=45, ha="right")
            plt.ylim(0, 1.1)  # Set y-axis limit
            plt.tight_layout()
            plt.savefig(FIGURES_DIR / "tcr_by_source_comparison.png")
            plt.close()

        logger.info(f"Comparative visualizations saved to {FIGURES_DIR}")

    except Exception as e:
        logger.error(f"Error creating comparative visualizations: {str(e)}")
        import traceback

        logger.error(traceback.format_exc())


@pytest.mark.skip(
    reason="Manual check: only run this when backend is confirmed running with default settings"
)
def test_response_quality():
    """Pytest function to run the response quality evaluation."""
    if not verify_prerequisites():
        pytest.fail("Prerequisites not met. See logs for details.")

    results_df = run_test()
    analyze_results(results_df)


if __name__ == "__main__":
    if verify_prerequisites():
        results_df = run_test()
        analyze_results(results_df)
    else:
        logger.error("Prerequisites check failed. Aborting test.")
        sys.exit(1)
