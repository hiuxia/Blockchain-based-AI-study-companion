"use client";
import React, { useState } from "react";
import { useSavedItemsStore } from "../../lib/store/savedItemsStore";

interface ChatMessageProps {
	message: string;
	isUser: boolean;
	reference?: string;
}

export const ChatMessage: React.FC<ChatMessageProps> = ({
	message,
	isUser,
	reference,
}) => {
	const [isSaveModalOpen, setIsSaveModalOpen] = useState(false);
	const [isLoading, setIsLoading] = useState(false);
	const [error, setError] = useState<string | null>(null);
	const [noteName, setNoteName] = useState("");
	const [contentType, setContentType] = useState("text");
	const [sourceSummaryId, setSourceSummaryId] = useState<string | undefined>(
		undefined
	);
	const { createNote } = useSavedItemsStore();
	const [saveSuccess, setSaveSuccess] = useState(false);

	const handleSave = async () => {
		if (!noteName.trim()) {
			setError("Please provide a name for this note");
			return;
		}

		setIsLoading(true);
		setError(null);
		setSaveSuccess(false);

		try {
			// Call API to save the note
			await createNote({
				name: noteName.trim(),
				content: message,
				content_type: contentType,
				source_summary_id: sourceSummaryId,
			});

			// Show success message
			setSaveSuccess(true);

			// Reset form after 1.5 seconds and close modal
			setTimeout(() => {
				setIsSaveModalOpen(false);
				setNoteName("");
				setContentType("text");
				setSourceSummaryId(undefined);
				setSaveSuccess(false);
			}, 1500);
		} catch (err) {
			console.error("Error saving note:", err);
			let errorMessage = "Failed to save note";

			// Try to extract more specific error message
			if (err instanceof Error) {
				// Clean up common error prefixes for better display
				errorMessage = err.message
					.replace("Failed to create note: ", "")
					.replace("Error: ", "");

				// Handle specific error cases
				if (err.message.includes("timed out")) {
					errorMessage =
						"Server is not responding. Please try again later.";
				} else if (
					err.message.includes("network") ||
					err.message.includes("fetch")
				) {
					errorMessage =
						"Network error. Please check your connection and try again.";
				}
			}

			setError(errorMessage);
		} finally {
			setIsLoading(false);
		}
	};

	return (
		<div
			className={`flex my-2 ${isUser ? "justify-end" : "justify-start"}`}
		>
			<div className="relative group max-w-xs md:max-w-md lg:max-w-lg">
				<div
					className={`rounded-lg px-4 py-2 ${
						isUser
							? "bg-blue-500 text-white"
							: "bg-gray-100 text-gray-800"
					}`}
				>
					<p>{message}</p>
					{reference && (
						<span
							className={`text-xs mt-1 block ${
								isUser ? "text-blue-200" : "text-blue-500"
							}`}
						>
							[{reference}]
						</span>
					)}
				</div>

				{/* Save button that appears on hover */}
				<button
					onClick={() => setIsSaveModalOpen(true)}
					className={`absolute -right-2 top-0 opacity-0 group-hover:opacity-100 transition-opacity duration-200 p-1 rounded-full 
						${isUser ? "bg-blue-600 hover:bg-blue-700" : "bg-gray-200 hover:bg-gray-300"}`}
					title="Save this message"
				>
					<svg
						className={`w-4 h-4 ${
							isUser ? "text-white" : "text-gray-600"
						}`}
						fill="none"
						viewBox="0 0 24 24"
						stroke="currentColor"
					>
						<path
							strokeLinecap="round"
							strokeLinejoin="round"
							strokeWidth={2}
							d="M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z"
						/>
					</svg>
				</button>

				{/* Save Modal */}
				{isSaveModalOpen && (
					<div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
						<div className="bg-white rounded-lg p-6 max-w-md w-full">
							<h3 className="text-lg font-medium mb-4">
								Save as Note
							</h3>

							{error && (
								<div className="mb-4 p-2 bg-red-100 text-red-800 rounded-md text-sm">
									{error}
								</div>
							)}

							{saveSuccess && (
								<div className="mb-4 p-2 bg-green-100 text-green-800 rounded-md text-sm">
									Note saved successfully!
								</div>
							)}

							<div className="mb-4">
								<label
									htmlFor="note-name"
									className="block text-sm font-medium text-gray-700 mb-1"
								>
									Note Name{" "}
									<span className="text-red-500">*</span>
								</label>
								<input
									id="note-name"
									type="text"
									value={noteName}
									onChange={(e) =>
										setNoteName(e.target.value)
									}
									className="w-full p-2 border border-gray-300 rounded"
									placeholder="Enter a name for this note"
									required
								/>
							</div>

							<div className="mb-4">
								<label
									htmlFor="content-type"
									className="block text-sm font-medium text-gray-700 mb-1"
								>
									Content Type
								</label>
								<select
									id="content-type"
									value={contentType}
									onChange={(e) =>
										setContentType(e.target.value)
									}
									className="w-full p-2 border border-gray-300 rounded"
								>
									<option value="text">Text</option>
									<option value="markdown">Markdown</option>
									<option value="code">Code</option>
								</select>
							</div>

							<div className="mb-6">
								<label
									htmlFor="source-summary"
									className="block text-sm font-medium text-gray-700 mb-1"
								>
									Source Summary ID (Optional)
								</label>
								<input
									id="source-summary"
									type="text"
									value={sourceSummaryId || ""}
									onChange={(e) =>
										setSourceSummaryId(
											e.target.value || undefined
										)
									}
									className="w-full p-2 border border-gray-300 rounded"
									placeholder="Enter source summary ID if applicable"
								/>
							</div>

							<div className="flex justify-end space-x-2">
								<button
									onClick={() => setIsSaveModalOpen(false)}
									className="px-4 py-2 border border-gray-300 rounded text-gray-700 hover:bg-gray-50"
									disabled={isLoading}
								>
									Cancel
								</button>
								<button
									onClick={handleSave}
									className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 disabled:bg-blue-300"
									disabled={isLoading || saveSuccess}
								>
									{isLoading ? (
										<span className="flex items-center">
											<svg
												className="animate-spin -ml-1 mr-2 h-4 w-4 text-white"
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
											Saving...
										</span>
									) : saveSuccess ? (
										<span className="flex items-center">
											<svg
												className="h-4 w-4 mr-1 text-white"
												fill="none"
												stroke="currentColor"
												viewBox="0 0 24 24"
											>
												<path
													strokeLinecap="round"
													strokeLinejoin="round"
													strokeWidth={2}
													d="M5 13l4 4L19 7"
												/>
											</svg>
											Saved!
										</span>
									) : (
										"Save"
									)}
								</button>
							</div>
						</div>
					</div>
				)}
			</div>
		</div>
	);
};
