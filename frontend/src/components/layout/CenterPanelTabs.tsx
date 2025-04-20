"use client";

import React from "react";
import { ChatInterface } from "../chat/ChatInterface";
import { OutputPanel } from "../output/OutputPanel";
import { useUIStore } from "../../lib/store/uiStore";

export const CenterPanelTabs: React.FC = () => {
	const { activeCenterPanelTab, setActiveCenterPanelTab } = useUIStore();

	return (
		<div className="flex flex-col h-full overflow-hidden">
			{/* Tabs Header - Fixed */}
			<div className="flex border-b border-gray-200 flex-shrink-0">
				<button
					className={`px-4 py-2 text-sm font-medium ${
						activeCenterPanelTab === "chat"
							? "text-blue-600 border-b-2 border-blue-600"
							: "text-gray-500 hover:text-gray-700 hover:border-gray-300"
					}`}
					onClick={() => setActiveCenterPanelTab("chat")}
				>
					Chat
				</button>
				<button
					className={`px-4 py-2 text-sm font-medium ${
						activeCenterPanelTab === "output"
							? "text-blue-600 border-b-2 border-blue-600"
							: "text-gray-500 hover:text-gray-700 hover:border-gray-300"
					}`}
					onClick={() => setActiveCenterPanelTab("output")}
				>
					Output
				</button>
			</div>

			{/* Tab Content - Scrollable */}
			<div className="flex-1 overflow-hidden">
				{activeCenterPanelTab === "chat" ? (
					<ChatInterface />
				) : (
					<OutputPanel />
				)}
			</div>
		</div>
	);
};
