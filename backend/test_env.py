import os

from app.core.config import settings
from app.core.logger import logger


def test_env_vars():
    print(f"Direct environment access: {os.environ.get('GEMINI_API_KEY') is not None}")
    print(f"Settings access: {settings.gemini_api_key is not None}")
    print(f"GEMINI_API_KEY from settings: {settings.gemini_api_key}")
    print(f"GEMINI_API_KEY from os.environ: {os.environ.get('GEMINI_API_KEY')}")


if __name__ == "__main__":
    test_env_vars()
