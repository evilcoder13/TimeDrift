# AGENTS.md — TimeDrift

Instructions for AI coding agents (and humans) working in this repo.

## Project in one line
A relax web app: animated line-art scenes + looping AI music, played on a timer. Admins generate the content, and users play it. Read [docs/PLAN.md](docs/PLAN.md) first.

## Current stage
**P0: documentation only.** Do not scaffold or write app code unless a task in [docs/BACKLOG.md](docs/BACKLOG.md) is marked `READY` and assigned to you.

## Doc map (read before working)
| Need | Read |
|---|---|
| What & why | [docs/product/PRD.md](docs/product/PRD.md) |
| Exact rules & acceptance criteria | [docs/ba/REQUIREMENTS.md](docs/ba/REQUIREMENTS.md) |
| Architecture, data, API | [docs/architecture/](docs/architecture/) |
| Decisions (do not re-litigate) | [docs/DECISIONS.md](docs/DECISIONS.md) |
| UI/UX | [docs/design/](docs/design/) |
| Music generation | [docs/audio/AUDIO_GUIDE.md](docs/audio/AUDIO_GUIDE.md) |
| Scene generation | [docs/scenes/SCENE_GUIDE.md](docs/scenes/SCENE_GUIDE.md) |
| Tags & seed content | [docs/content/](docs/content/) |
| Who does what | [docs/roles/](docs/roles/) |
| Subagents & Skills | [.agents/agents/](.agents/agents/) · [.agents/skills/](.agents/skills/) |
| Tasks | [docs/BACKLOG.md](docs/BACKLOG.md) |
| Tests | [docs/qa/TEST_PLAN.md](docs/qa/TEST_PLAN.md) |
| Setup / env | [docs/ops/SETUP.md](docs/ops/SETUP.md) |

## Stack (fixed)
- Next.js 15 App Router, TypeScript strict, Tailwind, Prisma + SQLite, Auth.js, next-intl, zod.
- Python 3.11 FastAPI worker in `worker/music/` (transformers MusicGen-small, CPU torch on `:8100`).
- LLM: Local worker in `worker/llm/` (llama-cpp-python running GGUF on `:8000`), or OpenAI-compatible server (omlx). Configured via `LLM_BASE_URL`.
- Scene library: `vendor/line-art-animation/` (MIT, from github.com/JDhruv14/line-art-animation). Do not modify it. Wrap it instead.

## Planned layout
```
src/app/[locale]/...     # user pages: /, /play, /custom, /playlists, /account
src/app/[locale]/admin/  # admin pages
src/app/api/...          # route handlers
src/server/              # domain logic (rules, scene-gen, music-client, payments)
src/lib/                 # shared utils, zod schemas
prisma/schema.prisma
messages/en.json, vi.json
public/scene-host.html   # sandboxed scene runtime
worker/music/            # Python MusicGen service (:8100)
worker/llm/              # Python llama.cpp local LLM service (:8000)
vendor/line-art-animation/
seed/                    # seed scenes (TS), tags, prompts
storage/                 # generated audio + bundles (gitignored)
```

## Non-negotiable rules
1. **Enforce business rules on the server** (timer limits, Pro gating, 720-min playlist cap). The UI only mirrors them. Rule IDs R1–R12 are in REQUIREMENTS.md, so cite them in code comments.
2. **Generated scene code is untrusted.** Run it only inside `scene-host.html` with `sandbox="allow-scripts"` (never `allow-same-origin`) and a CSP with no network access.
3. The scene module contract is in SCENE_GUIDE.md §2. Do not change it without an ADR.
4. Every user-facing string goes through next-intl, with both `en` and `vi` keys.
5. Keep it small. No new dependency without a reason in the PR description.
6. When you finish a task, update its status in BACKLOG.md. If a decision changed, add an ADR in DECISIONS.md.

## Commands (once scaffolded)
```
npm run dev | typecheck | lint | test | e2e
npx prisma migrate dev && npm run seed
cd worker/music && ./run.sh            # music worker on :8100
```

## Definition of Done
Typecheck, lint and tests all pass. EN/VI strings exist. The acceptance criteria in REQUIREMENTS.md are met. The docs are updated.
