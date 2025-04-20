#!/usr/bin/env python3
"""
A simple script to list all available Google Gemini models.
This helps identify which models can be used with langchain_google_genai.
"""

import os
import sys

from dotenv import load_dotenv

# Load environment variables from .env file
load_dotenv()

# Check if GEMINI_API_KEY is available
api_key = os.environ.get("GEMINI_API_KEY")
if not api_key:
    print("Error: GEMINI_API_KEY environment variable not found.")
    print("Make sure you have a .env file with GEMINI_API_KEY set.")
    sys.exit(1)

try:
    import google.generativeai as genai
except ImportError:
    print("Error: google-generativeai package is not installed.")
    print("Install it using: pip install google-generativeai")
    sys.exit(1)

# Configure the Gemini API
genai.configure(api_key=api_key)


def main():
    try:
        # List available models
        models = genai.list_models()

        print(f"\n{'=' * 70}")
        print("AVAILABLE GEMINI MODELS".center(70))
        print(f"{'=' * 70}")

        for model in models:
            if "generateContent" in model.supported_generation_methods:
                print(f"\nModel Name: {model.name}")
                print(f"Display Name: {model.display_name}")
                print(f"Description: {model.description}")
                print(
                    f"Generation Methods: {', '.join(model.supported_generation_methods)}"
                )
                print(f"Input Token Limit: {model.input_token_limit}")
                print(f"Output Token Limit: {model.output_token_limit}")
                print("-" * 70)

        print("\nUse these model names in your application config.\n")

    except Exception as e:
        print(f"Error occurred while fetching models: {str(e)}")
        sys.exit(1)


if __name__ == "__main__":
    main()
