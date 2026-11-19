# Library Analysis: `vendor/line-art-animation`
**Owner:** Scene Artist  
**Task:** SCN-1  
**Target Reference:** [JDhruv14/line-art-animation](https://github.com/JDhruv14/line-art-animation)  

---

## 1. Architectural Overview & Design Philosophy

`line-art-animation` is a dependency-free TypeScript / SVG procedural animation toolkit and AI coding agent skill designed to generate hand-drawn ink-on-paper aesthetics. 

### Key Characteristics
1. **Ink-on-Paper Aesthetic:**
   - Visual identity built on minimalist, restrained line art mimicking delicate fountain pen / dip pen strokes on textured parchment.
   - Limbs and anatomy are drawn as **two open pen strokes** with a paper fill class (`pp`), rather than rigid single vector strokes or geometric fills. Joints are soft and rounded; lines curve organically with slight physical pen imperfections.
   - Color styling relies on `currentColor` for line work, allowing theme adaptation, while dynamic fills react to background lighting.

2. **Procedural Motion over Static Keyframes:**
   - Motion is generated mathematically through physics simulations and kinematic solvers rather than linear interpolation or raw sine waves.
   - Guarantees natural physical realism: secondary oscillations, inertia, minimum jerk trajectories, and planted-foot ground contact.

3. **Self-Contained Living Scenes:**
   - Scenes are responsive, coordinate-normalized (viewBox `0 0 1920 1080`), and continuously looped without jarring visual resets.
   - Built to run deterministically from a numeric seed (`mulberry32`), ensuring repeatable visual compositions.

---

## 2. Core Modules & Exported Signatures

The library is organized into four core modules under `lib/`:

### 2.1. `lib/ink.ts` — Vector Primitives & Ink Aesthetics
Handles SVG element creation, ink filters, and character limb construction:
- **`inkDefs(svg: SVGSVGElement): { filter: string }`**  
  Injects standard SVG `<defs>` including procedural ink bleed/roughening turbulence filters and gradient markers. Returns the filter ID string for application to root containers.
- **`el<K extends keyof SVGElementTagNameMap>(tag: K, attrs?: Record<string, any>, parent?: SVGElement): SVGElementTagNameMap[K]`**  
  Lightweight DOM creation helper for SVG elements with attribute mapping and parent attachment.
- **`limb(p1: [number, number], p2: [number, number], width?: number): SVGPathElement`**  
  Generates an organic double-stroke limb segment between two 2D points, leaving subtle open ends at joint connections.
- **`shoe(x: number, y: number, dir: number, scale?: number): SVGPathElement`**  
  Renders a stylized shoe/foot contour aligned with character travel direction.
- **`place(container: SVGElement | any[], x?: number, y?: number, dir?: number, scale?: number | [number, number]): SVGElement`**  
  Transforms and positions characters or composite objects within the scene coordinate space. Standard figures are ~95 units tall with feet planted at local $y = 120$.

### 2.2. `lib/gait.ts` — Locomotion Kinematics
Solves organic character locomotion:
- **`gait(params: { kind: 'walk' | 'run' | 'shuffle'; phase: number; speed?: number }): GaitPose`**  
  Procedural inverse kinematics for bipeds and quadrupeds. Crucially coordinates:
  - **Planted Foot Locking:** When a foot is on the ground, its position moves backward at exact travel speed, eliminating visual sliding/ice-skating artifacts.
  - **Hip Bobbing & Stride Limits:** Hip elevation naturally dips and rises in cadence with leg extension.
  - Characters walk at slow, unhurried paces (travel speed $\le \text{gait speed} \times 0.6$).

### 2.3. `lib/motion.ts` — Natural Physics & Motion Curves
Provides physics helpers for organic environmental effects:
- **`minJerk(t: number): number`**  
  Evaluates 5th-order minimum-jerk polynomial ($10t^3 - 15t^4 + 6t^5$) for biological, human-like motion with zero start/end acceleration and jerk.
- **`spring(val: number, target: number, vel: number, config?: { stiffness?: number; damping?: number }): [number, number]`**  
  Damped harmonic oscillator for reactive elements (dangling lanterns, coats flapping, branches swaying).
- **`pendulum(theta: number, omega: number, dt: number, length: number): [number, number]`**  
  Calculates natural gravitational swing for hanging wind chimes, shop signs, or swinging lanterns.
- **`run(opts: SceneOpts, svg?: any): any`** / Loop Runners:  
  Internal animation loop utility coordinating frame callbacks, requestAnimationFrame, and phase accumulation.

### 2.4. `lib/daynight.ts` — Dynamic Palette Transitions
Controls ambient environmental lighting across the day/night cycle:
- **`palette(tau: number): DayNightPalette`**  
  Calculates color transitions for phase $\tau \in [0, 1)$ ($0.0 = \text{midnight}$, $0.25 = \text{dawn}$, $0.5 = \text{noon}$, $0.75 = \text{dusk}$):
  - **Day:** Warm ivory/parchment background (`#F9F6F0`), dark sumi ink (`#2C2A29`), translucent tea washes.
  - **Night:** Deep indigo/slate background (`#161B26`), pale bone ink (`#DCE1E8`), warm luminous lantern/window amber glows (`#E8A848`).
- **`applyPalette(svg: SVGSVGElement, p: DayNightPalette): void`**  
  Updates CSS custom properties, background fills, and `.pp` paper-layer elements smoothly across time.

---

## 3. Motion Curves & Animation Rules

To maintain the tranquil, meditative quality of TimeDrift:
1. **Breathing Rhythm:** All cyclical oscillations must operate on long loop periods ($T \ge 2.0\text{s}$, typically $4\text{s} - 8\text{s}$) to avoid agitation or urgency.
2. **Velocity Clamping:** Frame delta $\Delta t$ must always be clamped ($\Delta t = \min(0.1, \text{raw\_dt})$) to prevent physics explosions or visual warping during background tab throttling.
3. **Seamless Phase Wraparounds:** Motion must rely on modular continuous phases:
   $$\text{phase} = (\text{phase} + \Delta t \cdot \omega) \pmod{2\pi}$$
   No hard jumps, visible resets, or sudden teleports.
4. **Compositional Containment:** Main subjects are concentrated within the central third ($x \in [320, 1600]$, $y \in [180, 900]$) to preserve readability on 9:16 mobile viewports.

---

## 4. Bridge to TimeDrift Interface Contract

While `line-art-animation` provides vector rendering primitives and motion physics, TimeDrift enforces strict sandboxed encapsulation via `TimeDriftSceneModule` (URD §3.4.1) and `mount()` (SCENE_GUIDE §2):
- **Deterministic Seeding:** PRNG (`mulberry32`) seeded with `opts.seed` replaces `Math.random`.
- **Zero DOM Escape:** All element creation, attribute mutation, and event hooks are isolated strictly to the supplied canvas/SVG context inside the iframe sandbox (`allow-scripts`, no `allow-same-origin`).
- **Full Lifecycle Management:** Explicit cleanup in `destroy()` tears down all requestAnimationFrame callbacks, listeners, and cached state to prevent memory leaks during long-running relax sessions.
