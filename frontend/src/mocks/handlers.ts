import { http, HttpResponse, delay } from "msw";

// In-memory storage for mock state
const mockStorage = {
	sources: [
		{
			id: "source-id-1",
			filename: "Effective-Python.pdf",
			content_type: "application/pdf",
			created_at: new Date().toISOString(),
		},
		{
			id: "source-id-2",
			filename: "c-api.pdf",
			content_type: "application/pdf",
			created_at: new Date().toISOString(),
		},
		{
			id: "source-id-3",
			filename: "extending.pdf",
			content_type: "application/pdf",
			created_at: new Date().toISOString(),
		},
		{
			id: "source-id-4",
			filename: "machine-learning-concepts.pdf",
			content_type: "application/pdf",
			created_at: new Date().toISOString(),
		},
		{
			id: "source-id-5",
			filename: "react-patterns.pdf",
			content_type: "application/pdf",
			created_at: new Date().toISOString(),
		},
	],
	tasks: new Map<
		string,
		{
			id: string;
			sourceIds: string[];
			status: "pending" | "processing" | "completed" | "failed";
			result: Record<string, unknown> | null;
			createdAt: string;
			callCount: number;
		}
	>(),
	summaries: new Map<
		string,
		{
			id: string;
			sourceIds: string[];
			markdown: string;
			createdAt: string;
		}
	>(),
};

// Base API URL
const API_BASE_URL = "http://localhost:8000/api";

// Utility to generate a mock UUID
const generateMockId = () => {
	return "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(
		/[xy]/g,
		function (c) {
			const r = (Math.random() * 16) | 0,
				v = c === "x" ? r : (r & 0x3) | 0x8;
			return v.toString(16);
		}
	);
};

// Sample markdown for mock responses
const SAMPLE_MARKDOWN = `
- **Main Topic: Programming Languages**
  - **Overview**
    - Definition: Tools for instructing computers.
    - Categories: Low-level vs high-level.
  - **Major Paradigms**
    - **Object-Oriented Programming**
      - Key Concepts: Encapsulation, inheritance, polymorphism.
      - Examples: Java, C++, Python.
    - **Functional Programming**
      - Key Concepts: Pure functions, immutability, higher-order functions.
      - Examples: Haskell, Lisp, JavaScript (partially).
  - **Popular Languages**
    - Python
    - JavaScript
    - Java
    - C/C++
    - Go
`;

// Mock API handlers
export const handlers = [
	// 1. Upload PDF File(s)
	http.post(`${API_BASE_URL}/sources/upload`, async ({ request }) => {
		await delay(1000); // Simulate network delay

		// Check if it's a FormData request
		if (
			request.headers.get("Content-Type")?.includes("multipart/form-data")
		) {
			// Simulate successful file upload
			const mockSourceIds = [generateMockId(), generateMockId()];

			// Random chance to simulate file size error
			if (Math.random() < 0.05) {
				return new HttpResponse(null, {
					status: 413,
					statusText: "Request Entity Too Large",
				});
			}

			// Random chance to simulate validation error
			if (Math.random() < 0.05) {
				return new HttpResponse(
					JSON.stringify({
						error: "Invalid file format. Only PDF files are allowed.",
					}),
					{
						status: 400,
						statusText: "Bad Request",
						headers: {
							"Content-Type": "application/json",
						},
					}
				);
			}

			return HttpResponse.json(mockSourceIds, { status: 200 });
		}

		return new HttpResponse(null, { status: 400 });
	}),

	// 2. Get Uploaded Files List
	http.get(`${API_BASE_URL}/sources`, async ({ request }) => {
		await delay(500); // Simulate network delay

		const url = new URL(request.url);
		const skip = parseInt(url.searchParams.get("skip") || "0");
		const limit = parseInt(url.searchParams.get("limit") || "100");

		// Return paginated results
		const paginatedSources = mockStorage.sources.slice(skip, skip + limit);

		return HttpResponse.json(paginatedSources, { status: 200 });
	}),

	// 3. Delete File
	http.delete(`${API_BASE_URL}/sources/:sourceId`, async ({ params }) => {
		await delay(500); // Simulate network delay
		const { sourceId } = params;

		// Check if source exists
		const sourceIndex = mockStorage.sources.findIndex(
			(s) => s.id === sourceId
		);

		if (sourceIndex === -1) {
			return new HttpResponse(
				JSON.stringify({ error: "Source not found" }),
				{
					status: 404,
					statusText: "Not Found",
					headers: {
						"Content-Type": "application/json",
					},
				}
			);
		}

		// Remove the source
		mockStorage.sources = mockStorage.sources.filter(
			(s) => s.id !== sourceId
		);

		return HttpResponse.json(
			{ message: "Source deleted" },
			{ status: 200 }
		);
	}),

	// 4. Start Mindmap Generation Task
	http.post(`${API_BASE_URL}/process`, async ({ request }) => {
		await delay(1000); // Simulate network delay

		try {
			const body = await request.json();
			const { source_ids } = body as {
				source_ids: string[];
				llm_model?: string;
			};

			// Validate source_ids exist
			const validSourceIds = source_ids.filter((id) =>
				mockStorage.sources.some((s) => s.id === id)
			);

			if (validSourceIds.length !== source_ids.length) {
				return new HttpResponse(
					JSON.stringify({
						error: "One or more source IDs do not exist",
					}),
					{
						status: 404,
						statusText: "Not Found",
						headers: {
							"Content-Type": "application/json",
						},
					}
				);
			}

			// Create a new task
			const taskId = generateMockId();

			mockStorage.tasks.set(taskId, {
				id: taskId,
				sourceIds: source_ids,
				status: "pending",
				result: null,
				createdAt: new Date().toISOString(),
				callCount: 0,
			});

			return HttpResponse.json({ task_id: taskId }, { status: 202 });
		} catch {
			return new HttpResponse(
				JSON.stringify({ error: "Invalid request body" }),
				{
					status: 400,
					statusText: "Bad Request",
					headers: {
						"Content-Type": "application/json",
					},
				}
			);
		}
	}),

	// 5. Query Task Status and Result
	http.get(`${API_BASE_URL}/process/results/:taskId`, async ({ params }) => {
		await delay(800); // Simulate network delay

		const { taskId } = params;
		const task = mockStorage.tasks.get(taskId as string);

		if (!task) {
			return new HttpResponse(
				JSON.stringify({ error: "Task not found" }),
				{
					status: 404,
					statusText: "Not Found",
					headers: {
						"Content-Type": "application/json",
					},
				}
			);
		}

		// Increment call count to simulate task progression
		task.callCount += 1;

		// Update task status based on call count
		if (task.callCount <= 2) {
			task.status = "pending";
		} else if (task.callCount <= 5) {
			task.status = "processing";
		} else {
			// 10% chance of failure
			if (task.status !== "completed" && task.status !== "failed") {
				if (Math.random() < 0.1) {
					task.status = "failed";
					task.result = { error: "Mock processing failed" };
				} else {
					task.status = "completed";
					const summaryId = generateMockId();

					// Create mock summary
					mockStorage.summaries.set(summaryId, {
						id: summaryId,
						sourceIds: task.sourceIds,
						markdown: SAMPLE_MARKDOWN,
						createdAt: new Date().toISOString(),
					});

					task.result = {
						markdown: SAMPLE_MARKDOWN,
						summary_id: summaryId,
						created_at: new Date().toISOString(),
					};
				}
			}
		}

		mockStorage.tasks.set(taskId as string, task);

		return HttpResponse.json({
			task_id: taskId,
			status: task.status,
			result: task.result,
		});
	}),

	// 6. Get Generated Markdown Content
	http.get(`${API_BASE_URL}/summaries/:summaryId`, async ({ params }) => {
		await delay(500); // Simulate network delay

		const { summaryId } = params;
		const summary = mockStorage.summaries.get(summaryId as string);

		if (!summary) {
			return new HttpResponse(
				JSON.stringify({ error: "Summary not found" }),
				{
					status: 404,
					statusText: "Not Found",
					headers: {
						"Content-Type": "application/json",
					},
				}
			);
		}

		return HttpResponse.json({
			id: summary.id,
			source_ids: summary.sourceIds,
			markdown: summary.markdown,
			created_at: summary.createdAt,
		});
	}),
];
