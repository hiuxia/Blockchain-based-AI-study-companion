# Phase 2 Implementation Prompt: Source Management Integration

## Background
We have completed Phase 1 of the frontend-backend integration for the AI Study Companion project, which involved updating the API client and creating custom hooks. Now we need to implement Phase 2, which focuses on integrating the Source Management functionality with the real backend API.

## Task Overview
Your task is to implement the Source Management Integration (Phase 5 in the project status document) by:
1. Creating and updating UI components for file upload with progress indicators
2. Updating the sources list to fetch data from the API
3. Adding appropriate loading states and error handling to the UI

## Getting Started
First, familiarize yourself with the current codebase structure and the progress made so far:

```bash
# List the main project directories
list_dir frontend/src
list_dir frontend/src/components
list_dir frontend/src/lib
list_dir frontend/src/hooks

# Examine the project status for context
read_file project_status.md

# Review the implementation summary from Phase 1
read_file phase1-implementation-summary.md

# Check the integration plan for details on Phase 2
read_file frontend-backend-integration-plan.md
```

## Key Files to Understand
Review these files to understand what we've implemented so far:

```bash
# API Client and Types
read_file frontend/src/lib/apiClient.ts

# File Upload Hook
read_file frontend/src/hooks/useFileUpload.ts 

# Source Store
read_file frontend/src/lib/store/sourceStore.ts

# Current Source Components
read_file frontend/src/components/sources/SourcesList.tsx
read_file frontend/src/components/sources/SourceItem.tsx
```

## Implementation Tasks

### 1. Create File Upload Button Component
Create a new component `UploadButton.tsx` in the `frontend/src/components/sources` directory that:
- Uses the `useFileUpload` hook for file selection and upload
- Displays upload progress
- Shows validation errors 
- Integrates with the source store to update the list after successful upload

### 2. Update Sources List Component
Update the `SourcesList.tsx` component to:
- Fetch sources from the API when the component mounts
- Display a loading indicator while fetching
- Show appropriate error messages if fetch fails
- Render the list of sources with correct data format
- Include the new UploadButton component

### 3. Update Source Item Component
Update the `SourceItem.tsx` component to:
- Match the SourceFile interface from the API
- Display filename, file type, and possibly upload date
- Handle selection toggle correctly

### 4. Implement Error Handling and Loading States
Ensure that:
- All API requests show appropriate loading states
- Error messages are displayed in a user-friendly way
- The UI is responsive during long-running operations

## Testing Your Implementation
After implementing these features, test them by:
1. Starting the backend server
2. Starting the frontend development server
3. Uploading PDF files through the UI
4. Verifying that files appear in the sources list
5. Testing error cases (wrong file type, large files, network errors)

## Deliverables
- Updated or new components for file upload and source management
- Integration with backend API for source listing and file upload
- Proper error handling and loading states in the UI
- Documentation of any issues encountered or decisions made

## Resources
Refer to the following documents for guidance:
- API documentation in `.cursor/docs/API_DOC.md`
- Frontend-backend integration plan
- React hooks documentation for useEffect and other relevant hooks
- Zustand documentation for state management patterns

## Notes on API Endpoints
The relevant API endpoints for this phase are:
- `GET /sources` - List all sources
- `POST /sources` - Upload a new source file
- `GET /sources/{source_id}` - Get details of a specific source

Remember that all API calls should use the updated `apiClient.ts` with proper error handling. 