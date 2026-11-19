---
name: timedrift-context
description: Load TimeDrift project context before any work. Use at the start of every TimeDrift task to find the right docs, fixed stack, current stage and non-negotiable rules.
---
# TimeDrift Context

1. Read `AGENTS.md` (stage, stack, rules) and `docs/PLAN.md`.
2. Read only the docs for your role (map in `docs/README.md`):
   - rules → `docs/ba/REQUIREMENTS.md` (R1–R12)
   - architecture/data/API → `docs/architecture/*`
   - decisions → `docs/DECISIONS.md` (don't re-argue these)
   - content → `docs/creative/`, `docs/content/`, `docs/audio/`, `docs/scenes/`
3. Check your task in `docs/BACKLOG.md`. If it's not `READY`, stop and ask the PM.

## Non-negotiables (summary)
- Business rules are enforced on the server. Cite R-IDs in code comments and tests.
- Generated scene JS runs only in `public/scene-host.html` (`sandbox="allow-scripts"`, CSP, no network).
- Every user string goes through next-intl, with EN and VI keys.
- No new dependency without a written reason.
- Use the smallest omlx model that passes validation.
