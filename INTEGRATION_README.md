# Frontend-Backend Integration

This document provides an overview of the integration between the frontend and backend components of the AI Study Companion project.

## Integration Plan

The integration is being implemented in phases according to the plan detailed in [frontend-backend-integration-plan.md](./frontend-backend-integration-plan.md).

### Current Progress

- ✅ **Phase 1: Core API Client Implementation** - Completed
  - Updated API client to match backend endpoints
  - Created custom hooks for API interactions
  - Updated Zustand stores

- 🔄 **Phase 2: Source Management Integration** - In Progress
  - File upload UI implementation
  - Source listing with backend data
  - Loading states and error handling

- 📅 **Phase 3: Document Processing Integration** - Planned
  - Integration of process polling
  - Generation button connection to backend
  - Status updates and result display

- 📅 **Phase 4: Output Display Integration** - Planned
  - Markdown rendering from backend data
  - Mindmap visualization implementation
  - Output format switching

- 📅 **Phase 5: Chat Interface Integration** - Planned
  - Conversation history from backend
  - Message sending and receiving
  - History browsing and management

## Implementation Details

### API Client

The API client (`frontend/src/lib/apiClient.ts`) implements all endpoints defined in the backend API documentation. It includes:

- Proper TypeScript interfaces for all response types
- Error handling for various HTTP status codes
- Special handling for form data uploads
- Helper methods for common request patterns

### Custom Hooks

We've implemented several custom hooks to interact with the API:

- `useFileUpload`: For uploading PDF files with progress tracking
- `useProcessPolling`: For polling task status during document processing
- `useChatHistory`: For managing conversation history

### State Management

The application uses Zustand for state management, with three main stores:

- `sourceStore`: Manages the list of available source files and selection state
- `taskStore`: Handles document processing tasks and results
- `uiStore`: Controls UI state like active tabs and display options

## Development

To work on the integration:

1. Start the backend server:
   ```bash
   cd backend
   uvicorn app.main:app --reload
   ```

2. Start the frontend development server:
   ```bash
   cd frontend
   npm run dev
   ```

3. Follow the prompt for the current phase in the `prompts` directory

## Testing

Each phase should be tested thoroughly before moving to the next phase. Specifically:

- Test all API interactions
- Verify error handling for various error cases
- Check loading states and UI responsiveness
- Ensure proper data flow between components

## Documentation

Implementation details are documented in:

- `phase1-implementation-summary.md`: Summary of Phase 1 implementation
- `project_status.md`: Current status of the overall project
- `prompts/phase2.md`: Implementation guide for Phase 2

Future phases will be documented as they are implemented. 