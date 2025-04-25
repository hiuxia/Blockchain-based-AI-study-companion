#!/usr/bin/env zsh

set -e

cd "backend/benchmark/scripts"
cd ..
echo $PWD

source $(conda info --base)/etc/profile.d/conda.sh
conda activate nlp_backend

python test_response_quality.py
