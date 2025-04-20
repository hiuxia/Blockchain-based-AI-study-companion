import { create } from "zustand";
import apiClient, { Summary as ApiSummary } from "../apiClient";

export interface Note {
	id: string;
	name: string;
	content: string;
	content_type: string;
	source_summary_id?: string;
	created_at: string;
}

export type Summary = ApiSummary;

interface SavedItemsState {
	// State
	notes: Note[];
	summaries: Summary[];
	isLoadingNotes: boolean;
	isLoadingSummaries: boolean;
	notesError: string | null;
	summariesError: string | null;

	// Actions
	fetchNotes: () => Promise<void>;
	fetchSummaries: () => Promise<void>;
	createNote: (noteData: {
		name: string;
		content: string;
		content_type: string;
		source_summary_id?: string;
	}) => Promise<Note>;
	renameNote: (noteId: string, newName: string) => Promise<void>;
	renameSummary: (summaryId: string, newName: string) => Promise<void>;
	deleteNote: (noteId: string) => Promise<void>;
	deleteSummary: (summaryId: string) => Promise<void>;
}

// Helper functions to extend apiClient
const notesApi = {
	getNotes: async (): Promise<Note[]> => {
		try {
			const response = await fetch("http://localhost:8000/notes");
			if (!response.ok) {
				const errorText = await response
					.text()
					.catch(() => response.statusText);
				throw new Error(`Failed to fetch notes: ${errorText}`);
			}
			return response.json();
		} catch (error) {
			console.error("Error fetching notes:", error);
			throw error;
		}
	},

	createNote: async (noteData: {
		name: string;
		content: string;
		content_type: string;
		source_summary_id?: string;
	}): Promise<Note> => {
		try {
			const response = await fetch("http://localhost:8000/notes", {
				method: "POST",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify(noteData),
			});
			if (!response.ok) {
				const errorText = await response
					.text()
					.catch(() => response.statusText);
				throw new Error(`Failed to create note: ${errorText}`);
			}
			return response.json();
		} catch (error) {
			console.error("Error creating note:", error);
			throw error;
		}
	},

	renameNote: async (noteId: string, name: string): Promise<Note> => {
		try {
			const response = await fetch(
				`http://localhost:8000/notes/${noteId}`,
				{
					method: "PATCH",
					headers: { "Content-Type": "application/json" },
					body: JSON.stringify({ name }),
				}
			);
			if (!response.ok) {
				const errorText = await response
					.text()
					.catch(() => response.statusText);
				throw new Error(`Failed to rename note: ${errorText}`);
			}
			return response.json();
		} catch (error) {
			console.error("Error renaming note:", error);
			throw error;
		}
	},

	deleteNote: async (noteId: string): Promise<void> => {
		try {
			const response = await fetch(
				`http://localhost:8000/notes/${noteId}`,
				{
					method: "DELETE",
				}
			);
			if (!response.ok) {
				const errorText = await response
					.text()
					.catch(() => response.statusText);
				throw new Error(`Failed to delete note: ${errorText}`);
			}
		} catch (error) {
			console.error("Error deleting note:", error);
			throw error;
		}
	},
};

const summariesApi = {
	getSummaries: async (): Promise<Summary[]> => {
		try {
			return await apiClient.summaries.getSummaries();
		} catch (error) {
			console.error("Error fetching summaries:", error);
			// Return empty array instead of throwing to prevent UI from breaking
			return [];
		}
	},

	renameSummary: async (
		summaryId: string,
		name: string
	): Promise<Summary> => {
		try {
			return await apiClient.summaries.updateSummaryName(summaryId, name);
		} catch (error) {
			console.error("Error renaming summary:", error);
			throw error;
		}
	},

	deleteSummary: async (summaryId: string): Promise<void> => {
		try {
			const response = await fetch(
				`http://localhost:8000/summaries/${summaryId}`,
				{
					method: "DELETE",
				}
			);
			if (!response.ok) {
				const errorText = await response
					.text()
					.catch(() => response.statusText);
				throw new Error(`Failed to delete summary: ${errorText}`);
			}
		} catch (error) {
			console.error("Error deleting summary:", error);
			throw error;
		}
	},
};

export const useSavedItemsStore = create<SavedItemsState>((set) => ({
	// Initial state
	notes: [],
	summaries: [],
	isLoadingNotes: false,
	isLoadingSummaries: false,
	notesError: null,
	summariesError: null,

	// Actions
	fetchNotes: async () => {
		try {
			set({ isLoadingNotes: true, notesError: null });
			const notes = await notesApi.getNotes();
			set({ notes, isLoadingNotes: false });
		} catch (err) {
			set({
				notesError: err instanceof Error ? err.message : String(err),
				isLoadingNotes: false,
			});
		}
	},

	fetchSummaries: async () => {
		try {
			set({ isLoadingSummaries: true, summariesError: null });
			const summaries = await summariesApi.getSummaries();

			// Since getSummaries now returns an empty array on error instead of throwing,
			// we need to check if we have data before updating state
			set({
				summaries,
				isLoadingSummaries: false,
				// If the array is empty, it might indicate an error occurred in the API call
				// but we don't want to show an error if there are simply no summaries
				summariesError:
					summaries.length === 0
						? "Could not load summaries. The server might be unavailable."
						: null,
			});
		} catch (err) {
			console.error("Error in fetchSummaries:", err);
			set({
				summariesError:
					err instanceof Error ? err.message : String(err),
				isLoadingSummaries: false,
				// Ensure we don't lose existing summaries on error
				// summaries: [] would clear the list on error
			});
		}
	},

	createNote: async (noteData) => {
		try {
			set({ isLoadingNotes: true, notesError: null });
			const newNote = await notesApi.createNote(noteData);

			set((state) => ({
				notes: [...state.notes, newNote],
				isLoadingNotes: false,
			}));

			return newNote;
		} catch (err) {
			set({
				notesError: err instanceof Error ? err.message : String(err),
				isLoadingNotes: false,
			});
			throw err;
		}
	},

	renameNote: async (noteId, newName) => {
		try {
			set({ isLoadingNotes: true, notesError: null });
			const updatedNote = await notesApi.renameNote(noteId, newName);

			set((state) => ({
				notes: state.notes.map((note) =>
					note.id === noteId ? updatedNote : note
				),
				isLoadingNotes: false,
			}));
		} catch (err) {
			set({
				notesError: err instanceof Error ? err.message : String(err),
				isLoadingNotes: false,
			});
		}
	},

	renameSummary: async (summaryId: string, newName: string) => {
		try {
			set({ summariesError: null });
			const updatedSummary = await summariesApi.renameSummary(
				summaryId,
				newName
			);

			// Update the summary in the state with the new name
			set((state) => ({
				summaries: state.summaries.map((summary) =>
					summary.id === summaryId
						? { ...summary, name: updatedSummary.name }
						: summary
				),
			}));
		} catch (err) {
			set({
				summariesError:
					err instanceof Error ? err.message : String(err),
			});
			throw err;
		}
	},

	deleteNote: async (noteId) => {
		try {
			set({ isLoadingNotes: true, notesError: null });
			await notesApi.deleteNote(noteId);

			set((state) => ({
				notes: state.notes.filter((note) => note.id !== noteId),
				isLoadingNotes: false,
			}));
		} catch (err) {
			set({
				notesError: err instanceof Error ? err.message : String(err),
				isLoadingNotes: false,
			});
		}
	},

	deleteSummary: async (summaryId) => {
		try {
			set({ isLoadingSummaries: true, summariesError: null });
			await summariesApi.deleteSummary(summaryId);

			set((state) => ({
				summaries: state.summaries.filter(
					(summary) => summary.id !== summaryId
				),
				isLoadingSummaries: false,
			}));
		} catch (err) {
			set({
				summariesError:
					err instanceof Error ? err.message : String(err),
				isLoadingSummaries: false,
			});
		}
	},
}));
