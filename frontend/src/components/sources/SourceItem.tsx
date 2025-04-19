"use client";
import React from "react";
import { SourceFile } from "../../lib/apiClient";

interface SourceItemProps {
	source: SourceFile;
	isSelected: boolean;
	onToggleSelect: () => void;
}

export const SourceItem: React.FC<SourceItemProps> = ({
	source,
	isSelected,
	onToggleSelect,
}) => {
	// Format the date if it exists
	const formattedDate = source.created_at
		? new Date(source.created_at).toLocaleDateString()
		: null;

	// Determine file type icon based on content_type
	const getFileIcon = () => {
		if (source.content_type === "application/pdf") {
			return (
				<svg
					className="w-5 h-5 text-red-500"
					fill="currentColor"
					viewBox="0 0 20 20"
				>
					<path d="M5 3a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2V5a2 2 0 00-2-2H5zm0 2h10v10H5V5z" />
				</svg>
			);
		}

		// Default icon for other file types
		return (
			<svg
				className="w-5 h-5 text-gray-500"
				fill="currentColor"
				viewBox="0 0 20 20"
			>
				<path d="M5 3a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2V5a2 2 0 00-2-2H5zm0 2h10v10H5V5z" />
			</svg>
		);
	};

	return (
		<div
			className={`flex items-center py-2 px-3 hover:bg-blue-50 rounded-md ${
				isSelected ? "bg-blue-50" : ""
			}`}
		>
			<div className="flex-shrink-0 mr-2">{getFileIcon()}</div>
			<div className="flex-1">
				<div className="truncate font-medium">{source.filename}</div>
				{formattedDate && (
					<div className="text-xs text-gray-500">
						Added: {formattedDate}
					</div>
				)}
			</div>
			<div className="flex-shrink-0 ml-2">
				<input
					type="checkbox"
					checked={isSelected}
					onChange={onToggleSelect}
					className="h-4 w-4 text-blue-600 rounded focus:ring-blue-500"
				/>
			</div>
		</div>
	);
};
