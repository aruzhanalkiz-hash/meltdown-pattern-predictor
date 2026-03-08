#!/bin/bash
# Run training. Install deps first if needed.
set -e
cd "$(dirname "$0")"

if ! python3 -c "import sklearn" 2>/dev/null; then
    echo "Installing dependencies..."
    python3 -m pip install -r requirements.txt
fi

python3 train.py "$@"
