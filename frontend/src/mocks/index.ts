// This should only be imported in development mode
if (process.env.NODE_ENV === "development") {
	// Only in browser environment
	if (typeof window !== "undefined") {
		// Start mock service worker
		import("./browser")
			.then(async ({ startWorker }) => {
				await startWorker();
				console.log("[MSW] Mock API initialized");
			})
			.catch((error) => {
				console.error(
					"[MSW] Failed to initialize mock service worker:",
					error
				);
			});
	}
}
