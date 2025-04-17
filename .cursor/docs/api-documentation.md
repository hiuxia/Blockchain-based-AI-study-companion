# Backend API Documentation

**Note:** This document is the single source of truth for the backend API. It must be kept up-to-date whenever the API changes.

## Base URL

`http://localhost:8000/api` (Development)
`[Production URL]` (Production)

---

## File Management (`/sources`)

### 1. Upload PDF File(s)

- **Endpoint:** `POST /sources/upload`
- **Description:** Uploads one or more PDF files.
- **Request:** `multipart/form-data` containing `files` field (list of files).
- **Constraints:** PDF only, Max 50MB per file.
- **Success Response (200 OK):**

  ```json
  [
    "source-id-1",
    "source-id-2"
  ]


Error Responses:
413 Request Entity Too Large: File size exceeds limit.
400 Bad Request: Non-PDF file type detected or other validation error.
500 Internal Server Error: Server-side processing error.
2. Get Uploaded Files List
Endpoint: GET /sources
Description: Retrieves a paginated list of uploaded files.
Query Parameters:
skip (int, optional, default: 0): Number of records to skip.
limit (int, optional, default: 100): Maximum number of records to return.
Success Response (200 OK):
[
  {
    "id": "string (uuid)",
    "filename": "string",
    "content_type": "application/pdf",
    "created_at": "string (datetime isoformat)"
  }
  // ... more source objects
]

Error Responses:
500 Internal Server Error
3. Delete File
Endpoint: DELETE /sources/{source_id}
Description: Deletes a specific uploaded file by its ID.
Path Parameter: source_id (string, uuid).
Success Response (200 OK):
{
  "message": "Source deleted"
}

Error Responses:
404 Not Found: Source with the given ID does not exist.
500 Internal Server Error: Deletion failed on the server.
Processing Tasks (/process)
4. Start Mindmap Generation Task
Endpoint: POST /process
Description: Initiates an asynchronous task to process selected source files and generate a mindmap/summary.
Request Body (application/json):
{
  "source_ids": ["string (uuid)", "..."], // List of source IDs to process
  "llm_model": "string" // Optional? Default? e.g., "gemini-flash"
}

Success Response (202 Accepted):
{
  "task_id": "string (uuid)" // ID to use for polling status
}

Error Responses:
404 Not Found: One or more source_ids do not exist.
400 Bad Request: Invalid request body.
500 Internal Server Error: Failed to create the task.
5. Query Task Status and Result
Endpoint: GET /process/results/{task_id}
Description: Retrieves the status and, if completed, the result of a processing task. Intended for polling.
Path Parameter: task_id (string, uuid).
Success Response (200 OK):
// Example: Pending
{
  "task_id": "string (uuid)",
  "status": "pending",
  "result": null
}

// Example: Processing
{
  "task_id": "string (uuid)",
  "status": "processing",
  "result": null
}

// Example: Completed
{
  "task_id": "string (uuid)",
  "status": "completed",
  "result": {
    "markdown": "string (Generated Markdown content)",
    "summary_id": "string (uuid)", // ID to fetch full summary object if needed
    "created_at": "string (datetime isoformat)"
  }
}

// Example: Failed
{
  "task_id": "string (uuid)",
  "status": "failed",
  "result": { // Or result might be null, include error details
      "error": "string (Description of the error)"
  }
}

Error Responses:
404 Not Found: Task with the given ID does not exist.
Summary Results (/summaries)
6. Get Generated Markdown Content
Endpoint: GET /summaries/{summary_id}
Description: Retrieves the full summary record, including the Markdown content, by its ID.
Path Parameter: summary_id (string, uuid, obtained from a completed task result).
Success Response (200 OK):
{
  "id": "string (uuid)",
  "source_ids": ["string (uuid)", "..."], // IDs of sources used for this summary
  "markdown": "string (Generated Markdown content)",
  "created_at": "string (datetime isoformat)"
}

Error Responses:
404 Not Found: Summary with the given ID does not exist
---

**Filename:** `docs/markdown-examples.md`

```markdown
# Markdown Formatting Examples for Markmap

## Desired Structure (Using Nested Lists - Preferred)

```markdown
- **Main Topic: Photosynthesis**
  - **Overview**
    - Definition: Process by which plants convert light to chemical energy.
    - Importance: Fundamental to the food chain, produces oxygen.
  - **Stages**
    - **Light-dependent Reactions**
      - Location: Thylakoid membranes.
      - Products: ATP and NADPH.
      - Inputs: Light, Water.
    - **Light-independent Reactions (Calvin Cycle)**
      - Location: Stroma.
      - Inputs: CO2, ATP, NADPH.
      - Output: Glucose.
  - **Factors Affecting Rate**
    - Light Intensity
    - Carbon Dioxide Concentration
    - Temperature


Alternative Structure (Using Headings)
# Photosynthesis

## Overview
- Definition: Process by which plants convert light to chemical energy.
- Importance: Fundamental to the food chain, produces oxygen.

## Stages

### Light-dependent Reactions
- Location: Thylakoid membranes.
- Products: ATP and NADPH.
- Inputs: Light, Water.

### Light-independent Reactions (Calvin Cycle)
- Location: Stroma.
- Inputs: CO2, ATP, NADPH.
- Output: Glucose.

## Factors Affecting Rate
- Light Intensity
- Carbon Dioxide Concentration
- Temperature


Undesired Formatting (Too Flat, Lacks Hierarchy)
Photosynthesis is the process by which plants convert light to chemical energy. It's important for the food chain. It has two stages. Light-dependent reactions happen in thylakoids and make ATP/NADPH from light and water. Light-independent reactions (Calvin Cycle) happen in the stroma using CO2, ATP, NADPH to make glucose. Rate depends on light, CO2, and temperature.


Filename: docs/templates/zustand-store-template.ts
import { create } from 'zustand';
import { immer } from 'zustand/middleware/immer'; // Optional: if using Immer

// Define the interface for the store's state
interface MyStoreState {
  count: number;
  data: string | null;
  isLoading: boolean;
  // Add other state properties here
}

// Define the interface for the store's actions
interface MyStoreActions {
  increment: () => void;
  decrement: (amount: number) => void;
  fetchData: () => Promise<void>;
  reset: () => void;
  // Add other action signatures here
}

// Define the initial state
const initialState: MyStoreState = {
  count: 0,
  data: null,
  isLoading: false,
};

// Create the Zustand store
export const useMyStore = create<MyStoreState & MyStoreActions>()(
  // Optional: Wrap with immer if you want to mutate state directly
  // immer((set, get) => ({
  (set, get) => ({
    ...initialState,

    // --- Actions ---

    increment: () => {
      set((state) => { state.count += 1; }); // Immer syntax
      // OR: set((state) => ({ count: state.count + 1 })); // Standard syntax
    },

    decrement: (amount) => {
      set((state) => ({ count: state.count - amount })); // Standard syntax is fine here
    },

    fetchData: async () => {
      set({ isLoading: true });
      try {
        // const response = await apiClient.fetchMyData(); // Replace with actual API call
        const mockData = await new Promise<string>(resolve => setTimeout(() => resolve('Mock data fetched!'), 1000));
        set({ data: mockData, isLoading: false });
      } catch (error) {
        console.error('Failed to fetch data:', error);
        set({ isLoading: false, data: null }); // Handle error state
      }
    },

    reset: () => {
      set(initialState);
    },

    // Implement other actions here
  })
  // ) // Close immer wrapper if used
);
