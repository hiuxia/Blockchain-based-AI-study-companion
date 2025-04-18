"use client";
import React from "react";

interface HeaderProps {
	title: string;
}

export const Header: React.FC<HeaderProps> = ({ title }) => {
	return (
		<header className="w-full py-6 px-4 border-b border-gray-200">
			<h1 className="text-xl font-semibold text-gray-800">{title}</h1>
		</header>
	);
};
