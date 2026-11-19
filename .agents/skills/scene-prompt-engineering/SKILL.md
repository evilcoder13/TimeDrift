---
name: scene-prompt-engineering
description: Build and tune the LLM system/user/retry prompts that make small omlx models generate valid TimeDrift line-art scenes. Use when editing src/server/prompts/scene.system.md, improving pass rate, or running scene prompt benchmarks.
---
# Scene Prompt Engineering

## System prompt structure (`src/server/prompts/scene.system.md`), ≤ ~4k tokens
1. Role: "You write one TypeScript module that animates a calm line-art SVG scene."
2. Hard rules: the contract, the allowed imports, viewBox 1920×1080, no fetch/eval/document, ≤ 6 figures, seeded RNG, slow motion.
3. Lib API: **only the exported signatures** from `vendor/line-art-animation/lib/*.ts` (generate them with `npm run scene:api-digest`; don't paste whole files).
4. One complete seed scene as the example (the shortest one that's good, about 150 lines).
5. Creative rules from CREATIVE_BRIEF (scene section).
6. Output rule: "Return ONLY one ```ts code block. No prose."

## User prompt
```
Scene name: {name}
Description: {description}
Feeling tags: {tags}
Admin notes: {prompt}
```

## Retry prompt (attempts 2–3)
```
Your previous code failed validation.
<error>
{first 40 lines of tsc/runtime errors}
</error>
<code>
{previous code}
</code>
Fix every error. Return the full corrected file in one ```ts block.
```

## Tuning loop
1. Fixed test set: the 5 prompts in `seed/scene-prompts.json`.
2. Run `npm run scene:bench -- --model <id> --runs 3`. Record the pass rate within 3 attempts, the average attempts needed, and the latency.
3. Change one thing at a time (an example, a rule's wording, the API digest). Keep the change only if the pass rate doesn't drop.
4. Typical wins: tell the model the names it must NOT invent, put the contract skeleton first, use a lower temperature (0.2–0.4).
Record each result in `docs/scenes/SCENE_GUIDE.md` §7 "Benchmark log".
