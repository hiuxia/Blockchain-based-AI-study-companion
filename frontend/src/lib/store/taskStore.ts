import { create } from "zustand";
import apiClient from "../apiClient";

export type TaskStatus =
	| "idle"
	| "pending"
	| "processing"
	| "completed"
	| "failed";

interface TaskState {
	// State
	taskId: string | null;
	status: TaskStatus;
	markdownResult: string | null;
	summaryId: string | null;
	error: string | null;
	isPolling: boolean;

	// Actions
	startProcessing: (sourceIds: string[], llmModel?: string) => Promise<void>;
	checkTaskStatus: (taskId: string) => Promise<void>;
	setTaskResult: (result: { markdown: string; summaryId: string }) => void;
	setError: (error: string) => void;
	resetTask: () => void;
}

export const useTaskStore = create<TaskState>((set, get) => ({
	// Initial state
	taskId: null,
	status: "idle",
	markdownResult: null,
	summaryId: null,
	error: null,
	isPolling: false,

	// Actions
	startProcessing: async (sourceIds, llmModel = "gemini-flash") => {
		try {
			set({
				status: "pending",
				markdownResult: null,
				summaryId: null,
				error: null,
				isPolling: false,
			});

			const response = await apiClient.process.startProcessing(
				sourceIds,
				llmModel
			);
			set({
				taskId: response.task_id,
				status: "processing",
				isPolling: true,
			});

			// Start polling for status
			get().checkTaskStatus(response.task_id);
		} catch (err) {
			set({
				status: "failed",
				error: err instanceof Error ? err.message : String(err),
				isPolling: false,
			});
		}
	},

	checkTaskStatus: async (taskId) => {
		try {
			const result = await apiClient.process.getTaskResult(taskId);

			if (result.status === "completed" && result.result) {
				set({
					status: "completed",
					markdownResult: result.result.markdown,
					summaryId: result.result.summary_id,
					isPolling: false,
				});
			} else if (result.status === "failed") {
				set({
					status: "failed",
					error: result.error || "Task processing failed",
					isPolling: false,
				});
			} else {
				// Still processing, continue polling after delay
				setTimeout(() => get().checkTaskStatus(taskId), 2000);
			}
		} catch (err) {
			set({
				status: "failed",
				error: err instanceof Error ? err.message : String(err),
				isPolling: false,
			});
		}
	},

	setTaskResult: ({ markdown, summaryId }) =>
		set({
			markdownResult: markdown,
			summaryId,
			status: "completed",
			isPolling: false,
		}),

	setError: (error) =>
		set({
			error,
			status: "failed",
			isPolling: false,
		}),

	resetTask: () =>
		set({
			status: "idle",
			taskId: null,
			markdownResult: null,
			summaryId: null,
			error: null,
			isPolling: false,
		}),
}));
