import { create } from "zustand";

export interface Source {
	id: string;
	name: string;
}

interface SourceState {
	// State
	sources: Source[];
	selectedSourceIds: string[];

	// Actions
	setSources: (sources: Source[]) => void;
	toggleSelectSource: (id: string) => void;
	selectAllSources: () => void;
	clearSelection: () => void;
}

export const useSourceStore = create<SourceState>((set) => ({
	// Initial state
	sources: [
		{ id: "1", name: "Effective-Python.pdf" },
		{ id: "2", name: "c-api.pdf" },
		{ id: "3", name: "extending.pdf" },
		{ id: "4", name: "another-long-filename-with-text.pdf" },
		{ id: "5", name: "short.pdf" },
	],
	selectedSourceIds: ["1", "2", "3", "4", "5"],

	// Actions
	setSources: (sources) => set({ sources }),

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
