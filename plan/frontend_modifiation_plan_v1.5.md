# AI Study Companion: Frontend Implementation Plan

This plan outlines the steps to refine the frontend based on the project analysis and the requirements specified in `frontend_modification.pdf`.

## Phase 1: Backend Adjustments & Core Layout Refactoring

This phase focuses on necessary backend changes and restructuring the main frontend layout.

**1. Backend Adjustments (Prerequisites):**

* **File Uploads (`POST /sources`):** Implement mandatory automatic renaming for duplicate file uploads (e.g., `filename(1).pdf`). Update `app/api/sources.py` and potentially `app/services/file_storage.py`.
* **History Saving (`POST /history`):** Enhance this endpoint (or create a new one, e.g., `POST /notes`) to save individual chat messages or generated notes. Allow optional custom naming and associate saved items with the relevant `summary_id` or `source_ids`. Update `app/api/history.py`, `app/crud/history.py`, and `app/models/history.py` schema if needed.
* **Markmap Output (`POST /process` Task):** Ensure the background task in `app/api/process.py` (specifically `process_documents_background` calling `app/langchain_agent/agent.py`) generates Markdown compatible with `markmap.js`. The response from `GET /process/results/{task_id}` should contain this format.

**2. Frontend Layout Overhaul:**

* **Main Layout (`src/app/page.tsx`):**
    * Replace the current three-panel structure.
    * Implement a **Left Sidebar** (`SourcesList`) that is collapsible.
    * Implement a **Center Panel** using a new tab component to switch between "Chat" (`ChatInterface`) and "Output" (`OutputPanel`).
    * Implement a **Right Sidebar** (`SavedNotesPanel.tsx` - new component) that is collapsible.
* **Collapsible Sidebars:**
    * Add UI buttons and state logic (e.g., in `src/lib/store/uiStore.ts`) to manage the collapsed/expanded state for both the Left and new Right sidebars. Update `SourcesList` and create `SavedNotesPanel.tsx`.
* **Saved Notes Panel (`SavedNotesPanel.tsx` - New):**
    * Fetch saved notes/history using the enhanced `GET /history` endpoint.
    * Display saved items, potentially with options to view details or rename (requires backend support for renaming).
* **Generate Button (`src/components/GenerateButton.tsx`):**
    * Relocate this component in `src/app/page.tsx` so it appears *above* the new Center (Tabbed) Panel.

**3. Sources List Enhancements:**

* **Source Item (`src/components/sources/SourceItem.tsx`):**
    * Replace the generic icon with a specific PDF icon.
    * Implement filename truncation using CSS (`text-overflow: ellipsis;`) for long names. Ensure the checkbox remains fully visible and clickable.
* **Upload Button (`src/components/sources/UploadButton.tsx`):**
    * Remove the radio buttons for duplicate file handling choice. Rely entirely on the backend's auto-rename logic.

**4. Height & Scrollbars (Initial Setup):**

* Apply fixed heights to the sidebars and the center panel container using Tailwind CSS classes.
* Set up initial overflow/scrollbar rules (e.g., `overflow-y-auto` for vertical scrolling).

## Phase 2: Chat & Saving Functionality

This phase enhances the chat interface and integrates the note-saving feature.

**1. Chat Interface (`src/components/chat/ChatInterface.tsx`):**

* Adapt the component to fit within the new tabbed Center Panel structure.
* *Optional:* Implement internal sub-tabs ("Chat QA" / "Saved Notes") if desired, though the primary saved notes view will be the Right Sidebar.

**2. Chat Message Saving (`src/components/chat/ChatMessage.tsx`):**

* Add a "Save" button (e.g., an icon button) to each message bubble (user and AI).
* **Save Logic:**
    * On "Save" click, trigger an API call to the backend endpoint (`POST /history` or `POST /notes`).
    * Optionally, implement a small modal or inline input to allow the user to provide a custom name before saving.
    * Provide visual feedback (loading indicators, success/error messages).
    * Dynamically update the `SavedNotesPanel` (Right Sidebar) by refetching or adding the newly saved item to the local state.

**3. Contextual Chat:**

* Ensure that when sending chat messages (via the form submission in `ChatInterface.tsx`), the currently selected `selectedSourceIds` from `sourceStore` are included in the payload to the backend API. This allows the backend AI to potentially focus its response on the selected documents (requires backend logic to utilize these IDs).

## Phase 3: Output Panel & Mindmap Integration

This phase focuses on correctly displaying the generated notes and integrating the Markmap visualization.

**1. Output Panel (`src/components/output/OutputPanel.tsx`):**

* Refine styling for its new position within a tab.
* Ensure `NotesView` and `MindmapView` components correctly handle scrollbars as per requirements (vertical scroll enabled, horizontal scroll only for `NotesView`'s Markdown content).

**2. Mindmap View (`src/components/output/MindmapView.tsx`):**

* Install and import the `markmap-view` library or necessary Markmap dependencies.
* Fetch the Markmap-compatible Markdown string from the `taskStore` (updated when the `/process/results/{task_id}` polling completes).
* Use the Markmap library's functions to render the Markdown string as an interactive mindmap within the component. Ensure it supports panning and zooming.

## Phase 4: Final Polish & Testing

This phase involves refining the UI/UX and ensuring application stability.

**1. Styling & UI Refinements:**

* Apply consistent Tailwind CSS styling across all new and modified components.
* Ensure fixed heights and scrollbar behaviors are correctly implemented as per `frontend_modification.pdf`.
* Verify UI responsiveness and behavior during panel collapse/expand actions.

**2. State Management (`src/lib/store/`):**

* Review and update Zustand stores (`uiStore`, `taskStore`, `sourceStore`, potentially a new one for saved notes) to accurately reflect the application state, including sidebar visibility, active tabs, etc.

**3. Testing:**

* **Component Testing:** Test individual components in isolation where applicable.
* **Integration Testing:** Verify interactions between components (e.g., source selection enabling Generate button, saving chat updating Saved Notes panel).
* **End-to-End Testing:** Test the full user flows:
    * Uploading files (including duplicates).
    * Selecting sources.
    * Generating notes/mindmap.
    * Switching between Notes and Mindmap views.
    * Interacting with the chat.
    * Saving chat messages/notes.
    * Viewing/managing saved notes.
    * Collapsing/expanding sidebars.
    * Error handling (API errors, file errors).

