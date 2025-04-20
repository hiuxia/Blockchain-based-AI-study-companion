"use client";
import React, { useRef } from "react";
import { useFileUpload } from "../../hooks/useFileUpload";
import { useSourceStore } from "../../lib/store/sourceStore";

export const UploadButton: React.FC = () => {
	const fileInputRef = useRef<HTMLInputElement>(null);
	const {
		uploadFile,
		isUploading,
		progress,
		error,
		isDuplicate,
		isLargeFile,
	} = useFileUpload();

	const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
		const file = e.target.files?.[0];
		if (!file) return;

		// Upload the file using the useFileUpload hook
		const uploadedSource = await uploadFile(file, "rename");

		// If upload was successful, update the source store with the result
		// instead of uploading again
		if (uploadedSource) {
			// Just trigger a fetch to refresh the sources list
			// This avoids a second upload
			try {
				await useSourceStore.getState().fetchSources();
			} catch (error) {
				console.error("Failed to refresh sources list:", error);
			}
		}

		// Reset the file input
		if (fileInputRef.current) {
			fileInputRef.current.value = "";
		}
	};

	// Function to get upload status message
	const getUploadStatusMessage = () => {
		if (isLargeFile) {
			if (progress < 40) {
				return `Uploading large file (${Math.round(progress)}%)`;
			} else if (progress < 70) {
				return `Processing file (${Math.round(progress)}%)`;
			} else {
				return `Finalizing upload (${Math.round(progress)}%)`;
			}
		}
		return `Uploading (${Math.round(progress)}%)`;
	};

	return (
		<div className="w-full">
			<input
				type="file"
				ref={fileInputRef}
				onChange={handleFileChange}
				accept="application/pdf"
				className="hidden"
			/>

			<div className="flex flex-col space-y-2">
				<button
					className="w-full flex items-center justify-center py-2 px-4 border border-transparent rounded-md text-sm font-medium text-white bg-blue-500 hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:bg-blue-300"
					onClick={() => fileInputRef.current?.click()}
					disabled={isUploading}
				>
					{isUploading ? (
						<div className="flex items-center">
							<svg
								className="animate-spin -ml-1 mr-3 h-4 w-4 text-white"
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
							{getUploadStatusMessage()}
						</div>
					) : (
						<>
							<span className="mr-2">+</span>
							Add Source (Upload PDF)
						</>
					)}
				</button>
			</div>

			{error && (
				<div className="mt-2 text-red-500 text-sm">
					{error.message}
					{error.message.includes("timed out") && (
						<div className="mt-1 text-xs">
							Tip: Try compressing the PDF file before uploading.
							Large files may take longer to process.
						</div>
					)}
				</div>
			)}

			{isDuplicate && !error && (
				<div className="mt-2 text-amber-500 text-sm">
					Duplicate file detected. File was renamed automatically.
				</div>
			)}

			{isLargeFile && isUploading && (
				<div className="mt-2 text-blue-500 text-sm">
					This is a large file. Upload may take several minutes to
					complete. Please keep this page open.
				</div>
			)}

			{isUploading && (
				<div className="mt-2 w-full bg-gray-200 rounded-full h-2.5">
					<div
						className="bg-blue-600 h-2.5 rounded-full transition-all duration-300 ease-in-out"
						style={{ width: `${progress}%` }}
					></div>
				</div>
			)}
		</div>
	);
};
