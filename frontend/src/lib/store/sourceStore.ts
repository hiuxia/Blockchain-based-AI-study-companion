import { create } from "zustand";
import apiClient, { SourceFile } from "../apiClient";

interface SourceState {
	// State
	sources: SourceFile[];
	selectedSourceIds: string[];
	isLoading: boolean;
	error: string | null;

	// Actions
	fetchSources: () => Promise<void>;
	uploadSource: (file: File) => Promise<void>;
	toggleSelectSource: (id: string) => void;
	selectAllSources: () => void;
	clearSelection: () => void;
}

export const useSourceStore = create<SourceState>((set) => ({
	// Initial state
	sources: [],
	selectedSourceIds: [],
	isLoading: false,
	error: null,

	// Actions
	fetchSources: async () => {
		try {
			set({ isLoading: true, error: null });
			const sources = await apiClient.sources.getSources();
			set({
				sources,
				isLoading: false,
			});
		} catch (err) {
			set({
				error: err instanceof Error ? err.message : String(err),
				isLoading: false,
			});
		}
	},

	uploadSource: async (file) => {
		try {
			set({ isLoading: true, error: null });
			const newSource = await apiClient.sources.uploadSource(file);
			set((state) => ({
				sources: [...state.sources, newSource],
				isLoading: false,
			}));
		} catch (err) {
			set({
				error: err instanceof Error ? err.message : String(err),
				isLoading: false,
			});
		}
	},

	toggleSelectSource: (id) =>
		set((state) => {
			const isSelected = state.selectedSourceIds.includes(id);
			return {
				selectedSourceIds: isSelected
					? state.selectedSourceIds.filter(
							(sourceId) => sourceId !== id
					  )
					: [...state.selectedSourceIds, id],
			};
		}),

	selectAllSources: () =>
		set((state) => ({
			selectedSourceIds: state.sources.map((source) => source.id),
		})),

	clearSelection: () => set({ selectedSourceIds: [] }),
}));
