# Test Plan (Owner: QA)

## Levels
| Level | Tool | Scope |
|---|---|---|
| Unit | Vitest | `src/server/rules.ts` (R1–R12), matching (R7), random (R6), playlist validation (R5), Pro check (R9) |
| API | Vitest + Next route handlers | 401/403/`PRO_REQUIRED`, zod validation, R8/R12 |
| Worker | pytest | seam continuity (|x[end]-x[0]| < ε, RMS across seam ±1 dB), duration, loudness ±1 LU |
| Scene pipeline | Vitest + Playwright | good fixture → READY; broken fixture → 3 attempts → FAILED; fallback model used on attempt 3 (mock omlx) |
| E2E | Playwright | flows below, mobile + desktop viewports, EN + VI |
| Manual | Checklist | audio/visual quality, a11y, devices |

## Key E2E cases
| ID | Case | Expected |
|---|---|---|
| E1 | Guest plays template, picks 3 min (clock mocked) | Ends at 3:00 → fade → End screen; Replay works immediately |
| E2 | Guest tries 30 min | Locked → Upsell; API `POST /api/sessions minutes=30` → 403 |
| E3 | Guest opens /custom, /playlists | Upsell, no data |
| E4 | Pro plays 720 min | Accepted; 721 → 400 |
| E5 | Pro playlist total 721 | Save disabled; API 400 |
| E6 | Random 20× | Never same twice in a row; only published |
| E7 | Admin publishes template with unpublished scene | Blocked (R8) |
| E8 | Admin deletes music used by template | 409 `CONFLICT_IN_USE` (R12) |
| E9 | Language switch | All visible strings change; persists reload |
| E10 | Pro expires mid-run | Run continues; next run limited to 15 |

## Manual matrix
Chrome/Firefox/Safari desktop; Android Chrome; iOS Safari (document lock-screen audio behaviour). Keyboard-only run of E1. Screen reader (NVDA/VoiceOver) on Home + Player.

## Exit criteria (P4)
All unit/API/E2E green; 0 open P1/P2 bugs; Lighthouse PWA ≥ 90, a11y ≥ 95; Director sign-off on all published content.
