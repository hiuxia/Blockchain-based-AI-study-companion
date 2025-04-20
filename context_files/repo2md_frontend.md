# Backend Documentation

 of NLP ProjectGenerated on 4/20/2025

This doc provides a comprehensive overview of the backend of the NLP Project.

## Table of Contents

- 📁 public/
  - 📄 [mockServiceWorker.js](#public-mockserviceworker-js)
- 📁 src/
  - 📁 app/
    - 📄 [globals.css](#src-app-globals-css)
    - 📄 [layout.tsx](#src-app-layout-tsx)
    - 📄 [page.tsx](#src-app-page-tsx)
  - 📁 components/
    - 📄 [GenerateButton.tsx](#src-components-generatebutton-tsx)
    - 📁 chat/
      - 📄 [ChatInterface.tsx](#src-components-chat-chatinterface-tsx)
      - 📄 [ChatMessage.tsx](#src-components-chat-chatmessage-tsx)
    - 📁 layout/
      - 📄 [Header.tsx](#src-components-layout-header-tsx)
      - 📄 [MainLayout.tsx](#src-components-layout-mainlayout-tsx)
    - 📁 output/
      - 📄 [MindmapView.tsx](#src-components-output-mindmapview-tsx)
      - 📄 [NotesView.tsx](#src-components-output-notesview-tsx)
      - 📄 [OutputPanel.tsx](#src-components-output-outputpanel-tsx)
      - 📄 [OutputTabs.tsx](#src-components-output-outputtabs-tsx)
    - 📁 sources/
      - 📄 [SourceItem.tsx](#src-components-sources-sourceitem-tsx)
      - 📄 [SourcesList.tsx](#src-components-sources-sourceslist-tsx)
      - 📄 [UploadButton.tsx](#src-components-sources-uploadbutton-tsx)
  - 📁 docs/
  - 📁 hooks/
    - 📄 [useChatHistory.ts](#src-hooks-usechathistory-ts)
    - 📄 [useFileUpload.ts](#src-hooks-usefileupload-ts)
    - 📄 [useProcessPolling.ts](#src-hooks-useprocesspolling-ts)
    - 📄 [useTaskProcessing.ts](#src-hooks-usetaskprocessing-ts)
  - 📁 lib/
    - 📄 [apiClient.ts](#src-lib-apiclient-ts)
    - 📁 store/
      - 📄 [sourceStore.ts](#src-lib-store-sourcestore-ts)
      - 📄 [taskStore.ts](#src-lib-store-taskstore-ts)
      - 📄 [uiStore.ts](#src-lib-store-uistore-ts)
  - 📁 mocks/
    - 📁 browser/
    - 📄 [browser.ts](#src-mocks-browser-ts)
    - 📄 [handlers.ts](#src-mocks-handlers-ts)
    - 📄 [index.ts](#src-mocks-index-ts)
    - 📁 server/
  - 📄 [tailwind.config.ts](#src-tailwind-config-ts)
- 📄 [tsconfig.json](#tsconfig-json)

## Source Code

### <a id="public-mockserviceworker-js"></a>public/mockServiceWorker.js

```javascript
/* eslint-disable */
/* tslint:disable */

/**
 * Mock Service Worker.
 * @see https://github.com/mswjs/msw
 * - Please do NOT modify this file.
 * - Please do NOT serve this file on production.
 */

const PACKAGE_VERSION = '2.7.4'
const INTEGRITY_CHECKSUM = '00729d72e3b82faf54ca8b9621dbb96f'
const IS_MOCKED_RESPONSE = Symbol('isMockedResponse')
const activeClientIds = new Set()

self.addEventListener('install', function () {
  self.skipWaiting()
})

self.addEventListener('activate', function (event) {
  event.waitUntil(self.clients.claim())
})

self.addEventListener('message', async function (event) {
  const clientId = event.source.id

  if (!clientId || !self.clients) {
    return
  }

  const client = await self.clients.get(clientId)

  if (!client) {
    return
  }

  const allClients = await self.clients.matchAll({
    type: 'window',
  })

  switch (event.data) {
    case 'KEEPALIVE_REQUEST': {
      sendToClient(client, {
        type: 'KEEPALIVE_RESPONSE',
      })
      break
    }

    case 'INTEGRITY_CHECK_REQUEST': {
      sendToClient(client, {
        type: 'INTEGRITY_CHECK_RESPONSE',
        payload: {
          packageVersion: PACKAGE_VERSION,
          checksum: INTEGRITY_CHECKSUM,
        },
      })
      break
    }

    case 'MOCK_ACTIVATE': {
      activeClientIds.add(clientId)

      sendToClient(client, {
        type: 'MOCKING_ENABLED',
        payload: {
          client: {
            id: client.id,
            frameType: client.frameType,
          },
        },
      })
      break
    }

    case 'MOCK_DEACTIVATE': {
      activeClientIds.delete(clientId)
      break
    }

    case 'CLIENT_CLOSED': {
      activeClientIds.delete(clientId)

      const remainingClients = allClients.filter((client) => {
        return client.id !== clientId
      })

      // Unregister itself when there are no more clients
      if (remainingClients.length === 0) {
        self.registration.unregister()
      }

      break
    }
  }
})

self.addEventListener('fetch', function (event) {
  const { request } = event

  // Bypass navigation requests.
  if (request.mode === 'navigate') {
    return
  }

  // Opening the DevTools triggers the "only-if-cached" request
  // that cannot be handled by the worker. Bypass such requests.
  if (request.cache === 'only-if-cached' && request.mode !== 'same-origin') {
    return
  }

  // Bypass all requests when there are no active clients.
  // Prevents the self-unregistered worked from handling requests
  // after it's been deleted (still remains active until the next reload).
  if (activeClientIds.size === 0) {
    return
  }

  // Generate unique request ID.
  const requestId = crypto.randomUUID()
  event.respondWith(handleRequest(event, requestId))
})

async function handleRequest(event, requestId) {
  const client = await resolveMainClient(event)
  const response = await getResponse(event, client, requestId)

  // Send back the response clone for the "response:*" life-cycle events.
  // Ensure MSW is active and ready to handle the message, otherwise
  // this message will pend indefinitely.
  if (client && activeClientIds.has(client.id)) {
    ;(async function () {
      const responseClone = response.clone()

      sendToClient(
        client,
        {
          type: 'RESPONSE',
          payload: {
            requestId,
            isMockedResponse: IS_MOCKED_RESPONSE in response,
            type: responseClone.type,
            status: responseClone.status,
            statusText: responseClone.statusText,
            body: responseClone.body,
            headers: Object.fromEntries(responseClone.headers.entries()),
          },
        },
        [responseClone.body],
      )
    })()
  }

  return response
}

// Resolve the main client for the given event.
// Client that issues a request doesn't necessarily equal the client
// that registered the worker. It's with the latter the worker should
// communicate with during the response resolving phase.
async function resolveMainClient(event) {
  const client = await self.clients.get(event.clientId)

  if (activeClientIds.has(event.clientId)) {
    return client
  }

  if (client?.frameType === 'top-level') {
    return client
  }

  const allClients = await self.clients.matchAll({
    type: 'window',
  })

  return allClients
    .filter((client) => {
      // Get only those clients that are currently visible.
      return client.visibilityState === 'visible'
    })
    .find((client) => {
      // Find the client ID that's recorded in the
      // set of clients that have registered the worker.
      return activeClientIds.has(client.id)
    })
}

async function getResponse(event, client, requestId) {
  const { request } = event

  // Clone the request because it might've been already used
  // (i.e. its body has been read and sent to the client).
  const requestClone = request.clone()

  function passthrough() {
    // Cast the request headers to a new Headers instance
    // so the headers can be manipulated with.
    const headers = new Headers(requestClone.headers)

    // Remove the "accept" header value that marked this request as passthrough.
    // This prevents request alteration and also keeps it compliant with the
    // user-defined CORS policies.
    const acceptHeader = headers.get('accept')
    if (acceptHeader) {
      const values = acceptHeader.split(',').map((value) => value.trim())
      const filteredValues = values.filter(
        (value) => value !== 'msw/passthrough',
      )

      if (filteredValues.length > 0) {
        headers.set('accept', filteredValues.join(', '))
      } else {
        headers.delete('accept')
      }
    }

    return fetch(requestClone, { headers })
  }

  // Bypass mocking when the client is not active.
  if (!client) {
    return passthrough()
  }

  // Bypass initial page load requests (i.e. static assets).
  // The absence of the immediate/parent client in the map of the active clients
  // means that MSW hasn't dispatched the "MOCK_ACTIVATE" event yet
  // and is not ready to handle requests.
  if (!activeClientIds.has(client.id)) {
    return passthrough()
  }

  // Notify the client that a request has been intercepted.
  const requestBuffer = await request.arrayBuffer()
  const clientMessage = await sendToClient(
    client,
    {
      type: 'REQUEST',
      payload: {
        id: requestId,
        url: request.url,
        mode: request.mode,
        method: request.method,
        headers: Object.fromEntries(request.headers.entries()),
        cache: request.cache,
        credentials: request.credentials,
        destination: request.destination,
        integrity: request.integrity,
        redirect: request.redirect,
        referrer: request.referrer,
        referrerPolicy: request.referrerPolicy,
        body: requestBuffer,
        keepalive: request.keepalive,
      },
    },
    [requestBuffer],
  )

  switch (clientMessage.type) {
    case 'MOCK_RESPONSE': {
      return respondWithMock(clientMessage.data)
    }

    case 'PASSTHROUGH': {
      return passthrough()
    }
  }

  return passthrough()
}

function sendToClient(client, message, transferrables = []) {
  return new Promise((resolve, reject) => {
    const channel = new MessageChannel()

    channel.port1.onmessage = (event) => {
      if (event.data && event.data.error) {
        return reject(event.data.error)
      }

      resolve(event.data)
    }

    client.postMessage(
      message,
      [channel.port2].concat(transferrables.filter(Boolean)),
    )
  })
}

async function respondWithMock(response) {
  // Setting response status code to 0 is a no-op.
  // However, when responding with a "Response.error()", the produced Response
  // instance will have status code set to 0. Since it's not possible to create
  // a Response instance with status code 0, handle that use-case separately.
  if (response.status === 0) {
    return Response.error()
  }

  const mockedResponse = new Response(response.body, response)

  Reflect.defineProperty(mockedResponse, IS_MOCKED_RESPONSE, {
    value: true,
    enumerable: true,
  })

  return mockedResponse
}

```

### <a id="src-app-globals-css"></a>src/app/globals.css

```plaintext
@import "tailwindcss";

:root {
  --background: #ffffff;
  --foreground: #171717;
}

@theme inline {
  --color-background: var(--background);
  --color-foreground: var(--foreground);
  --font-sans: var(--font-geist-sans);
  --font-mono: var(--font-geist-mono);
}

@media (prefers-color-scheme: dark) {
  :root {
    --background: #0a0a0a;
    --foreground: #ededed;
  }
}

body {
  background: var(--background);
  color: var(--foreground);
  font-family: Arial, Helvetica, sans-serif;
}

```

### <a id="src-app-layout-tsx"></a>src/app/layout.tsx

```plaintext
import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";

// Initialize mock API for development only
if (process.env.NODE_ENV === 'development') {
  import('../mocks');
}

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
	title: "AI Study Companion",
	description: "Process PDFs and generate structured notes with mindmaps",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        {children}
      </body>
    </html>
  );
}

```

### <a id="src-app-page-tsx"></a>src/app/page.tsx

```plaintext
import { MainLayout } from "../components/layout/MainLayout";
import { SourcesList } from "../components/sources/SourcesList";
import { ChatInterface } from "../components/chat/ChatInterface";
import { OutputPanel } from "../components/output/OutputPanel";
import { GenerateButton } from "../components/GenerateButton";

export default function Home() {
	return (
		<MainLayout>
			<div className="relative flex h-full w-full">
				{/* Sources Panel (left sidebar) */}
				<div className="w-64 lg:w-72 flex-shrink-0">
					<SourcesList />
				</div>

				{/* Generate Button (centered at top) */}
				<GenerateButton />

				{/* Chat Interface (middle section) */}
				<div className="flex-1 border-l border-r border-gray-200">
					<ChatInterface />
				</div>

				{/* Output Panel (right section) */}
				<div className="w-1/3 flex-shrink-0">
					<OutputPanel />
				</div>
			</div>
		</MainLayout>
	);
}

```

### <a id="src-components-generatebutton-tsx"></a>src/components/GenerateButton.tsx

```plaintext
"use client";
import React, { useState } from "react";
import { useSourceStore } from "../lib/store/sourceStore";
import { useTaskProcessing } from "../hooks/useTaskProcessing";

export const GenerateButton: React.FC = () => {
	const { selectedSourceIds } = useSourceStore();
	const { status, error, startProcessing, isPolling } = useTaskProcessing();
	const [llmModel, setLlmModel] = useState<string>("gemini2");

	const selectedCount = selectedSourceIds.length;
	const isDisabled =
		selectedCount === 0 || status === "pending" || status === "processing";

	const handleGenerateClick = async () => {
		if (!isDisabled) {
			try {
				await startProcessing(selectedSourceIds, llmModel);
			} catch (err) {
				console.error("Failed to start processing:", err);
			}
		}
	};

	return (
		<div className="flex items-center justify-end gap-2 p-2">
			<select
				className="px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
				value={llmModel}
				onChange={(e) => setLlmModel(e.target.value)}
				disabled={isDisabled}
			>
				<option value="gemini2">Gemini 2</option>
				<option value="llama4">Llama 4</option>
			</select>

			<button
				className={`flex items-center space-x-1 ${
					isDisabled
						? "bg-blue-300 cursor-not-allowed"
						: "bg-blue-500 hover:bg-blue-600"
				} text-white font-medium rounded-md px-4 py-2 shadow-md`}
				onClick={handleGenerateClick}
				disabled={isDisabled}
			>
				{isPolling ? (
					<>
						<svg
							className="animate-spin -ml-1 mr-2 h-4 w-4 text-white"
							xmlns="http://www.w3.org/2000/svg"
							fill="none"
							viewBox="0 0 24 24"
						>
							<circle
								className="opacity-25"
								cx="12"
								cy="12"
								r="10"
								stroke="currentColor"
								strokeWidth="4"
							></circle>
							<path
								className="opacity-75"
								fill="currentColor"
								d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
							></path>
						</svg>
						Processing...
					</>
				) : (
					<>
						<svg
							className="w-5 h-5 mr-1"
							fill="none"
							stroke="currentColor"
							viewBox="0 0 24 24"
						>
							<path
								strokeLinecap="round"
								strokeLinejoin="round"
								strokeWidth={2}
								d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10"
							/>
						</svg>
						Generate ({selectedCount} selected)
					</>
				)}
			</button>

			{!isDisabled && selectedCount > 0 && (
				<span className="text-sm text-gray-600">
					Using {selectedCount}{" "}
					{selectedCount === 1 ? "source" : "sources"}
				</span>
			)}

			{error && (
				<div className="absolute top-14 left-0 right-0 text-center mt-2 text-red-500 text-sm bg-red-50 p-2 rounded">
					{error}
				</div>
			)}
		</div>
	);
};

```

### <a id="src-components-chat-chatinterface-tsx"></a>src/components/chat/ChatInterface.tsx

```plaintext
"use client";
import React, { useState, useEffect } from "react";
import { ChatMessage } from "./ChatMessage";

interface Message {
	id: number;
	message: string;
	isUser: boolean;
	reference?: string;
}

export const ChatInterface: React.FC = () => {
	const [inputValue, setInputValue] = useState("");
	const [messages, setMessages] = useState<Message[]>([
		{
			id: 1,
			message:
				"Welcome to AI Study Companion! Upload PDF files and select them to generate notes and ask questions.",
			isUser: false,
		},
	]);

	const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
		setInputValue(e.target.value);
	};

	const handleSubmit = (e: React.FormEvent) => {
		e.preventDefault();
		// In a real app, this would send the message to a backend
		if (inputValue.trim()) {
			// Add user message
			const newUserMessage = {
				id: Date.now(),
				message: inputValue.trim(),
				isUser: true,
			};

			setMessages((prevMessages) => [...prevMessages, newUserMessage]);
			setInputValue("");

			// Simulate AI response
			setTimeout(() => {
				const aiResponse = {
					id: Date.now() + 1,
					message: getAiResponse(inputValue.trim()),
					isUser: false,
				};
				setMessages((prevMessages) => [...prevMessages, aiResponse]);
			}, 1000);
		}
	};

	// Simple response generator for demo purposes
	const getAiResponse = (query: string): string => {
		// Check if the query contains a file not found pattern
		if (query.includes("File with ID") && query.includes("not found")) {
			return "I'm sorry, but it seems the reference file could not be located. This can happen if the file was deleted or if there's a mismatch between the database and storage. Please try with another source document.";
		}

		// Generic responses for demo
		const responses = [
			"I'm analyzing your documents to find the answer. Please make sure you've uploaded and selected relevant PDFs.",
			"That's an interesting question. To provide a more accurate answer, I would need access to specific documents related to this topic.",
			"Based on the information available, I can't give a complete answer to this question. Try uploading more relevant documents.",
			"I'd be happy to help with that once you've uploaded the appropriate study materials.",
		];

		return responses[Math.floor(Math.random() * responses.length)];
	};

	// Handle and process error messages in the UI
	useEffect(() => {
		const errorElements = document.querySelectorAll(
			'[class*="text-red-500"]'
		);

		errorElements.forEach((element) => {
			const errorText = element.textContent;
			if (
				errorText &&
				errorText.includes("File with ID") &&
				errorText.includes("not found")
			) {
				// Clear the error from UI if possible
				if (element.parentElement) {
					element.parentElement.style.display = "none";
				}

				// Add a helpful message to the chat instead
				const fileNotFoundMessage = {
					id: Date.now(),
					message:
						"There was an issue with the referenced file. Please try with a different source document.",
					isUser: false,
				};

				setMessages((prevMessages) => {
					// Avoid duplicate error messages
					if (
						!prevMessages.some(
							(msg) => msg.message === fileNotFoundMessage.message
						)
					) {
						return [...prevMessages, fileNotFoundMessage];
					}
					return prevMessages;
				});
			}
		});
	}, []);

	return (
		<div className="flex flex-col h-full">
			<div className="p-4 border-b border-gray-200">
				<h2 className="text-lg font-semibold text-gray-800">
					Ask Questions
				</h2>
			</div>

			<div className="flex-1 overflow-y-auto p-4 space-y-4">
				{messages.map((msg) => (
					<ChatMessage
						key={msg.id}
						message={msg.message}
						isUser={msg.isUser}
						reference={msg.reference}
					/>
				))}
			</div>

			<div className="p-4 border-t border-gray-200">
				<form onSubmit={handleSubmit} className="flex items-center">
					<input
						type="text"
						value={inputValue}
						onChange={handleInputChange}
						placeholder="Ask about the selected sources..."
						className="flex-1 rounded-l-md border border-gray-300 py-2 px-4 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
					/>
					<button
						type="submit"
						className="bg-blue-500 text-white px-4 py-2 rounded-r-md hover:bg-blue-600"
					>
						<svg
							className="w-5 h-5"
							fill="none"
							stroke="currentColor"
							viewBox="0 0 24 24"
							xmlns="http://www.w3.org/2000/svg"
						>
							<path
								strokeLinecap="round"
								strokeLinejoin="round"
								strokeWidth={2}
								d="M14 5l7 7m0 0l-7 7m7-7H3"
							/>
						</svg>
					</button>
				</form>
			</div>
		</div>
	);
};

```

### <a id="src-components-chat-chatmessage-tsx"></a>src/components/chat/ChatMessage.tsx

```plaintext
"use client";
import React from "react";

interface ChatMessageProps {
	message: string;
	isUser: boolean;
	reference?: string;
}

export const ChatMessage: React.FC<ChatMessageProps> = ({
	message,
	isUser,
	reference,
}) => {
	return (
		<div className={`my-2 ${isUser ? "ml-auto" : "mr-auto"}`}>
			<div
				className={`rounded-lg px-4 py-2 max-w-xs md:max-w-md lg:max-w-lg ${
					isUser
						? "bg-blue-500 text-white"
						: "bg-gray-100 text-gray-800"
				}`}
			>
				<p>{message}</p>
				{reference && (
					<span className="text-xs text-blue-200 mt-1 block">
						[{reference}]
					</span>
				)}
			</div>
		</div>
	);
};

```

### <a id="src-components-layout-header-tsx"></a>src/components/layout/Header.tsx

```plaintext
"use client";
import React from "react";

interface HeaderProps {
	title: string;
}

export const Header: React.FC<HeaderProps> = ({ title }) => {
	return (
		<header className="w-full py-6 px-4 border-b border-gray-200">
			<h1 className="text-xl font-semibold text-gray-800">{title}</h1>
		</header>
	);
};

```

### <a id="src-components-layout-mainlayout-tsx"></a>src/components/layout/MainLayout.tsx

```plaintext
"use client";
import React from "react";
import { Header } from "./Header";

interface MainLayoutProps {
	children: React.ReactNode;
}

export const MainLayout: React.FC<MainLayoutProps> = ({ children }) => {
	return (
		<div className="flex flex-col min-h-screen bg-gray-50">
			<Header title="AI Study Companion" />
			<div className="flex flex-1 overflow-hidden">{children}</div>
		</div>
	);
};

```

### <a id="src-components-output-mindmapview-tsx"></a>src/components/output/MindmapView.tsx

```plaintext
"use client";
import React from "react";
import { useTaskStore } from "../../lib/store/taskStore";

export const MindmapView: React.FC = () => {
	const { status, summaryId } = useTaskStore();

	return (
		<div className="h-full flex flex-col items-center justify-center bg-white p-6">
			<div className="text-center">
				{status === "completed" && summaryId ? (
					<div>
						<div className="flex justify-center mb-4">
							<svg
								className="w-16 h-16 text-green-300"
								fill="currentColor"
								viewBox="0 0 24 24"
							>
								<path d="M9 16.2L4.8 12l-1.4 1.4L9 19 21 7l-1.4-1.4L9 16.2z" />
							</svg>
						</div>
						<h2 className="text-xl font-semibold text-gray-700 mb-2">
							Mindmap Ready
						</h2>
						<p className="text-gray-500 max-w-md">
							Mindmap visualization is available based on your
							notes
						</p>
					</div>
				) : (
					<>
						<div className="flex justify-center mb-4">
							<svg
								className={`w-16 h-16 ${
									status === "pending" ||
									status === "processing"
										? "text-blue-300 animate-pulse"
										: "text-blue-300"
								}`}
								fill="currentColor"
								viewBox="0 0 24 24"
							>
								<path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 15h-2v-2h2v2zm0-4h-2V7h2v6z" />
							</svg>
						</div>
						<h2 className="text-xl font-semibold text-gray-700 mb-2">
							Mindmap Visualization
						</h2>
						<p className="text-gray-500 max-w-md">
							{status === "pending" || status === "processing"
								? "Generating mindmap from your sources..."
								: "Will render here based on Notes"}
						</p>
					</>
				)}
			</div>
		</div>
	);
};

```

### <a id="src-components-output-notesview-tsx"></a>src/components/output/NotesView.tsx

```plaintext
"use client";
import React from "react";
import { useTaskStore } from "../../lib/store/taskStore";

export const NotesView: React.FC = () => {
	const { markdownResult, status } = useTaskStore();

	return (
		<div className="h-full overflow-y-auto p-6 bg-white">
			<div className="prose max-w-none">
				{status === "completed" && markdownResult ? (
					<div dangerouslySetInnerHTML={{ __html: markdownResult }} />
				) : (
					<>
						<h1>Study Notes</h1>
						<p className="text-gray-500 italic">
							{status === "pending" || status === "processing"
								? "Generating notes from your sources..."
								: "Notes will appear here once they are generated from your sources."}
						</p>
					</>
				)}
			</div>
		</div>
	);
};

```

### <a id="src-components-output-outputpanel-tsx"></a>src/components/output/OutputPanel.tsx

```plaintext
"use client";
import React from "react";
import { OutputTabs } from "./OutputTabs";
import { NotesView } from "./NotesView";
import { MindmapView } from "./MindmapView";
import { useUIStore } from "../../lib/store/uiStore";
import { useTaskStore } from "../../lib/store/taskStore";

export const OutputPanel: React.FC = () => {
	const { activeOutputTab } = useUIStore();
	const { status } = useTaskStore();

	const isCompleted = status === "completed";
	const isProcessing = status === "pending" || status === "processing";
	const isFailed = status === "failed";

	return (
		<div className="flex flex-col h-full border-l border-gray-200 bg-white">
			<div className="flex items-center justify-between p-4 border-b border-gray-200">
				<div className="flex items-center">
					{isCompleted && (
						<>
							<span className="h-3 w-3 rounded-full bg-green-500 mr-2"></span>
							<span className="text-sm font-medium text-gray-700">
								Complete
							</span>
						</>
					)}
					{isProcessing && (
						<>
							<span className="h-3 w-3 rounded-full bg-blue-500 mr-2 animate-pulse"></span>
							<span className="text-sm font-medium text-gray-700">
								Processing
							</span>
						</>
					)}
					{isFailed && (
						<>
							<span className="h-3 w-3 rounded-full bg-red-500 mr-2"></span>
							<span className="text-sm font-medium text-gray-700">
								Failed
							</span>
						</>
					)}
					{status === "idle" && (
						<span className="text-sm font-medium text-gray-500">
							Ready
						</span>
					)}
				</div>
				<div className="flex items-center space-x-2">
					<button className="p-2 text-gray-500 hover:text-gray-700">
						<svg
							className="w-5 h-5"
							fill="none"
							stroke="currentColor"
							viewBox="0 0 24 24"
						>
							<path
								strokeLinecap="round"
								strokeLinejoin="round"
								strokeWidth={2}
								d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z"
							/>
						</svg>
					</button>
					<button className="p-2 text-gray-500 hover:text-gray-700">
						<svg
							className="w-5 h-5"
							fill="none"
							stroke="currentColor"
							viewBox="0 0 24 24"
						>
							<path
								strokeLinecap="round"
								strokeLinejoin="round"
								strokeWidth={2}
								d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"
							/>
						</svg>
					</button>
				</div>
			</div>

			<OutputTabs />

			<div className="flex-1 overflow-hidden">
				{activeOutputTab === "notes" ? <NotesView /> : <MindmapView />}
			</div>
		</div>
	);
};

```

### <a id="src-components-output-outputtabs-tsx"></a>src/components/output/OutputTabs.tsx

```plaintext
"use client";
import React from "react";
import { useUIStore } from "../../lib/store/uiStore";
import { OutputTab } from "../../lib/store/uiStore";

export const OutputTabs: React.FC = () => {
	const { activeOutputTab, setActiveOutputTab } = useUIStore();

	const handleTabClick = (tab: OutputTab) => {
		setActiveOutputTab(tab);
	};

	return (
		<div className="flex border-b border-gray-200">
			<div
				className={`px-6 py-3 font-medium text-sm cursor-pointer ${
					activeOutputTab === "notes"
						? "text-blue-600 border-b-2 border-blue-600"
						: "text-gray-500 hover:text-gray-700"
				}`}
				onClick={() => handleTabClick("notes")}
			>
				<div className="flex items-center">
					<svg
						className="w-5 h-5 mr-2"
						fill="none"
						stroke="currentColor"
						viewBox="0 0 24 24"
					>
						<path
							strokeLinecap="round"
							strokeLinejoin="round"
							strokeWidth={2}
							d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
						/>
					</svg>
					Notes
				</div>
			</div>
			<div
				className={`px-6 py-3 font-medium text-sm cursor-pointer ${
					activeOutputTab === "mindmap"
						? "text-blue-600 border-b-2 border-blue-600"
						: "text-gray-500 hover:text-gray-700"
				}`}
				onClick={() => handleTabClick("mindmap")}
			>
				<div className="flex items-center">
					<svg
						className="w-5 h-5 mr-2"
						fill="none"
						stroke="currentColor"
						viewBox="0 0 24 24"
					>
						<path
							strokeLinecap="round"
							strokeLinejoin="round"
							strokeWidth={2}
							d="M4 5a1 1 0 011-1h14a1 1 0 011 1v2a1 1 0 01-1 1H5a1 1 0 01-1-1V5zM4 13a1 1 0 011-1h6a1 1 0 011 1v6a1 1 0 01-1 1H5a1 1 0 01-1-1v-6zM16 13a1 1 0 011-1h2a1 1 0 011 1v6a1 1 0 01-1 1h-2a1 1 0 01-1-1v-6z"
						/>
					</svg>
					Mindmap
				</div>
			</div>
		</div>
	);
};

```

### <a id="src-components-sources-sourceitem-tsx"></a>src/components/sources/SourceItem.tsx

```plaintext
"use client";
import React from "react";
import { SourceFile } from "../../lib/apiClient";

interface SourceItemProps {
	source: SourceFile;
	isSelected: boolean;
	onToggleSelect: () => void;
}

export const SourceItem: React.FC<SourceItemProps> = ({
	source,
	isSelected,
	onToggleSelect,
}) => {
	// Format the date if it exists
	const formattedDate = source.created_at
		? new Date(source.created_at).toLocaleDateString()
		: null;

	// Determine file type icon based on content_type
	const getFileIcon = () => {
		if (source.content_type === "application/pdf") {
			return (
				<svg
					className="w-5 h-5 text-red-500"
					fill="currentColor"
					viewBox="0 0 20 20"
				>
					<path d="M5 3a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2V5a2 2 0 00-2-2H5zm0 2h10v10H5V5z" />
				</svg>
			);
		}

		// Default icon for other file types
		return (
			<svg
				className="w-5 h-5 text-gray-500"
				fill="currentColor"
				viewBox="0 0 20 20"
			>
				<path d="M5 3a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2V5a2 2 0 00-2-2H5zm0 2h10v10H5V5z" />
			</svg>
		);
	};

	return (
		<div
			className={`flex items-center py-2 px-3 hover:bg-blue-50 rounded-md ${
				isSelected ? "bg-blue-50" : ""
			}`}
		>
			<div className="flex-shrink-0 mr-2">{getFileIcon()}</div>
			<div className="flex-1">
				<div className="truncate font-medium">{source.filename}</div>
				{formattedDate && (
					<div className="text-xs text-gray-500">
						Added: {formattedDate}
					</div>
				)}
			</div>
			<div className="flex-shrink-0 ml-2">
				<input
					type="checkbox"
					checked={isSelected}
					onChange={onToggleSelect}
					className="h-4 w-4 text-blue-600 rounded focus:ring-blue-500"
				/>
			</div>
		</div>
	);
};

```

### <a id="src-components-sources-sourceslist-tsx"></a>src/components/sources/SourcesList.tsx

```plaintext
"use client";
import React, { useEffect } from "react";
import { SourceItem } from "./SourceItem";
import { UploadButton } from "./UploadButton";
import { useSourceStore } from "../../lib/store/sourceStore";

export const SourcesList: React.FC = () => {
	const {
		sources,
		selectedSourceIds,
		selectAllSources,
		clearSelection,
		toggleSelectSource,
		fetchSources,
		isLoading,
		error,
	} = useSourceStore();

	// Fetch sources when the component mounts
	useEffect(() => {
		fetchSources();
	}, [fetchSources]);
	
	const isAllSelected =
		sources.length > 0 && selectedSourceIds.length === sources.length;

	const handleSelectAllToggle = () => {
		if (isAllSelected) {
			clearSelection();
		} else {
			selectAllSources();
		}
	};

	return (
		<div className="flex flex-col h-full border-r border-gray-200 bg-white">
			<div className="p-4 border-b border-gray-200">
				<h2 className="text-lg font-semibold text-gray-800">Sources</h2>
			</div>

			<div className="p-4">
				<UploadButton />
			</div>

			<div className="p-4 border-b border-gray-200">
				<p className="text-sm text-gray-600">Select sources to use:</p>
				<div className="flex justify-between mt-2">
					<span
						className="text-sm text-blue-500 hover:underline cursor-pointer"
						onClick={handleSelectAllToggle}
					>
						{isAllSelected ? "Deselect All" : "Select All"}
					</span>
				</div>
			</div>

			<div className="flex-1 overflow-y-auto p-2">
				{isLoading && sources.length === 0 ? (
					<div className="text-center p-4">
						<svg
							className="animate-spin h-8 w-8 mx-auto text-blue-500"
							xmlns="http://www.w3.org/2000/svg"
							fill="none"
							viewBox="0 0 24 24"
						>
							<circle
								className="opacity-25"
								cx="12"
								cy="12"
								r="10"
								stroke="currentColor"
								strokeWidth="4"
							></circle>
							<path
								className="opacity-75"
								fill="currentColor"
								d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
							></path>
						</svg>
						<p className="mt-2 text-gray-600">Loading sources...</p>
					</div>
				) : error && sources.length === 0 ? (
					<div className="text-center p-4">
						<div className="text-red-500 mb-2">{error}</div>
						<button
							onClick={() => fetchSources()}
							className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
						>
							Retry
						</button>
					</div>
				) : sources.length === 0 ? (
					<div className="text-center p-4 text-gray-500">
						No sources uploaded yet. Upload a PDF to get started.
					</div>
				) : (
					sources.map((source) => (
						<SourceItem
							key={source.id}
							source={source}
							isSelected={selectedSourceIds.includes(source.id)}
							onToggleSelect={() => toggleSelectSource(source.id)}
						/>
					))
				)}
			</div>
		</div>
	);
};

```

### <a id="src-components-sources-uploadbutton-tsx"></a>src/components/sources/UploadButton.tsx

```plaintext
"use client";
import React, { useRef, useState } from "react";
import { useFileUpload } from "../../hooks/useFileUpload";
import { useSourceStore } from "../../lib/store/sourceStore";

export const UploadButton: React.FC = () => {
	const fileInputRef = useRef<HTMLInputElement>(null);
	const { uploadSource } = useSourceStore();
	const { uploadFile, isUploading, progress, error, isDuplicate } =
		useFileUpload();
	const [dupeHandling, setDupeHandling] = useState<"rename" | "skip">(
		"rename"
	);

	const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
		const file = e.target.files?.[0];
		if (!file) return;

		const result = await uploadFile(file, dupeHandling);
		if (result) {
			// Source store will be updated with the new source
			await uploadSource(file);
		}

		// Reset the file input
		if (fileInputRef.current) {
			fileInputRef.current.value = "";
		}
	};

	return (
		<div className="w-full">
			<input
				type="file"
				ref={fileInputRef}
				onChange={handleFileChange}
				accept="application/pdf"
				className="hidden"
			/>

			<div className="flex flex-col space-y-2">
				<button
					className="w-full flex items-center justify-center py-2 px-4 border border-transparent rounded-md text-sm font-medium text-white bg-blue-500 hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:bg-blue-300"
					onClick={() => fileInputRef.current?.click()}
					disabled={isUploading}
				>
					{isUploading ? (
						<div className="flex items-center">
							<svg
								className="animate-spin -ml-1 mr-3 h-4 w-4 text-white"
								xmlns="http://www.w3.org/2000/svg"
								fill="none"
								viewBox="0 0 24 24"
							>
								<circle
									className="opacity-25"
									cx="12"
									cy="12"
									r="10"
									stroke="currentColor"
									strokeWidth="4"
								></circle>
								<path
									className="opacity-75"
									fill="currentColor"
									d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
								></path>
							</svg>
							Uploading ({Math.round(progress)}%)
						</div>
					) : (
						<>
							<span className="mr-2">+</span>
							Add Source (Upload PDF)
						</>
					)}
				</button>

				<div className="flex text-xs text-gray-600 justify-between items-center">
					<span>If duplicate files:</span>
					<div className="space-x-2">
						<label className="inline-flex items-center">
							<input
								type="radio"
								className="form-radio h-3 w-3 text-blue-500"
								checked={dupeHandling === "rename"}
								onChange={() => setDupeHandling("rename")}
							/>
							<span className="ml-1">Auto Rename</span>
						</label>
						<label className="inline-flex items-center">
							<input
								type="radio"
								className="form-radio h-3 w-3 text-blue-500"
								checked={dupeHandling === "skip"}
								onChange={() => setDupeHandling("skip")}
							/>
							<span className="ml-1">Skip</span>
						</label>
					</div>
				</div>
			</div>

			{error && (
				<div className="mt-2 text-red-500 text-sm">{error.message}</div>
			)}

			{isDuplicate && !error && (
				<div className="mt-2 text-amber-500 text-sm">
					{dupeHandling === "rename"
						? "Duplicate file detected. File was renamed automatically."
						: "Duplicate file detected."}
				</div>
			)}
		</div>
	);
};

```

### <a id="src-hooks-usechathistory-ts"></a>src/hooks/useChatHistory.ts

```plaintext
import { useState } from "react";
import apiClient, { ConversationHistory } from "../lib/apiClient";

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

	const fetchHistory = async (historyId: string) => {
		try {
			setIsLoading(true);
			setError(null);
			const result = await apiClient.history.getConversationHistory(
				historyId
			);
			return result;
		} catch (err) {
			const error = err instanceof Error ? err : new Error(String(err));
			setError(error);
			return null;
		} finally {
			setIsLoading(false);
		}
	};

	const saveConversation = async (conversation: string) => {
		try {
			setIsLoading(true);
			setError(null);
			const result = await apiClient.history.saveConversation(
				conversation
			);

			// Update histories list with new conversation
			setHistories((prev) => [result, ...prev]);

			return result;
		} catch (err) {
			const error = err instanceof Error ? err : new Error(String(err));
			setError(error);
			return null;
		} finally {
			setIsLoading(false);
		}
	};

	return {
		histories,
		fetchHistories,
		fetchHistory,
		saveConversation,
		isLoading,
		error,
	};
}

```

### <a id="src-hooks-usefileupload-ts"></a>src/hooks/useFileUpload.ts

```plaintext
import { useState } from "react";
import apiClient, { SourceFile } from "../lib/apiClient";

interface FileUploadState {
	isUploading: boolean;
	progress: number;
	error: Error | null;
	isDuplicate: boolean;
}

export function useFileUpload() {
	const [state, setState] = useState<FileUploadState>({
		isUploading: false,
		progress: 0,
		error: null,
		isDuplicate: false,
	});

	// Check if a file with the same name already exists
	const checkForDuplicates = async (filename: string): Promise<boolean> => {
		try {
			const sources = await apiClient.sources.getSources();
			return sources.some((source) => source.filename === filename);
		} catch (err) {
			console.error("Error checking for duplicates:", err);
			return false;
		}
	};

	// Generate a unique filename by adding a timestamp
	const getUniqueFilename = (filename: string): string => {
		const extension = filename.substring(filename.lastIndexOf("."));
		const baseName = filename.substring(0, filename.lastIndexOf("."));
		const timestamp = new Date().getTime();
		return `${baseName}_${timestamp}${extension}`;
	};

	const uploadFile = async (
		file: File,
		handleDuplicates: "rename" | "skip" = "rename"
	): Promise<SourceFile | null> => {
		try {
			// Reset state
			setState({
				isUploading: true,
				progress: 0,
				error: null,
				isDuplicate: false,
			});

			// Validate file type
			if (file.type !== "application/pdf") {
				throw new Error("Only PDF files are supported");
			}

			// Validate file size (max 50MB)
			const MAX_FILE_SIZE = 50 * 1024 * 1024; // 50MB in bytes
			if (file.size > MAX_FILE_SIZE) {
				throw new Error("File size exceeds the 50MB limit");
			}

			// Check for duplicates
			const isDuplicate = await checkForDuplicates(file.name);

			if (isDuplicate) {
				setState((prev) => ({
					...prev,
					isDuplicate: true,
				}));

				if (handleDuplicates === "skip") {
					throw new Error(
						`File "${file.name}" already exists. Upload skipped.`
					);
				}

				// Create a file with a unique name
				const uniqueFilename = getUniqueFilename(file.name);
				const renamedFile = new File([file], uniqueFilename, {
					type: file.type,
				});
				file = renamedFile;
			}

			// Start progress simulation
			const progressInterval = simulateProgress();

			try {
				// Upload file
				const result = await apiClient.sources.uploadSource(file);

				// Complete progress
				setState((prev) => ({
					...prev,
					progress: 100,
				}));

				// Clear progress interval
				clearInterval(progressInterval);

				return result;
			} catch (error) {
				// Clear progress interval on error
				clearInterval(progressInterval);
				throw error;
			}
		} catch (err) {
			const error = err instanceof Error ? err : new Error(String(err));
			setState((prev) => ({
				...prev,
				error,
			}));
			return null;
		} finally {
			setState((prev) => ({
				...prev,
				isUploading: false,
			}));
		}
	};

	// Function to simulate upload progress since fetch doesn't provide it natively
	const simulateProgress = () => {
		return setInterval(() => {
			setState((prev) => {
				// Increment progress, but never reach 100% (that happens on completion)
				const newProgress =
					prev.progress < 90
						? prev.progress + Math.random() * 10
						: 90 + Math.random() * 5;

				return {
					...prev,
					progress: Math.min(99, newProgress),
				};
			});
		}, 300);
	};

	return {
		uploadFile,
		isUploading: state.isUploading,
		progress: state.progress,
		error: state.error,
		isDuplicate: state.isDuplicate,
	};
}

```

### <a id="src-hooks-useprocesspolling-ts"></a>src/hooks/useProcessPolling.ts

```plaintext
import { useState, useEffect, useRef } from "react";
import apiClient, { ProcessResult } from "../lib/apiClient";

export enum ProcessStatus {
	IDLE = "idle",
	POLLING = "polling",
	COMPLETED = "completed",
	FAILED = "failed",
}

interface UseProcessPollingOptions {
	taskId: string | null;
	pollingInterval?: number;
	maxAttempts?: number;
	onSuccess?: (result: ProcessResult) => void;
	onError?: (error: Error) => void;
}

export function useProcessPolling({
	taskId,
	pollingInterval = 2000,
	maxAttempts = 60, // 2 minutes at 2-second intervals
	onSuccess,
	onError,
}: UseProcessPollingOptions) {
	const [status, setStatus] = useState<ProcessStatus>(ProcessStatus.IDLE);
	const [result, setResult] = useState<ProcessResult | null>(null);
	const [error, setError] = useState<Error | null>(null);
	const attemptCountRef = useRef(0);
	const pollingTimeoutRef = useRef<number | null>(null);

	const clearPollingTimeout = () => {
		if (pollingTimeoutRef.current !== null) {
			window.clearTimeout(pollingTimeoutRef.current);
			pollingTimeoutRef.current = null;
		}
	};

	const startPolling = () => {
		if (!taskId) return;

		setStatus(ProcessStatus.POLLING);
		attemptCountRef.current = 0;

		const poll = async () => {
			if (attemptCountRef.current >= maxAttempts) {
				setStatus(ProcessStatus.FAILED);
				const timeoutError = new Error(
					`Polling exceeded maximum attempts (${maxAttempts})`
				);
				setError(timeoutError);
				if (onError) onError(timeoutError);
				return;
			}

			try {
				const response = await apiClient.process.getTaskResult(taskId);
				setResult(response);

				if (response.status === "completed") {
					setStatus(ProcessStatus.COMPLETED);
					if (onSuccess) onSuccess(response);
					return;
				} else if (response.status === "failed") {
					setStatus(ProcessStatus.FAILED);
					const apiError = new Error(
						response.error || "Task processing failed"
					);
					setError(apiError);
					if (onError) onError(apiError);
					return;
				}

				// Continue polling for pending/processing statuses
				attemptCountRef.current++;
				pollingTimeoutRef.current = window.setTimeout(
					poll,
					pollingInterval
				);
			} catch (err) {
				const error =
					err instanceof Error ? err : new Error(String(err));
				setError(error);
				setStatus(ProcessStatus.FAILED);
				if (onError) onError(error);
			}
		};

		poll();
	};

	const stopPolling = () => {
		clearPollingTimeout();
		setStatus(ProcessStatus.IDLE);
	};

	// Start polling when taskId changes
	useEffect(() => {
		if (taskId) {
			startPolling();
		} else {
			stopPolling();
		}

		return () => {
			clearPollingTimeout();
		};
	}, [taskId]);

	return {
		status,
		result,
		error,
		isPolling: status === ProcessStatus.POLLING,
		isCompleted: status === ProcessStatus.COMPLETED,
		isFailed: status === ProcessStatus.FAILED,
		startPolling,
		stopPolling,
	};
}

```

### <a id="src-hooks-usetaskprocessing-ts"></a>src/hooks/useTaskProcessing.ts

```plaintext
"use client";
import { useEffect } from "react";
import { useTaskStore } from "../lib/store/taskStore";
import { useProcessPolling, ProcessStatus } from "./useProcessPolling";

/**
 * A hook that combines the taskStore with the process polling hook
 * to provide a unified interface for task processing
 */
export function useTaskProcessing() {
	const {
		taskId,
		status,
		markdownResult,
		summaryId,
		error,
		startProcessing,
		setTaskResult,
		setError,
		resetTask,
	} = useTaskStore();

	// Only set up polling if we have a taskId
	const {
		status: pollingStatus,
		result: pollingResult,
		error: pollingError,
		isPolling,
	} = useProcessPolling({
		taskId,
		onSuccess: (result) => {
			if (result.result) {
				setTaskResult({
					markdown: result.result.markdown,
					summaryId: result.result.summary_id,
				});
			}
		},
		onError: (error) => {
			setError(error.message);
		},
	});

	// Sync polling status with task status
	useEffect(() => {
		if (!taskId) return;

		switch (pollingStatus) {
			case ProcessStatus.POLLING:
				// Already handled by taskStore
				break;
			case ProcessStatus.COMPLETED:
				if (pollingResult && pollingResult.result) {
					setTaskResult({
						markdown: pollingResult.result.markdown,
						summaryId: pollingResult.result.summary_id,
					});
				}
				break;
			case ProcessStatus.FAILED:
				if (pollingError) {
					setError(pollingError.message);
				}
				break;
		}
	}, [pollingStatus, pollingResult, pollingError, taskId]);

	return {
		taskId,
		status,
		markdownResult,
		summaryId,
		error,
		isPolling,
		startProcessing,
		resetTask,
	};
}

```

### <a id="src-lib-apiclient-ts"></a>src/lib/apiClient.ts

```plaintext
/**
 * API Client for the AI Study Companion
 *
 * This client handles all communication with the backend API
 * as specified in the API documentation.
 */

const API_BASE_URL = "http://localhost:8000";

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
	status: "pending" | "processing" | "completed" | "failed";
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

// Create a custom error handler
class ApiError extends Error {
	public status: number;

	constructor(message: string, status: number) {
		super(message);
		this.name = "ApiError";
		this.status = status;
	}
}

// Helper for making API requests
async function fetchApi<T>(
	endpoint: string,
	options: RequestInit = {}
): Promise<T> {
	const url = `${API_BASE_URL}${endpoint}`;

	const defaultHeaders: HeadersInit = {
		"Content-Type": "application/json",
		Accept: "application/json",
	};

	// If we're sending form data, don't set Content-Type
	// as the browser will set it with the boundary
	const headers =
		options.body instanceof FormData
			? { Accept: "application/json" }
			: defaultHeaders;

	const response = await fetch(url, {
		...options,
		headers: {
			...headers,
			...(options.headers || {}),
		},
	});

	// If the response is not JSON, handle appropriately
	const contentType = response.headers.get("content-type");

	if (!contentType || !contentType.includes("application/json")) {
		if (!response.ok) {
			throw new ApiError(
				`API error: ${response.statusText}`,
				response.status
			);
		}
		return {} as T;
	}

	const data = await response.json();

	if (!response.ok) {
		const errorMessage = data.detail || data.error || response.statusText;
		throw new ApiError(errorMessage, response.status);
	}

	return data as T;
}

// Complete API client with all endpoints
const apiClient = {
	// Health check
	health: {
		check: (): Promise<{ status: string }> => {
			return fetchApi("/health");
		},
	},

	// Sources API
	sources: {
		uploadSource: (file: File): Promise<SourceFile> => {
			const formData = new FormData();
			formData.append("file", file);

			return fetchApi("/sources", {
				method: "POST",
				body: formData,
			});
		},

		getSources: (): Promise<SourceFile[]> => {
			return fetchApi("/sources");
		},

		getSource: (sourceId: string): Promise<SourceFile> => {
			return fetchApi(`/sources/${sourceId}`);
		},
	},

	// Process API
	process: {
		startProcessing: (
			sourceIds: string[],
			llmModel: string = "gemini-flash"
		): Promise<ProcessTask> => {
			return fetchApi("/process", {
				method: "POST",
				body: JSON.stringify({
					source_ids: sourceIds,
					llm_model: llmModel,
				}),
			});
		},

		getTaskResult: (taskId: string): Promise<ProcessResult> => {
			return fetchApi(`/process/results/${taskId}`);
		},
	},

	// History API
	history: {
		saveConversation: (
			conversation: string
		): Promise<ConversationHistory> => {
			return fetchApi("/history", {
				method: "POST",
				body: JSON.stringify({ conversation }),
			});
		},

		getConversationHistories: (): Promise<ConversationHistory[]> => {
			return fetchApi("/history");
		},

		getConversationHistory: (
			historyId: string
		): Promise<ConversationHistory> => {
			return fetchApi(`/history/${historyId}`);
		},
	},
};

export default apiClient;

```

### <a id="src-lib-store-sourcestore-ts"></a>src/lib/store/sourceStore.ts

```plaintext
import { create } from "zustand";
import apiClient, { SourceFile } from "../apiClient";

interface SourceState {
	// State
	sources: SourceFile[];
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

export const useSourceStore = create<SourceState>((set) => ({
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
				isLoading: false,
			});
		} catch (err) {
			set({
				error: err instanceof Error ? err.message : String(err),
				isLoading: false,
			});
		}
	},

	uploadSource: async (file) => {
		try {
			set({ isLoading: true, error: null });
			const newSource = await apiClient.sources.uploadSource(file);
			set((state) => ({
				sources: [...state.sources, newSource],
				isLoading: false,
			}));
		} catch (err) {
			set({
				error: err instanceof Error ? err.message : String(err),
				isLoading: false,
			});
		}
	},

	toggleSelectSource: (id) =>
		set((state) => {
			const isSelected = state.selectedSourceIds.includes(id);
			return {
				selectedSourceIds: isSelected
					? state.selectedSourceIds.filter(
							(sourceId) => sourceId !== id
					  )
					: [...state.selectedSourceIds, id],
			};
		}),

	selectAllSources: () =>
		set((state) => ({
			selectedSourceIds: state.sources.map((source) => source.id),
		})),

	clearSelection: () => set({ selectedSourceIds: [] }),
}));

```

### <a id="src-lib-store-taskstore-ts"></a>src/lib/store/taskStore.ts

```plaintext
import { create } from "zustand";
import apiClient from "../apiClient";

export type TaskStatus =
	| "idle"
	| "pending"
	| "processing"
	| "completed"
	| "failed";

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
	setTaskResult: (result: { markdown: string; summaryId: string }) => void;
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
				error: null,
				isPolling: false,
			});

			const response = await apiClient.process.startProcessing(
				sourceIds,
				llmModel
			);

			set({
				taskId: response.task_id,
				status: "processing",
				isPolling: true,
			});

			// Start polling for status with improved error handling
			get().checkTaskStatus(response.task_id);
		} catch (err) {
			set({
				status: "failed",
				error: err instanceof Error ? err.message : String(err),
				isPolling: false,
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
					isPolling: false,
				});
			} else if (result.status === "failed") {
				set({
					status: "failed",
					error: result.error || "Task processing failed",
					isPolling: false,
				});
			} else {
				// Still processing, continue polling after delay
				setTimeout(() => get().checkTaskStatus(taskId), 2000);
			}
		} catch (err) {
			set({
				status: "failed",
				error: err instanceof Error ? err.message : String(err),
				isPolling: false,
			});
		}
	},

	setTaskResult: ({ markdown, summaryId }) =>
		set({
			markdownResult: markdown,
			summaryId,
			status: "completed",
			isPolling: false,
		}),

	setError: (error) =>
		set({
			error,
			status: "failed",
			isPolling: false,
		}),

	resetTask: () => {
		set({
			status: "idle",
			taskId: null,
			markdownResult: null,
			summaryId: null,
			error: null,
			isPolling: false,
		});
	},
}));

```

### <a id="src-lib-store-uistore-ts"></a>src/lib/store/uiStore.ts

```plaintext
import { create } from "zustand";

export type OutputTab = "notes" | "mindmap";

interface UIState {
	// State
	activeOutputTab: OutputTab;

	// Actions
	setActiveOutputTab: (tab: OutputTab) => void;
}

export const useUIStore = create<UIState>((set) => ({
	// Initial state
	activeOutputTab: "notes",

	// Actions
	setActiveOutputTab: (tab) => set({ activeOutputTab: tab }),
}));

```

### <a id="src-mocks-browser-ts"></a>src/mocks/browser.ts

```plaintext
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

```

### <a id="src-mocks-handlers-ts"></a>src/mocks/handlers.ts

```plaintext
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

```

### <a id="src-mocks-index-ts"></a>src/mocks/index.ts

```plaintext
// This should only be imported in development mode
if (process.env.NODE_ENV === "development") {
	// Only in browser environment
	if (typeof window !== "undefined") {
		// Start mock service worker
		import("./browser")
			.then(async ({ startWorker }) => {
				await startWorker();
				console.log("[MSW] Mock API initialized");
			})
			.catch((error) => {
				console.error(
					"[MSW] Failed to initialize mock service worker:",
					error
				);
			});
	}
}

```

### <a id="src-tailwind-config-ts"></a>src/tailwind.config.ts

```plaintext

```

### <a id="tsconfig-json"></a>tsconfig.json

```json
{
  "compilerOptions": {
    "target": "ES2017",
    "lib": ["dom", "dom.iterable", "esnext"],
    "allowJs": true,
    "skipLibCheck": true,
    "strict": true,
    "noEmit": true,
    "esModuleInterop": true,
    "module": "esnext",
    "moduleResolution": "bundler",
    "resolveJsonModule": true,
    "isolatedModules": true,
    "jsx": "preserve",
    "incremental": true,
    "plugins": [
      {
        "name": "next"
      }
    ],
    "paths": {
      "@/*": ["./src/*"]
    }
  },
  "include": ["next-env.d.ts", "**/*.ts", "**/*.tsx", ".next/types/**/*.ts"],
  "exclude": ["node_modules"]
}

```

