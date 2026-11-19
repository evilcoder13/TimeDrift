# Scene Benchmark Test Prompts
**Owner:** Scene Artist  
**Task:** SCN-2 / ML-1 Benchmark Suite  
**Reference:** [P0_URD.md §3.4.3](../ba/P0_URD.md#343-scn-2-system-prompt-engineering--5-benchmark-prompts) & [SCENE_GUIDE.md](SCENE_GUIDE.md)

This suite contains the 5 standardized benchmark prompts used to evaluate LLM scene generation pass rates, compile health, runtime stability, and aesthetic quality under `omlx` (Qwen3.5-4B-3D-Coder and fallback Gemma-4-12b-4bit).

---

## Evaluation Criteria
For each generated prompt, the validator and benchmark runner test:
1. **Compilation:** Strict TypeScript compilation (`tsc --noEmit`) against `TimeDriftSceneModule`.
2. **Bundle Integrity:** Clean bundling via `esbuild --bundle --format=esm`.
3. **Headless Execution:** 3.0-second execution in Chromium without runtime errors or console exceptions.
4. **Motion Activity:** Non-zero pixel delta between frames (verifies animation is alive and not static).
5. **Frame Budget & Safety:** CPU load < 30% single-core; figure count $\le 6$; zero outbound network or forbidden DOM calls.
6. **Focal Rule:** Key visual composition contained within central third (9:16 crop friendly).

---

## Benchmark Prompts

### Prompt 1: Rainy Countryside Bus Stop
- **Primary Tag:** `rainy`
- **Secondary Tags:** `calm`, `nostalgic`
- **Prompt Text:**
> "A quiet wooden bus stop in the countryside during a steady rain. Water droplets drip rhythmically from the tin roof into puddles with subtle expanding ripples. A single cat sits sheltered on the wooden bench, blinking slowly. Line-art style on parchment."
- **Expected Visual Dynamics:**
  - Vertical falling rain streaks with slight wind tilt.
  - Periodic dripping drops from eaves triggering concentric ripple rings.
  - Cat eye-blink and ear-twitch cycles ($T \approx 4\text{s} - 6\text{s}$).
  - Smooth day-to-night shift from rainy daylight grey-cream to deep rain-slicked dark indigo.

---

### Prompt 2: Bonsai Balcony Overlook
- **Primary Tag:** `calm`
- **Secondary Tags:** `peaceful`, `nature`
- **Prompt Text:**
> "An old bonsai tree perched on a stone balcony overlooking rolling hills. Gentle wind sways the pine needles slowly. Two leaves detach and drift down gracefully. Ink wash line drawing."
- **Expected Visual Dynamics:**
  - Harmonic sway on branch tips using damped harmonic motion.
  - Drifting leaves following smooth minimum-jerk trajectory across the center third.
  - Distant multi-layered mountain contours in light ink washes.
  - Golden hour dawn-to-dusk gradient transitions.

---

### Prompt 3: Vintage Bicycle in Old Alley
- **Primary Tag:** `nostalgic`
- **Secondary Tags:** `warm`, `cozy`
- **Prompt Text:**
> "A vintage bicycle parked against a brick wall beneath an old street lantern. Clothes hang on a balcony wire above, swaying softly in a light evening breeze. Detailed hatched ink lines."
- **Expected Visual Dynamics:**
  - Hanging laundry swaying like gentle pendulums ($T \approx 3\text{s}$).
  - Street lantern casting a delicate amber radial illumination at night (`progress > 0.5`).
  - Subtle leaf or dust drift at ground level.
  - Brick wall hatching and bicycle spoke detail drawn with clean vector strokes.

---

### Prompt 4: Tranquil Bamboo Grove & Shishi-Odoshi
- **Primary Tag:** `peaceful`
- **Secondary Tags:** `nature`, `focus`
- **Prompt Text:**
> "A tranquil bamboo grove beside a small stone basin with a traditional shishi-odoshi (wooden water fountain) rocking down every 8 seconds. Ink wash aesthetic."
- **Expected Visual Dynamics:**
  - Vertical bamboo stalks with subtle wind deflection.
  - Rocker arm fills slowly, pivots down sharply, strikes stone, and returns smoothly every 8.0 seconds.
  - Gentle water trickle and basin splash rings.
  - Meditative tempo with zero high-frequency jitter.

---

### Prompt 5: Cabin Window & Fireflies
- **Primary Tag:** `night`
- **Secondary Tags:** `sleepy`, `dreamy`
- **Prompt Text:**
> "A small cabin window overlooking a pine forest under a crescent moon. Inside the window, a warm yellow lantern light flickers gently. Soft fireflies drift across the glass. Dark ink with warm amber glows."
- **Expected Visual Dynamics:**
  - Fireflies wandering with organic Brownian motion / smooth trigonometric drift.
  - Warm amber lantern glow undulating inside window panes ($T \approx 2.5\text{s}$).
  - Silhouette of pine trees framing a delicate crescent moon.
  - High contrast night palette with luminous yellow-orange window highlights.

---

## Machine-Readable Benchmark Manifest (`seed/scene-prompts.json`)

```json
[
  {
    "id": "bench-1-rainy",
    "name": "Rainy Bus Stop",
    "tag": "rainy",
    "tags": ["rainy", "calm", "nostalgic"],
    "prompt": "A quiet wooden bus stop in the countryside during a steady rain. Water droplets drip rhythmically from the tin roof into puddles with subtle expanding ripples. A single cat sits sheltered on the wooden bench, blinking slowly. Line-art style on parchment."
  },
  {
    "id": "bench-2-calm",
    "name": "Bonsai Balcony",
    "tag": "calm",
    "tags": ["calm", "peaceful", "nature"],
    "prompt": "An old bonsai tree perched on a stone balcony overlooking rolling hills. Gentle wind sways the pine needles slowly. Two leaves detach and drift down gracefully. Ink wash line drawing."
  },
  {
    "id": "bench-3-nostalgic",
    "name": "Vintage Bicycle",
    "tag": "nostalgic",
    "tags": ["nostalgic", "warm", "cozy"],
    "prompt": "A vintage bicycle parked against a brick wall beneath an old street lantern. Clothes hang on a balcony wire above, swaying softly in a light evening breeze. Detailed hatched ink lines."
  },
  {
    "id": "bench-4-peaceful",
    "name": "Bamboo Grove",
    "tag": "peaceful",
    "tags": ["peaceful", "nature", "focus"],
    "prompt": "A tranquil bamboo grove beside a small stone basin with a traditional shishi-odoshi (wooden water fountain) rocking down every 8 seconds. Ink wash aesthetic."
  },
  {
    "id": "bench-5-night",
    "name": "Cabin Fireflies",
    "tag": "night",
    "tags": ["night", "sleepy", "dreamy"],
    "prompt": "A small cabin window overlooking a pine forest under a crescent moon. Inside the window, a warm yellow lantern light flickers gently. Soft fireflies drift across the glass. Dark ink with warm amber glows."
  }
]
```
