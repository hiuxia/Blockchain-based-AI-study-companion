"use client";
import React from "react";
import { Header } from "./Header";

interface MainLayoutProps {
	children: React.ReactNode;
}

export const MainLayout: React.FC<MainLayoutProps> = ({ children }) => {
	return (
		<div className="flex flex-col min-h-screen bg-gray-50">
			<Header title="AI Study Companion" />
			<div className="flex flex-1 overflow-hidden">{children}</div>
		</div>
	);
};
