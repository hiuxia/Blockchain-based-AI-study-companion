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
		uploadSource: (file: File): Promise<SourceFile> => {
			const formData = new FormData();
			formData.append("file", file);

			return fetchApi("/sources", {
				method: "POST",
				body: formData,
			});
		},

		getSources: (): Promise<SourceFile[]> => {
			return fetchApi("/sources");
		},

		getSource: (sourceId: string): Promise<SourceFile> => {
			return fetchApi(`/sources/${sourceId}`);
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
};

export default apiClient;
