#!/bin/bash

# Activate virtual environment if it exists
if [ -d "backend-env" ]; then
    source backend-env/bin/activate
    echo "Activated virtual environment"
fi

# Run the server
python start.py 