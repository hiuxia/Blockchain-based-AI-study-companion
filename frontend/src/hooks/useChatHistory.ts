import { useState } from "react";
import apiClient, { ConversationHistory } from "../lib/apiClient";

export function useChatHistory() {
	const [isLoading, setIsLoading] = useState(false);
	const [error, setError] = useState<Error | null>(null);
	const [histories, setHistories] = useState<ConversationHistory[]>([]);

	const fetchHistories = async () => {
		try {
			setIsLoading(true);
			setError(null);
			const result = await apiClient.history.getConversationHistories();
			setHistories(result);
		} catch (err) {
			setError(err instanceof Error ? err : new Error(String(err)));
		} finally {
			setIsLoading(false);
		}
	};

	const fetchHistory = async (historyId: string) => {
		try {
			setIsLoading(true);
			setError(null);
			const result = await apiClient.history.getConversationHistory(
				historyId
			);
			return result;
		} catch (err) {
			const error = err instanceof Error ? err : new Error(String(err));
			setError(error);
			return null;
		} finally {
			setIsLoading(false);
		}
	};

	const saveConversation = async (conversation: string) => {
		try {
			setIsLoading(true);
			setError(null);
			const result = await apiClient.history.saveConversation(
				conversation
			);

			// Update histories list with new conversation
			setHistories((prev) => [result, ...prev]);

			return result;
		} catch (err) {
			const error = err instanceof Error ? err : new Error(String(err));
			setError(error);
			return null;
		} finally {
			setIsLoading(false);
		}
	};

	return {
		histories,
		fetchHistories,
		fetchHistory,
		saveConversation,
		isLoading,
		error,
	};
}
