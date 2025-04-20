import os

import uvicorn

if __name__ == "__main__":
    # Make sure logging directory exists
    if not os.path.exists("logging"):
        os.makedirs("logging")

    # Run the FastAPI application
    uvicorn.run("app.main:app", host="0.0.0.0", port=8000, reload=True)
