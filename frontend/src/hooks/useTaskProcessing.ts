"use client";
import { useEffect } from "react";
import { useTaskStore } from "../lib/store/taskStore";
import { useProcessPolling, ProcessStatus } from "./useProcessPolling";

/**
 * A hook that combines the taskStore with the process polling hook
 * to provide a unified interface for task processing
 */
export function useTaskProcessing() {
	const {
		taskId,
		status,
		markdownResult,
		summaryId,
		error,
		startProcessing,
		setTaskResult,
		setError,
		resetTask,
	} = useTaskStore();

	// Only set up polling if we have a taskId
	const {
		status: pollingStatus,
		result: pollingResult,
		error: pollingError,
		isPolling,
	} = useProcessPolling({
		taskId,
		onSuccess: (result) => {
			if (result.result) {
				setTaskResult({
					markdown: result.result.markdown,
					summaryId: result.result.summary_id,
				});
			}
		},
		onError: (error) => {
			setError(error.message);
		},
	});

	// Sync polling status with task status
	useEffect(() => {
		if (!taskId) return;

		switch (pollingStatus) {
			case ProcessStatus.POLLING:
				// Already handled by taskStore
				break;
			case ProcessStatus.COMPLETED:
				if (pollingResult && pollingResult.result) {
					setTaskResult({
						markdown: pollingResult.result.markdown,
						summaryId: pollingResult.result.summary_id,
					});
				}
				break;
			case ProcessStatus.FAILED:
				if (pollingError) {
					setError(pollingError.message);
				}
				break;
		}
	}, [pollingStatus, pollingResult, pollingError, taskId]);

	return {
		taskId,
		status,
		markdownResult,
		summaryId,
		error,
		isPolling,
		startProcessing,
		resetTask,
	};
}
