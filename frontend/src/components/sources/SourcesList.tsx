"use client";
import React, { useEffect } from "react";
import { SourceItem } from "./SourceItem";
import { UploadButton } from "./UploadButton";
import { useSourceStore } from "../../lib/store/sourceStore";

export const SourcesList: React.FC = () => {
	const {
		sources,
		selectedSourceIds,
		selectAllSources,
		clearSelection,
		toggleSelectSource,
		fetchSources,
		isLoading,
		error,
	} = useSourceStore();

	// Fetch sources when the component mounts
	useEffect(() => {
		fetchSources();
	}, [fetchSources]);
	
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
				<UploadButton />
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
				{isLoading && sources.length === 0 ? (
					<div className="text-center p-4">
						<svg
							className="animate-spin h-8 w-8 mx-auto text-blue-500"
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
						<p className="mt-2 text-gray-600">Loading sources...</p>
					</div>
				) : error && sources.length === 0 ? (
					<div className="text-center p-4">
						<div className="text-red-500 mb-2">{error}</div>
						<button
							onClick={() => fetchSources()}
							className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
						>
							Retry
						</button>
					</div>
				) : sources.length === 0 ? (
					<div className="text-center p-4 text-gray-500">
						No sources uploaded yet. Upload a PDF to get started.
					</div>
				) : (
					sources.map((source) => (
						<SourceItem
							key={source.id}
							source={source}
							isSelected={selectedSourceIds.includes(source.id)}
							onToggleSelect={() => toggleSelectSource(source.id)}
						/>
					))
				)}
			</div>
		</div>
	);
};
