import { useState } from "react";
import apiClient, { SourceFile } from "../lib/apiClient";

interface FileUploadState {
	isUploading: boolean;
	progress: number;
	error: Error | null;
	isDuplicate: boolean;
}

export function useFileUpload() {
	const [state, setState] = useState<FileUploadState>({
		isUploading: false,
		progress: 0,
		error: null,
		isDuplicate: false,
	});

	// Check if a file with the same name already exists
	const checkForDuplicates = async (filename: string): Promise<boolean> => {
		try {
			const sources = await apiClient.sources.getSources();
			return sources.some((source) => source.filename === filename);
		} catch (err) {
			console.error("Error checking for duplicates:", err);
			return false;
		}
	};

	// Generate a unique filename by adding a timestamp
	const getUniqueFilename = (filename: string): string => {
		const extension = filename.substring(filename.lastIndexOf("."));
		const baseName = filename.substring(0, filename.lastIndexOf("."));
		const timestamp = new Date().getTime();
		return `${baseName}_${timestamp}${extension}`;
	};

	const uploadFile = async (
		file: File,
		handleDuplicates: "rename" | "skip" = "rename"
	): Promise<SourceFile | null> => {
		try {
			// Reset state
			setState({
				isUploading: true,
				progress: 0,
				error: null,
				isDuplicate: false,
			});

			// Validate file type
			if (file.type !== "application/pdf") {
				throw new Error("Only PDF files are supported");
			}

			// Validate file size (max 50MB)
			const MAX_FILE_SIZE = 50 * 1024 * 1024; // 50MB in bytes
			if (file.size > MAX_FILE_SIZE) {
				throw new Error("File size exceeds the 50MB limit");
			}

			// Check for duplicates
			const isDuplicate = await checkForDuplicates(file.name);

			if (isDuplicate) {
				setState((prev) => ({
					...prev,
					isDuplicate: true,
				}));

				if (handleDuplicates === "skip") {
					throw new Error(
						`File "${file.name}" already exists. Upload skipped.`
					);
				}

				// Create a file with a unique name
				const uniqueFilename = getUniqueFilename(file.name);
				const renamedFile = new File([file], uniqueFilename, {
					type: file.type,
				});
				file = renamedFile;
			}

			// Start progress simulation
			const progressInterval = simulateProgress();

			try {
				// Upload file
				const result = await apiClient.sources.uploadSource(file);

				// Complete progress
				setState((prev) => ({
					...prev,
					progress: 100,
				}));

				// Clear progress interval
				clearInterval(progressInterval);

				return result;
			} catch (error) {
				// Clear progress interval on error
				clearInterval(progressInterval);
				throw error;
			}
		} catch (err) {
			const error = err instanceof Error ? err : new Error(String(err));
			setState((prev) => ({
				...prev,
				error,
			}));
			return null;
		} finally {
			setState((prev) => ({
				...prev,
				isUploading: false,
			}));
		}
	};

	// Function to simulate upload progress since fetch doesn't provide it natively
	const simulateProgress = () => {
		return setInterval(() => {
			setState((prev) => {
				// Increment progress, but never reach 100% (that happens on completion)
				const newProgress =
					prev.progress < 90
						? prev.progress + Math.random() * 10
						: 90 + Math.random() * 5;

				return {
					...prev,
					progress: Math.min(99, newProgress),
				};
			});
		}, 300);
	};

	return {
		uploadFile,
		isUploading: state.isUploading,
		progress: state.progress,
		error: state.error,
		isDuplicate: state.isDuplicate,
	};
}
