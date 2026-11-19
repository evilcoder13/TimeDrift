#!/usr/bin/env bash
set -euo pipefail

cd "$(dirname "$0")"

PORT="${PORT:-8000}"
HOST="${HOST:-0.0.0.0}"

echo "===================================================="
echo "  Starting TimeDrift Lightweight LLM Worker         "
echo "  Port: http://$HOST:$PORT/v1                       "
echo "===================================================="

# Create venv if not exists
if [ ! -d ".venv" ]; then
  echo "[*] Creating Python virtual environment..."
  python3 -m venv .venv
fi

source .venv/bin/activate

# Install requirements if not installed
if ! python3 -c "import llama_cpp" 2>/dev/null; then
  echo "[*] Installing llama-cpp-python and dependencies..."
  pip install --no-cache-dir -r requirements.txt
fi

exec uvicorn main:app --host "$HOST" --port "$PORT" --workers 1
