"use client";
import React from "react";
import { useUIStore } from "../../lib/store/uiStore";
import { OutputTab } from "../../lib/store/uiStore";

export const OutputTabs: React.FC = () => {
	const { activeOutputTab, setActiveOutputTab } = useUIStore();

	const handleTabClick = (tab: OutputTab) => {
		setActiveOutputTab(tab);
	};

	return (
		<div className="flex border-b border-gray-200">
			<div
				className={`px-6 py-3 font-medium text-sm cursor-pointer ${
					activeOutputTab === "notes"
						? "text-blue-600 border-b-2 border-blue-600"
						: "text-gray-500 hover:text-gray-700"
				}`}
				onClick={() => handleTabClick("notes")}
			>
				<div className="flex items-center">
					<svg
						className="w-5 h-5 mr-2"
						fill="none"
						stroke="currentColor"
						viewBox="0 0 24 24"
					>
						<path
							strokeLinecap="round"
							strokeLinejoin="round"
							strokeWidth={2}
							d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
						/>
					</svg>
					Notes
				</div>
			</div>
			<div
				className={`px-6 py-3 font-medium text-sm cursor-pointer ${
					activeOutputTab === "mindmap"
						? "text-blue-600 border-b-2 border-blue-600"
						: "text-gray-500 hover:text-gray-700"
				}`}
				onClick={() => handleTabClick("mindmap")}
			>
				<div className="flex items-center">
					<svg
						className="w-5 h-5 mr-2"
						fill="none"
						stroke="currentColor"
						viewBox="0 0 24 24"
					>
						<path
							strokeLinecap="round"
							strokeLinejoin="round"
							strokeWidth={2}
							d="M4 5a1 1 0 011-1h14a1 1 0 011 1v2a1 1 0 01-1 1H5a1 1 0 01-1-1V5zM4 13a1 1 0 011-1h6a1 1 0 011 1v6a1 1 0 01-1 1H5a1 1 0 01-1-1v-6zM16 13a1 1 0 011-1h2a1 1 0 011 1v6a1 1 0 01-1 1h-2a1 1 0 01-1-1v-6z"
						/>
					</svg>
					Mindmap
				</div>
			</div>
		</div>
	);
};
