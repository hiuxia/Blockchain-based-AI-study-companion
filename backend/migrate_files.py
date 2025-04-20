#!/usr/bin/env python
"""
File migration utility for AI Study Companion.

This script migrates files from potential old locations to the correct location
after the frontend and backend were merged.
"""

import logging
import os
import shutil
import sqlite3
from pathlib import Path

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s - %(levelname)s - %(message)s",
    handlers=[
        logging.FileHandler("logging/migration.log"),
        logging.StreamHandler(),
    ],
)
logger = logging.getLogger("migrate")

# Ensure logging directory exists
if not os.path.exists("logging"):
    os.makedirs("logging")

# Define possible file locations
# We'll search for files in these directories
POSSIBLE_PATHS = [
    "uploaded_sources",  # Old relative path
    "../uploaded_sources",  # Old path from backend dir
    "./uploaded_sources",  # Explicit current dir
    os.path.abspath("uploaded_sources"),  # Absolute path
]

# Get the absolute path to the backend directory
BACKEND_DIR = Path(__file__).resolve().parent
# Set the correct target directory (as defined in config.py)
TARGET_DIR = BACKEND_DIR / "uploaded_sources"


def ensure_target_dir():
    """Ensure target directory exists with correct permissions."""
    if not TARGET_DIR.exists():
        logger.info(f"Creating target directory: {TARGET_DIR}")
        TARGET_DIR.mkdir(parents=True, exist_ok=True)
        # Set permissions
        os.chmod(TARGET_DIR, 0o755)
    return TARGET_DIR


def get_sources_from_db():
    """Get all source IDs from the database."""
    db_path = BACKEND_DIR / "documents.db"
    if not db_path.exists():
        logger.error(f"Database not found at: {db_path}")
        return []

    try:
        logger.info(f"Connecting to database: {db_path}")
        conn = sqlite3.connect(db_path)
        cursor = conn.cursor()
        cursor.execute("SELECT id, filename FROM sources")
        sources = cursor.fetchall()
        logger.info(f"Found {len(sources)} sources in database")
        return sources
    except Exception as e:
        logger.error(f"Error reading from database: {e}")
        return []
    finally:
        if conn:
            conn.close()


def find_file_in_paths(source_id):
    """Search for a file in possible locations."""
    filename = f"{source_id}.pdf"
    found_paths = []

    for base_path in POSSIBLE_PATHS:
        path = Path(base_path) / filename
        if path.exists():
            found_paths.append(path)
            logger.info(f"Found file at: {path}")

    return found_paths


def migrate_files():
    """Migrate all files to the correct location."""
    # Ensure target directory exists
    target_dir = ensure_target_dir()
    logger.info(f"Target directory: {target_dir}")

    # Get sources from database
    sources = get_sources_from_db()
    if not sources:
        logger.warning("No sources found in database")
        return

    migrated = 0
    for source_id, filename in sources:
        logger.info(f"Processing source: {source_id} ({filename})")

        # Check if file already exists in target location
        target_path = target_dir / f"{source_id}.pdf"
        if target_path.exists():
            logger.info(f"File already exists at target location: {target_path}")
            continue

        # Find file in possible locations
        found_paths = find_file_in_paths(source_id)

        if not found_paths:
            logger.warning(f"File not found for source: {source_id} ({filename})")
            continue

        # Copy the first found file to target location
        try:
            source_path = found_paths[0]
            logger.info(f"Copying {source_path} -> {target_path}")
            shutil.copy2(source_path, target_path)
            logger.info(f"Successfully migrated file for source: {source_id}")
            migrated += 1
        except Exception as e:
            logger.error(f"Error migrating file: {e}")

    logger.info(
        f"Migration complete. Migrated {migrated} files out of {len(sources)} sources."
    )


if __name__ == "__main__":
    logger.info("Starting file migration")
    migrate_files()
    logger.info("Migration complete")
