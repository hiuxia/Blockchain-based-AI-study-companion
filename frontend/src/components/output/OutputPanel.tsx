"use client";
import React, { useState, useEffect } from "react";
import { OutputTabs } from "./OutputTabs";
import { NotesView } from "./NotesView";
import { MindmapView } from "./MindmapView";
import { useUIStore } from "../../lib/store/uiStore";
import { useTaskStore } from "../../lib/store/taskStore";
import apiClient from "../../lib/apiClient";
import { useSavedItemsStore } from "../../lib/store/savedItemsStore";

// Add a dialog component for naming summaries
const NameSummaryDialog: React.FC<{
	isOpen: boolean;
	onClose: () => void;
	onSave: (name: string) => void;
}> = ({ isOpen, onClose, onSave }) => {
	const [name, setName] = useState("");

	// Reset the input when dialog opens or closes
	useEffect(() => {
		if (!isOpen) {
			// Short delay to reset after animation completes
			setTimeout(() => setName(""), 300);
		}
	}, [isOpen]);

	if (!isOpen) return null;

	return (
		<div className="fixed inset-0 bg-black bg-opacity-30 flex items-center justify-center z-50">
			<div className="bg-white p-4 rounded-md shadow-lg w-80">
				<h3 className="text-lg font-medium mb-2">Save Summary</h3>
				<p className="text-sm text-gray-500 mb-3">
					Give your summary a descriptive name to find it easily
					later.
				</p>
				<input
					type="text"
					value={name}
					onChange={(e) => setName(e.target.value)}
					placeholder="Enter a name for this summary"
					className="w-full p-2 border border-gray-300 rounded mb-4"
					autoFocus
				/>
				<div className="flex justify-end space-x-2">
					<button
						onClick={onClose}
						className="px-3 py-1 text-gray-600 hover:text-gray-800"
					>
						Cancel
					</button>
					<button
						onClick={() => {
							if (name.trim()) {
								onSave(name);
								onClose();
							}
						}}
						className="px-3 py-1 bg-blue-500 text-white rounded hover:bg-blue-600"
						disabled={!name.trim()}
					>
						Save
					</button>
				</div>
			</div>
		</div>
	);
};

export const OutputPanel: React.FC = () => {
	const { activeOutputTab } = useUIStore();
	const { status, summaryId } = useTaskStore();
	const { fetchSummaries } = useSavedItemsStore();
	const [isSaving, setIsSaving] = useState(false);
	const [isDialogOpen, setIsDialogOpen] = useState(false);
	const [saveSuccessMessage, setSaveSuccessMessage] = useState("");

	const isCompleted = status === "completed";
	const isProcessing = status === "pending" || status === "processing";
	const isFailed = status === "failed";

	// Handler for saving/naming a summary
	const handleSaveSummary = async (name: string) => {
		if (!summaryId) return;

		try {
			setIsSaving(true);
			setSaveSuccessMessage("");

			await apiClient.summaries.updateSummaryName(summaryId, name);

			// Refresh the summaries list
			await fetchSummaries();

			// Show success message briefly
			setSaveSuccessMessage(`Saved as "${name}"`);
			setTimeout(() => setSaveSuccessMessage(""), 3000);
		} catch (error) {
			console.error("Error saving summary:", error);
			alert("Failed to save summary. Please try again.");
		} finally {
			setIsSaving(false);
		}
	};

	return (
		<div className="flex flex-col h-full border-l border-gray-200 bg-white">
			<div className="flex items-center justify-between p-4 border-b border-gray-200">
				<div className="flex items-center">
					{isCompleted && (
						<>
							<span className="h-3 w-3 rounded-full bg-green-500 mr-2"></span>
							<span className="text-sm font-medium text-gray-700">
								Complete
							</span>
						</>
					)}
					{isProcessing && (
						<>
							<span className="h-3 w-3 rounded-full bg-blue-500 mr-2 animate-pulse"></span>
							<span className="text-sm font-medium text-gray-700">
								Processing
							</span>
						</>
					)}
					{isFailed && (
						<>
							<span className="h-3 w-3 rounded-full bg-red-500 mr-2"></span>
							<span className="text-sm font-medium text-gray-700">
								Failed
							</span>
						</>
					)}
					{status === "idle" && (
						<span className="text-sm font-medium text-gray-500">
							Ready
						</span>
					)}

					{saveSuccessMessage && (
						<span className="ml-3 text-sm text-green-600 fade-in-out">
							{saveSuccessMessage}
						</span>
					)}
				</div>
				<div className="flex items-center space-x-2">
					{isCompleted && summaryId && (
						<div className="relative group">
							<button
								className="flex items-center px-3 py-1.5 text-sm font-medium text-white bg-blue-600 rounded hover:bg-blue-700 transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
								onClick={() => setIsDialogOpen(true)}
								disabled={isSaving}
								aria-label="Save Summary"
							>
								<svg
									xmlns="http://www.w3.org/2000/svg"
									className="h-4 w-4 mr-1.5"
									fill="none"
									viewBox="0 0 24 24"
									stroke="currentColor"
								>
									<path
										strokeLinecap="round"
										strokeLinejoin="round"
										strokeWidth={2}
										d="M8 7H5a2 2 0 00-2 2v9a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-3m-1 4l-3 3m0 0l-3-3m3 3V4"
									/>
								</svg>
								{isSaving ? "Saving..." : "Save Summary"}
							</button>
							<div className="absolute bottom-full mb-2 left-1/2 transform -translate-x-1/2 hidden group-hover:block bg-gray-800 text-white text-xs rounded py-1 px-2 whitespace-nowrap">
								Give this summary a name to find it later
								<div className="absolute top-full left-1/2 transform -translate-x-1/2 w-2 h-2 bg-gray-800 rotate-45"></div>
							</div>
						</div>
					)}
					<button className="p-2 text-gray-500 hover:text-gray-700">
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
								d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z"
							/>
						</svg>
					</button>
					<button className="p-2 text-gray-500 hover:text-gray-700">
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
								d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"
							/>
						</svg>
					</button>
				</div>
			</div>

			<OutputTabs />

			<div className="flex-1 overflow-hidden">
				{activeOutputTab === "notes" ? <NotesView /> : <MindmapView />}
			</div>

			{/* Dialog for naming the summary */}
			<NameSummaryDialog
				isOpen={isDialogOpen}
				onClose={() => setIsDialogOpen(false)}
				onSave={handleSaveSummary}
			/>
		</div>
	);
};
