---
name: scene-authoring
description: Write or fix TimeDrift line-art animated scenes using the vendored line-art-animation lib and the scene module contract. Use when building seed scenes, editing generated scene code or debugging a scene that fails validation.
---
# Scene Authoring

## Contract (docs/scenes/SCENE_GUIDE.md §2, do not change it)
```ts
export default function mount(svg: SVGSVGElement, opts: SceneOpts): SceneHandle;
// SceneOpts { seed, dayLengthSec, startTau, reducedMotion }; SceneHandle { pause, resume, setSpeed, destroy }
```
Allowed imports: `../lib/ink`, `../lib/gait`, `../lib/motion`, `../lib/daynight`, `@timedrift/scene-api`.

## Skeleton
```ts
import { el, inkDefs, place, limb } from '../lib/ink';
import { gait } from '../lib/gait';
import { palette, applyPalette } from '../lib/daynight';
import type { SceneOpts, SceneHandle } from '@timedrift/scene-api';

export default function mount(svg: SVGSVGElement, o: SceneOpts): SceneHandle {
  svg.setAttribute('viewBox', '0 0 1920 1080');
  const { filter } = inkDefs(svg);
  const root = el('g', { filter }, svg);
  // 1 static background (hills, houses) 2 ambient loops (wind, water, rain) 3 ≤ 6 figures
  let speed = o.reducedMotion ? 0.25 : 1, paused = false, tau = o.startTau, raf = 0, last = performance.now();
  const frame = (now: number) => {
    const dt = Math.min(0.1, (now - last) / 1000) * speed; last = now;
    if (!paused) { tau = (tau + dt / o.dayLengthSec) % 1; applyPalette(svg, palette(tau)); /* update motion with dt */ }
    raf = requestAnimationFrame(frame);
  };
  raf = requestAnimationFrame(frame);
  return { pause: () => (paused = true), resume: () => (paused = false),
           setSpeed: (m) => (speed = Math.max(0.25, Math.min(1, m))), destroy: () => { cancelAnimationFrame(raf); svg.replaceChildren(); } };
}
```
Ink uses `currentColor`. Paper fills get the `pp` class so the night palette applies. Seed RNG: use a mulberry32 function seeded with `o.seed`. Never use `Math.random`.

## Design rules
Keep the important content in the centre third (for a 9:16 crop). Walk speed ≤ gait speed × 0.6. Figures that leave one edge re-enter from the other. Nothing visibly resets. There should always be some gentle motion.

## Validate
`npm run scene:validate -- seed/scenes/<name>.ts` runs tsc → esbuild → a 3s headless render (no console errors, ≥ 20 nodes, frames change). Then watch it at `scene-host.html?bundle=…&day=60` for 2 cycles and run the scene QA checklist in SCENE_GUIDE §6.

## Common fixes
- `tsc` errors: check the lib's exported signatures and don't invent helpers.
- Blank render: something is drawn outside the viewBox, or appended to `document` instead of `svg`.
- Jitter: you're using an absolute time delta. Clamp `dt` and accumulate phase.
