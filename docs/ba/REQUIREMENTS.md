# Requirements (Owner: BA)

## 1. Business rules
| ID | Rule |
|---|---|
| R1 | A free/guest run lasts **3–15 min**, default **15**. You can pick a preset (3, 5, 10, 15) or use a slider (1-min steps). |
| R2 | When a run ends: the audio fades out over 10s, the scene pauses, and the **End screen** appears (Replay, Random, Back). The user can start again right away. **No daily or total cap.** |
| R3 | A Pro run lasts **3–720 min** (presets 30, 60, 120, 240, 480, 720). |
| R4 | **Custom pair** and **Playlists** are Pro only. The API returns 403 `PRO_REQUIRED` for anyone else. |
| R5 | Playlist: 1–50 items. Each item is either a template or a custom pair, with minutes 3–720. **Total ≤ 720 min.** |
| R6 | Random: pick a published template at random. If there are no templates, pick a random published scene, then a published music track that shares at least 1 tag with it. If none share a tag, pick any published music. Never pick the same thing twice in a row. |
| R7 | Template suggestion score = Jaccard(scene.tags, music.tags). Suggestions are sorted by score, and pairs scoring below 0.2 are hidden by default. |
| R8 | Users can only see content with `published = true`. A template can only be published if its music and its scene are both published. |
| R9 | Pro status counts only while `isPro && (proUntil == null || proUntil > now)`. If Pro expires during a run, the run continues to its planned end. The next run follows free limits. |
| R10 | Music must have status READY to publish. Music duration is 30, 45 or 60s. |
| R11 | Scenes must pass validation (typecheck, bundle, render check) to publish. If an admin edits the source, the scene is validated again. |
| R12 | Unpublishing or deleting content that a template or playlist uses: deletion is blocked and the admin sees what uses it. Unpublishing hides it, and playlist items that use it are skipped during playback. |

## 2. User stories & acceptance criteria

### Admin
**AD-1 Manage tags.** As an admin I can create, edit and delete tags with a slug and EN/VI names.
- AC: the slug is unique, lowercase and kebab-case. Deleting a tag that is in use asks for confirmation, then removes it from every item that has it.

**AD-2 Generate music.** As an admin I enter a name, type, tags, prompt and length, and the system generates a loop.
- AC: a job is created with status QUEUED, then RUNNING, then READY or FAILED, and the UI shows the status (it polls every 3s). On READY I can play it in a loop to check the seam. I can regenerate with the same or an edited prompt. Errors are shown with the log.

**AD-3 Generate scene.** As an admin I enter a name, description, tags and prompt, and the system generates and validates a scene.
- AC: the pipeline goes QUEUED, RUNNING, VALIDATING, then READY or FAILED, and shows which attempt and which model it is on. A READY scene shows a live preview. I can edit the source and rebuild. If it fails I can still see the last source and the error.

**AD-4 Templates.** As an admin I make a template by choosing a scene and a music track (with suggestions), a name and tags.
- AC: I see the suggestions from R7 with their scores. The template's tags default to the shared tags of the pair. I can publish only if R8 is met.

**AD-5 Manage Pro.** As an admin I can grant or revoke Pro with an optional expiry date.

### User
**US-1 Play template.** As a guest I pick a template and a duration, and it plays.
- AC: the default is 15 min and the allowed range is 3–15 (R1). The scene and music start together after my first tap (needed by browser autoplay rules). Controls: pause/resume, volume, fullscreen, time remaining. The screen stays awake. R2 applies at the end.

**US-2 Random.** As a user I press Random and get a pair as in R6.

**US-3 Long session (Pro).** As a Pro user I can choose up to 720 min (R3).

**US-4 Custom pair (Pro).** As a Pro user I browse music and scenes (filtered by tag), preview them, and play my own pair.
- AC: a free user who opens this sees a Pro upsell and does not get access (R4).

**US-5 Playlist (Pro).** As a Pro user I can create, rename, reorder, delete and play playlists.
- AC: R5 is checked as I edit and again when I save. Playback moves from item to item with a 3s crossfade. The total remaining time is shown.

**US-6 Language.** I can switch between EN and VI, and my choice is remembered (cookie).

## 3. Non-functional
- Performance: the player is interactive in under 2s on 4G. A scene uses less than 30% of one CPU core on a mid-range phone.
- A11y: WCAG 2.2 AA. All controls work with the keyboard. There is a reduced-motion option (the scene slows to 0.25× speed).
- Security: generated code is sandboxed (ADR-005). Admin routes check role ADMIN. Pro rules are enforced on the server.
- Privacy: we store only email and name. No tracking beyond first-party, privacy-friendly analytics.
