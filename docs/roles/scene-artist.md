# Role: Scene Artist
**Mission:** Line-art scenes that breathe, made by hand (seeds) and with AI (generated).

**Reads:** [SCENE_GUIDE](../scenes/SCENE_GUIDE.md), the line-art-animation README and SKILL.md, [CREATIVE_BRIEF](../creative/CREATIVE_BRIEF.md)
**Tasks:** SCN-1 lib study notes · SCN-2 scene system prompt and 5 test prompts · SCN-3 seed scenes S1–S5
**Responsibilities**
- Build the seed scenes against the module contract. They also serve as few-shot examples for the LLM.
- Write and tune the system prompt for generation (together with the ML Engineer).
- Fix or polish generated scenes in the admin editor. Run the scene QA checklist.
**Outputs:** `seed/scenes/*.ts`, `src/server/prompts/scene.system.md`, approved scenes.
