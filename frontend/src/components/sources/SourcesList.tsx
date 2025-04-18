"use client";
import React from "react";
import { SourceItem } from "./SourceItem";
import { useSourceStore } from "../../lib/store/sourceStore";

export const SourcesList: React.FC = () => {
	const { sources, selectedSourceIds, selectAllSources, clearSelection } =
		useSourceStore();
	const isAllSelected =
		sources.length > 0 && selectedSourceIds.length === sources.length;

	const handleSelectAllToggle = () => {
		if (isAllSelected) {
			clearSelection();
		} else {
			selectAllSources();
		}
	};

	return (
		<div className="flex flex-col h-full border-r border-gray-200 bg-white">
			<div className="p-4 border-b border-gray-200">
				<h2 className="text-lg font-semibold text-gray-800">Sources</h2>
			</div>

			<div className="p-4">
				<button className="w-full flex items-center justify-center py-2 px-4 border border-transparent rounded-md text-sm font-medium text-white bg-blue-500 hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500">
					<span className="mr-2">+</span>
					Add Source (Upload PDF)
				</button>
			</div>

			<div className="p-4 border-b border-gray-200">
				<p className="text-sm text-gray-600">Select sources to use:</p>
				<div className="flex justify-between mt-2">
					<span
						className="text-sm text-blue-500 hover:underline cursor-pointer"
						onClick={handleSelectAllToggle}
					>
						{isAllSelected ? "Deselect All" : "Select All"}
					</span>
				</div>
			</div>

			<div className="flex-1 overflow-y-auto p-2">
				{sources.map((source) => (
					<SourceItem
						key={source.id}
						id={source.id}
						name={source.name}
					/>
				))}
			</div>
		</div>
	);
};
