"use client";

import React, { useCallback, useEffect, useState } from "react";

interface ResizeHandleProps {
	panelId: string;
	direction: "left" | "right";
}

export const ResizeHandle: React.FC<ResizeHandleProps> = ({
	panelId,
	direction,
}) => {
	const [isResizing, setIsResizing] = useState(false);

	// Initialize CSS variable on component mount
	useEffect(() => {
		const panel = document.getElementById(panelId);
		if (panel) {
			const initialWidth = panel.offsetWidth;
			document.documentElement.style.setProperty(
				`--${panelId}-width`,
				`${initialWidth}px`
			);
		}

		// Clean up any leftover state when component unmounts
		return () => {
			document.body.removeAttribute("data-resizing");
			document.body.style.removeProperty("cursor");
			document.body.style.removeProperty("user-select");
		};
	}, [panelId]);

	const startResize = useCallback(
		(e: React.MouseEvent) => {
			e.preventDefault();

			// Store starting position and current width
			const panel = document.getElementById(panelId);
			if (!panel) return;

			const startX = e.clientX;
			const panelWidth = panel.offsetWidth;

			// Set global state for resizing
			setIsResizing(true);
			document.body.setAttribute("data-resizing", "true");
			document.body.style.cursor = "col-resize";
			document.body.style.userSelect = "none";
			document.body.classList.add("user-select-none");

			const handleMouseMove = (moveEvent: MouseEvent) => {
				moveEvent.preventDefault();

				const deltaX = moveEvent.clientX - startX;
				let newWidth;

				if (direction === "right") {
					newWidth = panelWidth + deltaX;
				} else {
					newWidth = panelWidth - deltaX;
				}

				// Apply minimum and maximum constraints
				const constrainedWidth = Math.max(
					60, // Min width
					Math.min(400, newWidth) // Max width
				);

				document.documentElement.style.setProperty(
					`--${panelId}-width`,
					`${constrainedWidth}px`
				);
			};

			const handleMouseUp = () => {
				setIsResizing(false);
				document.body.removeAttribute("data-resizing");
				document.body.style.removeProperty("cursor");
				document.body.style.removeProperty("user-select");
				document.body.classList.remove("user-select-none");

				document.removeEventListener("mousemove", handleMouseMove);
				document.removeEventListener("mouseup", handleMouseUp);
			};

			document.addEventListener("mousemove", handleMouseMove);
			document.addEventListener("mouseup", handleMouseUp);
		},
		[panelId, direction]
	);

	return (
		<div
			className={`
        w-1 hover:w-2 cursor-col-resize h-full
        ${isResizing ? "bg-blue-500 w-2 z-10" : "bg-gray-200 hover:bg-blue-500"}
        transition-colors duration-150 flex-shrink-0
      `}
			onMouseDown={startResize}
			title="Drag to resize"
		></div>
	);
};
