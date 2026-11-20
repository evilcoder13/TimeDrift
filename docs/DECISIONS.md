# Architecture Decision Records

Format: Context → Decision → Consequences. Add new ADRs at the bottom and never edit accepted ones. If a decision changes, write a new ADR that supersedes the old one.

## ADR-001 Web app with Next.js PWA — Accepted
- Context: we want one codebase for desktop and mobile, and a small team.
- Decision: Next.js 15 App Router + TypeScript + Tailwind, installable as a PWA.
- Consequences: no native app store presence for now. Background audio on iOS is limited while the screen is locked (see the PRD known limitations).

## ADR-002 SQLite + Prisma, single server — Accepted
- Context: MVP, low write volume, and we want minimal ops.
- Decision: SQLite file DB via Prisma. Files live on local disk under `storage/`.
- Consequences: the app can't easily scale to several servers. Migrating to Postgres later is just a Prisma provider change.

## ADR-003 MusicGen-small on CPU, seamless short loops — Accepted
- Context: there is no GPU, and the generator must be local and free.
- Decision: `facebook/musicgen-small` via HF transformers in a Python FastAPI worker. Generate 30–60s, crossfade the tail into the head so it loops seamlessly, and export `.ogg` (Vorbis q5) at 32 kHz mono.
- Consequences: about 2–6 min per clip, so jobs run one at a time in a queue. Long sessions are made by gapless looping.

## ADR-004 Scene generation via omlx LLM — Accepted
- Context: `line-art-animation` is a library plus instructions written for an AI coding assistant. Scenes have to be written as code. A local model server already exists (omlx).
- Decision: call omlx through its OpenAI-compatible API. Use the smallest capable model first (`Qwen3.5-4B-3D-Coder`) and fall back to `gemma-4-12b-4bit` after the retries fail. All of this is configurable through env.
- Consequences: output quality varies, so we need a validation pipeline and an admin edit step.

## ADR-005 Live SVG in a sandboxed iframe — Accepted
- Decision: scenes are bundled into a single ES module and run in `scene-host.html` with `sandbox="allow-scripts"` and the CSP `default-src 'none'; script-src 'self'; style-src 'unsafe-inline'`. The host talks to the scene only through `postMessage`.
- Consequences: very little bandwidth, sharp at any size, and generated code stays isolated.

## ADR-006 Guest access, login only for Pro — Accepted
- Decision: Auth.js with email magic link and Google. Guests use free features without an account.
- Consequences: guest preferences are kept in localStorage only.

## ADR-007 Mock payments behind an interface — Accepted
- Decision: a `PaymentProvider` interface with a `MockProvider`. Admin switches `isPro`/`proUntil` by hand. VNPay/MoMo providers come in a later phase.

## ADR-008 Fixed shared tag list — Accepted
- Decision: admins manage a fixed tag list with EN/VI names. Both music and scenes use it. It drives Jaccard-based template matching.

## ADR-009 Standalone Lightweight Local LLM Worker (llama.cpp) — Accepted
- Context: initially ADR-004 relied on an external LAN server running `omlx` at `http://10.1.123.123:8000/v1`. To allow fully autonomous, offline development and deployment without external hardware or heavy Docker runtimes like Ollama, a self-contained local LLM solution is required.
- Decision: introduce `worker/llm/` as an independent microservice mirroring `worker/music/`. It runs Python FastAPI with `llama-cpp-python` compiling llama.cpp C++ routines, hosting lightweight 4-bit quantized GGUF models (such as `Qwen2.5-Coder-1.5B-Instruct-GGUF` or `3B`). It exposes standard OpenAI-compatible endpoints (`/v1/chat/completions`, `/v1/models`, `/health`) on port `8000`.
- Consequences:
  1. The entire stack can run completely offline on local CPU / Apple Silicon using under 1.5 GB RAM.
  2. The service can run either directly from the terminal via `./worker/llm/run.sh` or inside Docker via `docker-compose.local-ai.yml`.
  3. Configurable via `LLM_BASE_URL` with backward compatibility for remote omlx servers when desired.

