# Setup & Environment (Owner: DevOps)

## Prerequisites
- Node ≥ 22.18, npm
- Python 3.11, ffmpeg (for ogg encode), ~4 GB free RAM
- Chromium (installed via `npx playwright install chromium`) for headless scene validation
- Local LLM Worker: `worker/llm/` (llama.cpp GGUF, ~1 GB RAM) or network access to an OpenAI-compatible server (e.g. omlx)

### Local LLM Engine (`worker/llm/`)
TimeDrift includes an embedded, lightweight LLM server in `worker/llm/` powered by `llama-cpp-python`. It downloads and executes `Qwen2.5-Coder-1.5B-Instruct-GGUF` (or `3B`) on CPU, listening on port `8000`. You can also point to external omlx servers via `LLM_BASE_URL`.

## .env.example
```
DATABASE_URL="file:./data/timedrift.db"
STORAGE_DIR="./storage"
AUTH_SECRET="change-me"
AUTH_GOOGLE_ID=""
AUTH_GOOGLE_SECRET=""
EMAIL_SERVER="smtp://user:pass@smtp.example.com:587"
EMAIL_FROM="TimeDrift <no-reply@example.com>"
LLM_BASE_URL="http://127.0.0.1:8000/v1"
LLM_API_KEY="not-needed"
LLM_MODEL="default"
LLM_FALLBACK_MODEL="default"
MUSIC_WORKER_URL="http://127.0.0.1:8100"
ADMIN_EMAILS="you@example.com"   # promoted to ADMIN on first login
```

## Running Locally (Terminal)
```bash
# 1. Install dependencies & initialize database
npm install && npx playwright install chromium
npx prisma migrate dev && npm run seed

# 2. Start MusicGen Worker (port 8100)
cd worker/music && ./run.sh

# 3. Start Lightweight LLM Worker (port 8000)
cd worker/llm && ./run.sh

# 4. Start Web Application (port 3000)
npm run dev
```

## Running with Docker (Fully Offline Local AI Stack)
```bash
# Run web + music worker + local llama.cpp worker in a private docker network:
docker compose -f docker-compose.local-ai.yml up -d
```

## Ops
- Backup: nightly copy of `data/timedrift.db` + `storage/` (task OPS-3).
- Deploy target: single Linux box / Docker Compose (web + worker). TBD in OPS-2.
- `.gitignore`: `storage/`, `data/`, `.env`, `.venv/`, `captures/`.
