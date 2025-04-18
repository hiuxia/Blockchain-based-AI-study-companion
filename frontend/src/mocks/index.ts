// Ensure this file is only included during development
async function initMocks() {
	if (process.env.NODE_ENV === "development") {
		// Dynamically import the browser implementation
		const { worker } = await import("./browser");

		// Start the worker
		await worker.start({
			// Handling all unhandled requests silently (default behavior)
			onUnhandledRequest: "bypass",
		});

		console.log("[MSW] Mock API initialized");
	}
}

// Initialize MSW
initMocks().catch((error) => {
	console.error("[MSW] Failed to initialize mock service worker:", error);
});
