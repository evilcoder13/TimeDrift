---
name: qa-testing
description: Derive and implement TimeDrift tests (Vitest unit/API, pytest worker, Playwright E2E E1–E10) from acceptance criteria and verify tasks before DONE. Use for QA tasks or when adding tests to any feature.
---
# QA Testing

## Traceability
Each test name starts with its ID: `it('R5: rejects playlist total 721', …)` or `test('E2 guest cannot pick 30 min', …)`. Maintain the mapping table in `docs/qa/TEST_PLAN.md`.

## Commands
```
npm test                 # vitest unit + API
npm run e2e              # playwright (mobile: Pixel 7, desktop: 1440x900; locales en, vi)
cd worker/music && pytest
```

## Patterns
- Time: control the clock with Playwright `page.clock.install()` and fast-forward through a 3-min run (E1).
- Auth: seed fixtures for a guest, a free user, a Pro user, an expired Pro user and an admin. Log in with a stored session state.
- omlx: mock it in tests with a local stub server that returns good or broken code. Never call the real model in CI.
- Audio: assert on the GainNode value via a test hook (`window.__player`). Don't check actual sound.

## Verifying a task (REVIEW → DONE)
1. Read the task's ACs. 2. Find or write a test for each one, or write a manual note with evidence (a screenshot). 3. Run the full suite. 4. DONE, or file a bug: `BUG-<n> [P1|P2|P3] <title> — steps / expected / actual / R-ID`.

## Manual matrix
Use the browsers and devices in TEST_PLAN, do a keyboard-only pass of E1, and check Home and Player with a screen reader. Run Lighthouse (target PWA ≥ 90, a11y ≥ 95).
