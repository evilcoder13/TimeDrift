# Backlog — Tasks by Role (Owner: PM)

Status: `TODO` · `READY` · `DOING` · `REVIEW` · `DONE`. Size: S ≤ ½ day, M ≤ 2 days, L ≤ 5 days.
`Deps` = task IDs that must be DONE first.

## P0 — Preparation (current)
| ID | Role | Task | Size | Deps | Status |
|---|---|---|---|---|---|
| PM-1 | PM | Write PRD, roadmap, backlog | M | — | DONE |
| BA-1 | BA | Business rules R1–R12, user stories, acceptance criteria | M | PM-1 | DONE |
| TL-1 | Tech Lead | Architecture, data model, API, ADRs, AGENTS.md | M | BA-1 | DONE |
| DIR-1 | Director | Creative brief, tag list, seed content list | M | PM-1 | DONE (draft) |
| DIR-2 | Director | Review & sign off all P0 docs | S | all P0 | DONE |
| DES-1 | Designer | Wireframes for every flow in UX_FLOWS (mobile + desktop) | L | BA-1 | DONE |
| DES-2 | Designer | Hi-fi screens + tokens + components (day/night) | L | DES-1, DIR-1 | DONE |
| DES-3 | Designer | App icon, PWA icons, splash, empty-state art | M | DES-2 | DONE |
| AUD-1 | Audio Maker | Benchmark MusicGen-small CPU on target box (time / 30 s clip), record in AUDIO_GUIDE | S | — | DONE |
| AUD-2 | Audio Maker | Generate & curate M1–M5 seed tracks (manual script ok) | M | AUD-1 | DONE |
| AUD-3 | Audio Maker | Expand prompt library to ≥ 3 prompts per tag | M | DIR-1 | DONE |
| SCN-1 | Scene Artist | Study lib, write condensed SKILL notes for the system prompt | S | — | DONE |
| SCN-2 | Scene Artist | Draft `scene.system.md` prompt + 5 test prompts | M | SCN-1 | DONE |
| ML-1 | ML Engineer | Benchmark omlx 4B models vs gemma-4-12b on SCN-2 prompts (pass rate, latency); confirm default | M | SCN-2 | DONE |
| BA-2 | BA | VI translation glossary + review copy | S | DES-2 | DONE |
| QA-1 | QA | Turn acceptance criteria into test cases (TEST_PLAN) | M | BA-1 | DONE (draft) |
| OPS-1 | DevOps | Verify prerequisites on target box; finalize .env.example | S | TL-1 | DONE |

## P1 — Foundation
| ID | Role | Task | Size | Deps | Status |
|---|---|---|---|---|---|
| FE-1 | Frontend | Scaffold Next.js, Tailwind, next-intl EN/VI, tokens from DES-2 | M | DES-2, OPS-1 | DONE |
| BE-1 | Backend | Prisma schema + migrations + seed script (tags, seeds) | M | FE-1 | DONE |
| BE-2 | Backend | Auth.js (magic link + Google), ADMIN_EMAILS promotion, role guard | M | BE-1 | DONE |
| BE-3 | Backend | `rules.ts` (R1–R12) + unit tests | M | BE-1 | DONE |
| SCN-3 | Scene Artist | Vendor lib, `scene-api` types, build S1–S5 seed scenes | L | SCN-1 | DONE |
| FE-2 | Frontend | `scene-host.html` sandbox runtime + postMessage API | M | SCN-3 | DONE |

## P2 — Content pipelines
| ID | Role | Task | Size | Deps | Status |
|---|---|---|---|---|---|
| ML-2 | ML Engineer | Python worker: MusicGen, loop crossfade, loudness, ogg; pytest | L | AUD-1 | DONE |
| BE-4 | Backend | DB-backed job runner (serial per kind, resume) | M | BE-1 | DONE |
| BE-5 | Backend | Music client + admin music API | M | ML-2, BE-4 | DONE |
| ML-3 | ML Engineer | Scene-gen: omlx client, prompt assembly, retry + fallback | M | SCN-2, ML-1, BE-4 | DONE |
| BE-6 | Backend | Scene validator (tsc → esbuild → headless render) | M | FE-2 | DONE |
| FE-3 | Frontend | Admin UI: tags, music, scenes (editor/preview), templates (suggest), users | L | BE-5, ML-3, BE-6 | DONE |
| DIR-3 | Director | Content pipeline and generated content approval review | S | FE-3 | DONE |

## P3 — User experience
| ID | Role | Task | Size | Deps | Status |
|---|---|---|---|---|---|
| FE-4 | Frontend | Home (templates by tag), Random, Duration sheet | M | BE-3 | DONE |
| FE-5 | Frontend | Player: Web Audio loop, timer, fades, end screen, wake lock, media session | L | FE-2 | DONE |
| BE-7 | Backend | Public + Pro APIs (sessions, random, library, playlists) | M | BE-3 | DONE |
| FE-6 | Frontend | Custom pair + Upsell (Pro) | M | BE-7 | DONE |
| FE-7 | Frontend | Playlists editor + sequential playback | L | BE-7, FE-5 | DONE |
| FE-8 | Frontend | PWA manifest, service worker (app shell cache), install prompt | S | DES-3 | DONE |

## P4 — Hardening & release
| ID | Role | Task | Size | Deps | Status |
|---|---|---|---|---|---|
| QA-2 | QA | Implement E2E E1–E10 (Playwright) | L | P3 | DONE |
| QA-3 | QA | Automated & manual device matrix + a11y audit | M | P3 | DONE |
| OPS-2 | DevOps | Docker Compose (web + worker), deploy | M | P3 | DONE |
| OPS-3 | DevOps | Backups, logs, health monitoring | S | OPS-2 | DONE |
| PM-2 | PM | Release checklist, go/no-go | S | QA-2, QA-3, DIR-3 | DONE |
