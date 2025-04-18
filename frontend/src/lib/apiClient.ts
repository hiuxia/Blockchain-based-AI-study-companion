/**
 * API Client for the AI Study Companion
 *
 * This client handles all communication with the backend API
 * as specified in the API documentation.
 */

const API_BASE_URL = "http://localhost:8000/api";

// Source management
interface Source {
	id: string;
	filename: string;
	content_type: string;
	created_at: string;
}

// Task management
type TaskStatus = "pending" | "processing" | "completed" | "failed";

interface TaskResult {
	markdown: string;
	summary_id: string;
	created_at: string;
}

interface TaskResponse {
	task_id: string;
	status: TaskStatus;
	result: TaskResult | { error: string } | null;
}

// Summary management
interface Summary {
	id: string;
	source_ids: string[];
	markdown: string;
	created_at: string;
}

// Create a custom error handler
class ApiError extends Error {
	public status: number;

	constructor(message: string, status: number) {
		super(message);
		this.name = "ApiError";
		this.status = status;
	}
}

// Helper for making API requests
async function fetchApi<T>(
	endpoint: string,
	options: RequestInit = {}
): Promise<T> {
	const url = `${API_BASE_URL}${endpoint}`;

	const defaultHeaders: HeadersInit = {
		"Content-Type": "application/json",
		Accept: "application/json",
	};

	const response = await fetch(url, {
		...options,
		headers: {
			...defaultHeaders,
			...options.headers,
		},
	});

	// If the response is not JSON, handle appropriately
	const contentType = response.headers.get("content-type");

	if (!contentType || !contentType.includes("application/json")) {
		if (!response.ok) {
			throw new ApiError(
				`API error: ${response.statusText}`,
				response.status
			);
		}
		return {} as T;
	}

	const data = await response.json();

	if (!response.ok) {
		const errorMessage = data.error || response.statusText;
		throw new ApiError(errorMessage, response.status);
	}

	return data as T;
}

// Source API endpoints
export const sourcesApi = {
	// Upload PDF files
	uploadSources: async (files: File[]): Promise<string[]> => {
		const formData = new FormData();

		files.forEach((file) => {
			formData.append("files", file);
		});

		const response = await fetch(`${API_BASE_URL}/sources/upload`, {
			method: "POST",
			body: formData,
		});

		if (!response.ok) {
			const errorMessage =
				response.status === 413
					? "File size exceeds limit (50MB)"
					: "Failed to upload files";

			throw new ApiError(errorMessage, response.status);
		}

		return response.json();
	},

	// Get list of sources
	getSources: async (skip = 0, limit = 100): Promise<Source[]> => {
		return fetchApi<Source[]>(`/sources?skip=${skip}&limit=${limit}`);
	},

	// Delete a source
	deleteSource: async (sourceId: string): Promise<{ message: string }> => {
		return fetchApi<{ message: string }>(`/sources/${sourceId}`, {
			method: "DELETE",
		});
	},
};

// Processing API endpoints
export const processApi = {
	// Start a processing task
	startProcessing: async (
		sourceIds: string[],
		llmModel?: string
	): Promise<{ task_id: string }> => {
		return fetchApi<{ task_id: string }>("/process", {
			method: "POST",
			body: JSON.stringify({
				source_ids: sourceIds,
				...(llmModel ? { llm_model: llmModel } : {}),
			}),
		});
	},

	// Get task status and result
	getTaskResult: async (taskId: string): Promise<TaskResponse> => {
		return fetchApi<TaskResponse>(`/process/results/${taskId}`);
	},
};

// Summary API endpoints
export const summariesApi = {
	// Get summary by ID
	getSummary: async (summaryId: string): Promise<Summary> => {
		return fetchApi<Summary>(`/summaries/${summaryId}`);
	},
};

// Export combined API client
const apiClient = {
	sources: sourcesApi,
	process: processApi,
	summaries: summariesApi,
};

export default apiClient;
