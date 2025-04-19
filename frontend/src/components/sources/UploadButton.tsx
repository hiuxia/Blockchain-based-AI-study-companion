"use client";
import React, { useRef } from "react";
import { useFileUpload } from "../../hooks/useFileUpload";
import { useSourceStore } from "../../lib/store/sourceStore";

export const UploadButton: React.FC = () => {
	const fileInputRef = useRef<HTMLInputElement>(null);
	const { uploadSource } = useSourceStore();
	const { uploadFile, isUploading, progress, error } = useFileUpload();

	const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
		const file = e.target.files?.[0];
		if (!file) return;

		const result = await uploadFile(file);
		if (result) {
			// Source store will be updated with the new source
			await uploadSource(file);
		}

		// Reset the file input
		if (fileInputRef.current) {
			fileInputRef.current.value = "";
		}
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
						Uploading ({Math.round(progress)}%)
					</div>
				) : (
					<>
						<span className="mr-2">+</span>
						Add Source (Upload PDF)
					</>
				)}
			</button>

			{error && (
				<div className="mt-2 text-red-500 text-sm">{error.message}</div>
			)}
		</div>
	);
};
