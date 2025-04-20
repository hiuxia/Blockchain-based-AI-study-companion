import { useState } from "react";
import apiClient, { SourceFile } from "../lib/apiClient";

interface FileUploadState {
	isUploading: boolean;
	progress: number;
	error: Error | null;
	isDuplicate: boolean;
	isLargeFile: boolean;
}

export function useFileUpload() {
	const [state, setState] = useState<FileUploadState>({
		isUploading: false,
		progress: 0,
		error: null,
		isDuplicate: false,
		isLargeFile: false,
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
				isLargeFile: false,
			});

			// Validate file type
			if (file.type !== "application/pdf") {
				throw new Error("Only PDF files are supported");
			}

			// Validate file size (max 50MB)
			const MAX_FILE_SIZE = 50 * 1024 * 1024; // 50MB in bytes
			const LARGE_FILE_THRESHOLD = 10 * 1024 * 1024; // 10MB in bytes

			if (file.size > MAX_FILE_SIZE) {
				throw new Error("File size exceeds the 50MB limit");
			}

			// Check if this is a large file that might take longer
			const isLargeFile = file.size > LARGE_FILE_THRESHOLD;
			if (isLargeFile) {
				setState((prev) => ({
					...prev,
					isLargeFile: true,
				}));
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

			// Start progress simulation - adjust parameters based on file size
			const progressInterval = simulateProgress(isLargeFile);

			try {
				// Calculate timeout based on file size - allow more time for larger files
				// Roughly 10 seconds per MB with a minimum of 30 seconds
				const timeoutMs = Math.max(
					30000,
					(file.size / 1024 / 1024) * 10000
				);

				// Upload file with appropriate timeout
				const result = await apiClient.sources.uploadSource(
					file,
					timeoutMs
				);

				// Complete progress
				setState((prev) => ({
					...prev,
					progress: 100,
					isLargeFile: false,
				}));

				// Clear progress interval
				clearInterval(progressInterval);

				return result;
			} catch (error) {
				// Clear progress interval on error
				clearInterval(progressInterval);

				// Provide better error message for timeout/abort errors
				if (
					error instanceof DOMException &&
					error.name === "AbortError"
				) {
					throw new Error(
						"Upload timed out. The file may be too large or the network connection is unstable."
					);
				}

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
	// For large files, we adjust the simulation to be slower and more realistic
	const simulateProgress = (isLargeFile: boolean = false) => {
		// For larger files, we want a slower progress simulation
		const interval = isLargeFile ? 500 : 300;

		return setInterval(() => {
			setState((prev) => {
				// Different progress strategies based on file size
				let newProgress;

				if (isLargeFile) {
					// Slower progression for large files
					if (prev.progress < 40) {
						// Start slow
						newProgress = prev.progress + Math.random() * 5;
					} else if (prev.progress < 70) {
						// Even slower in the middle (where backend processing happens)
						newProgress = prev.progress + Math.random() * 2;
					} else {
						// Very slow at the end
						newProgress = prev.progress + Math.random() * 0.5;
					}
				} else {
					// Regular progression for normal files
					newProgress =
						prev.progress < 90
							? prev.progress + Math.random() * 10
							: 90 + Math.random() * 5;
				}

				return {
					...prev,
					progress: Math.min(99, newProgress),
				};
			});
		}, interval);
	};

	return {
		uploadFile,
		isUploading: state.isUploading,
		progress: state.progress,
		error: state.error,
		isDuplicate: state.isDuplicate,
		isLargeFile: state.isLargeFile,
	};
}
