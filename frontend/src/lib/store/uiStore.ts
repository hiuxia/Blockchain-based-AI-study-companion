import { create } from "zustand";

export type OutputTab = "notes" | "mindmap";

interface UIState {
	// State
	activeOutputTab: OutputTab;

	// Actions
	setActiveOutputTab: (tab: OutputTab) => void;
}

export const useUIStore = create<UIState>((set) => ({
	// Initial state
	activeOutputTab: "notes",

	// Actions
	setActiveOutputTab: (tab) => set({ activeOutputTab: tab }),
}));
