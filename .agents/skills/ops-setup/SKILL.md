---
name: ops-setup
description: Verify and prepare the TimeDrift runtime environment (Node 22.18+, Python 3.11, ffmpeg, Chromium, omlx reachability), run services, deploy with Docker Compose, and manage backups. Use for OPS tasks or when the environment is broken.
---
# Ops Setup

## Prerequisite check
```bash
node -v            # >= 22.18
python3.11 -V
ffmpeg -version | head -1
npx playwright --version
curl -s -m 3 http://10.1.123.123:8000/v1/models | jq -r '.data[].id'
free -g            # >= 4 GB free for MusicGen-small CPU
```
Record the results (date, versions, available models) in `docs/ops/SETUP.md`.

## Env
Copy `.env.example` to `.env`. Required: `DATABASE_URL`, `AUTH_SECRET` (`openssl rand -base64 32`), `LLM_*`, `MUSIC_WORKER_URL`, `ADMIN_EMAILS`. Never commit `.env`.

## Services
- web: `npm run build && npm start` (:3000)
- worker: `worker/music/run.sh` (:8100, bound to 127.0.0.1 only)
- Compose (OPS-2): two services sharing the `./storage` and `./data` volumes. The worker has no public port. Restart policy `unless-stopped`.

## Backups (OPS-3)
Every night: `sqlite3 data/timedrift.db ".backup data/backup-$(date +%F).db"` plus an rsync of `storage/`. Keep 14 days. Test a restore every month.

## Health
`GET /api/admin/health` reports the DB, the worker and omlx. Alert if any of them is down for more than 5 min.
