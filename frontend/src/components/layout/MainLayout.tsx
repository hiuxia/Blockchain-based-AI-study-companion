"use client";
import React, { useEffect } from "react";
import { Header } from "./Header";

interface MainLayoutProps {
	children: React.ReactNode;
}

export const MainLayout: React.FC<MainLayoutProps> = ({ children }) => {
	// Set CSS variable for viewport height to handle mobile browsers better
	useEffect(() => {
		const setViewportHeight = () => {
			const vh = window.innerHeight * 0.01;
			document.documentElement.style.setProperty("--vh", `${vh}px`);
		};

		// Set initial value
		setViewportHeight();

		// Update on resize
		window.addEventListener("resize", setViewportHeight);

		return () => {
			window.removeEventListener("resize", setViewportHeight);
		};
	}, []);

	return (
		<div
			className="flex flex-col h-screen"
			style={{ height: "calc(var(--vh, 1vh) * 100)" }}
		>
			<Header title="AI Study Companion" />
			<div className="flex flex-1 overflow-hidden">{children}</div>
		</div>
	);
};
