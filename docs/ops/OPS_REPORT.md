# Ops Report: Environment Verification & Configuration (OPS-1)

**Execution Date:** 2026-11-18  
**Operator:** DevOps Engineer Subagent  
**Scope:** Host environment prerequisites, omlx network connectivity & latency benchmark, `.env` / `.env.example` harmonization.  
**Reference Docs:** [P0_URD.md §3.2](file:///Users/daothang/Documents/Projects/TimeDrift/docs/ba/P0_URD.md), [SETUP.md](file:///Users/daothang/Documents/Projects/TimeDrift/docs/ops/SETUP.md), [REQUIREMENTS.md §R10-R11](file:///Users/daothang/Documents/Projects/TimeDrift/docs/ba/REQUIREMENTS.md)

---

## 1. Executive Summary

| Requirement Component | Target Spec | Host Detection | Status | Action / Remediation |
|---|---|---|---|---|
| **Node.js** | `>= 22.18.0` | `v22.23.5` | **PASSED** | Compatible with Next.js 15 & `line-art-animation`. |
| **npm** | `>= 10.0.0` | `10.9.9` | **PASSED** | Package manager ready. |
| **Python** | `3.11.x` | `3.11.13` (via `uv` managed cpython) | **PASSED** (Managed) | Available at `/Users/daothang/.local/share/uv/python/cpython-3.11.13-macos-aarch64-none/bin/python3.11`. System default is Python 3.9.6. Worker setup must use `uv venv --python 3.11`. |
| **FFmpeg** | `6.0+` / `7.0+` | Not found in system PATH | **ACTION REQUIRED** | Audio crossfading & LUFS normalization (R10) require FFmpeg. Must install via Homebrew/pkg or include static binary. |
| **Chromium** | Headless Chrome | Not installed on system | **PLANNED** | Will be provisioned via `npx playwright install chromium` upon P1 scaffold. |
| **SQLite3** | `>= 3.40.0` | `3.51.0` (`/usr/bin/sqlite3`) | **PASSED** | macOS native SQLite binary verified. |
| **omlx Connectivity** | `http://10.1.123.123:8000/v1` | HTTP 200 OK, Latency ~33.5ms | **PASSED** | Fast local connectivity confirmed. All required models present. |
| **Memory / CPU** | $\ge 4\text{ GB free RAM}$, 8 cores | 8 GB total RAM, 8 Apple Silicon cores | **WARNING** | Physical memory has 8 GB total (~7.2 GB allocated with active compression/swap). MusicGen CPU inference must be monitored closely to prevent OOM. |

---

## 2. Detailed Verification Logs

### 2.1. Node.js & npm
- `node -v`: `v22.23.5`
- `npm -v`: `10.9.9`
- Status: Meets minimum `v22.0.0` and target `v22.18.0+`.

### 2.2. Python Environment
- System default: `/usr/bin/python3` -> `Python 3.9.6` (Incompatible with MusicGen / PyTorch target)
- Python 3.11 installation located:
  - Path: `/Users/daothang/.local/share/uv/python/cpython-3.11.13-macos-aarch64-none/bin/python3.11`
  - Version: `Python 3.11.13`
  - Recommendation: Worker bootstrap script (`worker/music/run.sh`) or setup command should invoke:
    ```bash
    uv venv .venv --python 3.11
    ```

### 2.3. Audio Pipeline Tools (FFmpeg)
- Check command: `which ffmpeg`
- Result: Not found in standard paths (`/usr/local/bin`, `/opt/homebrew/bin`, `/usr/bin`).
- Impact: Audio seamless looping crossfades (3s), fade-in/fade-out, and LUFS normalization required by R10 will fail without FFmpeg.
- Recommendation: Install ffmpeg or provide a standalone binary in `bin/` or Docker container in OPS-2.

### 2.4. Headless Browser (Chromium)
- Check command: `which chromium google-chrome`
- Result: Not present as system app.
- Impact: Scene headless render pass validation (R11) requires Chromium.
- Remediation: Documented standard `npx playwright install chromium` during app scaffolding (`npm i && npx playwright install chromium`).

### 2.5. SQLite Database
- Check command: `/usr/bin/sqlite3 --version`
- Output: `3.51.0 2025-06-12 13:14:41 f0ca7bba1c5e232e5d279fad6338121ab55af0c8c68c84cdfb18ba5114dcaapl (64-bit)`
- Status: Exceeds minimum requirement of `3.40+`.

### 2.6. Local LLM Server (omlx) Connectivity & Models
- Endpoint: `http://10.1.123.123:8000/v1/models`
- HTTP Status: `200 OK`
- Latency (`TIME_TOTAL`): `0.0335s` (33.5 ms, well within the 500 ms SLA in URD §3.2.1)
- Catalog of reported models:
  1. `Qwen3.5-4B-3D-Coder` (**Primary Scene Model** — Confirmed available)
  2. `gemma-4-12b-4bit` (**Fallback Model** — Confirmed available)
  3. `Qwen3.5-4B-MLX-4bit`
  4. `gemma-3-4b-it-qat-4bit`
  5. `Jev-Style-Qwen3.5-2B-Decision-MLX-bf16`
  6. `Qwen2.5-1.5B-Instruct-4bit`
  7. `DeepSeek-V4-Pro-Qwen3.5-4B-UNCENSORED-heretic` (Blocked from usage per system rules)

---

## 3. Environment Configuration (`.env` & `.env.example`)

Both [.env.example](file:///Users/daothang/Documents/Projects/TimeDrift/.env.example) and [.env](file:///Users/daothang/Documents/Projects/TimeDrift/.env) have been aligned with URD §3.2.2 and SETUP.md:
- Generated secure cryptographic random secret for `AUTH_SECRET`: `nABCxaHOYhDKyqT0bVPKmND/Fu1fukeZHyL5e43yNE4=`
- Specified `DATABASE_URL="file:./data/timedrift.db"`
- Configured LLM parameters: `LLM_BASE_URL="http://10.1.123.123:8000/v1"`, `LLM_MODEL="Qwen3.5-4B-3D-Coder"`, `LLM_FALLBACK_MODEL="gemma-4-12b-4bit"`, `LLM_TIMEOUT_MS=60000`
- Configured Worker parameters: `MUSIC_WORKER_URL="http://127.0.0.1:8100"`, `MUSIC_WORKER_TIMEOUT_MS=120000`
- Configured Storage paths: `STORAGE_DIR="./storage"`, `STORAGE_AUDIO_DIR="./storage/audio"`, `STORAGE_BUNDLES_DIR="./storage/bundles"`
- Configured Business Rule limits: `NEXT_PUBLIC_FREE_MAX_MINUTES=15`, `NEXT_PUBLIC_PRO_MAX_MINUTES=720`

---

## 4. Next Steps & Recommendations for P1 Kickoff

1. **Audio Worker**: When creating `worker/music`, ensure setup instructions reference `uv` to use Python 3.11.13 (`uv venv .venv --python 3.11`).
2. **FFmpeg Provisioning**: Provide FFmpeg either via developer Homebrew (`brew install ffmpeg`) or package a static binary / Docker container for worker audio post-processing.
3. **Playwright Provisioning**: Ensure `package.json` postinstall or setup script runs `npx playwright install chromium`.
