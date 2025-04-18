"use client";
import React from "react";
import { OutputTabs } from "./OutputTabs";
import { NotesView } from "./NotesView";
import { MindmapView } from "./MindmapView";
import { useUIStore } from "../../lib/store/uiStore";
import { useTaskStore } from "../../lib/store/taskStore";

export const OutputPanel: React.FC = () => {
	const { activeOutputTab } = useUIStore();
	const { status } = useTaskStore();

	const isCompleted = status === "completed";
	const isProcessing = status === "pending" || status === "processing";
	const isFailed = status === "failed";

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
				</div>
				<div className="flex items-center space-x-2">
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
		</div>
	);
};
