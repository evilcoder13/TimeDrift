---
name: code-review
description: Review TimeDrift code changes (FE/BE/ML) for rule enforcement, sandbox security, i18n, tests and simplicity. Use when a task is in REVIEW.
---
# Code Review
Read the changed files and the code they call, not just the diff. Report only real findings: severity (P1 blocker / P2 should fix / P3 nit), file:line, the problem in plain words, and a fix.

## Checklist
- [ ] **Rules on the server**: any limit or Pro check in the UI also exists in an API route through `rules.ts`, with an R-ID comment.
- [ ] **Sandbox**: the scene iframe has `sandbox="allow-scripts"` only. The CSP is present. No generated code is evaluated in the app origin. postMessage checks `event.source`.
- [ ] **Auth**: admin routes check the role. Playlist routes check ownership. Media is served only when published.
- [ ] **Validation**: zod on every input. Errors use the `{error:{code,message}}` format.
- [ ] **i18n**: no string literals in JSX. EN and VI keys both exist.
- [ ] **Tests**: new logic has tests whose names cite R-IDs or story IDs. `npm run typecheck && npm run lint && npm test` pass.
- [ ] **Simplicity**: no unnecessary abstraction or new dependency without a reason. Vendor lib unmodified.
- [ ] **Perf**: the player doesn't re-render every frame. Audio is decoded once.
Verdict: APPROVE / CHANGES REQUESTED.
