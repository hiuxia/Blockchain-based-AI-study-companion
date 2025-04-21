"use client";
import React from "react";
import { useSourceStore } from "../lib/store/sourceStore";
import { useUIStore } from "../lib/store/uiStore";
import { useTaskProcessing } from "../hooks/useTaskProcessing";

export const GenerateButton: React.FC = () => {
	const { selectedSourceIds } = useSourceStore();
	const { llmModel, setLlmModel } = useUIStore();
	const { status, error, startProcessing, isPolling } = useTaskProcessing();

	const selectedCount = selectedSourceIds.length;
	const isDisabled =
		selectedCount === 0 || status === "pending" || status === "processing";

	const handleGenerateClick = async () => {
		if (!isDisabled) {
			try {
				await startProcessing(selectedSourceIds, llmModel);
			} catch (err) {
				console.error("Failed to start processing:", err);
			}
		}
	};

	return (
		<div className="flex items-center justify-end gap-2 p-2">
			<select
				className="px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
				value={llmModel}
				onChange={(e) => setLlmModel(e.target.value)}
				disabled={isDisabled}
			>
				<option value="gemma3">Gemma 3</option>
				<option value="llama4">Llama 4</option>
			</select>

			<button
				className={`flex items-center space-x-1 ${
					isDisabled
						? "bg-blue-300 cursor-not-allowed"
						: "bg-blue-500 hover:bg-blue-600"
				} text-white font-medium rounded-md px-4 py-2 shadow-md`}
				onClick={handleGenerateClick}
				disabled={isDisabled}
			>
				{isPolling ? (
					<>
						<svg
							className="animate-spin -ml-1 mr-2 h-4 w-4 text-white"
							xmlns="http://www.w3.org/2000/svg"
							fill="none"
							viewBox="0 0 24 24"
						>
							<circle
								className="opacity-25"
								cx="12"
								cy="12"
								r="10"
								stroke="currentColor"
								strokeWidth="4"
							></circle>
							<path
								className="opacity-75"
								fill="currentColor"
								d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
							></path>
						</svg>
						Processing...
					</>
				) : (
					<>
						<svg
							className="w-5 h-5 mr-1"
							fill="none"
							stroke="currentColor"
							viewBox="0 0 24 24"
						>
							<path
								strokeLinecap="round"
								strokeLinejoin="round"
								strokeWidth={2}
								d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10"
							/>
						</svg>
						Generate ({selectedCount} selected)
					</>
				)}
			</button>

			{!isDisabled && selectedCount > 0 && (
				<span className="text-sm text-gray-600">
					Using {selectedCount}{" "}
					{selectedCount === 1 ? "source" : "sources"}
				</span>
			)}

			{error && (
				<div className="absolute top-14 left-0 right-0 text-center mt-2 text-red-500 text-sm bg-red-50 p-2 rounded">
					{error}
				</div>
			)}
		</div>
	);
};
