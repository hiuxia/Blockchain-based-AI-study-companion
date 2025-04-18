"use client";
import React from "react";

interface ChatMessageProps {
	message: string;
	isUser: boolean;
	reference?: string;
}

export const ChatMessage: React.FC<ChatMessageProps> = ({
	message,
	isUser,
	reference,
}) => {
	return (
		<div className={`my-2 ${isUser ? "ml-auto" : "mr-auto"}`}>
			<div
				className={`rounded-lg px-4 py-2 max-w-xs md:max-w-md lg:max-w-lg ${
					isUser
						? "bg-blue-500 text-white"
						: "bg-gray-100 text-gray-800"
				}`}
			>
				<p>{message}</p>
				{reference && (
					<span className="text-xs text-blue-200 mt-1 block">
						[{reference}]
					</span>
				)}
			</div>
		</div>
	);
};
