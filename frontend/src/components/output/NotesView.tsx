"use client";
import React from "react";
import { useTaskStore } from "../../lib/store/taskStore";

export const NotesView: React.FC = () => {
	const { markdownResult, status } = useTaskStore();

	return (
		<div className="h-full overflow-y-auto p-6 bg-white">
			<div className="prose max-w-none">
				{status === "completed" && markdownResult ? (
					<div dangerouslySetInnerHTML={{ __html: markdownResult }} />
				) : (
					<>
						<h1>Study Notes</h1>
						<p className="text-gray-500 italic">
							{status === "pending" || status === "processing"
								? "Generating notes from your sources..."
								: "Notes will appear here once they are generated from your sources."}
						</p>
					</>
				)}
			</div>
		</div>
	);
};
