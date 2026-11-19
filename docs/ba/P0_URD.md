# User Requirements Document (URD) & Acceptance Criteria: Phase P0 & P1 Readiness

**Document Version:** 1.0.0  
**Date:** 2026-11-18  
**Author:** Business Analyst (BA)  
**Status:** Under Director & PM Review  
**Target Stages:** P0 Exit Clearance & P1 Kickoff Preparation  
**Direct Predecessors:** [PRD.md](file:///Users/daothang/Documents/Projects/TimeDrift/docs/product/PRD.md), [REQUIREMENTS.md](file:///Users/daothang/Documents/Projects/TimeDrift/docs/ba/REQUIREMENTS.md), [CREATIVE_BRIEF.md](file:///Users/daothang/Documents/Projects/TimeDrift/docs/creative/CREATIVE_BRIEF.md), [P0_TARGETS.md](file:///Users/daothang/Documents/Projects/TimeDrift/docs/phases/P0_TARGETS.md)

---

## 1. Overview & Objective

The purpose of this document is to bridge high-level system requirements with rigorous, unambiguous specifications for the remaining Phase P0 deliverables and prepare all foundation contracts for Phase P1.

Every requirement herein is strictly bound to Business Rules R1–R12, non-functional quality standards (WCAG 2.2 AA, responsive center-third framing, memory/CPU performance thresholds), and Director sign-off gates.

---

## 2. Business Rules Baseline (R1–R12) Verification Mapping

| Rule ID | Statement Summary | Free / Guest Bound | Pro Bound | Server Enforcement & Error Code | Client Verification Criteria |
|---|---|---|---|---|---|
| **R1** | Free Run Duration | 3–15 min (presets: 3, 5, 10, 15; step: 1 min). Default: 15 min. | N/A | `POST /api/sessions` rejects `minutes < 3` or `minutes > 15` with `400 BAD_REQUEST: DURATION_OUT_OF_BOUNDS`. | UI slider clamped between 3 and 15 min; presets 3, 5, 10, 15 selectable. |
| **R2** | Run Completion & Transition | Wall-clock timer ends: 10s audio fade-out (`gainNode.linearRampToValueAtTime`), canvas rendering pauses, End Screen renders (`Replay`, `Random`, `Back`). Immediate restart allowed; no daily/cumulative caps. | Identical behavior for Free and Pro. | Session state transitions to `COMPLETED`. No rate-limiting block on consecutive sessions. | No audio pop/click during 10s fade; scene canvas loop frozen upon fade completion; End Screen displays 3 action buttons. |
| **R3** | Pro Run Duration | 3–15 min (Free presets) | 3–720 min (presets: 30, 60, 120, 240, 480, 720; step: 1 min). Default: 60 min. | Rejects `minutes > 720` or unauthenticated requests with `400` or `403 PRO_REQUIRED`. | Pro users see extended presets and unlocked slider up to 720 min. |
| **R4** | Pro-Gated Routes | Access restricted to preview/upsell modal. | Full access to `/custom` and `/playlists`. | API routes `GET/POST /api/custom`, `GET/POST /api/playlists` return `403 FORBIDDEN: PRO_REQUIRED` if user is not Pro. | Free users clicking Custom Pair or Playlists are presented with the Pro Upsell Modal with zero data leaked. |
| **R5** | Playlist Structure & Duration | N/A (Pro only) | 1–50 items. Each item is a template or custom pair with item duration 3–720 min. $\sum \text{duration} \le 720$ min. | `POST/PUT /api/playlists` validates $1 \le N \le 50$ and total duration $\le 720$. Rejects with `400 PLAYLIST_LIMIT_EXCEEDED`. | Live accumulator in UI reflects total minutes; Save button disabled if items = 0, items > 50, or total > 720 min. Crossfade between items: 3s. |
| **R6** | Deterministic Random Selection | Selects a published template at random. Fallback: random published scene + published music sharing $\ge 1$ tag. Fallback 2: random published scene + any published music. | Identical algorithm. | `GET /api/templates/random?excludeId={lastPlayedId}` returns random item. Never repeats the immediate prior item (`id !== excludeId`) if total pool $> 1$. | Consecutive taps on "Random" produce distinct scenes/templates when pool $> 1$. |
| **R7** | Template Suggestion Metric | Admin scoring: $Jaccard(S_{tags}, M_{tags}) = \frac{\|S \cap M\|}{\|S \cup M\|}$. Sorted descending. Pairs $< 0.2$ hidden by default. | Admin tool only. | `/api/admin/suggestions` calculates Jaccard index; filters $< 0.2$ unless `showAll=true`. | Pair cards display tag match badges (e.g., "75% match — 3 shared tags"). Toggle exists to show low-scoring pairs. |
| **R8** | Publication Constraint | Public queries filter strictly `published = true`. | Public queries filter strictly `published = true`. | Templates cannot be set to `published = true` if `scene.published == false` or `music.published == false`. Rejects with `409 UNPUBLISHED_DEPENDENCY`. | Admin UI disables the "Publish" toggle with warning tooltip if dependencies are unpublished. |
| **R9** | Pro Session Continuity | Evaluated at session start: `isPro && (proUntil == null \|\| proUntil > now)`. If Pro expires during a session, active run completes to planned end. Next run reverts to Free bounds (R1). | Server session token includes `expiresAt` of active run. Background status poll does not terminate current session. | Session timer completes uninterrupted. Subsequent `POST /api/sessions` enforces R1 limits. |
| **R10** | Audio Artifact Integrity | N/A | Admin catalog | Worker audio generation requires status `READY` to publish. Duration strictly constrained to 30s, 45s, or 60s. Integrated loudness: $-16 \text{ LUFS} \pm 1$, true peak $\le -1 \text{ dBTP}$. | Non-ready or un-benchmarked audio cannot be assigned to published templates. |
| **R11** | Scene Sandboxing & Validation | N/A | Admin catalog | Generated scenes must pass TypeScript typecheck, Rollup/esbuild bundling, and Headless Chromium render check (30 frames without console errors) before status becomes `READY`. | Re-editing scene code resets status to `VALIDATING` and re-triggers validation pipeline. |
| **R12** | Deletion & Cascade Protection | N/A | Admin catalog | Hard deletion of music/scene used by template or playlist is blocked (`409 CONFLICT_IN_USE`). Unpublishing hides content; playlist skips unpublished item during playback with 1s silent crossfade. | Admin delete button displays dependent templates/playlists list upon rejection. |

---

## 3. Specifications for P0 Work Packages

### 3.1. DES-1 & DES-2: UI/UX Wireframes, Tokens & Interaction Design Specs

#### 3.1.1. Core Screens & Responsive Layout
1. **Home (`/`)**:
   - Hero focus: Single primary "Quick Drift" CTA (starts default 15-min template or random).
   - Secondary grid: Curated published templates displaying evocative titles (EN/VI), feeling tag pills, and ambient preview thumbnail.
   - Header: Minimalist brand wordmark ("TimeDrift"), language switcher (`EN` / `VI`), Theme indicator (Day/Night auto), User Profile / Pro badge.
2. **Player (`/play`)**:
   - Fullscreen viewport (`100dvw`, `100dvh`).
   - Sandboxed scene iframe filling background (`pointer-events: auto` for subtle ripple/wind interaction if supported).
   - Receding UI: Controls automatically fade out to `opacity: 0` (`transition: opacity 800ms cubic-bezier(0.16, 1, 0.3, 1)`) after 4.0 seconds of pointer inactivity. Pointer movement or keyboard focus instantly restores controls to `opacity: 1`.
   - Control bar (bottom-anchored): Time remaining countdown (`MM:SS`), Play/Pause toggle, Volume slider (0–100%), Fullscreen toggle, Ambient Day/Night manual toggle, Exit/Back button.
3. **End Screen (R2 Modal)**:
   - Appears centered over frozen canvas with a soft backdrop blur (`backdrop-blur-md bg-paper/80 dark:bg-charcoal/80`).
   - Typography: "Session Complete" / "Buổi thư giãn đã hoàn thành".
   - Actions (equal visual weight, unhurried styling):
     - `Replay` (re-runs current pair with same duration).
     - `Random` (runs R6 selection immediately).
     - `Back to Sanctuary` (returns to `/`).
4. **Custom Pair (`/custom` — Pro Only)**:
   - Split browser: Left pane: Scene selector with tag filter; Right pane: Music selector with tag filter and audio audition button (30s preview).
   - Live compatibility indicator based on Jaccard score (R7).
   - Free user state: Locked blur overlay with "Pro Sanctuary" banner and Mock Upgrade button.
5. **Playlists (`/playlists` — Pro Only)**:
   - Playlist manager: Drag-and-drop / arrow reordering, duration summation badge (`Total: XX / 720 min`), tag summary chips.
   - Free user state: Pro upsell modal with explanation of continuous multi-hour journeys.
6. **Admin Dashboard (`/admin`)**:
   - Management views for Tags (AD-1), Music (AD-2), Scenes (AD-3), Templates (AD-4), and Users/Pro (AD-5).

#### 3.1.2. Responsive Viewport Rule (16:9 vs 9:16)
- **Base Canvas Dimension:** $1920 \times 1080$ pixels.
- **Center-Third Focal Safe Zone:** The horizontal region between $X = 640\text{px}$ and $X = 1280\text{px}$ (640px width $\times$ 1080px height) must contain all essential visual focal elements (e.g., tree, window, character, bench).
- **Mobile Crop (9:16):** On viewports with aspect ratio $< 1.0$ (e.g., iPhone $393 \times 852$), the canvas host scales via `object-fit: cover` centered at `50% 50%`. Edge assets outside the center 640px may be softly cropped, but visual balance must remain harmonious without clipped text or severed focal art.

#### 3.1.3. Day/Night Transition Specification
- The application implements an organic Day/Night theme cycle:
  - **Day Mode (Warm Parchment):**
    - Background: Organic paper tone `#F9F6F0` (light) to `#F4EFE6` (base paper).
    - Line Ink: Charcoal `#2C2A29` (primary ink), `#5A5654` (secondary sketch).
    - Accent: Warm Ochre `#C28B38`.
  - **Night Mode (Deep Indigo Charcoal):**
    - Background: Midnight wash `#16181D` (base) to `#1E222B` (elevated).
    - Line Ink: Soft Ivory `#E2DED6` (primary), `#8F94A0` (muted wash).
    - Ambient Glow Accent: Lantern Amber `#E8A857` and Deep Ember `#D97736`.
  - **Transition Curve:** State transitions between Day and Night must interpolate color values smoothly over an 800ms ease-in-out curve (`transition: all 800ms cubic-bezier(0.4, 0, 0.2, 1)`). Scene background and lighting hook dynamically into `daynight.ts` simulated progress ($0.0 \to 1.0$).

#### 3.1.4. Accessibility & Inclusive Design (WCAG 2.2 AA)
- **Contrast Ratios:** Text and essential icons must maintain a minimum contrast ratio of $4.5:1$ against their background ($3.0:1$ for large text $\ge 24\text{px}$).
- **Keyboard Navigation:** Every interactive element has an explicit focus ring (`ring-2 ring-warm-ochre ring-offset-2`). Full player control via keyboard: `Space` (Play/Pause), `M` (Mute/Unmute), `F` (Fullscreen), `Esc` (Exit), `ArrowUp/Down` (Volume $\pm 5\%$).
- **Reduced Motion (`prefers-reduced-motion: reduce`):**
  - Scene canvas speed factor is automatically reduced to $0.25\times$ base speed.
  - UI control fade-outs and transitions default to immediate or subtle crossfades without sliding animations.

---

### 3.2. OPS-1: Environment Verification Matrix & Configuration Specification

#### 3.2.1. Host Prerequisites Verification Matrix
| Dependency | Minimum Version | Target Version | Verification Command | Failure Impact & Remediation |
|---|---|---|---|---|
| **Node.js** | `v22.0.0` | `v22.18.0+` (LTS) | `node -v` | Next.js 15 App Router incompatibility. Fail build if `< 22`. |
| **npm** | `10.0.0` | `10.8.0+` | `npm -v` | Package resolution failures. |
| **Python** | `3.11.0` | `3.11.9` | `python3 -v` | MusicGen worker requires Python 3.11 for PyTorch and Transformers compatibility. Fail if $\ne 3.11$. |
| **FFmpeg** | `6.0` | `7.0+` | `ffmpeg -version` | Audio seamless looping crossfades and LUFS normalization fail. Required in system `$PATH`. |
| **Chromium** | Latest Stable | Headless Chrome | `chromium --version` or Playwright bundled | Scene validation headless render pass (R11) fails. |
| **SQLite3** | `3.40+` | `3.45+` | `sqlite3 --version` | Prisma dev persistence. |
| **Local omlx Endpoint** | API v1 | OpenAI compatible | `curl -s http://10.1.123.123:8000/v1/models` | Scene generation blocked. Must verify host reachability within 500ms latency. |

#### 3.2.2. Environment Configuration Specifications (`.env.example`)
```bash
# ==============================================================================
# TimeDrift Environment Configuration Matrix (.env.example)
# ==============================================================================

# Application Runtime
NODE_ENV="development"
PORT=3000
NEXT_PUBLIC_APP_URL="http://localhost:3000"

# Authentication & Session Security (Auth.js)
# Generated via `openssl rand -base64 33`
AUTH_SECRET="change-this-to-a-secure-random-32-character-secret"
AUTH_TRUST_HOST=true

# Admin Authorization Matrix (Comma-separated authorized email addresses)
ADMIN_EMAILS="admin@timedrift.local,director@timedrift.local"

# Database Persistence (Prisma + SQLite)
DATABASE_URL="file:./dev.db"

# Local LLM Engine (omlx OpenAI-Compatible Server)
LLM_BASE_URL="http://10.1.123.123:8000/v1"
LLM_API_KEY="omlx-local-token"
# Primary small model (Qwen 4B optimized for code generation)
LLM_MODEL="Qwen3.5-4B-3D-Coder"
# Fallback model when primary fails validation after 2 attempts
LLM_FALLBACK_MODEL="gemma-4-12b-4bit"
LLM_TIMEOUT_MS=60000

# Audio Generation Worker Service
MUSIC_WORKER_URL="http://127.0.0.1:8100"
MUSIC_WORKER_TIMEOUT_MS=120000

# Local Storage Paths (Relative to project root)
STORAGE_AUDIO_DIR="./storage/audio"
STORAGE_BUNDLES_DIR="./storage/bundles"

# Business Rule Defaults (R1-R12)
NEXT_PUBLIC_FREE_MAX_MINUTES=15
NEXT_PUBLIC_PRO_MAX_MINUTES=720
```

---

### 3.3. AUD-1 & AUD-3: Audio Generation & Prompt Library Specifications

#### 3.3.1. AUD-1 Benchmark Protocols & Acoustic Targets
- **Model Baseline:** Meta MusicGen-small (`facebook/musicgen-small`), running locally on CPU torch.
- **Hardware Profile Baseline:** Target CPU generation speed: sec per 30s audio. The benchmark must establish the Real-Time Factor (RTF).
  - Target RTF: $\le 4.0$ (i.e., generating a 30s clip takes $\le 120$ seconds on host CPU).
- **Acoustic Standards:**
  - **Tempo:** 50–85 BPM (50–65 BPM for `sleepy`/`night`, 65–75 BPM for `calm`/`focus`).
  - **Integrated Loudness:** $-16.0 \text{ LUFS} \pm 1.0 \text{ LUFS}$ (measured via EBU R128).
  - **True Peak:** $\le -1.0 \text{ dBTP}$ to prevent inter-sample clipping across DACs.
  - **Looping Seam Protocol:** 4.0-second equal-power crossfade ($cos/sin$ curve) applied at boundaries.
  - **Seam Tolerance:** Amplitude delta $|x[\text{end}] - x[0]| < 0.001$; RMS differential across the boundary $\le 1.0 \text{ dB}$. Must be completely inaudible over 3 continuous listening loops on reference headphones.

#### 3.3.2. AUD-3 Emotion Tag Prompt Expansion Criteria
Every prompt in the library must adhere to the **Negative Pattern Guard**:
> `Negative Prompt / Prohibited Elements: "no vocals, no singing, no spoken words, no choir, no harsh distortion, no aggressive drops, no EDM synths, no heavy metal guitars, no fast arpeggios, no loud drums, loopable, soft dynamics"`

**Prompt Expansion Matrix (3 Prompts per Core Tag):**
1. **`calm` (Bình yên)**
   - *Prompt A:* "Minimalist upright felt piano playing slow warm chords, ambient vinyl crackle, gentle room acoustics, 60 BPM, relaxing and contemplative."
   - *Prompt B:* "Soft acoustic nylon-string guitar picking slowly, subtle distant warm pad, calm evening atmosphere, 65 BPM, peaceful and still."
   - *Prompt C:* "Gentle harp and warm analog electric piano Rhodes, soft tape saturation, breathing tempo, 58 BPM, quiet and meditative."
2. **`sleepy` (Buồn ngủ)**
   - *Prompt A:* "Deep sub ambient drone with gentle celestial Rhodes chords, slow breathing filter sweep, dreamy lullaby, 52 BPM, ultra soft."
   - *Prompt B:* "Muted celesta notes dripping like slow water drops over a warm low cello drone, sleepy and tranquil, 50 BPM, zero drums."
   - *Prompt C:* "Continuous soft warm analog synth pads, slow wave movement, low-pass filtered, hypnotic bedtime ambiance, 54 BPM."
3. **`focus` (Tập trung)**
   - *Prompt A:* "Steady lo-fi study beat with brushed snare, muted electric bassline, gentle electric piano chords, coffee shop rain, 72 BPM."
   - *Prompt B:* "Minimalist marimba ostinato with steady soft rhythmic shaker, warm analog warmth, concentration rhythm, 75 BPM."
   - *Prompt C:* "Gentle rhythmic acoustic guitar pattern, subtle cello drone sustaining underneath, clear mindful focus, 70 BPM."
4. **`cozy` (Ấm cúng)**
   - *Prompt A:* "Warm fireplace crackle with tender acoustic guitar fingerpicking, subtle cello harmony, wooden room feeling, 64 BPM."
   - *Prompt B:* "Lo-fi vintage piano with soft flutter and flutter tape warmth, soft rain tapping on window, cozy blanket mood, 62 BPM."
   - *Prompt C:* "Gentle music box playing over warm upright bass and soft brushed hi-hat, peaceful living room intimacy, 65 BPM."
5. **`nostalgic` (Hoài niệm)**
   - *Prompt A:* "Distant warm piano playing a bittersweet melodic phrase, gentle tape hiss, cassette warmth, 62 BPM, longing and memories."
   - *Prompt B:* "Vintage accordion and classical acoustic guitar duo, slow waltz tempo, soft warm vintage vinyl record aesthetic, 68 BPM."
   - *Prompt C:* "Muted electric guitar with warm vibrato and gentle spring reverb, slow walking tempo, reminiscent and poetic, 60 BPM."
6. **`rainy` (Mưa)**
   - *Prompt A:* "Soft natural rain shower sound with slow contemplative piano chords, melancholic beauty, no rhythm section, 58 BPM."
   - *Prompt B:* "Gentle electric piano notes echoing into warm tape delay with steady light rain on autumn leaves, 62 BPM."
   - *Prompt C:* "Low cello solo over gentle raindrops on glass window, warm cozy indoor warmth, 55 BPM, deeply comforting."
7. **`dreamy` (Mơ màng)**
   - *Prompt A:* "Shimmering glockenspiel and ethereal synth pads, floating harmonic clouds, slow drifting tempo, 56 BPM, surreal peace."
   - *Prompt B:* "Reversed piano textures layered with gentle warm strings, floating weightlessly in space, 54 BPM, dreamy meditation."
   - *Prompt C:* "Soft vibraphone with long natural sustain, lush ambient reverberation, drifting clouds mood, 60 BPM."
8. **`warm` (Ấm áp)**
   - *Prompt A:* "Rich acoustic cello and wooden viola duet playing tender harmonies, warm sunlit morning mood, 65 BPM, organic and pure."
   - *Prompt B:* "Golden hour acoustic folk guitar with soft thumb bass, gentle harmonic slides, comforting embrace, 68 BPM."
   - *Prompt C:* "Warm vintage organ chords with slow rotary Leslie speaker effect, deep comforting analog embrace, 60 BPM."
9. **`peaceful` (Thanh thản)**
   - *Prompt A:* "Solo acoustic concert harp playing descending arpeggios, gentle mountain breeze atmosphere, 58 BPM, absolute stillness."
   - *Prompt B:* "Deep Japanese shakuhachi flute over soft ambient temple drone, serene zen garden, 52 BPM, clear mind."
   - *Prompt C:* "Tender solo acoustic piano, vast dynamic restraint, delicate keystrokes, silence between notes, 56 BPM."
10. **`morning` (Buổi sáng)**
    - *Prompt A:* "Bright yet gentle acoustic fingerstyle guitar, soft distant songbirds, warm dawn sunlight filtering through leaves, 74 BPM."
    - *Prompt B:* "Light pizzicato strings and playful flute staccato, waking up slowly, gentle optimism, 72 BPM."
    - *Prompt C:* "Fresh morning piano arpeggios with soft warm analog synth pads, rising sun, peaceful start, 70 BPM."
11. **`night` (Đêm)**
    - *Prompt A:* "Quiet starry night ambiance, distant crickets, minimalist electric piano chords with long decay, 52 BPM."
    - *Prompt B:* "Deep dark ambient cello with soft wooden flute, moonlit riverbank, quiet contemplation, 50 BPM."
    - *Prompt C:* "Soft music box notes drifting over deep sub-bass warmth, slow breathing rhythm, midnight solitude, 54 BPM."
12. **`nature` (Thiên nhiên)**
    - *Prompt A:* "Organic bamboo flute playing gentle melodies with mountain wind and forest rustle, 60 BPM, pure wilderness."
    - *Prompt B:* "Flowing river water textures blended with gentle acoustic guitar harmonics and soft wooden chimes, 64 BPM."
    - *Prompt C:* "Forest bird echoes layered with slow atmospheric cello chords, morning mist over pine trees, 58 BPM."

---

### 3.4. SCN-1 & SCN-2: Scene Prompt System & Library Interface Specifications

#### 3.4.1. Scene Module Contract (`scene-api`)
Every animated scene module generated or authored must strictly export a compliant JavaScript/TypeScript interface executing inside `public/scene-host.html`.

```typescript
export interface TimeDriftSceneModule {
  /**
   * Initializes the scene on the target HTML5 Canvas.
   * Receives canvas context and initial dimension bounds.
   */
  init(canvas: HTMLCanvasElement, ctx: CanvasRenderingContext2D): void;

  /**
   * Updates physics, animation cycles, and day/night state.
   * @param dt Delta time elapsed since last frame in seconds (clamped max 0.1s to avoid physics explosions).
   * @param progress Progress of day/night cycle: float between 0.0 (day) and 1.0 (night).
   */
  update(dt: number, progress: number): void;

  /**
   * Renders the current frame onto the canvas.
   * All drawing must respect current progress (color palette transitions).
   */
  render(ctx: CanvasRenderingContext2D): void;

  /**
   * Handles canvas resize events while maintaining 1920x1080 internal resolution coordinate space.
   */
  onResize(width: number, height: number): void;

  /**
   * Optional pointer handler for subtle organic interaction.
   * Interaction must be gentle (e.g. slight wind sway, water ripple).
   */
  onPointerMove?(x: number, y: number): void;

  /**
   * Cleans up all timers, event listeners, and cached geometry to prevent memory leaks.
   */
  destroy(): void;
}
```

#### 3.4.2. Runtime Constraints & Sandboxing (ADR-005)
1. **Sandboxed Iframe:**
   - Attribute specification: `<iframe sandbox="allow-scripts" src="/scene-host.html" ... />`.
   - Strictly prohibited attributes: `allow-same-origin`, `allow-top-navigation`, `allow-popups`.
2. **Content Security Policy (CSP):**
   - Host header / meta: `default-src 'none'; script-src 'unsafe-inline' 'self'; style-src 'unsafe-inline'; img-src 'self' data:; connect-src 'none';`.
   - Zero outbound network requests permitted (`fetch`, `XMLHttpRequest`, `WebSocket`, `WebRTC` are completely blocked).
3. **Execution Safety & Loop Safeguards:**
   - Maximum figures animated simultaneously: $\le 6$.
   - Animation cycles must complete without positional jumps or teleports. Loop periods $> 2.0\text{s}$; character gait speed factor $\le 0.6\times$.
   - Code must not instantiate unbounded arrays, persistent growing data structures, or recursive loops.

#### 3.4.3. SCN-2 System Prompt Engineering & 5 Benchmark Prompts
The system prompt (`src/server/prompts/scene.system.md`) instructs omlx LLM models to generate scene code wrapped in `TimeDriftSceneModule`.

**Benchmark Prompts for ML-1 Model Evaluation:**
1. *Prompt 1 (rainy):* "A quiet wooden bus stop in the countryside during a steady rain. Water droplets drip rhythmically from the tin roof into puddles with subtle expanding ripples. A single cat sits sheltered on the wooden bench, blinking slowly. Line-art style on parchment."
2. *Prompt 2 (calm):* "An old bonsai tree perched on a stone balcony overlooking rolling hills. Gentle wind sways the pine needles slowly. Two leaves detach and drift down gracefully. Ink wash line drawing."
3. *Prompt 3 (nostalgic):* "A vintage bicycle parked against a brick wall beneath an old street lantern. Clothes hang on a balcony wire above, swaying softly in a light evening breeze. Detailed hatched ink lines."
4. *Prompt 4 (peaceful):* "A tranquil bamboo grove beside a small stone basin with a traditional shishi-odoshi (wooden water fountain) rocking down every 8 seconds. Ink wash aesthetic."
5. *Prompt 5 (night):* "A small cabin window overlooking a pine forest under a crescent moon. Inside the window, a warm yellow lantern light flickers gently. Soft fireflies drift across the glass. Dark ink with warm amber glows."

---

### 3.5. BA-2: Bilingual (EN/VI) Copy Glossary & UI Mapping Specification

All user-facing copy is loaded via `next-intl` from `messages/en.json` and `messages/vi.json`. The tone must remain serene, poetic, unhurried, and respectful.

#### 3.5.1. Domain Terms Glossary
| Term Slug | English (EN) | Vietnamese (VI) | Tone & Usage Notes |
|---|---|---|---|
| `app_title` | TimeDrift | TimeDrift | Universal brand name; do not translate. |
| `app_tagline` | Drift into stillness | Trôi vào tĩnh lặng | Poetic subtitle reflecting the slow drift of time. |
| `template` | Sanctuary / Template | Không gian thư giãn | Represents a curated Scene + Music pair. |
| `scene` | Scene | Hoạt cảnh | Animated line-art visual. |
| `music` | Melody / Music | Giai điệu | Looping acoustic relax track. |
| `custom_pair` | Harmonize / Custom Pair | Giai điệu tự chọn | Pro feature allowing user to combine any scene and music. |
| `playlist` | Journey / Playlist | Hành trình thư giãn | Pro multi-track sequence up to 720 min. |
| `pro_tier` | Pro Sanctuary | Gói Tĩnh Tại (Pro) | Non-aggressive premium branding. |
| `duration_minutes` | {count} minutes | {count} phút | Session time indicator. |

#### 3.5.2. Core UI Translation Mapping
```json
// messages/en.json extract
{
  "Common": {
    "play": "Play",
    "pause": "Pause",
    "resume": "Resume",
    "end": "End Session",
    "back": "Back",
    "minutes": "{count} min",
    "loading": "Breathing into stillness...",
    "pro_badge": "Pro",
    "random": "Drift Randomly"
  },
  "Player": {
    "session_complete": "Session Complete",
    "session_complete_sub": "May peace remain with you as you return.",
    "replay": "Replay",
    "random_next": "Drift to Another",
    "back_home": "Return Home",
    "time_remaining": "{time} remaining",
    "day_night_toggle": "Toggle Day / Night"
  },
  "Errors": {
    "pro_required": "This journey requires Pro Sanctuary.",
    "duration_invalid": "Session must be between {min} and {max} minutes.",
    "playlist_limit_exceeded": "A journey cannot exceed 12 hours (720 minutes).",
    "network_offline": "You are currently offline. Background melodies may pause."
  }
}
```

```json
// messages/vi.json extract
{
  "Common": {
    "play": "Bắt đầu",
    "pause": "Tạm dừng",
    "resume": "Tiếp tục",
    "end": "Kết thúc",
    "back": "Quay lại",
    "minutes": "{count} phút",
    "loading": "Đang hòa mình vào tĩnh lặng...",
    "pro_badge": "Tĩnh Tại",
    "random": "Ngẫu nhiên"
  },
  "Player": {
    "session_complete": "Buổi thư giãn đã hoàn thành",
    "session_complete_sub": "Chúc bạn giữ mãi sự an yên khi trở về.",
    "replay": "Lặp lại",
    "random_next": "Chuyển không gian khác",
    "back_home": "Về trang chủ",
    "time_remaining": "Còn lại {time}",
    "day_night_toggle": "Chuyển Ngày / Đêm"
  },
  "Errors": {
    "pro_required": "Tính năng này dành riêng cho Gói Tĩnh Tại (Pro).",
    "duration_invalid": "Thời gian phiên cần từ {min} đến {max} phút.",
    "playlist_limit_exceeded": "Hành trình thư giãn không thể vượt quá 12 giờ (720 phút).",
    "network_offline": "Bạn đang ngoại tuyến. Giai điệu nền có thể bị tạm dừng."
  }
}
```

---

## 4. Quality Assurance & Director Verification Matrix for P0

To pass Gate DIR-2 and transition to P1, QA and the Director will execute the following explicit verification tests against deliverables:

| Verification Target | Responsible | Validation Procedure | Acceptance Threshold / Pass Criteria |
|---|---|---|---|
| **DES-1 (Wireframes)** | Designer $\to$ Director | Review visual wireframes across 6 key flows (Home, Player, End Modal, Custom, Playlist, Admin) on Desktop (1920×1080) and Mobile (393×852). | 100% of screens keep essential focal actions in center 640px. UI recedes after 4s without visual clutter. |
| **DES-2 (Tokens & Themes)** | Designer $\to$ BA | Verify Tailwind color palette (`paper`, `ink`, `amber`, `indigo`) and contrast ratios using axe-core or contrast analyzer. | Text/UI contrast $\ge 4.5:1$ (Day & Night). Day/Night transition duration is $800\text{ms}$ ease-in-out. |
| **OPS-1 (Environment)** | DevOps $\to$ Director | Execute `.env` loading and environment probe script checking Node 22, Python 3.11, ffmpeg 6+, and local omlx connectivity. | `curl http://10.1.123.123:8000/v1/models` returns `200 OK` with $< 500\text{ms}$ RTT; all dependencies green. |
| **AUD-1 (Benchmark)** | Audio Maker $\to$ QA | Run MusicGen CPU generation script on target machine for a 30s audio segment. | Generation RTF $\le 4.0\times$ (time $\le 120\text{s}$). CPU usage monitored and logged in `AUDIO_GUIDE.md`. |
| **AUD-2 & 3 (Audio Seeds & Prompts)** | Audio Maker $\to$ Director | Listen to M1–M5 seeds on closed-back headphones for 3 consecutive loop boundaries (120s total). Inspect prompt catalog. | Seam completely undetectable ($|x[\text{end}] - x[0]| < 0.001$, $\Delta \text{RMS} \le 1\text{dB}$). $\ge 3$ verified prompts for all 12 emotion tags. |
| **SCN-1 & 2 (Scene Pipeline)** | Scene Artist $\to$ QA | Inspect `scene-api` implementation. Run 5 standard test prompts through LLM pipeline with mock/omlx engine. | Generated code adheres strictly to TypeScript contract. Zero network/DOM access outside canvas context. |
| **ML-1 (Model Benchmarking)** | ML Engineer $\to$ Director | Compare Qwen3.5-4B vs Gemma-4-12b on the 5 standard prompts over 3 runs each. | Pass rate $\ge 70\%$ within 3 attempts on selected primary model. Latency and token consumption recorded. |
| **BA-2 (Bilingual Copy)** | BA $\to$ Director | Audit `en.json` and `vi.json` string files against UI screens and creative brief tone guidelines. | 100% key parity between `en` and `vi`. Tone is calm and poetic, devoid of pushy marketing language. |

---

## 5. Transition to Phase P1 (Foundation Kickoff)

Upon Director approval and formal checklist sign-off in `docs/phases/P0_TARGETS.md` (Gate DIR-2), the following tasks in `docs/BACKLOG.md` are unlocked for immediate execution:
1. **`OPS-2`:** Next.js 15 scaffolding with TypeScript, Tailwind, next-intl, Prisma + SQLite.
2. **`BE-1` & `BE-2`:** Prisma schema implementation, database migration, and Auth.js session configuration.
3. **`BE-3`:** Business Rules engine implementation (`src/server/rules.ts`) strictly enforcing R1–R12 with 100% Vitest coverage.
4. **`FE-1` & `FE-2`:** Player frame and sandboxed scene host implementation (`public/scene-host.html`).
