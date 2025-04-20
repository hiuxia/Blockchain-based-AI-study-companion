"use client";

import React, { useEffect, useState } from "react";
import { useUIStore } from "../../lib/store/uiStore";
import {
	useSavedItemsStore,
	Note,
	Summary,
} from "../../lib/store/savedItemsStore";
import { useTaskStore } from "../../lib/store/taskStore";

// Context Menu Component
interface ContextMenuProps {
	x: number;
	y: number;
	item: Note | Summary;
	onClose: () => void;
	onRename: (item: Note | Summary) => void;
	onDelete: (item: Note | Summary) => void;
	onView?: (item: Summary) => void;
}

const ContextMenu: React.FC<ContextMenuProps> = ({
	x,
	y,
	item,
	onClose,
	onRename,
	onDelete,
	onView,
}) => {
	// Determine if the item is a Summary (for view option)
	const isSummary = "markdown" in item;

	// Close the context menu when clicking outside
	useEffect(() => {
		const handleOutsideClick = () => onClose();
		document.addEventListener("click", handleOutsideClick);
		return () => document.removeEventListener("click", handleOutsideClick);
	}, [onClose]);

	return (
		<div
			className="absolute z-50 bg-white shadow-lg rounded-md border border-gray-200 py-1 w-48"
			style={{ top: y, left: x }}
			onClick={(e) => e.stopPropagation()}
		>
			{isSummary && onView && (
				<button
					className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 flex items-center"
					onClick={() => {
						onView(item as Summary);
						onClose();
					}}
				>
					<svg
						xmlns="http://www.w3.org/2000/svg"
						className="h-4 w-4 mr-2"
						viewBox="0 0 20 20"
						fill="currentColor"
					>
						<path d="M10 12a2 2 0 100-4 2 2 0 000 4z" />
						<path
							fillRule="evenodd"
							d="M.458 10C1.732 5.943 5.522 3 10 3s8.268 2.943 9.542 7c-1.274 4.057-5.064 7-9.542 7S1.732 14.057.458 10zM14 10a4 4 0 11-8 0 4 4 0 018 0z"
							clipRule="evenodd"
						/>
					</svg>
					View
				</button>
			)}
			<button
				className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 flex items-center"
				onClick={() => {
					onRename(item);
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
					onDelete(item);
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
	name: string;
	onClose: () => void;
	onRename: (newName: string) => void;
}> = ({ isOpen, name, onClose, onRename }) => {
	const [newName, setNewName] = useState(name);

	useEffect(() => {
		if (isOpen) {
			setNewName(name);
		}
	}, [isOpen, name]);

	if (!isOpen) return null;

	return (
		<div className="fixed inset-0 bg-black bg-opacity-30 flex items-center justify-center z-50">
			<div className="bg-white p-4 rounded-md shadow-lg w-80">
				<h3 className="text-lg font-medium mb-2">Rename</h3>
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
								onRename(newName);
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
	itemName: string;
	onClose: () => void;
	onConfirm: () => void;
}> = ({ isOpen, itemName, onClose, onConfirm }) => {
	if (!isOpen) return null;

	return (
		<div className="fixed inset-0 bg-black bg-opacity-30 flex items-center justify-center z-50">
			<div className="bg-white p-4 rounded-md shadow-lg w-80">
				<h3 className="text-lg font-medium mb-2">Confirm Delete</h3>
				<p className="mb-4">
					Are you sure you want to delete &quot;{itemName}&quot;? This
					action cannot be undone.
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
							onConfirm();
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

type SavedItemTab = "notes" | "summaries";

export const SavedItemsPanel: React.FC = () => {
	const { isRightSidebarCollapsed, toggleRightSidebar } = useUIStore();
	const [activeTab, setActiveTab] = useState<SavedItemTab>("notes");
	const [renameDialogOpen, setRenameDialogOpen] = useState(false);
	const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
	const [selectedNote, setSelectedNote] = useState<Note | null>(null);
	const [selectedSummary, setSelectedSummary] = useState<Summary | null>(
		null
	);

	// Context menu state
	const [contextMenu, setContextMenu] = useState<{
		visible: boolean;
		x: number;
		y: number;
		item: Note | Summary;
	} | null>(null);

	const {
		notes,
		summaries,
		isLoadingNotes,
		isLoadingSummaries,
		notesError,
		summariesError,
		fetchNotes,
		fetchSummaries,
		renameNote,
		renameSummary,
		deleteNote,
		deleteSummary,
	} = useSavedItemsStore();

	const { setTaskResult } = useTaskStore();

	useEffect(() => {
		fetchNotes();
		fetchSummaries();
	}, [fetchNotes, fetchSummaries]);

	// Handle right click on an item
	const handleItemContextMenu = (
		e: React.MouseEvent,
		item: Note | Summary
	) => {
		e.preventDefault();
		e.stopPropagation();
		setContextMenu({
			visible: true,
			x: e.clientX,
			y: e.clientY,
			item,
		});
	};

	// Close context menu
	const closeContextMenu = () => {
		setContextMenu(null);
	};

	const handleRenameClick = (item: Note | Summary) => {
		if ("content" in item) {
			setSelectedNote(item as Note);
			setSelectedSummary(null);
		} else {
			setSelectedSummary(item as Summary);
			setSelectedNote(null);
		}
		setRenameDialogOpen(true);
	};

	const handleDeleteClick = (item: Note | Summary) => {
		if ("content" in item) {
			setSelectedNote(item as Note);
			setSelectedSummary(null);
		} else {
			setSelectedSummary(item as Summary);
			setSelectedNote(null);
		}
		setDeleteDialogOpen(true);
	};

	const handleRename = (newName: string) => {
		if (selectedNote) {
			renameNote(selectedNote.id, newName);
		} else if (selectedSummary) {
			renameSummary(selectedSummary.id, newName);
		}
	};

	const handleDelete = () => {
		if (selectedNote) {
			deleteNote(selectedNote.id);
		} else if (selectedSummary) {
			deleteSummary(selectedSummary.id);
		}
	};

	const handleSummaryClick = (summary: Summary) => {
		setTaskResult({
			markdown: summary.markdown,
			summaryId: summary.id,
		});
	};

	return (
		<div className="flex flex-col h-full border-l border-gray-200 bg-white">
			<div className="flex justify-between items-center p-4 border-b border-gray-200 flex-shrink-0">
				<h2
					className={`text-lg font-semibold text-gray-800 ${
						isRightSidebarCollapsed ? "hidden" : "block"
					}`}
				>
					Saved Items
				</h2>
				<button
					onClick={toggleRightSidebar}
					className="text-gray-500 hover:text-gray-700 focus:outline-none"
				>
					{isRightSidebarCollapsed ? (
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
					) : (
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
					)}
				</button>
			</div>

			{!isRightSidebarCollapsed && (
				<>
					<div className="flex border-b border-gray-200 flex-shrink-0">
						<button
							className={`flex-1 py-2 text-sm font-medium ${
								activeTab === "notes"
									? "text-blue-600 border-b-2 border-blue-600"
									: "text-gray-500 hover:text-gray-700"
							}`}
							onClick={() => setActiveTab("notes")}
						>
							Notes
						</button>
						<button
							className={`flex-1 py-2 text-sm font-medium ${
								activeTab === "summaries"
									? "text-blue-600 border-b-2 border-blue-600"
									: "text-gray-500 hover:text-gray-700"
							}`}
							onClick={() => setActiveTab("summaries")}
						>
							Summaries
						</button>
					</div>

					<div className="flex-1 overflow-y-auto">
						{activeTab === "notes" ? (
							// Notes tab content
							<>
								{isLoadingNotes && notes.length === 0 ? (
									<div className="text-center p-4">
										<div className="animate-spin h-6 w-6 border-2 border-blue-500 border-t-transparent rounded-full mx-auto"></div>
										<p className="mt-2 text-sm text-gray-600">
											Loading notes...
										</p>
									</div>
								) : notesError ? (
									<div className="p-4 text-center">
										<div className="text-red-500 mb-2">
											{notesError}
										</div>
										<button
											onClick={() => fetchNotes()}
											className="px-3 py-1 bg-blue-500 text-white rounded text-sm hover:bg-blue-600"
										>
											Retry
										</button>
									</div>
								) : notes.length === 0 ? (
									<div className="p-4 text-center text-gray-500">
										No saved notes yet.
									</div>
								) : (
									<ul className="divide-y divide-gray-200">
										{notes.map((note) => (
											<li
												key={note.id}
												className="p-3 hover:bg-gray-50 cursor-pointer"
												onContextMenu={(e) =>
													handleItemContextMenu(
														e,
														note
													)
												}
											>
												<div className="flex items-start">
													<div className="mr-2 mt-0.5">
														{note.content_type ===
														"markdown" ? (
															<svg
																xmlns="http://www.w3.org/2000/svg"
																className="h-5 w-5 text-blue-500"
																viewBox="0 0 20 20"
																fill="currentColor"
															>
																<path
																	fillRule="evenodd"
																	d="M4 4a2 2 0 012-2h4.586A2 2 0 0112 2.586L15.414 6A2 2 0 0116 7.414V16a2 2 0 01-2 2H6a2 2 0 01-2-2V4zm2 6a1 1 0 011-1h6a1 1 0 110 2H7a1 1 0 01-1-1zm1 3a1 1 0 100 2h6a1 1 0 100-2H7z"
																	clipRule="evenodd"
																/>
															</svg>
														) : note.content_type ===
														  "code" ? (
															<svg
																xmlns="http://www.w3.org/2000/svg"
																className="h-5 w-5 text-purple-500"
																viewBox="0 0 20 20"
																fill="currentColor"
															>
																<path
																	fillRule="evenodd"
																	d="M12.316 3.051a1 1 0 01.633 1.265l-4 12a1 1 0 11-1.898-.632l4-12a1 1 0 011.265-.633zM5.707 6.293a1 1 0 010 1.414L3.414 10l2.293 2.293a1 1 0 11-1.414 1.414l-3-3a1 1 0 010-1.414l3-3a1 1 0 011.414 0zm8.586 0a1 1 0 011.414 0l3 3a1 1 0 010 1.414l-3 3a1 1 0 11-1.414-1.414L16.586 10l-2.293-2.293a1 1 0 010-1.414z"
																	clipRule="evenodd"
																/>
															</svg>
														) : (
															<svg
																xmlns="http://www.w3.org/2000/svg"
																className="h-5 w-5 text-gray-500"
																viewBox="0 0 20 20"
																fill="currentColor"
															>
																<path
																	fillRule="evenodd"
																	d="M4 4a2 2 0 012-2h4.586A2 2 0 0112 2.586L15.414 6A2 2 0 0116 7.414V16a2 2 0 01-2 2H6a2 2 0 01-2-2V4z"
																	clipRule="evenodd"
																/>
															</svg>
														)}
													</div>
													<div className="flex-1 min-w-0">
														<p className="text-sm font-medium text-gray-900 truncate">
															{note.name}
														</p>
														<p className="text-xs text-gray-500">
															{new Date(
																note.created_at
															).toLocaleString()}
														</p>
													</div>
												</div>
											</li>
										))}
									</ul>
								)}
							</>
						) : (
							// Summaries tab content
							<>
								{isLoadingSummaries &&
								summaries.length === 0 ? (
									<div className="text-center p-4">
										<div className="animate-spin h-6 w-6 border-2 border-blue-500 border-t-transparent rounded-full mx-auto"></div>
										<p className="mt-2 text-sm text-gray-600">
											Loading summaries...
										</p>
									</div>
								) : summariesError ? (
									<div className="p-4 text-center">
										<div className="text-red-500 mb-2">
											{summariesError}
										</div>
										<button
											onClick={() => fetchSummaries()}
											className="px-3 py-1 bg-blue-500 text-white rounded text-sm hover:bg-blue-600"
										>
											Retry
										</button>
									</div>
								) : summaries.length === 0 ? (
									<div className="p-4 text-center text-gray-500">
										No saved summaries yet.
									</div>
								) : (
									<ul className="divide-y divide-gray-200">
										{summaries.map((summary) => (
											<li
												key={summary.id}
												className="p-3 hover:bg-gray-50 cursor-pointer"
												onClick={() =>
													handleSummaryClick(summary)
												}
												onContextMenu={(e) =>
													handleItemContextMenu(
														e,
														summary
													)
												}
											>
												<div className="flex items-center">
													<span className="text-sm font-medium text-gray-800 truncate">
														{summary.name ||
															"Untitled Summary"}
													</span>
												</div>
												<p className="text-xs text-gray-500 mt-1">
													{new Date(
														summary.created_at
													).toLocaleDateString()}
												</p>
											</li>
										))}
									</ul>
								)}
							</>
						)}
					</div>
				</>
			)}

			{/* Context Menu */}
			{contextMenu && contextMenu.visible && (
				<ContextMenu
					x={contextMenu.x}
					y={contextMenu.y}
					item={contextMenu.item}
					onClose={closeContextMenu}
					onRename={handleRenameClick}
					onDelete={handleDeleteClick}
					onView={
						"markdown" in contextMenu.item
							? handleSummaryClick
							: undefined
					}
				/>
			)}

			{/* Rename Dialog */}
			<RenameDialog
				isOpen={renameDialogOpen}
				name={selectedNote?.name || selectedSummary?.name || ""}
				onClose={() => setRenameDialogOpen(false)}
				onRename={handleRename}
			/>

			{/* Confirm Delete Dialog */}
			<ConfirmDeleteDialog
				isOpen={deleteDialogOpen}
				itemName={
					selectedNote?.name || selectedSummary?.name || "this item"
				}
				onClose={() => setDeleteDialogOpen(false)}
				onConfirm={handleDelete}
			/>
		</div>
	);
};
