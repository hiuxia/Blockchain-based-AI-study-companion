! temporarily not used in this project.

# Backend Conventions

## Python & FastAPI

- Use Python 3.10+.
- Follow PEP 8 guidelines, enforced by Black.
- Use `async def` for all API endpoints and I/O-bound operations.
- Utilize FastAPI's dependency injection (`Depends`) for services and database sessions.
- Structure routers logically, typically one file per resource type in `app/api/`.
- Use Pydantic models defined in `app/models/schemas.py` for request/response validation.

## SQLAlchemy

- Define database models in `app/models/` inheriting from a declarative base.
- Use asynchronous database sessions if using an async driver (e.g., `asyncpg`).
- Keep database logic within the `app/crud/` layer. Services should call CRUD functions.
- Handle database session lifecycle appropriately (e.g., using middleware or dependencies).

## LangChain

- Configure the LLM client (`ChatGoogleGenerativeAI`) in `app/langchain_agent/llm_config.py`.
- Define custom tools in `app/langchain_agent/tools.py` following LangChain's `BaseTool` structure or using the `@tool` decorator.
- Implement memory strategies (e.g., `ConversationSummaryBufferMemory`) in `app/langchain_agent/memory.py`.
- Structure prompts clearly in `app/langchain_agent/prompts.py`.
- The main agent orchestration logic resides in `app/langchain_agent/agent.py`.

## Error Handling

- Use FastAPI's `HTTPException` for standard HTTP errors in the API layer.
- Implement custom exception handlers for application-specific errors if needed.
- Return meaningful error messages in API responses.

## Logging

- Configure structured logging (e.g., using Python's `logging` module).
- Log important events, errors, and relevant context (like task IDs).
