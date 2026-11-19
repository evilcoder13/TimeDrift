#!/usr/bin/env bash
set -e

DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" >/dev/null 2>&1 && pwd)"
cd "$DIR"

PORT="${PORT:-8100}"
HOST="${HOST:-127.0.0.1}"

# Check virtual environment
if [ ! -d ".venv" ]; then
    echo "Creating virtual environment in $DIR/.venv using uv..."
    uv venv .venv --python 3.11 || python3 -m venv .venv
    source .venv/bin/activate
    uv pip install -r requirements.txt || pip install -r requirements.txt
else
    source .venv/bin/activate
fi

echo "Starting TimeDrift MusicGen Worker on http://$HOST:$PORT ..."
exec uvicorn main:app --host "$HOST" --port "$PORT"
