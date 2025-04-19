// src/mocks/browser.ts
// This file is only used in the browser

import { setupWorker } from "msw/browser";
import { handlers } from "./handlers";

// Export the worker directly
export const worker = setupWorker(...handlers);

// Export a utility to ensure we're in browser and start the worker
export const startWorker = async () => {
	if (typeof window !== "undefined") {
		return worker.start({
			onUnhandledRequest: "bypass",
		});
	}
	return Promise.resolve();
};
