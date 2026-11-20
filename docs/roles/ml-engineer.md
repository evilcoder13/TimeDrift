# Role: ML Engineer
**Mission:** Reliable local AI pipelines for music and scenes.

**Reads:** [AUDIO_GUIDE](../audio/AUDIO_GUIDE.md), [SCENE_GUIDE](../scenes/SCENE_GUIDE.md), [ARCHITECTURE](../architecture/ARCHITECTURE.md)
**Tasks:** ML-1 LLM model benchmark · ML-2 MusicGen worker · ML-3 scene-gen client with retry and fallback
**Responsibilities**
- Maintain the local lightweight LLM worker (`worker/llm/` with llama.cpp GGUF) and benchmark models reaching ≥ 70% pass rate within 3 attempts.
- Implement the music pipeline (`worker/music/`): crossfade, loudness and encoding, with pytest coverage.
- Scene generation: assemble the prompt, extract the code, retry with the error, use the fallback model on attempt 3, and log the model and attempts in GenJob.
- Keep all workers CPU-only, memory-bounded, and runnable standalone or via Docker.
**Outputs:** `worker/music/`, `worker/llm/`, `src/server/services/scene-generator.ts`, `src/server/services/music-client.ts`, benchmark report.
