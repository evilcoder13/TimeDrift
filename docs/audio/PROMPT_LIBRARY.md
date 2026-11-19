# Relax Music Prompt Library (AUD-3)

**Document Version:** 1.0.0  
**Owner:** Audio Maker  
**Approved by:** Director  
**Specification:** [docs/ba/P0_URD.md](file:///Users/daothang/Documents/Projects/TimeDrift/docs/ba/P0_URD.md) §3.3.2 & [docs/audio/AUDIO_GUIDE.md](file:///Users/daothang/Documents/Projects/TimeDrift/docs/audio/AUDIO_GUIDE.md)

---

## 1. Musical Prompt Constraints & Negative Patterns

All prompts generated for TimeDrift adhere strictly to the following parameters:
- **Formula:** `<type> , <mood tags>, <instrument(s)>, <tempo> bpm, <texture>, no vocals, loopable, soft dynamics`
- **Tempo Range:** 50–85 BPM (50–65 BPM for `sleepy`/`night`, 65–75 BPM for `calm`/`focus`).
- **Sound Textures:** Warm analog tape saturation, felt piano hammers, nylon acoustic strings, mellow Rhodes, wooden flutes, soft vinyl crackle, natural water/rain ambiences.
- **Strict Negative Guard:** No vocals, no singing, no spoken words, no choir, no harsh distortion, no aggressive drops, no EDM synths, no heavy metal guitars, no fast arpeggios, no loud drums / crashes.

---

## 2. Complete Prompt Library Matrix (36 Prompts across 12 Feeling Tags)

| Tag Slug | Prompt ID | Track Title (EN / VI) | Type | Tempo | Target Tags | Complete Prompt Text |
|---|---|---|---|---|---|---|
| **`calm`** | `CALM-01` | Felt Reverie / Khúc Hoài Niệm Nỉ | `piano` | 60 BPM | `calm`, `peaceful` | `minimalist upright felt piano playing slow warm chords, ambient vinyl crackle, gentle room acoustics, 60 bpm, relaxing and contemplative, no vocals, loopable, soft dynamics` |
| | `CALM-02` | Evening Willow / Liễu Chiều Buông | `acoustic` | 65 BPM | `calm`, `peaceful`, `warm` | `soft acoustic nylon-string guitar picking slowly, subtle distant warm pad, calm evening atmosphere, 65 bpm, peaceful and still, no vocals, loopable, soft dynamics` |
| | `CALM-03` | Quiet Horizon / Chân Trời Lặng Lẽ | `ambient` | 58 BPM | `calm`, `dreamy` | `gentle harp and warm analog electric piano rhodes, soft tape saturation, breathing tempo, 58 bpm, quiet and meditative, no vocals, loopable, soft dynamics` |
| **`sleepy`** | `SLEEP-01` | Celestial Cradle / Nôi Sao Đêm | `ambient` | 52 BPM | `sleepy`, `night`, `dreamy` | `deep sub ambient drone with gentle celestial rhodes chords, slow breathing filter sweep, dreamy lullaby, 52 bpm, ultra soft, no drums, no vocals, loopable` |
| | `SLEEP-02` | Dewdrop Lullaby / Khúc Ru Giọt Sương | `music-box` | 50 BPM | `sleepy`, `night` | `muted celesta notes dripping like slow water drops over a warm low cello drone, sleepy and tranquil, 50 bpm, zero drums, no vocals, loopable, soft dynamics` |
| | `SLEEP-03` | Slumber Waves / Sóng Giấc Say | `ambient` | 54 BPM | `sleepy`, `peaceful` | `continuous soft warm analog synth pads, slow wave movement, low-pass filtered, hypnotic bedtime ambiance, 54 bpm, no drums, no vocals, loopable` |
| **`focus`** | `FOCUS-01` | Coffee Rain / Mưa Quán Nhỏ | `lofi` | 72 BPM | `focus`, `cozy`, `rainy` | `steady lo-fi study beat with brushed snare, muted electric bassline, gentle electric piano chords, coffee shop rain, 72 bpm, no vocals, loopable, soft dynamics` |
| | `FOCUS-02` | Clockwork Thought / Dòng Tư Lự | `chillhop` | 75 BPM | `focus`, `calm` | `minimalist marimba ostinato with steady soft rhythmic shaker, warm analog warmth, concentration rhythm, 75 bpm, no vocals, loopable, soft dynamics` |
| | `FOCUS-03` | Mindful Flow / Dòng Tâm Thức | `acoustic` | 70 BPM | `focus`, `peaceful` | `gentle rhythmic acoustic guitar pattern, subtle cello drone sustaining underneath, clear mindful focus, 70 bpm, no vocals, loopable, soft dynamics` |
| **`cozy`** | `COZY-01` | Hearthside Warmth / Hơi Ấm Lò Sưởi | `acoustic` | 64 BPM | `cozy`, `warm` | `warm fireplace crackle with tender acoustic guitar fingerpicking, subtle cello harmony, wooden room feeling, 64 bpm, no vocals, loopable, soft dynamics` |
| | `COZY-02` | Wool Blanket / Chăn Len Ấm | `piano` | 62 BPM | `cozy`, `calm` | `lo-fi vintage piano with soft flutter tape warmth, soft rain tapping on window, cozy blanket mood, 62 bpm, no vocals, loopable, soft dynamics` |
| | `COZY-03` | Living Room Tale / Chuyện Gian Nhà Gỗ | `music-box` | 65 BPM | `cozy`, `nostalgic` | `gentle music box playing over warm upright bass and soft brushed hi-hat, peaceful living room intimacy, 65 bpm, no vocals, loopable, soft dynamics` |
| **`nostalgic`** | `NOST-01` | Cassette Memory / Ký Ức Băng Từ | `piano` | 62 BPM | `nostalgic`, `calm` | `distant warm piano playing a bittersweet melodic phrase, gentle tape hiss, cassette warmth, 62 bpm, longing and memories, no vocals, loopable, soft dynamics` |
| | `NOST-02` | Old Courtyard Waltz / Nhịp Điệu Sân Cũ | `acoustic` | 68 BPM | `nostalgic`, `warm` | `vintage accordion and classical acoustic guitar duo, slow waltz tempo, soft warm vintage vinyl record aesthetic, 68 bpm, no vocals, loopable, soft dynamics` |
| | `NOST-03` | Amber Echo / Vọng Âm Hổ Phách | `strings` | 60 BPM | `nostalgic`, `peaceful` | `muted electric guitar with warm vibrato and gentle spring reverb, slow walking tempo, reminiscent and poetic, 60 bpm, no vocals, loopable, soft dynamics` |
| **`rainy`** | `RAIN-01` | Rain on Veranda / Mưa Rơi Hiên Nhà | `piano` | 58 BPM | `rainy`, `calm`, `peaceful` | `soft natural rain shower sound with slow contemplative piano chords, melancholic beauty, no rhythm section, 58 bpm, warm reverb, no vocals, loopable, soft dynamics` |
| | `RAIN-02` | Autumn Leaves Drizzle / Mưa Phùn Lá Thu | `ambient` | 62 BPM | `rainy`, `focus`, `calm` | `gentle electric piano notes echoing into warm tape delay with steady light rain on autumn leaves, 62 bpm, no drums, no vocals, loopable, soft dynamics` |
| | `RAIN-03` | Window Mist / Sương Mờ Cửa Sổ | `strings` | 55 BPM | `rainy`, `cozy`, `nostalgic` | `low cello solo over gentle raindrops on glass window, warm cozy indoor warmth, 55 bpm, deeply comforting, no vocals, loopable, soft dynamics` |
| **`dreamy`** | `DREAM-01` | Cloud Drift / Mây Trôi Lãng Đãng | `ambient` | 56 BPM | `dreamy`, `sleepy` | `shimmering glockenspiel and ethereal synth pads, floating harmonic clouds, slow drifting tempo, 56 bpm, surreal peace, no drums, no vocals, loopable` |
| | `DREAM-02` | Weightless Glow / Ánh Sáng Vô Trọng Lực | `strings` | 54 BPM | `dreamy`, `peaceful` | `reversed piano textures layered with gentle warm strings, floating weightlessly in space, 54 bpm, dreamy meditation, no vocals, loopable, soft dynamics` |
| | `DREAM-03` | Silver Reverie / Ảo Mộng Bạc | `ambient` | 60 BPM | `dreamy`, `night` | `soft vibraphone with long natural sustain, lush ambient reverberation, drifting clouds mood, 60 bpm, no vocals, loopable, soft dynamics` |
| **`warm`** | `WARM-01` | Golden Amber Duet / Khúc Nhị Tấu Hổ Phách | `strings` | 65 BPM | `warm`, `peaceful` | `rich acoustic cello and wooden viola duet playing tender harmonies, warm sunlit morning mood, 65 bpm, organic and pure, no vocals, loopable, soft dynamics` |
| | `WARM-02` | Sunlit Porch / Hiên Nắng Ban Mai | `acoustic` | 68 BPM | `warm`, `cozy` | `golden hour acoustic folk guitar with soft thumb bass, gentle harmonic slides, comforting embrace, 68 bpm, no vocals, loopable, soft dynamics` |
| | `WARM-03` | Ember Resonance / Dư Ba Than Hồng | `ambient` | 60 BPM | `warm`, `night` | `warm vintage organ chords with slow rotary leslie speaker effect, deep comforting analog embrace, 60 bpm, no drums, no vocals, loopable, soft dynamics` |
| **`peaceful`** | `PEACE-01` | Mountain Stillness / Tĩnh Lặng Non Cao | `acoustic` | 58 BPM | `peaceful`, `calm` | `solo acoustic concert harp playing descending arpeggios, gentle mountain breeze atmosphere, 58 bpm, absolute stillness, no vocals, loopable, soft dynamics` |
| | `PEACE-02` | Zen Garden Mist / Sương Vườn Thiền | `nature-ambient` | 52 BPM | `peaceful`, `nature` | `deep japanese shakuhachi flute over soft ambient temple drone, serene zen garden, 52 bpm, clear mind, no drums, no vocals, loopable` |
| | `PEACE-03` | White Pebble Silence / Lặng Im Sỏi Trắng | `piano` | 56 BPM | `peaceful`, `focus` | `tender solo acoustic piano, vast dynamic restraint, delicate keystrokes, silence between notes, 56 bpm, no vocals, loopable, soft dynamics` |
| **`morning`** | `MORN-01` | First Dawn Ray / Tia Nắng Đầu Tiên | `acoustic` | 74 BPM | `morning`, `peaceful`, `warm` | `bright yet gentle acoustic fingerstyle guitar, soft distant songbirds, warm dawn sunlight filtering through leaves, 74 bpm, no vocals, loopable, soft dynamics` |
| | `MORN-02` | Dewdrop Awakening / Giọt Mai Thức Giấc | `strings` | 72 BPM | `morning`, `calm` | `light pizzicato strings and playful flute staccato, waking up slowly, gentle optimism, 72 bpm, no vocals, loopable, soft dynamics` |
| | `MORN-03` | Early Mist Window / Cửa Sổ Sương Mai | `piano` | 70 BPM | `morning`, `focus` | `fresh morning piano arpeggios with soft warm analog synth pads, rising sun, peaceful start, 70 bpm, no vocals, loopable, soft dynamics` |
| **`night`** | `NIGHT-01` | Starlight Solitude / Đơn Côi Ánh Sao | `ambient` | 52 BPM | `night`, `sleepy` | `quiet starry night ambiance, distant crickets, minimalist electric piano chords with long decay, 52 bpm, no drums, no vocals, loopable, soft dynamics` |
| | `NIGHT-02` | Moonlit Riverbank / Bờ Sông Trăng Tròn | `strings` | 50 BPM | `night`, `calm` | `deep dark ambient cello with soft wooden flute, moonlit riverbank, quiet contemplation, 50 bpm, no vocals, loopable, soft dynamics` |
| | `NIGHT-03` | Lantern Slumber / Ngủ Dưới Ánh Đèn | `music-box` | 54 BPM | `night`, `cozy` | `soft music box notes drifting over deep sub-bass warmth, slow breathing rhythm, midnight solitude, 54 bpm, no drums, no vocals, loopable, soft dynamics` |
| **`nature`** | `NAT-01` | Bamboo Sanctuary / Rừng Trúc Bình An | `nature-ambient` | 60 BPM | `nature`, `peaceful` | `organic bamboo flute playing gentle melodies with mountain wind and forest rustle, 60 bpm, pure wilderness, no vocals, loopable, soft dynamics` |
| | `NAT-02` | Forest Brook / Dòng Suối Nhỏ | `acoustic` | 64 BPM | `nature`, `calm`, `focus` | `flowing river water textures blended with gentle acoustic guitar harmonics and soft wooden chimes, 64 bpm, no vocals, loopable, soft dynamics` |
| | `NAT-03` | Pine Breeze Echo / Vọng Gió Rừng Thông | `strings` | 58 BPM | `nature`, `dreamy` | `forest bird echoes layered with slow atmospheric cello chords, morning mist over pine trees, 58 bpm, no vocals, loopable, soft dynamics` |
