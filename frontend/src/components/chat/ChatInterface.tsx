"use client";
import React, { useState, useEffect, useRef } from "react";
import { ChatMessage } from "./ChatMessage";
import { useSourceStore } from "../../lib/store/sourceStore";
import { useUIStore } from "../../lib/store/uiStore";
import apiClient from "../../lib/apiClient";

interface Message {
	id: number;
	message: string;
	isUser: boolean;
	reference?: string;
}

// Helper to format references from API to display in the UI
const formatReferences = (references: string[]): string => {
	if (!references || references.length === 0) return "";
	return references.join(", ");
};

export const ChatInterface: React.FC = () => {
	const [inputValue, setInputValue] = useState("");
	const [messages, setMessages] = useState<Message[]>([
		{
			id: 1,
			message:
				"Welcome to AI Study Companion! Upload PDF files and select them to generate notes and ask questions.",
			isUser: false,
		},
	]);
	const [isLoading, setIsLoading] = useState(false);
	const { selectedSourceIds } = useSourceStore();
	const { llmModel } = useUIStore();

	// Reference to the messages container for scrolling
	const messagesEndRef = useRef<HTMLDivElement>(null);

	const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
		setInputValue(e.target.value);
	};

	const handleSubmit = async (e: React.FormEvent) => {
		e.preventDefault();
		if (inputValue.trim()) {
			// Add user message
			const newUserMessage = {
				id: Date.now(),
				message: inputValue.trim(),
				isUser: true,
			};

			setMessages((prevMessages) => [...prevMessages, newUserMessage]);
			setInputValue("");
			setIsLoading(true);

			try {
				// Check if sources are selected
				if (selectedSourceIds.length === 0) {
					// No sources selected, inform the user
					const noSourcesMessage = {
						id: Date.now() + 1,
						message:
							"It looks like you haven't selected any source documents. Please select one or more sources from the left panel to provide context for your questions.",
						isUser: false,
					};

					setMessages((prevMessages) => [
						...prevMessages,
						noSourcesMessage,
					]);
					setIsLoading(false);
					return;
				}

				// Call the backend API with selected source IDs
				console.log(
					"Sending question to API with sources:",
					selectedSourceIds
				);

				const response = await apiClient.qa.askQuestion({
					question: newUserMessage.message,
					source_ids: selectedSourceIds,
					llm_model: llmModel,
				});

				// Create AI response with references
				const aiResponse = {
					id: Date.now() + 1,
					message: response.answer,
					isUser: false,
					reference: formatReferences(response.references),
				};

				setMessages((prevMessages) => [...prevMessages, aiResponse]);
			} catch (error) {
				console.error("Chat error:", error);

				// Add error message
				setMessages((prevMessages) => [
					...prevMessages,
					{
						id: Date.now() + 1,
						message:
							"Sorry, I encountered an error processing your request. " +
							(error instanceof Error ? error.message : ""),
						isUser: false,
					},
				]);
			} finally {
				setIsLoading(false);
			}
		}
	};

	// Scroll to bottom when messages change
	useEffect(() => {
		messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
	}, [messages]);

	// Handle and process error messages in the UI
	useEffect(() => {
		const errorElements = document.querySelectorAll(
			'[class*="text-red-500"]'
		);

		errorElements.forEach((element) => {
			const errorText = element.textContent;
			if (
				errorText &&
				errorText.includes("File with ID") &&
				errorText.includes("not found")
			) {
				// Clear the error from UI if possible
				if (element.parentElement) {
					element.parentElement.style.display = "none";
				}

				// Add a helpful message to the chat instead
				const fileNotFoundMessage = {
					id: Date.now(),
					message:
						"There was an issue with the referenced file. Please try with a different source document.",
					isUser: false,
				};

				setMessages((prevMessages) => {
					// Avoid duplicate error messages
					if (
						!prevMessages.some(
							(msg) => msg.message === fileNotFoundMessage.message
						)
					) {
						return [...prevMessages, fileNotFoundMessage];
					}
					return prevMessages;
				});
			}
		});
	}, []);

	return (
		<div className="flex flex-col h-full bg-gray-50">
			<div className="flex-1 overflow-y-auto p-4 space-y-4">
				{messages.map((msg) => (
					<ChatMessage
						key={msg.id}
						message={msg.message}
						isUser={msg.isUser}
						reference={msg.reference}
					/>
				))}
				<div ref={messagesEndRef} /> {/* Scroll anchor */}
			</div>

			<div className="p-4 border-t border-gray-200 bg-white flex-shrink-0 sticky bottom-0">
				<form onSubmit={handleSubmit} className="flex items-center">
					<input
						type="text"
						value={inputValue}
						onChange={handleInputChange}
						placeholder={
							selectedSourceIds.length > 0
								? "Ask about the selected sources..."
								: "Select sources first, then ask questions..."
						}
						className="flex-1 rounded-l-md border border-gray-300 py-2 px-4 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
						disabled={isLoading}
					/>
					<button
						type="submit"
						className="bg-blue-500 text-white px-4 py-2 rounded-r-md hover:bg-blue-600 disabled:bg-blue-300"
						disabled={
							!inputValue.trim() ||
							isLoading ||
							selectedSourceIds.length === 0
						}
					>
						{isLoading ? (
							<svg
								className="animate-spin h-5 w-5 text-white"
								xmlns="http://www.w3.org/2000/svg"
								fill="none"
								viewBox="0 0 24 24"
							>
								<circle
									className="opacity-25"
									cx="12"
									cy="12"
									r="10"
									stroke="currentColor"
									strokeWidth="4"
								></circle>
								<path
									className="opacity-75"
									fill="currentColor"
									d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
								></path>
							</svg>
						) : (
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
						)}
					</button>
				</form>

				{selectedSourceIds.length > 0 ? (
					<div className="mt-2 text-xs text-gray-500">
						{selectedSourceIds.length === 1
							? "1 source selected"
							: `${selectedSourceIds.length} sources selected`}{" "}
						· Using {llmModel}
					</div>
				) : (
					<div className="mt-2 text-xs text-amber-500">
						No sources selected. Select documents from the left
						panel first.
					</div>
				)}
			</div>
		</div>
	);
};
