# Frontend-Backend Integration

This document provides an overview of the integration between the frontend and backend components of the AI Study Companion project.

## Integration Plan

The integration is being implemented in phases according to the plan detailed in [frontend-backend-integration-plan.md](./frontend-backend-integration-plan.md).

### Current Progress

- ✅ **Phase 1: Core API Client Implementation** - Completed
  - Updated API client to match backend endpoints
  - Created custom hooks for API interactions
  - Updated Zustand stores

- ✅ **Phase 2: Source Management Integration** - Completed
  - Implemented file upload UI with progress indicators
  - Connected source listing to backend data
  - Added loading states and error handling
  - Implemented file validation

- ✅ **Phase 3: Document Processing Integration** - Completed
  - Implemented process polling mechanism 
  - Connected generate button to backend API
  - Added status updates and improved error handling
  - Created unified task processing hook

- ✅ **Phase 4: Bug Fixes and UI Enhancements** - Completed
  - Fixed UI layout issues with component positioning
  - Implemented file duplication detection and handling
  - Enhanced error presentation for file-not-found errors
  - Updated model selection to current LLM options (Gemini 2, Llama 4)
  - Improved overall UI responsiveness

- 📅 **Phase 5: Output Display Integration** - Planned
  - Markdown rendering from backend data
  - Mindmap visualization implementation
  - Output format switching

- 📅 **Phase 6: Chat Interface Integration** - Planned
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

- `useFileUpload`: For uploading PDF files with progress tracking and duplicate handling
- `useProcessPolling`: For polling task status during document processing
- `useTaskProcessing`: Combines taskStore with polling for unified task management
- `useChatHistory`: For managing conversation history

### State Management

The application uses Zustand for state management, with three main stores:

- `sourceStore`: Manages the list of available source files and selection state
- `taskStore`: Handles document processing tasks and results
- `uiStore`: Controls UI state like active tabs and display options

## Bug Fixes

Several bugs have been fixed in the latest implementation:

1. **UI Layout Issues**: Fixed positioning of the Generate button and model selection
2. **File Duplication**: Implemented detection and handling of duplicate files with options to:
   - Automatically rename files (adding timestamp)
   - Skip duplicate uploads
3. **Error Handling**: Enhanced error handling for file-not-found errors with user-friendly messages

See [frontend/src/docs/bug-fixes-summary.md](./frontend/src/docs/bug-fixes-summary.md) for detailed information.

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
- `frontend/src/docs/phase2-implementation-summary.md`: Summary of Phase 2 implementation
- `frontend/src/docs/phase3-implementation-summary.md`: Summary of Phase 3 implementation
- `frontend/src/docs/bug-fixes-summary.md`: Summary of bug fixes implemented
- `project_status.md`: Current status of the overall project 