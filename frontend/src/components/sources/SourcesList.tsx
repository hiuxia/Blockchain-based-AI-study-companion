"use client";
import React, { useEffect, useState } from "react";
import { SourceItem } from "./SourceItem";
import { UploadButton } from "./UploadButton";
import { useSourceStore } from "../../lib/store/sourceStore";
import { useUIStore } from "../../lib/store/uiStore";
import { SourceFile } from "../../lib/apiClient";

// Context Menu Component
interface ContextMenuProps {
	x: number;
	y: number;
	source: SourceFile;
	onClose: () => void;
	onRename: (source: SourceFile) => void;
	onDelete: (source: SourceFile) => void;
}

const ContextMenu: React.FC<ContextMenuProps> = ({
	x,
	y,
	source,
	onClose,
	onRename,
	onDelete,
}) => {
	// Ref for measuring context menu dimensions
	const menuRef = React.useRef<HTMLDivElement>(null);

	// State to track adjusted position
	const [position, setPosition] = React.useState({ top: y, left: x });

	// Adjust position once the menu is rendered to ensure it's visible
	React.useEffect(() => {
		if (menuRef.current) {
			const menu = menuRef.current;
			const menuRect = menu.getBoundingClientRect();
			const viewportWidth = window.innerWidth;
			const viewportHeight = window.innerHeight;

			// Check if menu is outside viewport and adjust if needed
			let adjustedLeft = x;
			let adjustedTop = y;

			// Adjust horizontally if needed
			if (x + menuRect.width > viewportWidth) {
				adjustedLeft = x - menuRect.width;
			}

			// Adjust vertically if needed
			if (y + menuRect.height > viewportHeight) {
				adjustedTop = y - menuRect.height;
			}

			setPosition({
				top: adjustedTop,
				left: adjustedLeft,
			});
		}
	}, [x, y]);

	// Close the context menu when clicking outside
	useEffect(() => {
		const handleOutsideClick = () => onClose();
		document.addEventListener("click", handleOutsideClick);
		return () => document.removeEventListener("click", handleOutsideClick);
	}, [onClose]);

	return (
		<div
			ref={menuRef}
			className="fixed z-50 bg-white shadow-lg rounded-md border border-gray-200 py-1 w-48"
			style={{ top: position.top, left: position.left }}
			onClick={(e) => e.stopPropagation()}
		>
			<button
				className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 flex items-center"
				onClick={() => {
					onRename(source);
					onClose();
				}}
			>
				<svg
					xmlns="http://www.w3.org/2000/svg"
					className="h-4 w-4 mr-2"
					viewBox="0 0 20 20"
					fill="currentColor"
				>
					<path d="M13.586 3.586a2 2 0 112.828 2.828l-.793.793-2.828-2.828.793-.793zM11.379 5.793L3 14.172V17h2.828l8.38-8.379-2.83-2.828z" />
				</svg>
				Rename
			</button>
			<button
				className="w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-gray-100 flex items-center"
				onClick={() => {
					onDelete(source);
					onClose();
				}}
			>
				<svg
					xmlns="http://www.w3.org/2000/svg"
					className="h-4 w-4 mr-2"
					viewBox="0 0 20 20"
					fill="currentColor"
				>
					<path
						fillRule="evenodd"
						d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v6a1 1 0 102 0V8a1 1 0 00-1-1z"
						clipRule="evenodd"
					/>
				</svg>
				Delete
			</button>
		</div>
	);
};

// Rename Dialog component
const RenameDialog: React.FC<{
	isOpen: boolean;
	source: SourceFile | null;
	onClose: () => void;
	onRename: (id: string, newName: string) => void;
}> = ({ isOpen, source, onClose, onRename }) => {
	const [newName, setNewName] = useState("");

	useEffect(() => {
		if (isOpen && source) {
			setNewName(source.filename);
		}
	}, [isOpen, source]);

	if (!isOpen || !source) return null;

	return (
		<div className="fixed inset-0 bg-black bg-opacity-30 flex items-center justify-center z-50">
			<div className="bg-white p-4 rounded-md shadow-lg w-80">
				<h3 className="text-lg font-medium mb-2">Rename Source</h3>
				<input
					type="text"
					value={newName}
					onChange={(e) => setNewName(e.target.value)}
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
							if (newName.trim()) {
								onRename(source.id, newName.trim());
								onClose();
							}
						}}
						className="px-3 py-1 bg-blue-500 text-white rounded hover:bg-blue-600"
					>
						Save
					</button>
				</div>
			</div>
		</div>
	);
};

// Confirm Delete Dialog component
const ConfirmDeleteDialog: React.FC<{
	isOpen: boolean;
	source: SourceFile | null;
	onClose: () => void;
	onConfirm: (id: string) => void;
}> = ({ isOpen, source, onClose, onConfirm }) => {
	if (!isOpen || !source) return null;

	return (
		<div className="fixed inset-0 bg-black bg-opacity-30 flex items-center justify-center z-50">
			<div className="bg-white p-4 rounded-md shadow-lg w-80">
				<h3 className="text-lg font-medium mb-2">Confirm Delete</h3>
				<p className="mb-4">
					Are you sure you want to delete &quot;{source.filename}
					&quot;? This action cannot be undone.
				</p>
				<div className="flex justify-end space-x-2">
					<button
						onClick={onClose}
						className="px-3 py-1 text-gray-600 hover:text-gray-800"
					>
						Cancel
					</button>
					<button
						onClick={() => {
							onConfirm(source.id);
							onClose();
						}}
						className="px-3 py-1 bg-red-500 text-white rounded hover:bg-red-600"
					>
						Delete
					</button>
				</div>
			</div>
		</div>
	);
};

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
		deleteSource,
		renameSource: renameSourceInStore,
	} = useSourceStore();

	const { isLeftSidebarCollapsed, toggleLeftSidebar } = useUIStore();

	// Context menu state
	const [contextMenu, setContextMenu] = useState<{
		visible: boolean;
		x: number;
		y: number;
		source: SourceFile;
	} | null>(null);

	// Dialog states
	const [renameDialogOpen, setRenameDialogOpen] = useState(false);
	const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
	const [selectedSource, setSelectedSource] = useState<SourceFile | null>(
		null
	);

	// Fetch sources when the component mounts or when sources change
	useEffect(() => {
		fetchSources();
	}, [fetchSources, sources.length]);

	const isAllSelected =
		sources.length > 0 && selectedSourceIds.length === sources.length;

	const handleSelectAllToggle = () => {
		if (isAllSelected) {
			clearSelection();
		} else {
			selectAllSources();
		}
	};

	// Handle right click on a source item
	const handleSourceContextMenu = (
		e: React.MouseEvent,
		source: SourceFile
	) => {
		e.preventDefault();

		// Calculate position relative to the clicked element
		// We'll position it near the right side of the item
		const targetElement = e.currentTarget as HTMLElement;
		const rect = targetElement.getBoundingClientRect();

		setContextMenu({
			visible: true,
			x: rect.right - 20, // Position near the right side of the item
			y: rect.top + rect.height / 2, // Position at the vertical center of the item
			source,
		});
	};

	// Close context menu
	const closeContextMenu = () => {
		setContextMenu(null);
	};

	// Handle rename request
	const handleRenameClick = (source: SourceFile) => {
		setSelectedSource(source);
		setRenameDialogOpen(true);
	};

	// Handle delete request
	const handleDeleteClick = (source: SourceFile) => {
		// Create a fresh copy of the source to avoid stale state issues
		setSelectedSource({ ...source });
		setDeleteDialogOpen(true);
	};

	// Implement rename API call with store function
	const renameSource = async (sourceId: string, newName: string) => {
		try {
			await renameSourceInStore(sourceId, newName);
		} catch (err) {
			console.error("Error renaming source:", err);
			// You could add a toast notification here
		}
	};

	// Use the store's deleteSource function
	// No need to implement a separate deleteSource function here

	return (
		<div className="flex flex-col h-full border-r border-gray-200 bg-white">
			<div className="flex justify-between items-center p-4 border-b border-gray-200 flex-shrink-0">
				<h2
					className={`text-lg font-semibold text-gray-800 ${
						isLeftSidebarCollapsed ? "hidden" : "block"
					}`}
				>
					Sources
				</h2>
				<button
					onClick={toggleLeftSidebar}
					className="text-gray-500 hover:text-gray-700 focus:outline-none"
				>
					{isLeftSidebarCollapsed ? (
						<svg
							xmlns="http://www.w3.org/2000/svg"
							className="h-5 w-5"
							viewBox="0 0 20 20"
							fill="currentColor"
						>
							<path
								fillRule="evenodd"
								d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z"
								clipRule="evenodd"
							/>
						</svg>
					) : (
						<svg
							xmlns="http://www.w3.org/2000/svg"
							className="h-5 w-5"
							viewBox="0 0 20 20"
							fill="currentColor"
						>
							<path
								fillRule="evenodd"
								d="M12.707 5.293a1 1 0 010 1.414L9.414 10l3.293 3.293a1 1 0 01-1.414 1.414l-4-4a1 1 0 010-1.414l4-4a1 1 0 011.414 0z"
								clipRule="evenodd"
							/>
						</svg>
					)}
				</button>
			</div>

			{!isLeftSidebarCollapsed && (
				<>
					<div className="p-4 flex-shrink-0">
						<UploadButton />
					</div>

					<div className="p-4 border-b border-gray-200 flex-shrink-0">
						<p className="text-sm text-gray-600">
							Select sources to use:
						</p>
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
								<p className="mt-2 text-gray-600">
									Loading sources...
								</p>
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
								No sources uploaded yet. Upload a PDF to get
								started.
							</div>
						) : (
							sources.map((source) => (
								<div
									key={source.id}
									onContextMenu={(e) =>
										handleSourceContextMenu(e, source)
									}
								>
									<SourceItem
										source={source}
										isSelected={selectedSourceIds.includes(
											source.id
										)}
										onToggleSelect={() =>
											toggleSelectSource(source.id)
										}
										onDeleteClick={handleDeleteClick}
									/>
								</div>
							))
						)}
					</div>
				</>
			)}

			{/* Context Menu */}
			{contextMenu && contextMenu.visible && (
				<ContextMenu
					x={contextMenu.x}
					y={contextMenu.y}
					source={contextMenu.source}
					onClose={closeContextMenu}
					onRename={handleRenameClick}
					onDelete={handleDeleteClick}
				/>
			)}

			{/* Rename Dialog */}
			<RenameDialog
				isOpen={renameDialogOpen}
				source={selectedSource}
				onClose={() => setRenameDialogOpen(false)}
				onRename={renameSource}
			/>

			{/* Confirm Delete Dialog */}
			<ConfirmDeleteDialog
				isOpen={deleteDialogOpen}
				source={selectedSource}
				onClose={() => setDeleteDialogOpen(false)}
				onConfirm={async (sourceId) => {
					try {
						await deleteSource(sourceId);
						// After successful deletion, force a re-render if needed
						setTimeout(() => {
							// This timeout is a trick to ensure the UI updates after the state change
							// It's needed because React might batch updates
							fetchSources();
						}, 100);
					} catch (error) {
						console.error("Error deleting source:", error);
						// Optionally show an error message to the user
					}
				}}
			/>
		</div>
	);
};
