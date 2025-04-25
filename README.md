# AI Study Companion

[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](https://opensource.org/licenses/MIT)

## 📚 Description

AI Study Companion is an innovative application designed to help students process educational materials more efficiently. The system allows users to upload PDF documents, which are then automatically processed to generate structured notes and interactive mindmaps. The application also features a chat interface that allows users to ask questions about the uploaded content with accurate citations.

The project combines modern web technologies with AI capabilities to create a seamless experience for studying and note-taking.

## 📋 Table of Contents

- [Features](#-features)
- [Technology Stack](#-technology-stack)
- [Installation](#-installation)
- [Usage](#-usage)
- [API Endpoints](#-api-endpoints)
- [Configuration](#-configuration)
- [Contributing](#-contributing)
- [License](#-license)

## ✨ Features

- **PDF Upload and Management**: Users can upload, manage, and rename multiple PDF documents
- **Source Selection**: Select specific uploaded documents to be processed
- **Asynchronous Processing**: Documents are processed in the background without blocking the UI
- **Structured Notes**: Generated content is displayed as structured Markdown notes
- **Interactive Mindmaps**: Visual representation of content using Markmap visualization
- **Chat Interface**: Ask questions based on selected sources with accurate citations
- **Responsive UI**: Intuitive interface with resizable panels for customized workspace

## 🛠️ Technology Stack

### Backend
- **Language**: Python
- **Framework**: FastAPI
- **LLM Integration**: LangChain
- **LLM API**: Google Gemini API (using `gemini-flash` model)
- **Database**: SQLite (via SQLAlchemy ORM)
- **PDF Parsing**: PyPDF

### Frontend
- **Framework**: Next.js (App Router)
- **Language**: TypeScript
- **Styling**: Tailwind CSS
- **State Management**: Zustand
- **Mindmap Visualization**: Markmap.js / `markmap-view` library

### Development & Tooling
- **Version Control**: Git
- **Package Managers**: `pip` (Backend), `npm` (Frontend)
- **Environment Management**: `.env` files

## 📥 Installation

### Prerequisites
- Python 3.10+
- Node.js 18+
- npm or yarn

### Backend Setup

1. Clone the repository
   ```bash
   git clone https://github.com/yourusername/ai-study-companion.git
   cd ai-study-companion
   ```

2. Set up Python virtual environment
   ```bash
   cd backend
   python -m venv backend-env
   source backend-env/bin/activate  # On Windows: backend-env\Scripts\activate
   ```

3. Install Python dependencies
   ```bash
   pip install -r requirements.txt
   ```

4. Create a `.env` file in the backend directory with the following contents:
   ```
   GOOGLE_API_KEY=your_google_gemini_api_key
   DATABASE_URL=sqlite:///documents.db
   ```

### Frontend Setup

1. Navigate to the frontend directory
   ```bash
   cd ../frontend
   ```

2. Install Node.js dependencies
   ```bash
   npm install
   # or
   yarn install
   ```

## 🚀 Usage

### Starting the Backend Server

```bash
cd backend
bash run_server.sh
# or manually
source backend-env/bin/activate  # On Windows: backend-env\Scripts\activate
uvicorn app.main:app --host 0.0.0.0 --port 8000
```

The backend server will start at http://localhost:8000

### Starting the Frontend Development Server

```bash
cd frontend
npm run dev
# or
yarn dev
```

The frontend development server will start at http://localhost:3000

### Application Workflow

1. Upload PDF documents through the Sources panel
2. Select the documents you want to process
3. Click the "Generate" button to process the selected documents
4. View the generated notes in the center panel
5. Use the mindmap visualization for an interactive overview
6. Ask questions about the content using the chat interface

## 🔄 API Endpoints

The backend API provides the following endpoints:

### Health Check
- `GET /health` - Check if the backend is running

### File Management
- `POST /sources` - Upload a PDF file
- `GET /sources` - List all uploaded files
- `GET /sources/{source_id}` - Get metadata for a specific file
- `DELETE /sources/{source_id}` - Delete a file
- `PATCH /sources/{source_id}` - Rename a file

### Document Processing
- `POST /process` - Process selected documents to generate notes and mindmaps

### Notes and Summaries
- `GET /notes` - Get all generated notes
- `GET /summaries` - Get all generated summaries

### Chat/Q&A
- `POST /qa` - Ask questions about the selected documents

## ⚙️ Configuration

### Backend Configuration

The backend uses environment variables for configuration. Create a `.env` file in the `backend` directory with the following variables:

```
GOOGLE_API_KEY=your_google_gemini_api_key
DATABASE_URL=sqlite:///documents.db
```

### Frontend Configuration

Create a `.env.local` file in the `frontend` directory:

```
NEXT_PUBLIC_API_URL=http://localhost:8000
```

## 🤝 Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📄 License

This project is licensed under the MIT License - see the LICENSE file for details.
