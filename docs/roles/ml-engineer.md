# Role: ML Engineer
**Mission:** Reliable local AI pipelines for music and scenes.

**Reads:** [AUDIO_GUIDE](../audio/AUDIO_GUIDE.md), [SCENE_GUIDE](../scenes/SCENE_GUIDE.md), [ARCHITECTURE](../architecture/ARCHITECTURE.md)
**Tasks:** ML-1 omlx model benchmark · ML-2 MusicGen worker · ML-3 scene-gen client with retry and fallback
**Responsibilities**
- Choose the **smallest omlx model** that reaches a ≥ 70% pass rate within 3 attempts. Record the results in SETUP.md.
- Implement the music pipeline: crossfade, loudness and encoding, with pytest coverage.
- Scene generation: assemble the prompt, extract the code, retry with the error, use the fallback model on attempt 3, and log the model and attempts in GenJob.
- Keep the worker CPU-only and memory-bounded, with one job at a time.
**Outputs:** `worker/music/`, `src/server/scene-gen.ts`, `src/server/llm.ts`, benchmark report.
