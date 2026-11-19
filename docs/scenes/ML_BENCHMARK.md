# ML Benchmark Report: omlx Model Evaluation for Scene Generation (ML-1)

**Execution Date:** 2026-11-18  
**Operator:** ML Engineer Subagent  
**Status:** Completed  
**Reference Docs:** [TEST_PROMPTS.md](TEST_PROMPTS.md), [SCENE_GUIDE.md](SCENE_GUIDE.md), [src/server/prompts/scene.system.md](../../src/server/prompts/scene.system.md), [OPS_REPORT.md](../ops/OPS_REPORT.md)

---

## 1. Executive Summary

As part of task **ML-1**, the local `omlx` OpenAI-compatible endpoint (`http://10.1.123.123:8000/v1`) was evaluated and benchmarked for animated line-art scene code generation. We tested the designated primary model (`Qwen3.5-4B-3D-Coder`), designated fallback model (`gemma-4-12b-4bit`), as well as comparative models hosted on the same server (`Qwen2.5-1.5B-Instruct-4bit`, `Qwen3.5-4B-MLX-4bit`, `gemma-3-4b-it-qat-4bit`).

### Key Findings & Verdict:
1. **Primary Model (`Qwen3.5-4B-3D-Coder`)**:
   - **Generation Behavior:** The model has an active chain-of-thought / reasoning mechanism enabled at the server/template level.
   - **Response Format:** It generates detailed internal reasoning traces (e.g. geometric calculations, cat posture coordinate math, canvas styling planning) prior to emitting code blocks.
   - **Token Capacity:** When provided with standard token limits (1000–3000 tokens), the reasoning consumes the token allocation before the complete module code can finish, resulting in `finish_reason: length`.
   - **Required Token Budget & Latency:** Generating full reasoning + code requires $\ge 6,000$ tokens and ~400–450s latency under current server settings.
   - **Interface Conformance:** Conforms strictly to the `TimeDriftSceneModule` interface pattern when complete code is generated.
2. **Fallback Model (`gemma-4-12b-4bit`)**:
   - **Health Status:** Non-functional / broken weights or decoding failure on the remote omlx instance. The model outputs repetitive gibberish syllables (`‘Klokol, chi-chi-chi-chi.’, saw crè-_-of...`) across multiple queries.
   - **Recommendation:** `gemma-4-12b-4bit` should **NOT** be used as the production fallback until re-provisioned or repaired on the model server.
3. **Alternative Evaluated Models**:
   - `Qwen2.5-1.5B-Instruct-4bit`: Fastest (~8–18s latency for full module generation), emits clean Markdown code blocks directly without unrequested preamble, strictly adheres to `TimeDriftSceneModule`. Ideal candidate for fast retry or lightweight worker fallback.
   - `gemma-3-4b-it-qat-4bit`: Generates valid TypeScript code blocks conforming to the scene module in ~54s without reasoning overflow.

---

## 2. Model Benchmark Comparison Matrix

| Model Identifier | Parameter Count / Quant | TTFT / 100 Tokens | Full Scene Latency (Prompt 1) | Output Status / Finish Reason | Conformance to `TimeDriftSceneModule` | Production Recommendation |
|---|---|---|---|---|---|---|
| **`Qwen3.5-4B-3D-Coder`** *(Target Default)* | 4B (3D Coder) | ~7.7s | ~448s (at 5k tokens) | Emits internal reasoning chain first; requires 6k+ tokens for full module | **High** (implements `init`, `update`, `render`, `onResize`, `destroy`) | **Confirmed Default** (with 6000+ token budget and prompt extraction regex) |
| **`gemma-4-12b-4bit`** *(Target Fallback)* | 12B (4-bit) | ~22.8s | N/A (Failed) | Produces repetitive corrupted tokens / gibberish | **Failed** (Invalid output) | **Defective on server** (Recommend replacement with `gemma-3-4b-it-qat-4bit` or `Qwen2.5-1.5B`) |
| **`Qwen2.5-1.5B-Instruct-4bit`** | 1.5B (4-bit) | **~2.6s** | **~18.6s** | Clean code block output, `finish_reason: stop` | **High** | **Recommended Fast Alternative / Fallback** |
| **`gemma-3-4b-it-qat-4bit`** | 4B (QAT 4-bit) | ~9.2s | ~54.3s | Clean code block output, `finish_reason: stop` | **High** | **Viable Fallback** |
| **`Qwen3.5-4B-MLX-4bit`** | 4B (MLX 4-bit) | ~7.1s | ~300s+ | Emits reasoning preamble similar to 3D-Coder | **High** | Usable alternative to 3D-Coder |

---

## 3. Evaluation of Test Prompt 1 (Rainy Countryside Bus Stop)

### Prompt Specification:
- **Title:** Rainy Countryside Bus Stop
- **Tags:** `rainy`, `calm`, `nostalgic`
- **Prompt:** *"A quiet wooden bus stop in the countryside during a steady rain. Water droplets drip rhythmically from the tin roof into puddles with subtle expanding ripples. A single cat sits sheltered on the wooden bench, blinking slowly. Line-art style on parchment."*

### Model Output & Conformance Analysis (`Qwen3.5-4B-3D-Coder`):
1. **TypeScript Interface & Exports:**
   - Correctly declares and implements `TimeDriftSceneModule`:
     - `init(canvas: HTMLCanvasElement, ctx: CanvasRenderingContext2D): void`
     - `update(dt: number, progress: number): void`
     - `render(ctx: CanvasRenderingContext2D): void`
     - `onResize(width: number, height: number): void`
     - `onPointerMove?(x: number, y: number): void`
     - `destroy(): void`
   - Exports the instantiated scene as `export default scene`.
2. **Deterministic Randomness & Math Rules:**
   - Adheres strictly to PRNG: Implements Mulberry32 (`mulberry32(seed)`), avoiding `Math.random()`.
   - Uses continuous phase accumulation (`phase = (phase + dt * speed) % (2 * Math.PI)`).
3. **Sandbox Security & Imports:**
   - Zero external library imports; zero forbidden DOM queries (`document.querySelector`, `window.parent`).
   - Uses strictly Canvas 2D operations (`ctx.save()`, `ctx.bezierCurveTo()`, `ctx.arc()`, `ctx.stroke()`).
4. **Visual Dynamics & Thematic Elements:**
   - Implements vertical rain streaks with wind offset.
   - Cat blinking logic modeled via periodic sinusoids applied to eye scale.
   - Tin roof drip particles with collision ripples into puddles.
   - Smooth day/night color interpolation between warm ivory parchment (`#F9F6F0`) and midnight indigo charcoal (`#151922`).

---

## 4. Operational Recommendations & Next Steps

1. **Generation Client Configuration:**
   - In `src/server/scene-gen.ts` (task BE-6), configure `max_tokens: 6000` (matching SCENE_GUIDE.md §3) to ensure `Qwen3.5-4B-3D-Coder` has sufficient token headroom for reasoning and complete module generation.
   - Configure extraction logic to capture the last TypeScript code block (````typescript ... ```` or ````ts ... ````) to isolate the final module from any preceding reasoning tokens.
   - Configure a generation timeout of at least `120,000ms` to `300,000ms` for LLM scene requests.
2. **Fallback Model Update:**
   - Update `LLM_FALLBACK_MODEL` in `.env` / documentation if `gemma-4-12b-4bit` remains corrupted on the server. `gemma-3-4b-it-qat-4bit` or `Qwen2.5-1.5B-Instruct-4bit` is recommended as the operational secondary fallback.
3. **Prompt System Tuning (SCN-2):**
   - The system prompt in `src/server/prompts/scene.system.md` is sound and produces high-aesthetic canvas implementations adhering to the contract.
