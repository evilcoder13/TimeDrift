# Wireframes & Screen Layout Specifications (Owner: UI/UX Designer)

**Version:** 1.0.0  
**Status:** Approved for Foundation / P1 Scaffolding  
**Target Viewports:**
- **Desktop Primary:** 1440 × 900 px (Canvas standard 1920 × 1080)
- **Mobile Primary:** 393 × 852 px (Center-third 640px focal safe framing)
- **Related Documents:** [docs/ba/P0_URD.md](file:///Users/daothang/Documents/Projects/TimeDrift/docs/ba/P0_URD.md), [docs/design/UX_FLOWS.md](file:///Users/daothang/Documents/Projects/TimeDrift/docs/design/UX_FLOWS.md), [docs/design/TOKENS.md](file:///Users/daothang/Documents/Projects/TimeDrift/docs/design/TOKENS.md)

---

## 1. Responsive Viewport Strategy: The Center-Third Safe Zone

```
Standard 16:9 Canvas (1920 x 1080)
+-----------------------------------------------------------------------------+
|                                    |                                        |
|  PERIPHERAL BACKGROUND             |  CENTER-THIRD FOCAL ZONE               |  PERIPHERAL BACKGROUND
|  (Clouds, extended horizons,       |  (Focal subjects: Trees, benches,      |  (Extended landscape,
|   ambient floating dust/birds)     |   windows, characters, cats, text UI)  |   secondary elements)
|                                    |                                        |
|  X = 0px to 640px                  |  X = 640px to 1280px (Width: 640px)    |  X = 1280px to 1920px
|                                    |                                        |
+------------------------------------+----------------------------------------+------------------------------------+
                                     |<--- MOBILE 9:16 CROP VIEWPORT (393px) ->|
```

- When viewed on mobile devices (aspect ratio $< 1.0$), the player canvas uses `object-fit: cover; object-position: 50% 50%`.
- All key focal line-art assets and interactive overlay chrome are strictly anchored within the **center 640px** safe zone.

---

## 2. Wireframes: Screen by Screen

### 2.1. Home View (`/`)

#### 2.1.1. Desktop (1440px)
```
+----------------------------------------------------------------------------------------------------+
|  [TIMEDRIFT Logo]                                     [EN/VI]   [Day/Night Auto]   [Login / Pro 🔒] |
+----------------------------------------------------------------------------------------------------+
|                                                                                                    |
|                                       TIMEDRIFT                                                    |
|                                  Drift into stillness                                              |
|                                                                                                    |
|                             [  ▶  Quick Drift (15 min)  ]                                          |
|                                [   Drift Randomly ⚄   ]                                            |
|                                                                                                    |
|  Filter by Mood:                                                                                   |
|  ( All )  ( Calm )  ( Sleepy )  ( Focus )  ( Rainy )  ( Nostalgic )  ( Cozy )  ( Nature )          |
|                                                                                                    |
|  +---------------------------+  +---------------------------+  +---------------------------+       |
|  | [ Scene Thumbnail ]       |  | [ Scene Thumbnail ]       |  | [ Scene Thumbnail ]       |       |
|  | Rainy Bus Stop            |  | Tea by the Window         |  | Old Bonsai on Balcony     |       |
|  | Felt Piano (60 BPM)       |  | Nylon Guitar (65 BPM)     |  | Ambient Harp (58 BPM)     |       |
|  | [rainy] [calm]            |  | [cozy] [tea] [warm]       |  | [calm] [nature]           |       |
|  +---------------------------+  +---------------------------+  +---------------------------+       |
|  | [ Scene Thumbnail ]       |  | [ Scene Thumbnail ]       |  | [ Scene Thumbnail ]       |       |
|  | Midnight Lantern Cabin    |  | Temple Water Rocker       |  | Vintage Bicycle Wall      |       |
|  | Night Rhodes (52 BPM)     |  | Bamboo Flute (56 BPM)     |  | Muted Lo-Fi (70 BPM)      |       |
|  | [night] [sleepy]          |  | [peaceful] [zen]          |  | [nostalgic] [focus]       |       |
|  +---------------------------+  +---------------------------+  +---------------------------+       |
|                                                                                                    |
+----------------------------------------------------------------------------------------------------+
```

#### 2.1.2. Mobile (393px)
```
+-----------------------------------+
| = TIMEDRIFT         [VI] [☀️/🌙]   |
+-----------------------------------+
|                                   |
|            TIMEDRIFT              |
|       Trôi vào tĩnh lặng          |
|                                   |
|   [  ▶ Bắt đầu nhanh (15p)  ]     |
|   [    Ngẫu nhiên ⚄         ]     |
|                                   |
| Mood:                             |
| [Tất cả] [Bình yên] [Mưa] [Đêm] > |
|                                   |
| +-------------------------------+ |
| | [ Scene Thumbnail 16:9 ]      | |
| | Trạm xe buýt chiều mưa        | |
| | Piano mộc mạc • 60 BPM        | |
| | [mưa] [bình yên]              | |
| +-------------------------------+ |
|                                   |
| +-------------------------------+ |
| | [ Scene Thumbnail 16:9 ]      | |
| | Tách trà bên khung cửa        | |
| | Guitar cổ điển • 65 BPM       | |
| | [ấm cúng] [hoài niệm]         | |
| +-------------------------------+ |
|                                   |
| [ Home ]   [ Custom 🔒 ] [ Pro ]  |
+-----------------------------------+
```

---

### 2.2. Duration Picker Modal / Sheet (US-1, US-2)

#### 2.2.1. Mobile Bottom Sheet / Desktop Centered Card
```
+-------------------------------------------------------------------+
|  Rainy Countryside Bus Stop                                   [✕] |
|  Felt Piano in F Major • 60 BPM • Loopable                        |
+-------------------------------------------------------------------+
|                                                                   |
|  CHOOSE YOUR DRIFT DURATION:                                      |
|                                                                   |
|  [ 3 min ]      [ 5 min ]      [ 10 min ]     [ 15 min (Std) ]    |
|                                                                   |
|  [ 30 min 🔒]   [ 60 min 🔒]   [ 120 min 🔒]  [ 720 min 🔒]       |
|                                                                   |
|                     15 minutes / 15 phút                          |
|  [=========================================O-------------------]  |
|  3 min                                     15 min        720 min  |
|                                                                   |
|  * Durations beyond 15 min are unlocked with Pro Sanctuary.       |
|                                                                   |
|  +-------------------------------------------------------------+  |
|  |                 [  ▶  Begin Journey  ]                      |  |
|  +-------------------------------------------------------------+  |
+-------------------------------------------------------------------+
```

---

### 2.3. Active Player Screen (`/play`)

#### 2.3.1. Normal State (Controls Active)
```
+----------------------------------------------------------------------------------------------------+
| [ ✕ Exit ]            Rainy Bus Stop  •  Felt Piano                  [ ☀️ Day ]   [ ⛶ Fullscreen ] |
|                                                                                                    |
|                                                                                                    |
|                                                                                                    |
|                                    ( Fullscreen Sandboxed )                                        |
|                                    ( Line-Art Canvas Host )                                        |
|                                    ( Center 640px Safe    )                                        |
|                                                                                                    |
|                                                                                                    |
|                                                                                                    |
|                    +--------------------------------------------------------+                      |
|                    |  [ ⏸ ]   14:28 remaining    [ ◖ ━━━●━━ ◗ ]   [ ⚄ ]   |                      |
|                    +--------------------------------------------------------+                      |
+----------------------------------------------------------------------------------------------------+
```

#### 2.3.2. Receded State (After 4.0 Seconds Inactivity)
```
+----------------------------------------------------------------------------------------------------+
|                                                                                                    |
|                                                                                                    |
|                                                                                                    |
|                                                                                                    |
|                           ( Pure animated line-art drawing only )                                  |
|                           ( Water droplets dripping, puddles rippling )                            |
|                           ( Cat breathing slowly on bench )                                        |
|                           ( Zero UI chrome visible - Complete Stillness )                          |
|                                                                                                    |
|                                                                                                    |
|                                                                                                    |
|                                                                                                    |
|                                                                                                    |
+----------------------------------------------------------------------------------------------------+
```

---

### 2.4. End Screen Modal (Rule R2)

```
+----------------------------------------------------------------------------------------------------+
|  [ Background Scene Frozen at End Frame with Soft Warm Blur Backdrop ]                             |
|                                                                                                    |
|                          +------------------------------------------------+                        |
|                          |                                                |                        |
|                          |               Session Complete                 |                        |
|                          |          Buổi thư giãn đã hoàn thành           |                        |
|                          |                                                |                        |
|                          |     May peace remain with you as you return.   |                        |
|                          |      Chúc bạn giữ mãi sự an yên khi trở về.    |                        |
|                          |                                                |                        |
|                          |   [  ↺  Replay Session (15 min)  ]             |                        |
|                          |                                                |                        |
|                          |   [  ⚄  Drift to Another Scene   ]             |                        |
|                          |                                                |                        |
|                          |   [  ←  Back to Sanctuary        ]             |                        |
|                          |                                                |                        |
|                          +------------------------------------------------+                        |
|                                                                                                    |
+----------------------------------------------------------------------------------------------------+
```

---

### 2.5. Custom Pair Screen (`/custom` — Pro Only)

#### 2.5.1. Desktop (1440px)
```
+----------------------------------------------------------------------------------------------------+
| [ ← Home ]                    Custom Harmonization (Pro)                      [ Account / Pro Status ]|
+----------------------------------------------------------------------------------------------------+
|  STEP 1: SELECT SCENE                           |  STEP 2: SELECT MELODY                           |
|  Filter: [All] [Rainy] [Nature] [Room]          |  Filter: [All] [Piano] [Guitar] [Ambient]        |
|                                                 |                                                  |
|  +--------------------+  +--------------------+ |  +--------------------+  +---------------------+ |
|  | [✓ Selected]       |  | [                  | |  | [▶ Audition (10s)] |  | [▶ Audition (10s)]  | |
|  | Rainy Bus Stop     |  | Bonsai Balcony     | |  | Warm Felt Piano    |  | Forest Bamboo Flute | |
|  | [rainy] [calm]     |  | [calm] [nature]    | |  | 60 BPM • [calm]    |  | 56 BPM • [peaceful] | |
|  +--------------------+  +--------------------+ |  | [✓ Selected]       |  |                     | |
|                                                 |  +--------------------+  +---------------------+ |
+----------------------------------------------------------------------------------------------------+
|  STICKY HARMONIZATION TRAY:                                                                        |
|  Scene: Rainy Bus Stop  +  Melody: Warm Felt Piano  |  Match Score: 85% (Jaccard High)             |
|  Duration: [ 30 min ▾ ]                                             [  ▶ Play Custom Pair  ]       |
+----------------------------------------------------------------------------------------------------+
```

#### 2.5.2. Free User Locked State (Pro Upsell)
```
+----------------------------------------------------------------------------------------------------+
|  [ Blurred Custom Pair UI Background ]                                                             |
|                                                                                                    |
|                       +---------------------------------------------------+                        |
|                       |  🔒  Pro Sanctuary Feature                        |                        |
|                       |                                                   |                        |
|                       |  Harmonize any line-art drawing with any          |                        |
|                       |  acoustic melody of your choice.                  |                        |
|                       |                                                   |                        |
|                       |  - Unrestricted pairings                          |                        |
|                       |  - Sessions up to 720 minutes                     |                        |
|                       |  - Infinite continuous playlists                  |                        |
|                       |                                                   |                        |
|                       |         [ Upgrade to Pro (Simulated) ]            |                        |
|                       |         [ Return to Curated Drift ]               |                        |
|                       +---------------------------------------------------+                        |
+----------------------------------------------------------------------------------------------------+
```

---

### 2.6. Playlists Manager (`/playlists` — Pro Only)

```
+----------------------------------------------------------------------------------------------------+
| [ ← Home ]                    My Journeys (Playlists)                              [ + New Journey ]|
+----------------------------------------------------------------------------------------------------+
|  Journey: "Deep Evening Study & Sleep"                                                             |
|                                                                                                    |
|  Items (3 / 50 Max):                                                                               |
|  +----+-------------------------------+-----------------------------+----------+-----------------+  |
|  | :: | 01. Rainy Countryside Bus Stop| Felt Piano in F Major       | [ 45m ▾] | [ ✕ Remove ]    |  |
|  +----+-------------------------------+-----------------------------+----------+-----------------+  |
|  | :: | 02. Tea by the Window         | Warm Acoustic Folk Guitar   | [ 60m ▾] | [ ✕ Remove ]    |  |
|  +----+-------------------------------+-----------------------------+----------+-----------------+  |
|  | :: | 03. Midnight Lantern Cabin    | Night Ambient Rhodes        | [180m ▾] | [ ✕ Remove ]    |  |
|  +----+-------------------------------+-----------------------------+----------+-----------------+  |
|                                                                                                    |
|  +-----------------------------------------------------------------------------------------------+ |
|  | Total Planned Duration: 285 min / 720 min max (Cap R5)                          [ Save Journey ] | |
|  +-----------------------------------------------------------------------------------------------+ |
+----------------------------------------------------------------------------------------------------+
```

---

### 2.7. Admin Dashboard (`/admin/scenes`)

```
+----------------------------------------------------------------------------------------------------+
|  TIMEDRIFT ADMIN  |  Tags (AD-1)  |  Music (AD-2)  |  Scenes (AD-3)  |  Templates (AD-4)  |  Users |
+----------------------------------------------------------------------------------------------------+
|  SCENE GENERATION & VALIDATION PIPELINE                                                            |
|                                                                                                    |
|  Prompt: [ A quiet tea house in the rain with steam rising from a cup...                       ]  |
|  Tags:   [x] rainy   [x] cozy   [x] tea                                                            |
|  Model:  (•) Qwen3.5-4B-3D-Coder (Primary)     ( ) Gemma-4-12b-4bit (Fallback)                     |
|                                                                        [ Generate Scene (omlx) ]   |
|                                                                                                    |
|  ACTIVE GENERATION JOBS:                                                                           |
|  +-----------------------------------------------------------------------------------------------+ |
|  | Job #SCN-104 | "Quiet Tea House" | Attempt 1/3 | Status: VALIDATING (Chromium 30fps Headless) | |
|  +-----------------------------------------------------------------------------------------------+ |
|                                                                                                    |
|  SCENE INSPECTION & CODE FIX (SCN-103 - READY):                                                    |
|  +--------------------------------------------+--------------------------------------------------+ |
|  | Code Editor (TypeScript / Module API)      | Live Sandbox Iframe Preview                      | |
|  |                                            |                                                  | |
|  | export class Scene implements TimeDrift... | [ Live rendering at 60fps ]                      | |
|  |   init(canvas, ctx) { ... }                | [ Day / Night Slider: ━━━●━━━━━ (0.42) ]         | |
|  |   update(dt, progress) { ... }             |                                                  | |
|  |   render(ctx) { ... }                      | Frame Time: 3.2ms | Figures: 2 | Seam: Clean     | |
|  +--------------------------------------------+--------------------------------------------------+ |
|  [ Rebuild Bundle ]                                           [ Unpublish ]  [ Publish to Live ]   |
+----------------------------------------------------------------------------------------------------+
```

---

### 2.8. Day vs. Night Theme Wireframe Comparisons

```
+-------------------------------------------+  +-------------------------------------------+
| DAY THEME (Sunlit Parchment)              |  | NIGHT THEME (Midnight Charcoal & Lantern) |
| - Background: #F4EFE6 (Warm Paper)        |  | - Background: #161822 (Deep Charcoal Wash)|
| - Lines: #2B2A28 (Concentrated Sumi Ink)  |  | - Lines: #EDE9DF (Soft Luminous Ivory)    |
| - Controls: Paper pill with hairline ink  |  | - Controls: Translucent charcoal dock     |
| - Atmosphere: Serene daylight             |  | - Atmosphere: Amber window lantern glow   |
+-------------------------------------------+  +-------------------------------------------+
```
