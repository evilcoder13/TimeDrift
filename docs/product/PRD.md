# PRD — TimeDrift (Owner: PM)

## Problem
People want a quiet, beautiful corner of the internet where they can relax, focus or fall asleep, without ads, feeds or decisions.

## Vision
"Open, press play, drift." A hand-inked scene breathes slowly from day into night while soft music loops. A timer ends the session gently.

## Personas
| Persona | Need | Tier |
|---|---|---|
| **Linh, student** (20) | 15-min focus or break sessions, free | Free / guest |
| **Minh, remote dev** (30) | 2–4 h of background focus with a fixed vibe | Pro |
| **Hà, insomniac** (40) | Fall asleep to a long, consistent sleepy playlist | Pro |
| **Admin / curator** | Make and pair content quickly with local AI | Admin |

## Scope (MVP)
**Admin**
- A1 Manage feeling tags (EN/VI).
- A2 Generate music with AI (name, type, tags, prompt, length 30/45/60s) → preview → publish.
- A3 Generate scenes with AI (name, description, tags, prompt) → validate → preview → edit → publish.
- A4 Templates: pairs of music + scene, with suggestions based on tag overlap.
- A5 Users: switch Pro on/off (mock payment).

**User**
- U1 Play a template, with a timer of 3–15 min (default 15). When it ends: stop and show the End screen. They can run again right away, with no cap.
- U2 Random pair.
- U3 Pro: timer up to 720 min.
- U4 Pro: custom pair (any music + any scene).
- U5 Pro: playlists made of templates or custom pairs.
- U6 EN/VI, installable PWA, keep the screen awake.

## Out of scope (MVP)
Real payments, Pro users generating their own AI content, social features, offline download, native apps, ambient sound layers.

## Success metrics
- Share of sessions that are completed (the timer reaches its end): ≥ 60%.
- Median session length.
- Guest → Pro interest: clicks on a locked Pro feature.
- Content pipeline: ≥ 70% of scene generations pass validation within 3 attempts.

## Known limitations
- iOS Safari may pause audio when the screen locks. We use the Wake Lock API and document the limitation.
- CPU generation is slow, so content is made in batches by admins and never on demand for users.
