import { create } from "zustand";

export type OutputTab = "notes" | "mindmap";
export type CenterPanelTab = "chat" | "output";

interface UIState {
	// State
	activeOutputTab: OutputTab;
	activeCenterPanelTab: CenterPanelTab;
	isLeftSidebarCollapsed: boolean;
	isRightSidebarCollapsed: boolean;
	llmModel: string;

	// Actions
	setActiveOutputTab: (tab: OutputTab) => void;
	setActiveCenterPanelTab: (tab: CenterPanelTab) => void;
	toggleLeftSidebar: () => void;
	toggleRightSidebar: () => void;
	setLlmModel: (model: string) => void;
}

export const useUIStore = create<UIState>((set) => ({
	// Initial state
	activeOutputTab: "notes",
	activeCenterPanelTab: "chat",
	isLeftSidebarCollapsed: false,
	isRightSidebarCollapsed: false,
	llmModel: "gemini2",

	// Actions
	setActiveOutputTab: (tab) => set({ activeOutputTab: tab }),
	setActiveCenterPanelTab: (tab) => set({ activeCenterPanelTab: tab }),
	toggleLeftSidebar: () =>
		set((state) => ({
			isLeftSidebarCollapsed: !state.isLeftSidebarCollapsed,
		})),
	toggleRightSidebar: () =>
		set((state) => ({
			isRightSidebarCollapsed: !state.isRightSidebarCollapsed,
		})),
	setLlmModel: (model) => set({ llmModel: model }),
}));
