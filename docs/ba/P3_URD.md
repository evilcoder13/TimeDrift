# User Requirements Document (URD) & Acceptance Criteria: Phase P3 User Experience

**Document Version:** 1.0.0  
**Date:** 2026-11-18  
**Author:** Business Analyst (BA)  
**Status:** Approved for Implementation  
**Target Phase:** P3 (User Experience)  
**Related Documents:** [REQUIREMENTS.md](file:///Users/daothang/Documents/Projects/TimeDrift/docs/ba/REQUIREMENTS.md), [P3_TARGETS.md](file:///Users/daothang/Documents/Projects/TimeDrift/docs/phases/P3_TARGETS.md), [WIREFRAMES.md](file:///Users/daothang/Documents/Projects/TimeDrift/docs/design/WIREFRAMES.md), [CREATIVE_BRIEF.md](file:///Users/daothang/Documents/Projects/TimeDrift/docs/creative/CREATIVE_BRIEF.md), [DECISIONS.md](file:///Users/daothang/Documents/Projects/TimeDrift/docs/DECISIONS.md)

---

## 1. Executive Summary & Purpose

The purpose of this document is to establish the exhaustive functional, technical, and experiential requirements for **Phase P3: User Experience**. Phase P3 translates the content generation and backend foundations established in P1 and P2 into a serene, tactile, distraction-free sanctuary for end users.

Every requirement defined herein strictly enforces **Business Rules R1, R2, R3, R4, R5, R6, R9, and R12**, adheres to the creative vision *"Ink on warm paper, breathing slowly"*, complies with WCAG 2.2 AA accessibility, and establishes deterministic verification criteria for QA and Director sign-off.

---

## 2. Business Rules Baseline (P3 Focus)

| Rule ID | Rule Statement Summary | Guest / Free Bound | Pro Bound | Server Enforcement & HTTP Status | Client UI Specification |
|---|---|---|---|---|---|
| **R1** | Free Run Duration | 3–15 min (presets: 3, 5, 10, 15; step: 1 min). Default: 15 min. | N/A | `POST /api/sessions` rejects `minutes < 3` or `minutes > 15` for non-Pro users with `400 BAD_REQUEST: DURATION_OUT_OF_BOUNDS`. | Duration sheet displays unlocked presets [3m, 5m, 10m, 15m] and locked Pro presets. Slider clamped to 3–15 min for guests. |
| **R2** | Run Completion & Transition | At timer expiration: 10s logarithmic audio fade-out; scene slows gently and pauses; End screen appears with Replay, Random, Back. Immediate restart allowed. No daily or cumulative session caps. | Identical behavior for Free and Pro users. | Session state transitions to `COMPLETED`. No rate-limiting or cooldown blocks. | Gain ramps to 0 over 10.0s. Canvas pauses at 10s mark. End screen modal dissolves in over 800ms. |
| **R3** | Pro Run Duration | 3–15 min (Free presets) | 3–720 min (presets: 30, 60, 120, 240, 480, 720; step: 1 min). Default: 60 min. | `POST /api/sessions` allows `minutes` up to 720 only when `isPro` check passes. Non-Pro requesting $> 15$ receives `403 FORBIDDEN: PRO_REQUIRED`. | Pro users see extended presets unlocked and slider range extending up to 720 min (12 hours). |
| **R4** | Pro-Gated Routes | Access blocked; triggers non-coercive upsell modal. | Full access to Custom Pair (`/custom`) and Playlists (`/playlists`). | `GET/POST /api/custom`, `GET/POST/PUT/DELETE /api/playlists` return `403 FORBIDDEN: PRO_REQUIRED` for non-Pro. | Free users navigating to `/custom` or `/playlists` see the dignified Pro Sanctuary upsell modal with zero data leakage. |
| **R5** | Playlist Limits & Cap | N/A (Pro only) | 1–50 items. Each item is a template or custom pair with duration 3–720 min. Total planned duration $\le 720$ min. | `POST/PUT /api/playlists` enforces: $1 \le \text{items} \le 50$, each item $3 \le m \le 720$, and $\sum m \le 720$. Violations return `400 BAD_REQUEST: PLAYLIST_LIMIT_EXCEEDED`. | Live accumulator bar displays `Total: X / 720 min`. Save button disabled if items = 0, items > 50, or total > 720 min. Sequential playback uses 3s equal-power crossfade. |
| **R6** | Deterministic Random Selection | Selects a published template at random. If none, selects a random published scene + published music sharing $\ge 1$ tag. Fallback 2: random published scene + any published music. Never repeats immediate prior item (`id !== excludeId`). | Identical algorithm for Free and Pro. | `GET /api/random?excludeId={id}` executes selection query in accordance with R6 priority and exclusion logic. | Tapping "Drift Randomly" immediately navigates to `/play` with selected entity and default duration (15 min for Free, last selected or 60 min for Pro). |
| **R9** | Pro Session Continuity | Evaluated at session start: `isPro && (proUntil == null \|\| proUntil > now)`. If Pro expires mid-session, active run continues to its scheduled end. Subsequent run reverts to Free limits. | Active session token maintains validity until expiration. Background Pro status changes do not interrupt or truncate active playback. | Subsequent `POST /api/sessions` evaluates live user status and enforces R1 if Pro expired. | Player countdown continues smoothly to 00:00 without interruption. |
| **R12** | Unpublished Content Cascade Protection | Users only see published content. | If content used by a playlist item is unpublished or deleted, the sequential engine automatically skips that item. | Public API endpoints (`/api/templates`, `/api/music`, `/api/scenes`) strictly filter `published = true`. | Playlist player detects skipped item, logs quiet skip, and crossfades to next valid item with 1s silent crossfade. |

---

## 3. Detailed Functional Specifications by Work Package

### 3.1. FE-4: Home Page, Discovery & Duration Sheet

#### 3.1.1. Overview & Layout Hierarchy
The Home page (`/[locale]`) serves as the entry portal to TimeDrift, evoking an unhurried, hand-crafted library of contemplative art.
- **Top Navigation Bar:**
  - Wordmark: "TimeDrift" (Fraunces optical serif).
  - Language Switcher: Pill toggle (`EN` / `VI`) writing to cookie `NEXT_LOCALE`.
  - Theme Mode Toggle: Auto / Day / Night switch updating root dataset and CSS variables (`--paper`, `--ink`).
  - Auth / Account Indicator: "Login" link for guests; Avatar with "Pro" amber badge for Pro subscribers.
- **Hero Section:**
  - Centered headline: *"Drift into stillness"* / *"Trôi vào tĩnh lặng"*.
  - Primary CTA: **"Quick Drift (15 min)"** / **"Bắt đầu nhanh (15p)"** (launches default featured template in 1 click).
  - Secondary CTA: **"Drift Randomly ⚄"** / **"Ngẫu nhiên ⚄"** (invokes R6 deterministic random selection).
- **Feeling Tags Carousel / Filter Bar:**
  - Horizontal scrollable row of pill-shaped chips (`border-radius: 999px`): `#all`, `#calm`, `#focus`, `#sleep`, `#rain`, `#night`, `#cozy`, `#nature`, `#nostalgic`, `#warm`, `#peaceful`, `#morning`.
  - Selecting a tag filters the template catalog immediately via client-side state or instant server revalidation (`?tag=slug`).
  - Active chip receives sumi ink fill (`bg-ink text-paper`); inactive chips display fine 1px hairlines (`border-ink-soft text-ink-secondary`).
- **Template Exploration Grid:**
  - Responsive multi-column layout: 3 columns on desktop ($\ge 1024\text{px}$), 2 columns on tablet ($\ge 768\text{px}$), 1 column on mobile ($< 768\text{px}$).
  - Template Card Components:
    - 16:9 canvas preview thumbnail generated from the scene's initial frame or poster image.
    - Title in Fraunces serif (EN/VI).
    - Music track subtitle: Instrument/style and BPM (e.g., *"Felt Piano in F Major • 60 BPM"*).
    - Tag badges (e.g., `[rain]`, `[calm]`).
    - Tap/Click action: Opens the **Duration Picker Sheet**.

#### 3.1.2. Duration Picker Sheet Specification
When a template or Random drift is triggered, a non-intrusive sheet (bottom-anchored on mobile, centered modal card on desktop) prompts the user for session length:
- **Header:** Displays template title and composer/artist attribution.
- **Preset Buttons:**
  - Free Presets: `3 min`, `5 min`, `10 min`, `15 min (Default)`.
  - Pro Presets: `30 min 🔒`, `60 min 🔒`, `120 min 🔒`, `240 min 🔒`, `480 min 🔒`, `720 min 🔒`.
  - For Pro users: Lock glyphs are removed, and all presets are fully interactive.
  - For Guest/Free users: Clicking a locked preset does **not** launch the session; instead, it opens the **Pro Sanctuary Upsell Sheet** (FE-6).
- **Stepped Duration Slider:**
  - Guest/Free range: 3 to 15 minutes, step = 1 min.
  - Pro range: 3 to 720 minutes, step = 1 min (with logarithmic visual track or dual-scale slider: linear 3–60m over first half, linear 60–720m over second half for precise control).
  - Current value displayed prominently above slider: e.g., *"15 minutes / 15 phút"*.
- **CTA Button:**
  - Primary button: *"Begin Journey"* / *"Bắt đầu hành trình"*.
  - Action: Navigates to `/play?templateId={id}&duration={minutes}` or invokes player modal overlay.

---

### 3.2. FE-5: Full-Screen Player Runtime & End Screen

#### 3.2.1. Viewport & Sandboxed Scene Hosting
- Full-screen viewport container (`100dvw`, `100dvh`, `overflow: hidden`, `position: fixed`, `inset: 0`).
- Background host: `<iframe id="scene-host" src="/scene-host.html" sandbox="allow-scripts" />`.
- **Security Boundaries (ADR-005):**
  - Prohibited iframe tokens: `allow-same-origin`, `allow-top-navigation`, `allow-popups`, `allow-forms`.
  - Sandbox communicates exclusively via bi-directional `postMessage` protocol:
    - Host $\to$ Iframe: `{ type: 'INIT', bundleUrl: string, config: { dayNightProgress: number, reducedMotion: boolean } }`.
    - Host $\to$ Iframe: `{ type: 'UPDATE_TIME', dt: number, progress: number }`.
    - Host $\to$ Iframe: `{ type: 'SET_PAUSED', paused: boolean }`.
    - Host $\to$ Iframe: `{ type: 'DESTROY' }`.
    - Iframe $\to$ Host: `{ type: 'SCENE_READY' }`, `{ type: 'SCENE_ERROR', error: string }`.
- **Responsive Center-Third Safe Framing:**
  - The iframe canvas is rendered at $1920 \times 1080$ native resolution.
  - CSS scaling rules: On aspect ratio $< 1.0$ (mobile), container applies `object-fit: cover; object-position: 50% 50%`. Essential artwork must remain within $X = [640\text{px}, 1280\text{px}]$.

#### 3.2.2. Web Audio Dual-Buffer Gapless Looping Engine
- Browsers trigger audio initialization upon the first user interaction ("Begin Journey" click).
- Audio graph architecture:
  - `AudioContext` $\to$ `Dual BufferSourceNodes (A & B)` $\to$ `Crossfade GainNodes (GainA, GainB)` $\to$ `Master GainNode` $\to$ `destination`.
- **Gapless Seam Scheduling:**
  - For audio assets of length $L$ (30s, 45s, 60s) with crossfade duration $C = 4.0\text{s}$:
  - Buffer A starts at $T_0$. At time $T_0 + L - C$, Buffer B is scheduled to start:
    - `GainA.gain.setValueCurveAtTime([1.0, ..., 0.0], T_0 + L - C, C)`
    - `GainB.gain.setValueCurveAtTime([0.0, ..., 1.0], T_0 + L - C, C)`
  - Buffers alternate ping-pong continuously until the session timer enters fade-out.
  - Seam tolerance: RMS delta across loop boundary $\le 1.0\text{ dB}$, zero clicks, pops, or phase cancellation.

#### 3.2.3. Wall-Clock Drift-Free Timer & Day/Night Progression
- Timing must **not** rely on cumulative `setInterval` or `requestAnimationFrame` ticks, which drift when browser tabs background or throttle.
- System registers:
  - `startTime = performance.now()`
  - `targetDurationMs = minutes * 60 * 1000`
  - `elapsedMs = performance.now() - startTime`
  - `remainingMs = Math.max(0, targetDurationMs - elapsedMs)`
- `dayNightProgress` is computed continuously: $P(t) = \text{clamp}\left(\frac{\text{elapsedMs}}{\text{targetDurationMs}}, 0.0, 1.0\right)$ and dispatched to the scene frame at 30–60 fps.

#### 3.2.4. Inactivity & Receding Chrome Dynamics (4.0s Rule)
- Active controls: Exit button (top-left), title/attribution (top-center), Day/Night manual toggle and Fullscreen toggle (top-right), Floating bottom control bar (Play/Pause, Remaining Time ring, Volume slider, Random next glyph).
- After **4.0 seconds** of zero mouse movement, touch gesture, or keyboard activity:
  - Entire UI chrome transitions to `opacity: 0; pointer-events: none` via `transition: opacity 800ms cubic-bezier(0.16, 1, 0.3, 1)`.
  - Desktop mouse cursor style sets to `cursor: none`.
- Any cursor movement, tap, or key press restores `opacity: 1; pointer-events: auto` and `cursor: default` over `300ms ease-in`.

#### 3.2.5. Audio Envelope & Fade Specifications
- **Session Start:** Audio volume ramps from 0.0 to master volume over **3.0 seconds** (`masterGain.exponentialRampToValueAtTime`).
- **Session Expiration (Rule R2):**
  - When `remainingMs === 0`:
  - Master audio executes a **10.0-second logarithmic fade-out** curve ($V(t) = V_0 \cdot \left(\frac{10-t}{10}\right)^2$).
  - Scene animation decelerates gently to a resting pose over the 10-second window.
  - At $t = 10.0\text{s}$, audio stops completely, canvas drawing loop pauses (`SET_PAUSED: true`), and the End Screen modal appears.

#### 3.2.6. System Integrations: Wake Lock & Media Session API
- **Screen Wake Lock API:**
  - Upon playback start, request `navigator.wakeLock.request('screen')`.
  - Keeps display awake throughout the session.
  - If visibility state changes (`document.visibilitychange` $\to$ `visible`), re-acquire wake lock if session is active.
  - Release wake lock upon session pause, end, or exit.
- **Media Session API:**
  - Populate `navigator.mediaSession.metadata = new MediaMetadata({ title, artist, album: 'TimeDrift', artwork })`.
  - Implement action handlers: `play`, `pause`, `stop`, `previoustrack`, `nexttrack`.
  - Synchronize playback state (`'playing'` / `'paused'`).

#### 3.2.7. Tranquil End Screen Modal (Rule R2)
- Renders centered over the paused canvas with a 35% scene dim and warm washi overlay (`rgba(244, 239, 228, 0.75)` day; `rgba(30, 34, 51, 0.85)` night) via an `800ms` opacity dissolve.
- Centered reflection copy:
  - EN: *"Session complete. Take a gentle breath before returning."*
  - VI: *"Buổi thư giãn đã hoàn thành. Chúc bạn giữ mãi sự an yên khi trở về."*
- Three unhurried, equal-weight action buttons:
  1. **Replay:** Restarts the exact same scene/music pairing with the previous duration.
  2. **Random:** Curates and immediately starts a fresh, harmonious pairing (R6).
  3. **Back:** Gracefully exits the player and returns to `/`.
- Strict Non-Interference: Zero countdown timers, zero auto-redirects, zero popups or rating prompts. The screen remains peaceful indefinitely until the user chooses an action.

---

### 3.3. BE-7: Public & Pro APIs Specification

#### 3.3.1. Route Overview & Authorization Matrix

| Endpoint | Method | Auth / Tier | Zod Schema Validation | HTTP Responses & Business Rule Logic |
|---|---|---|---|---|
| `/api/templates` | `GET` | Public (Guest & User) | Query: `tag?: string`, `limit?: number`, `offset?: number` | Returns list of templates where `published = true` (R8). Includes populated scene and music metadata. |
| `/api/templates/:id` | `GET` | Public | Param: `id: string (cuid/uuid)` | Returns single template if `published = true`. `404` if not found or unpublished. |
| `/api/random` | `GET` | Public | Query: `excludeId?: string` | Implements Rule R6: Random published template $\to$ Fallback: random published scene + published music sharing $\ge 1$ tag $\to$ Fallback 2: random published scene + any published music. Never returns `excludeId` if pool $> 1$. |
| `/api/scenes` | `GET` | Public | Query: `tag?: string` | Returns list of scenes where `published = true`. Excludes raw unbundled source code for performance/security. |
| `/api/music` | `GET` | Public | Query: `tag?: string` | Returns list of music tracks where `published = true` and `status = 'READY'`. |
| `/api/sessions` | `POST` | Public (Validation differs by tier) | Body: `{ entityId: string, type: 'TEMPLATE'\|'CUSTOM'\|'PLAYLIST', minutes: number }` | Validates duration: Free $\to 3 \le \text{minutes} \le 15$ (R1). Pro $\to 3 \le \text{minutes} \le 720$ (R3). Rejects out-of-bounds or unauthorized Pro durations with `400` or `403 FORBIDDEN: PRO_REQUIRED`. |
| `/api/playlists` | `GET` | Pro Only (R4) | None | Returns user's saved playlists with ordered items. If user not Pro, returns `403 FORBIDDEN: PRO_REQUIRED`. |
| `/api/playlists` | `POST` | Pro Only (R4, R5) | Body: `PlaylistCreateSchema` ($1 \le \text{items} \le 50$, total duration $\le 720$) | Creates new playlist. Validates item count $\le 50$ and total minutes $\le 720$. Rejects violations with `400 BAD_REQUEST: PLAYLIST_LIMIT_EXCEEDED`. |
| `/api/playlists/:id` | `GET` | Pro Only (R4, R12) | Param: `id: string` | Returns playlist. Filters or flags any items whose underlying scene or music is unpublished (R12). |
| `/api/playlists/:id` | `PUT` | Pro Only (R4, R5) | Body: `PlaylistUpdateSchema` | Updates title and ordered items. Enforces item duration $\ge 3$ and total duration $\le 720$ min. |
| `/api/playlists/:id` | `DELETE` | Pro Only (R4) | Param: `id: string` | Deletes user's playlist. Enforces owner authorization. |

#### 3.3.2. Detailed Zod Schemas (`src/lib/schemas/api.ts`)

```typescript
import { z } from 'zod';

export const SessionCreateSchema = z.object({
  entityId: z.string().min(1),
  type: z.enum(['TEMPLATE', 'CUSTOM', 'PLAYLIST']),
  minutes: z.number().int().min(3).max(720),
});

export const PlaylistItemSchema = z.object({
  id: z.string().optional(),
  templateId: z.string().optional(),
  sceneId: z.string().optional(),
  musicId: z.string().optional(),
  order: z.number().int().min(0),
  durationMinutes: z.number().int().min(3).max(720),
}).refine(
  data => (data.templateId != null) || (data.sceneId != null && data.musicId != null),
  { message: "Either templateId or both sceneId and musicId must be provided" }
);

export const PlaylistCreateSchema = z.object({
  title: z.string().min(1).max(100),
  items: z.array(PlaylistItemSchema).min(1).max(50),
}).refine(
  data => {
    const total = data.items.reduce((sum, item) => sum + item.durationMinutes, 0);
    return total <= 720;
  },
  { message: "Total playlist duration cannot exceed 720 minutes (Rule R5)", path: ["items"] }
);

export const PlaylistUpdateSchema = PlaylistCreateSchema;
```

#### 3.3.3. Error Response Contract
All error responses adhere to standard structure:
```json
{
  "error": {
    "code": "PRO_REQUIRED",
    "message": "This feature requires an active Pro Sanctuary subscription.",
    "details": { "rule": "R4" }
  }
}
```

---

### 3.4. FE-6: Custom Pairing Studio & Pro Upsell

#### 3.4.1. Custom Pairing Studio (`/[locale]/custom`)
- **Pro Authorization Guard (R4):**
  - Page executes server-side session check.
  - If user is not Pro or unauthenticated, the page renders a tranquil blurred preview background with the **Pro Sanctuary Upsell Dialog** front and center.
- **Studio Interface (When Authorized):**
  - Two-column responsive selector:
    - **Left Column (Scene Selector):** Catalog of published line-art scenes with tag filters (`#nature`, `#rain`, `#night`, etc.). Each card shows live preview thumbnail and title.
    - **Right Column (Melody Selector):** Catalog of published relax tracks with tag filters and an **Audition Button** (15s audio audition with 1s fade-out).
  - **Compatibility Badge (Rule R7):**
    - Dynamic calculation of Jaccard index: $J = \frac{|S_{\text{tags}} \cap M_{\text{tags}}|}{|S_{\text{tags}} \cup M_{\text{tags}}|}$.
    - Visual badge: e.g., *"Harmony: 80% — 3 shared tags"* (or subtle organic sumi stamp).
  - **Sticky Action Tray:**
    - Displays selected Scene name + selected Melody name.
    - Duration picker dropdown / stepper (3 to 720 minutes per Rule R3).
    - Primary CTA: *"Harmonize & Play"* $\to$ Launches full-screen player with custom pairing.

#### 3.4.2. Dignified Pro Upsell Sheet / Dialog Specification
- **Design Philosophy:** Calm invitation to deepen one's quiet space; zero hostile popups, fake countdown timers, artificial scarcity, or deceptive dark patterns.
- **Triggers:**
  - Tapping a locked duration preset ($> 15\text{ min}$) on the Duration Sheet.
  - Navigating to `/custom` or `/playlists` as guest or free user.
- **Aesthetic Elements:**
  - Soft washi card with generous whitespace and 1px ink hairline border.
  - Heading in Fraunces serif: *"Deepen your quiet space"* / *"Mở rộng không gian tĩnh lặng"*.
  - Three serene bullet points:
    1. *Unbroken journeys up to 12 hours (720 minutes).*
    2. *Harmonize any scene with any melody in the Custom Studio.*
    3. *Curate multi-step continuous playlists with seamless crossfades.*
  - Transparent pricing display (Monthly / Annual).
  - Primary button: *"Begin Pro Sanctuary"* (mock/simulated upgrade in development).
  - Secondary ghost button: *"Continue with 15 minutes"* / *"Maybe later"*.
  - Dismissal: Pressing `Escape` or tapping outside immediately closes the sheet with zero confirmation dialogs.

---

### 3.5. FE-7: Curated Playlist Manager & Sequential Player Engine

#### 3.5.1. Playlist Manager (`/[locale]/playlists`)
- **Pro Gating:** Protected under Rule R4 (`PRO_REQUIRED`).
- **Management Capabilities:**
  - List of user-created playlists with title, item count, and total duration badge.
  - Create New Journey modal: Enter title, add items.
  - **Item Editor:**
    - Add item (select from published templates or custom scene + music pairs).
    - Duration input per item: 3 to 720 minutes (R5).
    - Drag-and-drop handles (`::`) or Up/Down arrows for reordering.
    - Delete item action with instant duration recalculation.
- **Live Rule R5 Accumulator:**
  - Visual status bar: $\sum \text{duration} \text{ min} / 720 \text{ min}$.
  - Progress bar turns amber when approaching 720 min.
  - If $\sum \text{duration} > 720\text{ min}$ or $\text{items} > 50$:
    - Error message: *"A journey cannot exceed 12 hours (720 minutes) or 50 items."*
    - "Save Journey" button is hard-disabled.

#### 3.5.2. Sequential Playback Engine
- When a playlist is launched in `/play?playlistId={id}`:
  - Total playlist remaining time and current item index (e.g., *"Track 2 of 4 • 45:00 remaining"*) displayed in player chrome.
- **3.0-Second Equal-Power Audio Crossfade:**
  - As item $K$ approaches its end ($T_{\text{end}} - 3.0\text{s}$):
  - Preload audio buffer for item $K+1$.
  - Execute equal-power crossfade over exactly 3.0 seconds:
    $$\text{Gain}_{\text{out}}(t) = \cos\left(\frac{\pi t}{2 \cdot 3}\right), \quad \text{Gain}_{\text{in}}(t) = \sin\left(\frac{\pi t}{2 \cdot 3}\right)$$
- **Visual Scene Dissolve:**
  - Dual iframe or layered canvas transitions: Item $K$ fades out while Item $K+1$ fades in over an **800ms opacity crossfade**, ensuring no black flash or layout jump.
- **Rule R12 Unpublished Item Cascade Handling:**
  - If item $K+1$ references a scene or music track that was unpublished or deleted:
  - Sequential engine detects invalid state, silently skips item $K+1$, logs skip event, and immediately bridges to item $K+2$ using a 1.0s silent crossfade.
- **Playlist Completion:**
  - Upon completion of the final playlist item:
  - Master audio executes the standard 10-second logarithmic fade-out (R2).
  - End screen appears showing summary of total journey completed.

---

### 3.6. FE-8: PWA Manifest, Service Worker & Offline Shell

#### 3.6.1. Web App Manifest (`manifest.webmanifest`)
- Configuration specifications:
  - `name`: "TimeDrift — Drift into Stillness"
  - `short_name`: "TimeDrift"
  - `start_url`: "/?source=pwa"
  - `display`: "standalone"
  - `orientation`: "any"
  - `background_color`: "#F4EFE4" (Day washi paper)
  - `theme_color`: "#2B2A28" (Sumi ink)
  - `icons`:
    - `192x192` PNG (standard)
    - `512x512` PNG (standard)
    - `512x512` PNG with `"purpose": "maskable"`
    - Bespoke SVG vector icon

#### 3.6.2. Service Worker & App Shell Offline Caching
- **App Shell Cache Scope:**
  - Precaches essential static assets: HTML app shell, compiled JavaScript chunks, CSS stylesheets, web fonts (`Fraunces`, `Inter`), and core SVG brand glyphs.
  - Cache name: `timedrift-shell-v1`.
- **Runtime Network-First Strategy:**
  - Navigation requests (`/`, `/play`, `/custom`) use Network-First with Cache Fallback to maintain offline boot capability.
  - API responses (`/api/templates`, `/api/music`, `/api/scenes`) use Stale-While-Revalidate with a 24-hour expiration.
  - Large audio media files (`.ogg`, `.mp3`) are excluded from automatic precache to prevent disk bloat; cached opportunistically on playback start.
- **Tranquil Offline Fallback Page:**
  - If offline and requested resource is not in cache:
  - Displays warm washi offline screen: *"You are currently resting offline. Reconnect to explore new melodies."* / *"Bạn đang ngoại tuyến. Hãy kết nối lại để khám phá thêm giai điệu mới."*

#### 3.6.3. Unobtrusive Install Prompt
- TimeDrift listens for the `beforeinstallprompt` event.
- Prevents automatic browser banner prompt.
- Surfaces a subtle, poetic install option in the Account/Settings menu: *"Add TimeDrift to Home Screen for a fullscreen tactile sanctuary."*

---

## 4. Verification Scenarios & Director Sign-Off Criteria

To verify that Phase P3 satisfies all technical constraints, business rules, and creative mandates, QA and the Director will execute the following 15 verification scenarios (P3-QA-01 through P3-QA-15):

| ID | Title / Target | Target Work Package | Execution Steps | Expected Outcome & Verification Criteria |
|---|---|---|---|---|
| **P3-QA-01** | Free Guest Duration Bounds | `FE-4`, `BE-7` | 1. Open Duration sheet as guest. 2. Verify presets. 3. Select 15 min and click Begin. 4. Attempt manual API post with `minutes: 20`. | UI displays [3m, 5m, 10m, 15m] unlocked. Slider clamped to 15m. API returns `400 BAD_REQUEST: DURATION_OUT_OF_BOUNDS`. |
| **P3-QA-02** | Pro Preset Unlocking | `FE-4`, `BE-7` | 1. Log in as Pro user. 2. Open Duration sheet. 3. Verify presets up to 720m. 4. Launch a 60 min session. | All Pro presets (30m, 60m, 120m, 240m, 480m, 720m) unlocked. Slider ranges up to 720m. `POST /api/sessions` succeeds with `200 OK`. |
| **P3-QA-03** | Receding Chrome 4s Rule | `FE-5` | 1. Start session on desktop. 2. Keep mouse still for 4.0 seconds. 3. Observe controls. 4. Move mouse 1px. | At 4.0s mark, all UI chrome transitions to `opacity: 0` over 800ms; cursor disappears (`cursor: none`). Moving mouse instantly restores controls over 300ms. |
| **P3-QA-04** | Gapless Audio Looping | `FE-5` | 1. Start player with 30s audio track. 2. Monitor Web Audio buffer scheduling across 3 loop boundaries (90s). | Dual BufferSourceNodes crossfade seamlessly over 4.0s. RMS delta $\le 1.0\text{ dB}$. Zero clicks, pops, or audio drops. |
| **P3-QA-05** | Drift-Free Timer Accuracy | `FE-5` | 1. Start 3-minute session. 2. Background browser tab for 2 minutes. 3. Return to tab. | Remaining time strictly matches elapsed wall-clock time (`performance.now()`). Zero timer drift or stall caused by background throttling. |
| **P3-QA-06** | 10s Fade-Out & End Screen (R2) | `FE-5` | 1. Let session reach 00:00. 2. Monitor audio gain and canvas animation. 3. Observe End screen modal. | Audio fades out over 10.0s logarithmic curve; canvas slows to rest; at $t = 10\text{s}$, canvas pauses and End Screen dissolves in with Replay, Random, Back. |
| **P3-QA-07** | End Screen Actions | `FE-5` | 1. On End Screen, test "Replay". 2. Reach End Screen again, test "Random". 3. Reach End Screen again, test "Back". | Replay restarts same pair with same duration; Random curates new pair (R6); Back returns to `/`. No session caps or cooldown blocks. |
| **P3-QA-08** | Wake Lock & Media Session | `FE-5` | 1. Launch session. 2. Verify `navigator.wakeLock` status. 3. Inspect OS lockscreen media controls. | Wake lock acquired ('screen'). Media session displays title, artist, album art; Play/Pause from lockscreen controls player correctly. |
| **P3-QA-09** | Deterministic Random (R6) | `BE-7` | 1. Invoke `GET /api/random` 5 times sequentially, passing previous ID as `excludeId`. | Each response returns a valid published template/pair. Never returns the identical template consecutively when pool $> 1$. |
| **P3-QA-10** | Pro Route Gating (R4) | `FE-6`, `BE-7` | 1. Visit `/custom` and `/playlists` as guest/free user. 2. Issue `GET /api/playlists` without Pro token. | UI renders blurred preview with Pro Sanctuary upsell modal. API returns `403 FORBIDDEN: PRO_REQUIRED`. |
| **P3-QA-11** | Custom Pair Studio Workflow | `FE-6`, `BE-7` | 1. As Pro user, select Scene and Melody in `/custom`. 2. Verify Jaccard score (R7). 3. Launch custom session. | Jaccard tag compatibility badge updates dynamically. Audio audition plays 15s preview. Player launches successfully with custom pair. |
| **P3-QA-12** | Playlist 720m Cap & 50 Items (R5) | `FE-7`, `BE-7` | 1. In `/playlists`, create journey. 2. Add items totaling 700 min. 3. Add item with 30 min (total 730 min). 4. Attempt save. | UI displays cap warning; Save button is disabled. API rejects total $> 720$ with `400 BAD_REQUEST: PLAYLIST_LIMIT_EXCEEDED`. |
| **P3-QA-13** | Playlist 3s Equal-Power Crossfade | `FE-7` | 1. Launch 2-item playlist. 2. Fast-forward to 3s before item 1 end. 3. Observe transition. | Item 1 audio fades out while Item 2 audio fades in over 3.0s equal-power curve. Scenes dissolve over 800ms without black screen flash. |
| **P3-QA-14** | Playlist Skip Unpublished Item (R12) | `FE-7` | 1. Create playlist with 3 items. 2. Unpublish item 2 in admin. 3. Play playlist as user. | Sequential engine detects unpublished item 2, skips it quietly, and transitions from item 1 to item 3 with 1.0s silent crossfade. |
| **P3-QA-15** | PWA Installation & Offline Shell | `FE-8` | 1. Audit PWA manifest with Lighthouse. 2. Turn off network connection. 3. Refresh app shell. | Lighthouse PWA audit passes. App shell, fonts, and offline fallback screen load seamlessly while disconnected. |

---

## 5. Director Creative Sign-Off Criteria for P3

Before any Phase P3 feature can be merged to `main` and marked `DONE` in `docs/BACKLOG.md`, it must satisfy the Creative Director's non-negotiable artistic gates:

- [ ] **Organic Immersion:** The 4.0-second receding chrome dissolves silently without visual flicker; awakening is gradual and gentle; the mouse cursor hides completely on desktop viewports.
- [ ] **Acoustic Restraint:** Start fade-in (3s) and completion fade-out (10s) are completely click-free, pop-free, and harsh-cut-free across all audio transitions.
- [ ] **Tranquil End Modal:** The End screen creates a genuine sense of gratitude and stillness; zero invasive ads, notifications, streak badges, or pressure.
- [ ] **Parchment Aesthetics:** Day theme evokes warm washi paper (`#F4EFE4`) and sumi ink (`#2B2A28`); Night theme evokes deep charcoal wash (`#1E2233`) and warm lantern amber; WCAG 2.2 AA contrast verified.
- [ ] **Diacritical Typography:** Vietnamese tone marks (`ơ`, `ư`, `ắ`, `ề`, `ộ`, `đ`) in `Fraunces` and `Inter` render with exquisite optical alignment and zero font fallback jumps.
- [ ] **Pro Sanctuary Dignity:** The Pro upsell experience is dignified, gentle, and transparent, treating every seeker of peace with utmost respect.
- [ ] **Center-Third Framing:** All visual focal elements remain perfectly legible and balanced across both desktop 16:9 and mobile 9:16 portrait viewports.
