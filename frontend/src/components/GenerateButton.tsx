"use client";
import React from "react";
import { useSourceStore } from "../lib/store/sourceStore";
import { useTaskStore } from "../lib/store/taskStore";

export const GenerateButton: React.FC = () => {
	const { selectedSourceIds } = useSourceStore();
	const { status, startTask } = useTaskStore();

	const selectedCount = selectedSourceIds.length;
	const isDisabled =
		selectedCount === 0 || status === "pending" || status === "processing";

	const handleGenerateClick = () => {
		if (!isDisabled) {
			startTask();
		}
	};

	return (
		<div className="absolute top-4 left-1/2 transform -translate-x-1/2 z-10 flex items-center justify-center">
			<button
				className={`flex items-center space-x-1 ${
					isDisabled
						? "bg-blue-300 cursor-not-allowed"
						: "bg-blue-500 hover:bg-blue-600"
				} text-white font-medium rounded-md px-4 py-2 shadow-md`}
				onClick={handleGenerateClick}
				disabled={isDisabled}
			>
				<svg
					className="w-5 h-5"
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
				<span>
					{status === "pending" || status === "processing"
						? "Processing..."
						: `Generate (${selectedCount} selected)`}
				</span>
			</button>
			<span className="ml-4 text-gray-500 text-sm">
				Using {selectedCount}{" "}
				{selectedCount === 1 ? "source" : "sources"}
			</span>
		</div>
	);
};
