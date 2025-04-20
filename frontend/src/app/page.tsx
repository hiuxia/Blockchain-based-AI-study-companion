"use client";

import { MainLayout } from "../components/layout/MainLayout";
import { SourcesList } from "../components/sources/SourcesList";
import { CenterPanelTabs } from "../components/layout/CenterPanelTabs";
import { SavedItemsPanel } from "../components/layout/SavedItemsPanel";
import { GenerateButton } from "../components/GenerateButton";
import { ResizeHandle } from "../components/layout/ResizeHandle";

export default function Home() {
	return (
		<MainLayout>
			<div className="relative flex h-full w-full overflow-hidden">
				{/* Left Sidebar (Sources Panel) - Collapsible & Resizable */}
				<div
					id="left-panel"
					className="transition-all duration-300 flex-shrink-0 h-full overflow-hidden"
					style={{
						width: "var(--left-panel-width, 260px)",
						minWidth: "60px",
						maxWidth: "400px",
					}}
				>
					<SourcesList />
				</div>

				{/* Resize handle between left and center panels */}
				<ResizeHandle panelId="left-panel" direction="right" />

				{/* Center Section */}
				<div
					id="center-panel"
					className="flex-1 flex flex-col min-w-[300px] h-full overflow-hidden"
				>
					{/* Generate Button (above center panel) */}
					<div className="border-b border-gray-200 py-2 flex-shrink-0">
						<GenerateButton />
					</div>

					{/* Center Panel Tabs (Chat/Output) */}
					<div className="flex-1 overflow-hidden">
						<CenterPanelTabs />
					</div>
				</div>

				{/* Resize handle between center and right panels */}
				<ResizeHandle panelId="right-panel" direction="left" />

				{/* Right Sidebar (Saved Items Panel) - Collapsible & Resizable */}
				<div
					id="right-panel"
					className="transition-all duration-300 flex-shrink-0 h-full overflow-hidden"
					style={{
						width: "var(--right-panel-width, 280px)",
						minWidth: "60px",
						maxWidth: "400px",
					}}
				>
					<SavedItemsPanel />
				</div>
			</div>

			{/* Add global styles for resize handles */}
			<style jsx global>{`
				:root {
					--left-panel-width: 260px;
					--right-panel-width: 280px;
				}

				/* Make resize handles easier to grab */
				.cursor-col-resize {
					cursor: col-resize !important;
				}

				/* Prevent text selection during resize */
				.user-select-none {
					user-select: none !important;
				}

				/* Smooth transitions for panel resizing */
				#left-panel,
				#right-panel {
					transition: width 50ms ease;
				}

				/* When actively resizing, disable transition */
				body[data-resizing="true"] #left-panel,
				body[data-resizing="true"] #right-panel {
					transition: none;
				}
			`}</style>
		</MainLayout>
	);
}
