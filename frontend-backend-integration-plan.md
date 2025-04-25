# Frontend-Backend Integration Implementation Plan

This document outlines the plan for implementing the necessary frontend functionality that interacts with the backend API to achieve the project's goals. Based on the project status and API documentation, we'll focus on transitioning from mock implementation to real backend integration.

## Current Status

- Static UI components have been implemented
- State management with Zustand has been set up (sourceStore, taskStore, uiStore)
- Mock API implementation is in place using MSW

## Required Frontend Functions and API Integration

### 1. File Upload and Source Management

#### 1.1 Update API Client (Priority: High)

**Current State:** Basic API client structure exists but needs alignment with actual backend endpoints.

**Tasks:**
- [ ] Update `apiClient.ts` to match the exact endpoint structure in API_DOC.md
- [ ] Implement proper error handling for all API responses
- [ ] Update TypeScript interfaces to match API response structures

```typescript
// Example update to align with API_DOC.md
export const sourcesApi = {
  uploadSource: async (file: File): Promise<Source> => {
    const formData = new FormData();
    formData.append('file', file);
    
    return fetchApi<Source>('/sources', {
      method: 'POST',
      headers: {
        // Remove Content-Type to let browser set it with boundary
      },
      body: formData,
    });
  },
  
  getSources: async (): Promise<Source[]> => {
    return fetchApi<Source[]>('/sources');
  },
  
  getSource: async (sourceId: string): Promise<Source> => {
    return fetchApi<Source>(`/sources/${sourceId}`);
  },
};
```

#### 1.2 Create File Upload Hook (Priority: High)

**Current State:** Not implemented.

**Tasks:**
- [ ] Create `useFileUpload` hook in `src/hooks/useFileUpload.ts`
- [ ] Implement file validation (PDF only, size limits)
- [ ] Add upload progress tracking
- [ ] Handle success and error states

```typescript
export function useFileUpload() {
  const [isUploading, setIsUploading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState<Error | null>(null);
  
  const uploadFile = async (file: File): Promise<Source | null> => {
    try {
      setIsUploading(true);
      setProgress(0);
      setError(null);
      
      // Validate file
      if (file.type !== 'application/pdf') {
        throw new Error('Only PDF files are supported');
      }
      
      // Upload with apiClient
      const result = await apiClient.sources.uploadSource(file);
      return result;
    } catch (err) {
      setError(err instanceof Error ? err : new Error(String(err)));
      return null;
    } finally {
      setIsUploading(false);
    }
  };
  
  return { uploadFile, isUploading, progress, error };
}
```

#### 1.3 Update Source Store (Priority: High)

**Current State:** Using mock data with hardcoded sources.

**Tasks:**
- [ ] Update `sourceStore.ts` to fetch sources from API
- [ ] Implement CRUD operations for sources
- [ ] Add loading states for API operations

```typescript
interface SourceState {
  // State
  sources: Source[];
  selectedSourceIds: string[];
  isLoading: boolean;
  error: string | null;

  // Actions
  fetchSources: () => Promise<void>;
  uploadSource: (file: File) => Promise<void>;
  toggleSelectSource: (id: string) => void;
  selectAllSources: () => void;
  clearSelection: () => void;
}

export const useSourceStore = create<SourceState>((set, get) => ({
  // Initial state
  sources: [],
  selectedSourceIds: [],
  isLoading: false,
  error: null,

  // Actions
  fetchSources: async () => {
    try {
      set({ isLoading: true, error: null });
      const sources = await apiClient.sources.getSources();
      set({ 
        sources, 
        isLoading: false 
      });
    } catch (err) {
      set({ 
        error: err instanceof Error ? err.message : String(err),
        isLoading: false 
      });
    }
  },
  
  uploadSource: async (file) => {
    try {
      set({ isLoading: true, error: null });
      const newSource = await apiClient.sources.uploadSource(file);
      set(state => ({ 
        sources: [...state.sources, newSource],
        isLoading: false 
      }));
    } catch (err) {
      set({ 
        error: err instanceof Error ? err.message : String(err),
        isLoading: false 
      });
    }
  },
  
  // Existing toggle, select, clear actions...
}));
```

#### 1.4 Update Sources Component (Priority: Medium)

**Current State:** The component reads from sourceStore but doesn't handle real API interactions.

**Tasks:**
- [ ] Add file upload UI component
- [ ] Implement useEffect to fetch sources on component mount
- [ ] Add loading indicators and error messages
- [ ] Implement file drag-and-drop functionality

### 2. Document Processing

#### 2.1 Create Process Polling Hook (Priority: High)

**Current State:** Not implemented.

**Tasks:**
- [ ] Create `useProcessPolling` hook in `src/hooks/useProcessPolling.ts` based on the template
- [ ] Implement polling logic to check task status at regular intervals
- [ ] Handle all possible task states (pending, processing, completed, failed)

```typescript
// Implementation based on template-process-polling.mdc
```

#### 2.2 Update Task Store (Priority: High)

**Current State:** Task store exists but uses mock data and doesn't interact with the API.

**Tasks:**
- [ ] Update `taskStore.ts` to use the API client for processing tasks
- [ ] Integrate with the polling hook for task status updates
- [ ] Properly handle and store processing results

```typescript
interface TaskState {
  // State
  taskId: string | null;
  status: TaskStatus;
  markdownResult: string | null;
  summaryId: string | null;
  error: string | null;
  isPolling: boolean;

  // Actions
  startProcessing: (sourceIds: string[], llmModel?: string) => Promise<void>;
  checkTaskStatus: (taskId: string) => Promise<void>;
  setTaskResult: (result: TaskResult) => void;
  setError: (error: string) => void;
  resetTask: () => void;
}

export const useTaskStore = create<TaskState>((set, get) => ({
  // Initial state
  taskId: null,
  status: "idle",
  markdownResult: null,
  summaryId: null,
  error: null,
  isPolling: false,

  // Actions
  startProcessing: async (sourceIds, llmModel = "gemini-flash") => {
    try {
      set({
        status: "pending",
        markdownResult: null,
        summaryId: null,
        error: null
      });
      
      const response = await apiClient.process.startProcessing(sourceIds, llmModel);
      set({
        taskId: response.task_id,
        status: "processing",
        isPolling: true
      });
      
      // Start polling for status
      get().checkTaskStatus(response.task_id);
      
    } catch (err) {
      set({
        status: "failed",
        error: err instanceof Error ? err.message : String(err)
      });
    }
  },
  
  checkTaskStatus: async (taskId) => {
    try {
      const result = await apiClient.process.getTaskResult(taskId);
      
      if (result.status === "completed" && result.result) {
        set({
          status: "completed",
          markdownResult: result.result.markdown,
          summaryId: result.result.summary_id,
          isPolling: false
        });
      } else if (result.status === "failed") {
        set({
          status: "failed",
          error: result.error || "Task processing failed",
          isPolling: false
        });
      } else {
        // Still processing, continue polling after delay
        setTimeout(() => get().checkTaskStatus(taskId), 2000);
      }
    } catch (err) {
      set({
        status: "failed",
        error: err instanceof Error ? err.message : String(err),
        isPolling: false
      });
    }
  },
  
  // Add other actions...
}));
```

#### 2.3 Update Generate Button Component (Priority: Medium)

**Current State:** Basic component exists but doesn't trigger real API calls.

**Tasks:**
- [ ] Update the component to call the actual API via taskStore
- [ ] Add processing state UI feedback
- [ ] Handle errors and display appropriate messages

### 3. Output Display

#### 3.1 Update Notes View Component (Priority: Medium)

**Current State:** Displays static content, not connected to real API response.

**Tasks:**
- [ ] Update component to render the markdown from taskStore
- [ ] Add loading state for when content is being fetched
- [ ] Implement error handling

#### 3.2 Implement Mindmap View Component (Priority: Low)

**Current State:** Basic component exists but doesn't render actual mindmap.

**Tasks:**
- [ ] Integrate a mindmap rendering library (e.g., Markmap)
- [ ] Convert markdown from taskStore to mindmap format
- [ ] Implement zoom and navigation controls

### 4. Chat Interface

#### 4.1 Create Chat History Hook (Priority: Medium)

**Current State:** Not implemented.

**Tasks:**
- [ ] Create `useChatHistory` hook in `src/hooks/useChatHistory.ts`
- [ ] Implement functions to fetch, save, and manage chat history
- [ ] Handle loading states and errors

```typescript
export function useChatHistory() {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  const [histories, setHistories] = useState<ConversationHistory[]>([]);
  
  const fetchHistories = async () => {
    try {
      setIsLoading(true);
      setError(null);
      const result = await apiClient.history.getConversationHistories();
      setHistories(result);
    } catch (err) {
      setError(err instanceof Error ? err : new Error(String(err)));
    } finally {
      setIsLoading(false);
    }
  };
  
  const saveConversation = async (conversation: string) => {
    try {
      setIsLoading(true);
      setError(null);
      const result = await apiClient.history.saveConversation(conversation);
      return result;
    } catch (err) {
      setError(err instanceof Error ? err : new Error(String(err)));
      return null;
    } finally {
      setIsLoading(false);
    }
  };
  
  return { 
    histories, 
    fetchHistories, 
    saveConversation, 
    isLoading, 
    error 
  };
}
```

#### 4.2 Update Chat Interface Component (Priority: Medium)

**Current State:** Basic UI exists but doesn't connect to backend.

**Tasks:**
- [ ] Update component to fetch and display chat history
- [ ] Implement conversation saving functionality
- [ ] Add loading states and error handling

### 5. Complete API Client Implementation (Priority: Highest)

**Current State:** Partial implementation with some API functions not aligned with the backend.

**Tasks:**
- [ ] Update the base URL to match the backend (`http://localhost:8000`)
- [ ] Implement all endpoints according to API_DOC.md
- [ ] Create TypeScript interfaces that match API response structures exactly

```typescript
// Full API client implementation
const API_BASE_URL = 'http://localhost:8000';

// API response type interfaces
export interface SourceFile {
  id: string;
  filename: string;
  content_type: string;
  created_at?: string;
}

export interface ProcessTask {
  task_id: string;
}

export interface ProcessResult {
  task_id: string;
  status: 'pending' | 'processing' | 'completed' | 'failed';
  result: {
    markdown: string;
    summary_id: string;
    created_at: string;
  } | null;
  error: string | null;
}

export interface ConversationHistory {
  id: string;
  conversation: string;
  created_at: string;
}

// Complete API client with all endpoints
const apiClient = {
  // Health check
  health: {
    check: (): Promise<{ status: string }> => {
      return fetchApi('/health');
    }
  },
  
  // Sources API
  sources: {
    uploadSource: (file: File): Promise<SourceFile> => {
      const formData = new FormData();
      formData.append('file', file);
      
      return fetchApi('/sources', {
        method: 'POST',
        body: formData,
      });
    },
    
    getSources: (): Promise<SourceFile[]> => {
      return fetchApi('/sources');
    },
    
    getSource: (sourceId: string): Promise<SourceFile> => {
      return fetchApi(`/sources/${sourceId}`);
    }
  },
  
  // Process API
  process: {
    startProcessing: (sourceIds: string[], llmModel: string = 'gemini-flash'): Promise<ProcessTask> => {
      return fetchApi('/process', {
        method: 'POST',
        body: JSON.stringify({
          source_ids: sourceIds,
          llm_model: llmModel
        }),
      });
    },
    
    getTaskResult: (taskId: string): Promise<ProcessResult> => {
      return fetchApi(`/process/results/${taskId}`);
    }
  },
  
  // History API
  history: {
    saveConversation: (conversation: string): Promise<ConversationHistory> => {
      return fetchApi('/history', {
        method: 'POST',
        body: JSON.stringify({ conversation }),
      });
    },
    
    getConversationHistories: (): Promise<ConversationHistory[]> => {
      return fetchApi('/history');
    },
    
    getConversationHistory: (historyId: string): Promise<ConversationHistory> => {
      return fetchApi(`/history/${historyId}`);
    }
  }
};

export default apiClient;
```

## Detailed Component Implementation Notes

### Sources Component Implementation

The Sources component will need to be updated to handle actual API interactions:

```tsx
// frontend/src/components/sources/SourcesList.tsx
import { useEffect, useState } from 'react';
import { useSourceStore } from '../../lib/store/sourceStore';
import { SourceItem } from './SourceItem';
import { UploadButton } from './UploadButton';

export function SourcesList() {
  const { sources, selectedSourceIds, fetchSources, toggleSelectSource, isLoading, error } = useSourceStore();
  
  // Fetch sources on component mount
  useEffect(() => {
    fetchSources();
  }, [fetchSources]);
  
  if (isLoading && sources.length === 0) {
    return <div className="p-4">Loading sources...</div>;
  }
  
  if (error && sources.length === 0) {
    return (
      <div className="p-4 text-red-500">
        Error loading sources: {error}
        <button 
          className="ml-2 px-2 py-1 bg-blue-500 text-white rounded"
          onClick={() => fetchSources()}
        >
          Retry
        </button>
      </div>
    );
  }
  
  return (
    <div className="p-4">
      <div className="mb-4">
        <UploadButton />
      </div>
      
      {sources.length === 0 ? (
        <div className="text-gray-500">No sources uploaded yet. Upload a PDF to get started.</div>
      ) : (
        <ul className="space-y-2">
          {sources.map((source) => (
            <SourceItem 
              key={source.id}
              source={source}
              isSelected={selectedSourceIds.includes(source.id)}
              onToggleSelect={() => toggleSelectSource(source.id)}
            />
          ))}
        </ul>
      )}
    </div>
  );
}
```

The accompanying `UploadButton` component would handle file selection and uploading:

```tsx
// frontend/src/components/sources/UploadButton.tsx
import { useRef, useState } from 'react';
import { useSourceStore } from '../../lib/store/sourceStore';
import { useFileUpload } from '../../hooks/useFileUpload';

export function UploadButton() {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { uploadSource } = useSourceStore();
  const { uploadFile, isUploading, progress, error } = useFileUpload();
  
  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    
    const result = await uploadFile(file);
    if (result) {
      // Source store will be updated with the new source
      uploadSource(file);
    }
    
    // Reset the file input
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };
  
  return (
    <div>
      <input 
        type="file"
        ref={fileInputRef}
        onChange={handleFileChange}
        accept="application/pdf"
        className="hidden"
      />
      
      <button
        className="px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600 disabled:bg-blue-300"
        onClick={() => fileInputRef.current?.click()}
        disabled={isUploading}
      >
        {isUploading ? `Uploading (${progress}%)` : 'Upload PDF'}
      </button>
      
      {error && (
        <div className="mt-2 text-red-500 text-sm">
          {error.message}
        </div>
      )}
    </div>
  );
}
```

### Generate Button Implementation

The `GenerateButton` component needs to be updated to work with the real API:

```tsx
// frontend/src/components/GenerateButton.tsx
import { useState } from 'react';
import { useSourceStore } from '../lib/store/sourceStore';
import { useTaskStore } from '../lib/store/taskStore';

export function GenerateButton() {
  const { selectedSourceIds } = useSourceStore();
  const { status, error, startProcessing } = useTaskStore();
  const [llmModel, setLlmModel] = useState<string>('gemini-flash');
  
  const isProcessing = status === 'pending' || status === 'processing';
  const canGenerate = selectedSourceIds.length > 0 && !isProcessing;
  
  const handleGenerate = async () => {
    if (!canGenerate) return;
    
    try {
      await startProcessing(selectedSourceIds, llmModel);
    } catch (err) {
      console.error('Failed to start processing:', err);
    }
  };
  
  return (
    <div className="flex flex-col space-y-2">
      <select
        className="p-2 border rounded"
        value={llmModel}
        onChange={(e) => setLlmModel(e.target.value)}
        disabled={isProcessing}
      >
        <option value="gemini-flash">Gemini Flash</option>
        <option value="gemini-pro">Gemini Pro</option>
      </select>
      
      <button
        className={`px-4 py-2 rounded text-white ${canGenerate ? 'bg-green-500 hover:bg-green-600' : 'bg-gray-300'}`}
        onClick={handleGenerate}
        disabled={!canGenerate}
      >
        {isProcessing ? 'Processing...' : 'Generate Notes'}
      </button>
      
      {error && (
        <div className="text-red-500 text-sm mt-2">
          {error}
        </div>
      )}
      
      {status === 'processing' && (
        <div className="text-blue-500 text-sm mt-2">
          Processing your documents... This may take a minute.
        </div>
      )}
    </div>
  );
}
```

### Notes View Implementation

The `NotesView` component needs to render the markdown from the API response:

```tsx
// frontend/src/components/output/NotesView.tsx
import { useEffect, useState } from 'react';
import { useTaskStore } from '../../lib/store/taskStore';
import ReactMarkdown from 'react-markdown';

export function NotesView() {
  const { status, markdownResult, error } = useTaskStore();
  
  if (status === 'idle') {
    return (
      <div className="p-4 text-gray-500">
        Select sources and click "Generate Notes" to create a summary.
      </div>
    );
  }
  
  if (status === 'pending' || status === 'processing') {
    return (
      <div className="p-4">
        <div className="animate-pulse space-y-4">
          <div className="h-4 bg-gray-200 rounded w-3/4"></div>
          <div className="h-4 bg-gray-200 rounded w-1/2"></div>
          <div className="h-4 bg-gray-200 rounded w-5/6"></div>
        </div>
        <p className="mt-4 text-blue-500">Processing your documents...</p>
      </div>
    );
  }
  
  if (status === 'failed') {
    return (
      <div className="p-4 text-red-500">
        Error generating notes: {error}
      </div>
    );
  }
  
  if (status === 'completed' && markdownResult) {
    return (
      <div className="p-4 prose max-w-none">
        <ReactMarkdown>{markdownResult}</ReactMarkdown>
      </div>
    );
  }
  
  return (
    <div className="p-4 text-gray-500">
      No notes generated yet.
    </div>
  );
}
```

### Chat Interface Implementation

The Chat Interface needs to save and retrieve conversation history:

```tsx
// frontend/src/components/chat/ChatInterface.tsx
import { useState, useEffect } from 'react';
import { useChatHistory } from '../../hooks/useChatHistory';
import { ChatMessage } from './ChatMessage';

export function ChatInterface() {
  const [message, setMessage] = useState('');
  const [chatMessages, setChatMessages] = useState<Array<{role: 'user' | 'assistant', content: string}>>([]);
  const { saveConversation, isLoading, error } = useChatHistory();
  
  const handleSendMessage = async () => {
    if (!message.trim()) return;
    
    // Add user message to chat
    const updatedMessages = [
      ...chatMessages,
      { role: 'user', content: message }
    ];
    setChatMessages(updatedMessages);
    setMessage('');
    
    // In a real implementation, you would send this to the backend
    // For now, we'll just mock an assistant response
    setTimeout(() => {
      const newMessages = [
        ...updatedMessages,
        { role: 'assistant', content: `This is a mock response to: "${message}"` }
      ];
      setChatMessages(newMessages);
      
      // Save conversation to backend
      const conversationText = newMessages
        .map(msg => `${msg.role === 'user' ? 'User' : 'AI'}: ${msg.content}`)
        .join('\n');
      
      saveConversation(conversationText);
    }, 1000);
  };
  
  return (
    <div className="flex flex-col h-full">
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {chatMessages.length === 0 ? (
          <div className="text-gray-500 text-center">
            Start a conversation about the documents you've processed.
          </div>
        ) : (
          chatMessages.map((msg, index) => (
            <ChatMessage 
              key={index}
              role={msg.role}
              content={msg.content}
            />
          ))
        )}
      </div>
      
      <div className="border-t p-4">
        <div className="flex space-x-2">
          <input
            type="text"
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            placeholder="Ask about your documents..."
            className="flex-1 p-2 border rounded"
            onKeyDown={(e) => e.key === 'Enter' && handleSendMessage()}
          />
          <button
            onClick={handleSendMessage}
            disabled={!message.trim() || isLoading}
            className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 disabled:bg-blue-300"
          >
            Send
          </button>
        </div>
        
        {error && (
          <div className="mt-2 text-red-500 text-sm">
            {error.message}
          </div>
        )}
      </div>
    </div>
  );
}
```

## Implementation Phases

### Phase 1: Core API Client Implementation 

- Implement updated API client with correct endpoints
- Create basic hooks for API interaction
- Update Zustand stores to use real API

### Phase 2: Source Management Integration 

- Implement file upload functionality
- Update sources list to fetch from API
- Add error handling and loading states

### Phase 3: Document Processing Integration

- Implement process polling mechanism
- Update task store to use real API
- Connect generate button to real processing

### Phase 4: Output Display Integration 

- Update notes view to display real markdown results
- Implement mindmap visualization with real data
- Add support for switching between output formats

### Phase 5: Chat Interface Integration

- Implement chat history management
- Connect chat interface to backend API
- Add support for saving and loading conversations

## Testing Strategy

- Unit test each hook individually with mock API responses
- Integration test the connection between stores and components
- End-to-end test the complete flow from file upload to result display

## Potential Challenges

1. **Handling large files**: May require chunked upload implementation
2. **Polling mechanism**: Need to handle network failures and timeouts gracefully
3. **Mindmap rendering**: May require optimization for large documents
4. **Error handling**: Need comprehensive approach for various API failure scenarios

## Success Criteria

- File upload and processing works end-to-end
- Task status polling correctly updates UI
- Notes view displays correctly formatted markdown
- Mindmap visualization renders correctly
- Chat history is properly saved and retrieved 