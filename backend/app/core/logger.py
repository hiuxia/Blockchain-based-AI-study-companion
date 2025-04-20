import datetime
import logging
import os
from logging.handlers import RotatingFileHandler
from pathlib import Path

# Create logging directory if it doesn't exist
LOG_DIR = Path("logging")
if not LOG_DIR.exists():
    LOG_DIR.mkdir(parents=True, exist_ok=True)

# Generate log file name with date stamp
current_date = datetime.datetime.now().strftime("%Y-%m-%d")
LOG_FILE = LOG_DIR / f"app_{current_date}.log"


# Configure logger
def setup_logger():
    """Configure the application logger."""
    logger = logging.getLogger("app")
    logger.setLevel(logging.DEBUG)

    # File handler for all logs (DEBUG and above)
    file_handler = RotatingFileHandler(
        LOG_FILE,
        maxBytes=10 * 1024 * 1024,  # 10MB
        backupCount=5,
    )
    file_handler.setLevel(logging.DEBUG)
    file_format = logging.Formatter(
        "%(asctime)s - %(name)s - %(levelname)s - %(module)s:%(lineno)d - %(message)s"
    )
    file_handler.setFormatter(file_format)

    # Stream handler (console) for INFO and above
    console_handler = logging.StreamHandler()
    console_handler.setLevel(logging.INFO)
    console_format = logging.Formatter("%(levelname)s - %(message)s")
    console_handler.setFormatter(console_format)

    # Add handlers to logger
    logger.addHandler(file_handler)
    logger.addHandler(console_handler)

    return logger


# Create the application logger
logger = setup_logger()
