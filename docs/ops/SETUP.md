# Setup & Environment (Owner: DevOps)

## Prerequisites
- Node ≥ 22.18 (required by line-art-animation), npm
- Python 3.11, ffmpeg (for ogg encode), ~4 GB free RAM for MusicGen-small CPU
- Chromium (Playwright installs it) for scene validation
- Network access to omlx: `curl http://10.1.123.123:8000/v1/models`

### Available omlx models (checked 2026-11-12)
`Qwen3.5-4B-3D-Coder` (default scene model), `Qwen3.5-4B-MLX-4bit`, `gemma-3-4b-it-qat-4bit`, `gemma-4-12b-4bit` (fallback), `Jev-Style-Qwen3.5-2B-Decision-MLX-bf16`, `DeepSeek-V4-Pro-Qwen3.5-4B-UNCENSORED-heretic` (do not use).
Task ML-1 benchmarks the 4B options on 5 seed prompts and confirms the default.

## .env.example
```
DATABASE_URL="file:./data/timedrift.db"
STORAGE_DIR="./storage"
AUTH_SECRET="change-me"
AUTH_GOOGLE_ID=""
AUTH_GOOGLE_SECRET=""
EMAIL_SERVER="smtp://user:pass@smtp.example.com:587"
EMAIL_FROM="TimeDrift <no-reply@example.com>"
LLM_BASE_URL="http://10.1.123.123:8000/v1"
LLM_API_KEY="not-needed"
LLM_MODEL="Qwen3.5-4B-3D-Coder"
LLM_FALLBACK_MODEL="gemma-4-12b-4bit"
MUSIC_WORKER_URL="http://127.0.0.1:8100"
ADMIN_EMAILS="you@example.com"   # promoted to ADMIN on first login
```

## Run (after scaffolding)
```
npm i && npx playwright install chromium
npx prisma migrate dev && npm run seed
cd worker/music && python -m venv .venv && . .venv/bin/activate \
  && pip install -r requirements.txt --extra-index-url https://download.pytorch.org/whl/cpu && ./run.sh
npm run dev
```

## Ops
- Backup: nightly copy of `data/timedrift.db` + `storage/` (task OPS-3).
- Deploy target: single Linux box / Docker Compose (web + worker). TBD in OPS-2.
- `.gitignore`: `storage/`, `data/`, `.env`, `.venv/`, `captures/`.
