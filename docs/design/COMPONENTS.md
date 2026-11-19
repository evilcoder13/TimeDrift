# Component Specifications (Owner: UI/UX Designer)

**Version:** 1.0.0  
**Status:** Approved for Foundation / P1 Scaffolding  
**Related Requirements:** [docs/ba/P0_URD.md](file:///Users/daothang/Documents/Projects/TimeDrift/docs/ba/P0_URD.md), [docs/design/TOKENS.md](file:///Users/daothang/Documents/Projects/TimeDrift/docs/design/TOKENS.md), [docs/creative/CREATIVE_BRIEF.md](file:///Users/daothang/Documents/Projects/TimeDrift/docs/creative/CREATIVE_BRIEF.md)

---

## 1. Design System Principles

Every component in TimeDrift embodies:
1. **Uncluttered Canvas:** Interfaces defer to the line-art animation. Chrome is featherlight, utilizing 1px borders and gentle fades.
2. **Tactile Simplicity:** Generous touch targets ($\ge 44 \times 44\text{px}$) with natural, unhurried feedback loops.
3. **Graceful Degradation & Full Accessibility:** Every interactive element has keyboard focus parity, explicit ARIA roles, and handles `prefers-reduced-motion`.

---

## 2. Core Interactive Components

### 2.1. Button (`<Button />`)

#### Anatomy
`[Leading Icon (optional)] [Label Text] [Trailing Icon / Badge (optional)]`

#### Variants
- `primary`: Solid accent fill (`bg-accent text-paper-light dark:text-paper hover:bg-accent-hover`).
- `secondary`: Paper card fill with hairline border (`bg-paper-light text-ink border border-ink/15 hover:border-ink/30`).
- `ghost`: Transparent background, ink text (`hover:bg-ink/5 text-ink`).
- `danger`: Muted terracotta border and text (`text-danger border border-danger/30 hover:bg-danger/10`).
- `icon-only`: Circular or square touch target ($44 \times 44\text{px}$) with centered Lucide line icon.

#### Sizes
- `sm`: Height 32px, text-xs, px-3, radius 8px
- `md` (Default): Height 44px, text-sm font-medium, px-5, radius 10px
- `lg`: Height 52px, text-base font-medium, px-6, radius 12px

#### States
- `default`: Normal rendering.
- `hover`: 200ms ease transition on background and border.
- `focus-visible`: `ring-2 ring-accent ring-offset-2 ring-offset-paper outline-none`.
- `active`: Slight scale reduction `scale-[0.98]` over 100ms.
- `disabled`: `opacity-40 cursor-not-allowed pointer-events-none`.
- `loading`: Label replaced or accompanied by a slow pulsing 3-dot breath animation.

#### Accessibility
- Native `<button>` element.
- `aria-disabled="true"` when inactive.
- Icon-only variants strictly require `aria-label`.

---

### 2.2. Tag Chip (`<TagChip />`)

#### Anatomy
`[Dot / Icon (optional)] [Tag Name] [Count / Close Icon (optional)]`

#### Variants
- `filter`: Interactive toggle chip for filtering scene/music tags (e.g. `calm`, `rainy`, `sleepy`).
  - *Inactive:* `bg-paper-dark/60 text-ink-soft border border-ink/10 hover:border-ink/25`.
  - *Active:* `bg-ink text-paper border-ink dark:bg-ink dark:text-paper font-medium`.
- `meta`: Static display tag inside template card (`bg-paper-dark/40 text-ink-soft text-xs px-2.5 py-1 rounded-full`).
- `score`: Compatibility badge showing Jaccard match percentage (`border border-accent/40 text-accent font-mono text-xs`).

#### Behavior
- Tapping a filter chip toggles selection without page reload.
- Full keyboard arrow and enter/space activation.

---

### 2.3. Template Card (`<TemplateCard />`)

#### Anatomy
```
+-------------------------------------------------------+
|  Preview Thumbnail (16:9 Aspect Ratio)                |
|  - Line-art still frozen at tau=0.3                   |
|  - Hover: Subtle 3-frame slow motion preview          |
|  - Top Right: Tag Badge or Pro Lock                   |
+-------------------------------------------------------+
|  Title (Fraunces Serif, text-lg)                      |
|  Subtitle / Mood description (text-sm text-ink-soft)  |
|  Tags: [calm] [piano] [rainy]                         |
+-------------------------------------------------------+
```

#### States & Interaction
- `default`: Clean 1px border `border-ink/10 bg-paper-light rounded-card overflow-hidden`.
- `hover`: Border tint shifts to `border-ink/25`, thumbnail activates gentle low-framerate loop (8fps, 20% speed).
- `focus-visible`: Whole card highlighted with accent focus ring.
- `click`: Opens the **Duration Picker Sheet** (US-1).

---

### 2.4. Duration Picker Sheet (`<DurationPickerSheet />`)

#### Anatomy
A modal bottom sheet (mobile) or centered card modal (desktop) for selecting session length.
- **Header:** Template Name + Author / Seed attribution + Close button (✕).
- **Preset Buttons:**
  - Free Range: `[ 3 min ]` `[ 5 min ]` `[ 10 min ]` `[ 15 min ]` (Default: 15 min).
  - Pro Extended Presets: `[ 30 min ]` `[ 60 min ]` `[ 120 min ]` `[ 240 min ]` `[ 480 min ]` `[ 720 min ]`.
  - Pro items shown with subtle `🔒 Pro` indicator for guest/free users.
- **Duration Slider:**
  - Range track: 3 to 15 (Free) or 3 to 720 (Pro).
  - Visual indicator: Current selection displayed in large Fraunces font (`15 minutes` / `15 phút`).
  - Dragging beyond 15 min for Free user snaps back to 15 and reveals the Pro Upsell tooltip.
- **Primary CTA:** Large `[ Begin Journey / Bắt đầu ]` button.

#### Business Rules Enforced
- **R1:** Free run clamped to 3–15 min.
- **R3:** Pro run up to 720 min.
- **R4:** Clicking locked presets opens `<ProUpsellModal />`.

---

### 2.5. Player Viewport & Receding Chrome (`<PlayerViewport />`)

#### Anatomy
1. **Background Canvas Layer:** Sandboxed `<iframe>` (`public/scene-host.html`) filling `100dvw` $\times$ `100dvh`.
2. **Top Header Bar (Receding):**
   - Left: Back / Exit button (`✕ Exit Drift` / `Thoát`).
   - Center: Scene & Music Title + Tag pill.
   - Right: Ambient Day/Night Mode Switcher + Fullscreen Toggle.
3. **Bottom Control Dock (Receding):**
   - Centered inside maximum safe width (`max-w-xl mx-auto`).
   - Floating pill container (`bg-paper-light/85 dark:bg-paper-dark/85 backdrop-blur-md border border-ink/10 rounded-full px-6 py-3`).
   - Controls:
     - `Play / Pause` toggle button (Spacebar hotkey).
     - `Time Remaining` countdown readout (`fraunces font-mono text-base`).
     - `Volume Slider` with Mute toggle icon (`0% - 100%`).
     - `Drift Next (Random)` quick jump.

#### Receding Inactivity Specification (URD §3.1.1)
- **Timer:** Active pointer, touch, or keyboard event sets `inactivityTimer = 4000ms`.
- **Fade Out:** After 4.0s without input, header and bottom dock transition:
  `opacity: 0; pointer-events: none; transition: opacity 800ms cubic-bezier(0.16, 1, 0.3, 1)`.
- **Restore:** Any mouse movement ($> 3\text{px}$ delta), touch tap, or key press instantly resets opacity:
  `opacity: 1; pointer-events: auto; transition: opacity 150ms ease-out`.

#### Center-Third Mobile Framing Rule
- Canvas host preserves internal 1920×1080 resolution.
- On viewports $< 640\text{px}$ width (e.g. mobile 393×852), floating controls and focal UI never extend beyond the horizontal center 640px coordinate slice.

---

### 2.6. End Screen Overlay (`<EndScreenModal />`)

#### Anatomy
Renders in place when the session timer expires (R2).
- **Atmospheric Veil:** Background scene canvas frozen at completion; overlay adds `backdrop-blur-md bg-paper/80 dark:bg-paper-dark/80` via a 1000ms crossfade.
- **Completion Heading:**
  - EN: "Session Complete"
  - VI: "Buổi thư giãn đã hoàn thành"
- **Poetic Subtext:**
  - EN: "May peace remain with you as you return."
  - VI: "Chúc bạn giữ mãi sự an yên khi trở về."
- **Three Core Action CTAs (Horizontal row on desktop, stacked on mobile):**
  1. `[ Replay / Lặp lại ]` (Runs current scene/music pair with same duration).
  2. `[ Drift Randomly / Không gian khác ]` (Executes R6 random pairing immediately).
  3. `[ Return Home / Về trang chủ ]` (Returns to `/`).

---

### 2.7. Pro Upsell Modal (`<ProUpsellModal />`)

#### Anatomy
Shown when a Free user attempts to access `/custom`, `/playlists`, or sets a duration $> 15\text{min}$.
- **Title:** "Enter the Deeper Sanctuary" / "Gói Tĩnh Tại (Pro)"
- **Feature Comparison Matrix:**
  - Extended Timers: Up to 12 Hours (720 min) continuous drift for deep sleep & work sessions.
  - Custom Harmonization: Pair any line-art scene with any acoustic melody.
  - Infinite Journeys: Assemble multi-track playlists with seamless 3s acoustic crossfades.
- **Action CTAs:**
  - `[ Upgrade to Pro (Simulated) ]`
  - `[ Remain in Free Drift ]`

---

### 2.8. Playlist Manager Components (Pro Only)

#### 2.8.1. PlaylistItemCard
- Drag-handle (reorderable).
- Sequence index (`01`, `02`, …).
- Scene & Music title chips.
- Item duration spinner/input (`3` to `720` min).
- Remove button (`trash-2` icon).

#### 2.8.2. PlaylistAccumulatorBar
- Sticky footer on `/playlists/edit`.
- Progress meter: Displays cumulative minutes against 720-min cap:
  - $\le 600\text{ min}$: Normal accent tone.
  - $601 - 720\text{ min}$: Warm warning amber.
  - $> 720\text{ min}$: Terracotta clay (`text-danger border-danger`), Save button permanently disabled with tooltip: *"Journeys cannot exceed 12 hours (720 min) — Rule R5"*.

---

### 2.9. Admin Catalog & Validation Cards

#### 2.9.1. GenerationJobCard
- Live status indicator: `QUEUED` (pulsing gray), `GENERATING` (breathing ochre), `VALIDATING` (amber spin), `READY` (ink checkmark), `FAILED` (danger alert).
- Displays LLM model name (`Qwen3.5-4B-3D-Coder`), attempt count (`Attempt 2 of 3`), and error logs if validation fails.

#### 2.9.2. SceneInspectionPane
- Side-by-side view:
  - Left: Interactive CodeMirror editor displaying TypeScript scene code.
  - Right: Live sandboxed iframe preview with Day/Night scrubber slider ($0.0 \leftrightarrow 1.0$) and FPS monitor.
- Actions: `[ Rebuild & Validate ]`, `[ Publish / Unpublish Toggle ]`.
