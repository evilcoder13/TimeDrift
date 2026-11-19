# Audio Guide (Owner: Audio Maker)

## 1. Pipeline
`prompt → MusicGen-small (CPU, guidance 3.0, temp 1.0, top_k 250) → generate seconds+4 → crossfade last 4s into first 4s (equal-power) → trim to seconds → loudness normalize −16 LUFS / −1 dBTP → ogg vorbis q5, 32 kHz mono`

## 2. Technical spec
| Item | Value |
|---|---|
| Lengths | 30 / 45 / 60 s |
| Seam | Equal-power crossfade 4s; zero-crossing aligned |
| Loudness | −16 LUFS integrated (pyloudnorm) |
| Format | `.ogg` Vorbis q5 (~ 80 kbps), 32 kHz mono |
| Est. CPU time | 2–6 min per 30 s clip (benchmark on target box in task AUD-1) |

## 3. Types (Music.type)
`lofi`, `piano`, `ambient`, `acoustic`, `strings`, `nature-ambient`, `chillhop`, `music-box`

## 4. Prompt formula
`<type> , <mood tags>, <instrument(s)>, <tempo> bpm, <texture>, no vocals, loopable, soft dynamics`

## 5. Prompt library
See full 36-track library across all 12 emotion tags in [docs/audio/PROMPT_LIBRARY.md](PROMPT_LIBRARY.md).

Starter sample:
| Name (EN / VI) | Type | Tags | Prompt |
|---|---|---|---|
| Rainy Window / Cửa sổ mưa | piano | rainy, calm, nostalgic | `soft solo piano, gentle rain mood, 65 bpm, warm reverb, sparse melody, no vocals, loopable, soft dynamics` |
| Paper Lanterns / Đèn lồng giấy | ambient | night, sleepy, dreamy | `ambient pad, slow evolving synth, distant chimes, 55 bpm, airy, no drums, no vocals, loopable` |
| Morning Tea / Trà sáng | acoustic | morning, peaceful, cozy, warm | `fingerpicked acoustic guitar, light shaker, 75 bpm, warm, cozy, peaceful, no vocals, loopable` |
| Study Room / Phòng học | lofi | focus, cozy, calm | `lofi hip hop, mellow rhodes, soft vinyl crackle, muted kick, 72 bpm, no vocals, loopable` |
| Village Dusk / Hoàng hôn làng | strings | nostalgic, warm, peaceful | `slow string quartet, pastoral, 60 bpm, warm legato, no percussion, no vocals, loopable` |
36 curated prompts ready for production across all tags (AUD-3 completed).

## 6. QA checklist per track
- [ ] Listen 3 loops on headphones — seam inaudible  - [ ] No clipping / harsh highs  - [ ] No vocal-like artifacts  - [ ] Tempo/mood matches tags  - [ ] Name EN+VI

## 7. Negative patterns (avoid in prompts)
"epic", "drop", "intense", "drums" (except "muted kick"/"brushes"), "vocals", "choir".
