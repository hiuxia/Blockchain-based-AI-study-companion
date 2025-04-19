import { useState, useEffect, useRef } from "react";
import apiClient, { ProcessResult } from "../lib/apiClient";

export enum ProcessStatus {
	IDLE = "idle",
	POLLING = "polling",
	COMPLETED = "completed",
	FAILED = "failed",
}

interface UseProcessPollingOptions {
	taskId: string | null;
	pollingInterval?: number;
	maxAttempts?: number;
	onSuccess?: (result: ProcessResult) => void;
	onError?: (error: Error) => void;
}

export function useProcessPolling({
	taskId,
	pollingInterval = 2000,
	maxAttempts = 60, // 2 minutes at 2-second intervals
	onSuccess,
	onError,
}: UseProcessPollingOptions) {
	const [status, setStatus] = useState<ProcessStatus>(ProcessStatus.IDLE);
	const [result, setResult] = useState<ProcessResult | null>(null);
	const [error, setError] = useState<Error | null>(null);
	const attemptCountRef = useRef(0);
	const pollingTimeoutRef = useRef<number | null>(null);

	const clearPollingTimeout = () => {
		if (pollingTimeoutRef.current !== null) {
			window.clearTimeout(pollingTimeoutRef.current);
			pollingTimeoutRef.current = null;
		}
	};

	const startPolling = () => {
		if (!taskId) return;

		setStatus(ProcessStatus.POLLING);
		attemptCountRef.current = 0;

		const poll = async () => {
			if (attemptCountRef.current >= maxAttempts) {
				setStatus(ProcessStatus.FAILED);
				const timeoutError = new Error(
					`Polling exceeded maximum attempts (${maxAttempts})`
				);
				setError(timeoutError);
				if (onError) onError(timeoutError);
				return;
			}

			try {
				const response = await apiClient.process.getTaskResult(taskId);
				setResult(response);

				if (response.status === "completed") {
					setStatus(ProcessStatus.COMPLETED);
					if (onSuccess) onSuccess(response);
					return;
				} else if (response.status === "failed") {
					setStatus(ProcessStatus.FAILED);
					const apiError = new Error(
						response.error || "Task processing failed"
					);
					setError(apiError);
					if (onError) onError(apiError);
					return;
				}

				// Continue polling for pending/processing statuses
				attemptCountRef.current++;
				pollingTimeoutRef.current = window.setTimeout(
					poll,
					pollingInterval
				);
			} catch (err) {
				const error =
					err instanceof Error ? err : new Error(String(err));
				setError(error);
				setStatus(ProcessStatus.FAILED);
				if (onError) onError(error);
			}
		};

		poll();
	};

	const stopPolling = () => {
		clearPollingTimeout();
		setStatus(ProcessStatus.IDLE);
	};

	// Start polling when taskId changes
	useEffect(() => {
		if (taskId) {
			startPolling();
		} else {
			stopPolling();
		}

		return () => {
			clearPollingTimeout();
		};
	}, [taskId]);

	return {
		status,
		result,
		error,
		isPolling: status === ProcessStatus.POLLING,
		isCompleted: status === ProcessStatus.COMPLETED,
		isFailed: status === ProcessStatus.FAILED,
		startPolling,
		stopPolling,
	};
}
