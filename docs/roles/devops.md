# Role: DevOps
**Mission:** A reproducible environment, a simple deploy and safe data.

**Reads:** [SETUP](../ops/SETUP.md), [ARCHITECTURE](../architecture/ARCHITECTURE.md)
**Tasks:** OPS-1 prerequisites and env · OPS-2 Docker Compose deploy · OPS-3 backups and monitoring
**Responsibilities**
- Make sure the target box can reach omlx (`10.1.123.123:8000`) and has Node 22.18+, Python 3.11, ffmpeg and Chromium.
- Run the web app and the worker under supervision, and check `/api/admin/health`.
- Back up the SQLite file and `storage/` every night, and test the restore.
