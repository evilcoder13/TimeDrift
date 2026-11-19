# Scene Guide (Owner: Scene Artist)

## 1. Library
Vendored from [JDhruv14/line-art-animation](https://github.com/JDhruv14/line-art-animation) (MIT) into `vendor/line-art-animation/lib`:
`ink.ts` (el, limb, shoe, place, inkDefs, run), `gait.ts` (gait poses), `motion.ts`, `daynight.ts` (palette(τ), applyPalette). Figures ~95 units tall, feet on y=120, placed via `place()`.

## 2. Scene module contract (do not change without ADR)
```ts
import type { SceneOpts } from '@timedrift/scene-api';
export interface SceneOpts {
  seed: number;          // deterministic randomness
  dayLengthSec: number;  // full day/night cycle, default 900
  startTau: number;      // 0..1, 0 = midnight, 0.5 = noon
  reducedMotion: boolean;
}
export interface SceneHandle {
  pause(): void; resume(): void;
  setSpeed(mult: number): void;   // 0.25..1
  destroy(): void;
}
export default function mount(svg: SVGSVGElement, opts: SceneOpts): SceneHandle;
```
Rules: viewBox `0 0 1920 1080`; import only from `../lib/*` and `@timedrift/scene-api`; no `fetch`, no `eval`, no DOM outside the given `svg`; must not throw within 3 s; ≤ 6 figures.

## 3. LLM generation
- Endpoint: `LLM_BASE_URL` (omlx, OpenAI-compatible) `POST /chat/completions`.
- Model order: attempt 1–2 `LLM_MODEL` (`Qwen3.5-4B-3D-Coder`), attempt 3 `LLM_FALLBACK_MODEL` (`gemma-4-12b-4bit`). temperature 0.4, max_tokens 6000.
- System prompt = condensed SKILL.md + lib API signatures + contract §2 + one seed scene as example + Creative Brief scene rules. Stored in `src/server/prompts/scene.system.md` (task SCN-2).
- User prompt template:
```
Scene name: {name}
Description: {description}
Feeling tags: {tags}
Admin notes: {prompt}
Return ONLY one TypeScript code block implementing the contract.
```
- Retry prompt: previous code + error output (tsc / runtime console) + "Fix and return the full file."

## 4. Validation pipeline
1. Extract the first ```ts block. 2. `tsc --noEmit` against lib + scene-api types. 3. `esbuild --bundle --format=esm --minify`. 4. Headless Chromium loads `scene-host.html?bundle=…` for 3 s: no console errors, `svg` has ≥ 20 child nodes, frame-to-frame pixel diff > 0 (it animates). 5. Save `source.ts`, `bundle.js`, model name.

## 5. Seed scenes (hand-made by Scene Artist, adapted from repo examples)
See [content/SEED_CONTENT.md](../content/SEED_CONTENT.md).

## 6. QA checklist
- [ ] Contract satisfied  - [ ] Watch 2 full day cycles at `day=60`: no visual reset, no stuck figure  - [ ] CPU < 30% one core (Chrome perf)  - [ ] Readable at 9:16 crop  - [ ] reducedMotion honoured
