# Mock API for AI Study Companion

This directory contains a mock implementation of the backend API for the AI Study Companion project, implemented using [Mock Service Worker (MSW)](https://mswjs.io/).

## Setup

The mock API is automatically initialized during development. It intercepts all API requests that match the patterns defined in `handlers.ts` and returns mock responses that conform to the API specification.

## Files

- `index.ts`: Entry point for initializing the MSW mock service worker
- `browser.ts`: Browser-specific setup for MSW
- `handlers.ts`: Mock API endpoint handlers that simulate backend behavior
- `mockServiceWorker.js`: Service worker script (in `public/`) that intercepts network requests

## How it Works

1. During development, all API requests are intercepted by the MSW service worker
2. The handlers in `handlers.ts` process these requests and return mock responses
3. The application interacts with these mock endpoints as if they were real backend API calls

## Mock Data

- Sources: Pre-populated list of mock PDF sources
- Tasks: Simulated processing tasks with state transitions (pending → processing → completed/failed)
- Summaries: Mock markdown summaries for completed tasks

## Error Simulation

The mock API also simulates errors that might occur in the real API:

- 413 (Request Entity Too Large): Random chance when uploading files
- 400 (Bad Request): Random chance for validation errors
- 404 (Not Found): When requesting non-existent resources
- Task Failures: 10% chance of a task failing during processing

## Important Note

**Before deploying to production:**

1. Remove the mock API initialization from `src/app/layout.tsx`
2. Verify that all API client code works with the real backend
3. Update environment variables to point to the production API endpoint 