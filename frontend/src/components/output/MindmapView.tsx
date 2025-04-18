"use client";
import React from "react";
import { useTaskStore } from "../../lib/store/taskStore";

export const MindmapView: React.FC = () => {
	const { status, summaryId } = useTaskStore();

	return (
		<div className="h-full flex flex-col items-center justify-center bg-white p-6">
			<div className="text-center">
				{status === "completed" && summaryId ? (
					<div>
						<div className="flex justify-center mb-4">
							<svg
								className="w-16 h-16 text-green-300"
								fill="currentColor"
								viewBox="0 0 24 24"
							>
								<path d="M9 16.2L4.8 12l-1.4 1.4L9 19 21 7l-1.4-1.4L9 16.2z" />
							</svg>
						</div>
						<h2 className="text-xl font-semibold text-gray-700 mb-2">
							Mindmap Ready
						</h2>
						<p className="text-gray-500 max-w-md">
							Mindmap visualization is available based on your
							notes
						</p>
					</div>
				) : (
					<>
						<div className="flex justify-center mb-4">
							<svg
								className={`w-16 h-16 ${
									status === "pending" ||
									status === "processing"
										? "text-blue-300 animate-pulse"
										: "text-blue-300"
								}`}
								fill="currentColor"
								viewBox="0 0 24 24"
							>
								<path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 15h-2v-2h2v2zm0-4h-2V7h2v6z" />
							</svg>
						</div>
						<h2 className="text-xl font-semibold text-gray-700 mb-2">
							Mindmap Visualization
						</h2>
						<p className="text-gray-500 max-w-md">
							{status === "pending" || status === "processing"
								? "Generating mindmap from your sources..."
								: "Will render here based on Notes"}
						</p>
					</>
				)}
			</div>
		</div>
	);
};
