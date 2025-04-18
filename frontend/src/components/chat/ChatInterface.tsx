"use client";
import React, { useState } from "react";
import { ChatMessage } from "./ChatMessage";

export const ChatInterface: React.FC = () => {
	const [inputValue, setInputValue] = useState("");

	// Placeholder data for static UI
	const messages = [
		{
			id: 1,
			message: "In the thylakoid membranes.",
			isUser: false,
			reference: "1",
		},
		{ id: 2, message: "Thanks!", isUser: true },
		{ id: 3, message: "You're welcome!", isUser: false },
		{
			id: 4,
			message: "Tell me more about the Calvin Cycle.",
			isUser: true,
		},
		{
			id: 5,
			message: "The Calvin Cycle occurs in the stroma...",
			isUser: false,
			reference: "2",
		},
		{ id: 6, message: "What are the inputs?", isUser: true },
		{
			id: 7,
			message: "CO2, ATP, and NADPH.",
			isUser: false,
			reference: "3",
		},
	];

	const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
		setInputValue(e.target.value);
	};

	const handleSubmit = (e: React.FormEvent) => {
		e.preventDefault();
		// In a real app, this would send the message to a backend
		// For now, just clear the input
		if (inputValue.trim()) {
			setInputValue("");
		}
	};

	return (
		<div className="flex flex-col h-full">
			<div className="p-4 border-b border-gray-200">
				<h2 className="text-lg font-semibold text-gray-800">
					Ask Questions
				</h2>
			</div>

			<div className="flex-1 overflow-y-auto p-4 space-y-4">
				{messages.map((msg) => (
					<ChatMessage
						key={msg.id}
						message={msg.message}
						isUser={msg.isUser}
						reference={msg.reference}
					/>
				))}
			</div>

			<div className="p-4 border-t border-gray-200">
				<form onSubmit={handleSubmit} className="flex items-center">
					<input
						type="text"
						value={inputValue}
						onChange={handleInputChange}
						placeholder="Ask about the selected sources..."
						className="flex-1 rounded-l-md border border-gray-300 py-2 px-4 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
					/>
					<button
						type="submit"
						className="bg-blue-500 text-white px-4 py-2 rounded-r-md hover:bg-blue-600"
					>
						<svg
							className="w-5 h-5"
							fill="none"
							stroke="currentColor"
							viewBox="0 0 24 24"
							xmlns="http://www.w3.org/2000/svg"
						>
							<path
								strokeLinecap="round"
								strokeLinejoin="round"
								strokeWidth={2}
								d="M14 5l7 7m0 0l-7 7m7-7H3"
							/>
						</svg>
					</button>
				</form>
			</div>
		</div>
	);
};
