---
name: music-generation
description: Generate, loop-process, QA and catalogue relax music with MusicGen-small on CPU for TimeDrift. Use for writing music prompts, running the music worker, fixing loop seams or building the seed tracks.
---
# Music Generation

## Prompt
Formula: `<type>, <mood tags>, <instruments>, <bpm> bpm, <texture>, no vocals, loopable, soft dynamics`
Avoid: epic, drop, intense, drums (allowed: "muted kick", "brushes"), vocals, choir. The starter library is in `docs/audio/AUDIO_GUIDE.md` §5.

## Run
- Worker: `cd worker/music && ./run.sh` (listens on :8100). Health check: `curl :8100/health`.
- Generate one track:
```bash
curl -X POST localhost:8100/generate -H 'content-type: application/json' \
  -d '{"prompt":"soft solo piano, gentle rain mood, 65 bpm, warm reverb, no vocals, loopable","seconds":30,"out_path":"storage/audio/test.ogg"}'
```
- Expect 2–6 min per 30s clip on CPU. Queue a batch and leave it running. Never run jobs in parallel.

## Pipeline (ML Engineer implements)
`musicgen-small` (guidance 3.0, temperature 1.0, top_k 250) produces `seconds+4`. Then: equal-power crossfade of the last 4s into the first 4s, aligned to a zero crossing → trim to `seconds` → pyloudnorm to −16 LUFS, peak −1 dBTP → ffmpeg to ogg vorbis q5 at 32 kHz mono.

## QA (per track)
1. Loop it 3× on headphones and listen for a click, a gap or a jump in volume at the seam.
2. Listen for clipping, harsh highs and vocal-like artifacts.
3. Check that BPM and mood match the tags.
4. If it fails: change the prompt (simplify the instruments, lower the BPM) and regenerate. If the seam problem keeps happening, report it to the ML Engineer with the file.

## Catalogue
Record each track: `name EN/VI, type, tags, prompt, seconds, file, verdict`. Seed tracks go in `seed/music.json` and `seed/audio/`.
