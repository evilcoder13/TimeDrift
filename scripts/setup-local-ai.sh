#!/usr/bin/env bash
set -euo pipefail

echo "===================================================="
echo "  TimeDrift - Local AI Stack Initializer (Docker)  "
echo "===================================================="

# Start containers
docker compose -f docker-compose.local-ai.yml up -d llm

echo "Waiting for local LLM container (Ollama) to be ready..."
until docker exec timedrift_llm ollama list > /dev/null 2>&1; do
  sleep 2
done

# Pull compact coding model (Qwen 2.5 Coder 3B or 1.5B)
echo "Pulling local coder model (qwen2.5-coder:3b)..."
docker exec timedrift_llm ollama pull qwen2.5-coder:3b

echo "Starting full TimeDrift stack (web + music worker + local llm)..."
docker compose -f docker-compose.local-ai.yml up -d

echo "===================================================="
echo "  All services running locally on Docker!           "
echo "  Web UI:       http://localhost:3000              "
echo "  Music Worker: http://localhost:8100              "
echo "  Local LLM:    http://localhost:11434/v1          "
echo "===================================================="
