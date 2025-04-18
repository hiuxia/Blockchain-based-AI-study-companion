import { create } from "zustand";

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

	// Actions
	startTask: () => void;
	setStatus: (status: TaskStatus) => void;
	setResult: (result: { markdown: string; summaryId: string }) => void;
	setError: (error: string) => void;
	resetTask: () => void;
}

export const useTaskStore = create<TaskState>((set) => ({
	// Initial state
	taskId: null,
	status: "idle",
	markdownResult: null,
	summaryId: null,
	error: null,

	// Actions
	startTask: () =>
		set({
			status: "pending",
			taskId: `task_${Date.now()}`,
			markdownResult: null,
			summaryId: null,
			error: null,
		}),

	setStatus: (status) => set({ status }),

	setResult: ({ markdown, summaryId }) =>
		set({
			markdownResult: markdown,
			summaryId,
			status: "completed",
		}),

	setError: (error) =>
		set({
			error,
			status: "failed",
		}),

	resetTask: () =>
		set({
			status: "idle",
			taskId: null,
			markdownResult: null,
			summaryId: null,
			error: null,
		}),
}));
