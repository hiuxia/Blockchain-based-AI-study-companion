/**
 * API Client for the AI Study Companion
 *
 * This client handles all communication with the backend API
 * as specified in the API documentation.
 */

const API_BASE_URL = "http://localhost:8000";

// API response type interfaces
export interface SourceFile {
	id: string;
	filename: string;
	content_type: string;
	created_at?: string;
}

export interface ProcessTask {
	task_id: string;
}

export interface ProcessResult {
	task_id: string;
	status: "pending" | "processing" | "completed" | "failed";
	result: {
		markdown: string;
		summary_id: string;
		created_at: string;
	} | null;
	error: string | null;
}

export interface ConversationHistory {
	id: string;
	conversation: string;
	created_at: string;
}

export interface Summary {
	id: string;
	name: string;
	source_ids: string[];
	markdown: string;
	vector_index_path?: string;
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

	// If we're sending form data, don't set Content-Type
	// as the browser will set it with the boundary
	const headers =
		options.body instanceof FormData
			? { Accept: "application/json" }
			: defaultHeaders;

	const response = await fetch(url, {
		...options,
		headers: {
			...headers,
			...(options.headers || {}),
		},
	});

	// Special handling for DELETE requests which might return empty bodies
	if (options.method === "DELETE" && response.status === 204) {
		return {} as T;
	}

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

	// Safely parse JSON with error handling
	let data;
	try {
		// Check if there's content to parse
		const text = await response.text();
		data = text ? JSON.parse(text) : {};
	} catch (error) {
		console.error("Error parsing JSON:", error);
		if (!response.ok) {
			throw new ApiError(
				`Invalid JSON response: ${response.statusText}`,
				response.status
			);
		}
		return {} as T;
	}

	if (!response.ok) {
		const errorMessage = data.detail || data.error || response.statusText;
		throw new ApiError(errorMessage, response.status);
	}

	return data as T;
}

// Complete API client with all endpoints
const apiClient = {
	// Health check
	health: {
		check: (): Promise<{ status: string }> => {
			return fetchApi("/health");
		},
	},

	// Sources API
	sources: {
		uploadSource: (
			file: File,
			timeoutMs: number = 120000
		): Promise<SourceFile> => {
			const formData = new FormData();
			formData.append("file", file);

			// Create an AbortController to handle timeout
			const controller = new AbortController();
			const timeoutId = setTimeout(() => controller.abort(), timeoutMs);

			// Add custom timeout handling for large files
			return fetchApi<SourceFile>("/sources", {
				method: "POST",
				body: formData,
				signal: controller.signal,
			}).finally(() => {
				clearTimeout(timeoutId);
			});
		},

		getSources: (): Promise<SourceFile[]> => {
			return fetchApi("/sources");
		},

		getSource: (sourceId: string): Promise<SourceFile> => {
			return fetchApi(`/sources/${sourceId}`);
		},

		deleteSource: (sourceId: string): Promise<void> => {
			return fetchApi(`/sources/${sourceId}`, {
				method: "DELETE",
			}).then(() => {
				// Explicitly return void for DELETE operations
				return;
			});
		},

		renameSource: (
			sourceId: string,
			newFilename: string
		): Promise<SourceFile> => {
			return fetchApi(`/sources/${sourceId}`, {
				method: "PATCH",
				body: JSON.stringify({ filename: newFilename }),
			});
		},
	},

	// Process API
	process: {
		startProcessing: (
			sourceIds: string[],
			llmModel: string = "gemini-flash"
		): Promise<ProcessTask> => {
			return fetchApi("/process", {
				method: "POST",
				body: JSON.stringify({
					source_ids: sourceIds,
					llm_model: llmModel,
				}),
			});
		},

		getTaskResult: (taskId: string): Promise<ProcessResult> => {
			return fetchApi(`/process/results/${taskId}`);
		},
	},

	// History API
	history: {
		saveConversation: (
			conversation: string
		): Promise<ConversationHistory> => {
			return fetchApi("/history", {
				method: "POST",
				body: JSON.stringify({ conversation }),
			});
		},

		getConversationHistories: (): Promise<ConversationHistory[]> => {
			return fetchApi("/history");
		},

		getConversationHistory: (
			historyId: string
		): Promise<ConversationHistory> => {
			return fetchApi(`/history/${historyId}`);
		},
	},

	// Summaries API
	summaries: {
		getSummaries: (): Promise<Summary[]> => {
			return fetchApi("/summaries");
		},

		getSummary: (summaryId: string): Promise<Summary> => {
			return fetchApi(`/summaries/${summaryId}`);
		},

		updateSummaryName: (
			summaryId: string,
			name: string
		): Promise<Summary> => {
			return fetchApi(`/summaries/${summaryId}`, {
				method: "PATCH",
				body: JSON.stringify({ name }),
			});
		},
	},
};

export default apiClient;
