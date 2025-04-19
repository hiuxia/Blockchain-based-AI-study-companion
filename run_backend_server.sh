#!/usr/bin/env zsh

cd ./backend

# Use source to properly activate the conda environment
source $(conda info --base)/etc/profile.d/conda.sh
conda activate nlp_backend

which uvicorn

# Add host value (typically 0.0.0.0 or 127.0.0.1)
uvicorn app.main:app --host 0.0.0.0 --port 8000