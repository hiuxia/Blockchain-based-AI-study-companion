# Project Principles: AI Study Companion

## Core Goal

To develop an application that assists students by automatically generating structured notes and interactive mindmaps from uploaded educational materials (PDFs initially).

## Key Features

- PDF Upload and Management: Users can upload multiple PDF documents.
- Source Selection: Users can select specific uploaded documents to be processed.
- Asynchronous Processing: Summarization and mindmap generation occur in the background.
- Output Display: View generated content as structured Markdown notes and an interactive Markmap visualization.
- Chat with selected files: Chat interface to ask questions based on the selected sources with citations.

## Core Principles

- **Accuracy:** Generated summaries must accurately reflect the content of the source documents. The LLM should be instructed not to introduce external information.
- **Usability:** The interface should be intuitive and easy for students to use.
- **Efficiency:** Backend processing should be reasonably fast, and the frontend should provide feedback on task status.
- **Modularity:** Code should be organized into logical modules (API, services, agent, UI components).
- **Maintainability:** Code should be well-documented, follow consistent standards, and be easy to update.
