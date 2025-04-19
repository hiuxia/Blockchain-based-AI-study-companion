import { useState } from "react";
import apiClient, { SourceFile } from "../lib/apiClient";

interface FileUploadState {
	isUploading: boolean;
	progress: number;
	error: Error | null;
}

export function useFileUpload() {
	const [state, setState] = useState<FileUploadState>({
		isUploading: false,
		progress: 0,
		error: null,
	});

	const uploadFile = async (file: File): Promise<SourceFile | null> => {
		try {
			// Reset state
			setState({
				isUploading: true,
				progress: 0,
				error: null,
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
	};
}
