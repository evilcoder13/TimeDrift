# Role: DevOps
**Mission:** A reproducible environment, a simple deploy and safe data.

**Reads:** [SETUP](../ops/SETUP.md), [ARCHITECTURE](../architecture/ARCHITECTURE.md)
**Tasks:** OPS-1 prerequisites and env · OPS-2 Docker Compose deploy · OPS-3 backups and monitoring
**Responsibilities**
- Make sure the target box has Node 22.18+, Python 3.11, ffmpeg and Chromium; support both local LLM (`worker/llm/`) and remote endpoints.
- Run the web app, the music worker, and the LLM worker under supervision, and verify `/api/health`.
- Back up the SQLite file and `storage/` via automated atomic scripts (`scripts/backup-sqlite.sh`), and test the restore (`scripts/restore-sqlite.sh`).
- Maintain Docker configurations: `docker-compose.yml` and fully offline `docker-compose.local-ai.yml`.
