"use client";
import React, { useState } from "react";
import { SourceFile } from "../../lib/apiClient";
import { useSourceStore } from "../../lib/store/sourceStore";

interface SourceItemProps {
	source: SourceFile;
	isSelected: boolean;
	onToggleSelect: () => void;
	onDeleteClick?: (source: SourceFile) => void;
}

export const SourceItem: React.FC<SourceItemProps> = ({
	source,
	isSelected,
	onToggleSelect,
	onDeleteClick,
}) => {
	const { renameSource } = useSourceStore();
	const [isRenaming, setIsRenaming] = useState(false);
	const [newName, setNewName] = useState(source.filename);

	// Format the date if it exists
	const formattedDate = source.created_at
		? new Date(source.created_at).toLocaleDateString()
		: null;

	// PDF icon (specific for PDF files)
	const PdfIcon = () => (
		<svg
			className="w-5 h-5 text-red-500"
			xmlns="http://www.w3.org/2000/svg"
			viewBox="0 0 24 24"
			fill="currentColor"
		>
			<path d="M7 18H17V16H7V18M7 14H17V12H7V14M7 10H11V8H7V10M5 21C4.45 21 3.98 20.8 3.59 20.41C3.2 20.02 3 19.55 3 19V5C3 4.45 3.2 3.98 3.59 3.59C3.98 3.2 4.45 3 5 3H19C19.55 3 20.02 3.2 20.41 3.59C20.8 3.98 21 4.45 21 5V19C21 19.55 20.8 20.02 20.41 20.41C20.02 20.8 19.55 21 19 21H5ZM5 19H19V5H5V19Z" />
		</svg>
	);

	// Handle rename submission
	const handleRenameSubmit = (e: React.FormEvent) => {
		e.preventDefault();
		if (newName.trim() && newName !== source.filename) {
			renameSource(source.id, newName.trim());
		}
		setIsRenaming(false);
	};

	// Handle rename cancel
	const handleRenameCancel = () => {
		setNewName(source.filename);
		setIsRenaming(false);
	};

	return (
		<div
			className={`flex items-center py-2 px-3 hover:bg-blue-50 rounded-md ${
				isSelected ? "bg-blue-50" : ""
			}`}
		>
			<div className="flex-shrink-0 mr-2">
				<PdfIcon />
			</div>
			<div className="flex-1 min-w-0">
				{isRenaming ? (
					<form
						onSubmit={handleRenameSubmit}
						className="flex items-center"
					>
						<input
							type="text"
							value={newName}
							onChange={(e) => setNewName(e.target.value)}
							autoFocus
							className="w-full py-1 px-2 border border-blue-300 rounded text-sm"
						/>
						<button
							type="submit"
							className="ml-1 text-green-600 hover:text-green-800"
							title="Save"
						>
							<svg
								className="w-4 h-4"
								fill="none"
								viewBox="0 0 24 24"
								stroke="currentColor"
							>
								<path
									strokeLinecap="round"
									strokeLinejoin="round"
									strokeWidth={2}
									d="M5 13l4 4L19 7"
								/>
							</svg>
						</button>
						<button
							type="button"
							onClick={handleRenameCancel}
							className="ml-1 text-red-600 hover:text-red-800"
							title="Cancel"
						>
							<svg
								className="w-4 h-4"
								fill="none"
								viewBox="0 0 24 24"
								stroke="currentColor"
							>
								<path
									strokeLinecap="round"
									strokeLinejoin="round"
									strokeWidth={2}
									d="M6 18L18 6M6 6l12 12"
								/>
							</svg>
						</button>
					</form>
				) : (
					<div
						className="truncate font-medium"
						title={source.filename}
					>
						{source.filename}
					</div>
				)}
				{formattedDate && (
					<div className="text-xs text-gray-500">
						Added: {formattedDate}
					</div>
				)}
			</div>

			{!isRenaming && (
				<div className="flex-shrink-0 flex items-center gap-2">
					<button
						onClick={() => setIsRenaming(true)}
						className="p-1 text-gray-500 hover:text-blue-600 rounded-full hover:bg-blue-100"
						title="Rename"
					>
						<svg
							className="w-4 h-4"
							fill="none"
							viewBox="0 0 24 24"
							stroke="currentColor"
						>
							<path
								strokeLinecap="round"
								strokeLinejoin="round"
								strokeWidth={2}
								d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z"
							/>
						</svg>
					</button>
					<button
						onClick={() => onDeleteClick && onDeleteClick(source)}
						className="p-1 text-gray-500 hover:text-red-600 rounded-full hover:bg-red-100"
						title="Delete"
					>
						<svg
							className="w-4 h-4"
							fill="none"
							viewBox="0 0 24 24"
							stroke="currentColor"
						>
							<path
								strokeLinecap="round"
								strokeLinejoin="round"
								strokeWidth={2}
								d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
							/>
						</svg>
					</button>
					<input
						type="checkbox"
						checked={isSelected}
						onChange={onToggleSelect}
						className="h-4 w-4 text-blue-600 rounded focus:ring-blue-500"
					/>
				</div>
			)}
		</div>
	);
};
