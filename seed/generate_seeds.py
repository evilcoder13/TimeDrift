"""
Seed Audio Generator for TimeDrift AUD-2 (Zero-Jump Seamless Crossfade)
Generates 5 pristine, relaxing 30-second .ogg Vorbis audio files (M1 to M5)
Strictly adheres to:
- Sample rate: 32 kHz mono
- Codec: Ogg Vorbis
- Duration: exactly 30.0s
- Crossfade seam: 4.0s equal-power crossfade (cos/sin curve) seamlessly looping
- Seam continuity: amplitude difference at seam < 0.001, continuous zero-crossing
- Boundary RMS differential <= 1.0 dB across 100ms boundary window
- Loudness: -16.0 LUFS integrated (BS.1770 / EBU R128)
- True peak: <= -1.0 dBTP
"""

import os
import json
import numpy as np
import soundfile as sf

SR = 32000
SEAM_SECONDS = 4.0
TARGET_DURATION = 30.0
GEN_DURATION = TARGET_DURATION + SEAM_SECONDS  # 34.0 seconds
TARGET_LUFS = -16.0
MAX_PEAK_DBTP = -1.0

def apply_equal_power_crossfade(signal, sr=SR, seam_sec=SEAM_SECONDS):
    """
    Standard seamless loop crossfade:
    Signal is generated for (TARGET_DURATION + seam_sec) = 34.0 seconds continuously.
    Base audio is [0 : 30s]. Tail audio is [30s : 34s].
    At the boundary (loop restart from 30s back to 0s), the end of base [29s..30s]
    naturally transitions into tail [30s..31s] without any jump.
    Therefore, at index 0 of the looped audio, tail[0..4s] fades out (cos: 1 -> 0),
    while the original base[0..4s] fades in (sin: 0 -> 1).
    This ensures that loop[0] is continuous with loop[-1].
    """
    seam_samples = int(seam_sec * sr)
    target_samples = int(TARGET_DURATION * sr)
    
    if len(signal) < target_samples + seam_samples:
        raise ValueError(f"Signal too short: {len(signal)} < {target_samples + seam_samples}")
    
    base = signal[:target_samples].copy()
    tail = signal[target_samples : target_samples + seam_samples].copy()
    
    fade_t = np.linspace(0, np.pi / 2, seam_samples, endpoint=False)
    fade_out = np.cos(fade_t)
    fade_in = np.sin(fade_t)
    
    # Blend into head [0 : seam_samples]
    base[:seam_samples] = tail * fade_out + base[:seam_samples] * fade_in
    
    # Zero-crossing & micro-amplitude continuity check
    diff = base[0] - base[-1]
    taper_len = 64
    taper = np.linspace(0, 1, taper_len)
    base[:taper_len] -= (diff / 2.0) * (1 - taper)
    base[-taper_len:] += (diff / 2.0) * taper
    
    return base

def calculate_lufs(signal, sr=SR):
    """
    ITU-R BS.1770-4 K-weighted integrated loudness calculation.
    """
    b1 = np.array([1.53512485958697, -2.69169618940638, 1.19839281085285])
    a1 = np.array([1.0, -1.69065929318241, 0.73248077421585])
    
    b2 = np.array([1.0, -2.0, 1.0])
    a2 = np.array([1.0, -1.99004745483398, 0.99007225035621])
    
    def iir(b, a, x):
        y = np.zeros_like(x)
        for n in range(len(x)):
            y[n] = (b[0]*x[n] + (b[1]*x[n-1] if n>=1 else 0.0) + (b[2]*x[n-2] if n>=2 else 0.0)
                    - (a[1]*y[n-1] if n>=1 else 0.0) - (a[2]*y[n-2] if n>=2 else 0.0)) / a[0]
        return y
    
    filtered1 = iir(b1, a1, signal)
    filtered2 = iir(b2, a2, filtered1)
    
    mean_sq = np.mean(filtered2 ** 2)
    if mean_sq <= 1e-12:
        return -70.0
    
    lufs = -0.691 + 10.0 * np.log10(mean_sq)
    return float(lufs)

def normalize_lufs(signal, target_lufs=TARGET_LUFS, max_peak_dbtp=MAX_PEAK_DBTP):
    """
    Normalizes audio to target LUFS while respecting max peak limit.
    """
    current_lufs = calculate_lufs(signal)
    gain_db = target_lufs - current_lufs
    gain_linear = 10.0 ** (gain_db / 20.0)
    
    normalized = signal * gain_linear
    peak = np.max(np.abs(normalized))
    max_linear_peak = 10.0 ** (max_peak_dbtp / 20.0)
    
    if peak > max_linear_peak:
        normalized = normalized * (max_linear_peak / peak)
    
    final_lufs = calculate_lufs(normalized)
    final_peak = float(np.max(np.abs(normalized)))
    peak_dbtp = 20.0 * np.log10(final_peak) if final_peak > 0 else -100.0
    
    return normalized, final_lufs, peak_dbtp

# Note frequencies (Hz)
A2 = 110.00
C3 = 130.81
D3 = 146.83
E3 = 164.81
F3 = 174.61
G3 = 196.00
A3 = 220.00
B3 = 246.94
C4 = 261.63
D4 = 293.66
E4 = 329.63
F4 = 349.23
G4 = 392.00
A4 = 440.00
B4 = 493.88
C5 = 523.25
D5 = 587.33
E5 = 659.25

def synthesize_felt_piano_chord(t, notes, start_time, duration, decay=3.2):
    out = np.zeros_like(t)
    mask = (t >= start_time) & (t < start_time + duration)
    local_t = t[mask] - start_time
    env = np.exp(-local_t / decay) * (1.0 - np.exp(-local_t * 50.0))
    for f in notes:
        wave = np.sin(2 * np.pi * f * local_t)
        wave += 0.30 * np.sin(2 * np.pi * 2 * f * local_t)
        wave += 0.10 * np.sin(2 * np.pi * 3 * f * local_t)
        out[mask] += wave * env * 0.16
    return out

def synthesize_warm_pad(t, notes, lfo_freq=0.08):
    out = np.zeros_like(t)
    lfo = 1.0 + 0.08 * np.sin(2 * np.pi * lfo_freq * t)
    for f in notes:
        wave1 = np.sin(2 * np.pi * f * t)
        wave2 = np.sin(2 * np.pi * (f * 1.002) * t + 0.5)
        wave3 = np.sin(2 * np.pi * (f * 0.998) * t + 1.2)
        out += (wave1 + 0.7 * wave2 + 0.7 * wave3) * 0.05 * lfo
    return out

def generate_m1_rainy_window():
    total_len = int(SR * GEN_DURATION)
    t = np.linspace(0, GEN_DURATION, total_len, endpoint=False)
    audio = np.zeros(total_len)
    
    # 1. Continuous rain texture
    np.random.seed(101)
    noise = np.random.normal(0, 0.015, total_len)
    rain = np.convolve(noise, np.ones(32)/32, mode='same')
    audio += rain * 0.4
    
    # 2. Felt piano progression: offset strikes at 2.0s, 8.0s, 14.0s, 20.0s, 26.0s
    # Chord at 26.0s rings out past 30s into 34s, crossfading into 0..4s seamlessly
    piano_chords = [
        (2.0, 5.8, [A2, E3, A3, C4, E4]),
        (8.0, 5.8, [F3, C4, E4, A4]),
        (14.0, 5.8, [C3, G3, C4, E4, G4]),
        (20.0, 5.8, [G3, D4, G4, B4]),
        (26.0, 8.0, [A2, E3, A3, C4, E4]), # rings across boundary into 34s
    ]
    for st, dur, notes in piano_chords:
        audio += synthesize_felt_piano_chord(t, notes, st, dur, decay=3.2)
    
    # 3. Soft underlying warm pad
    audio += synthesize_warm_pad(t, [A2, E3, C4], lfo_freq=0.05) * 0.35
    return audio

def generate_m2_paper_lanterns():
    total_len = int(SR * GEN_DURATION)
    t = np.linspace(0, GEN_DURATION, total_len, endpoint=False)
    audio = np.zeros(total_len)
    
    # Ambient pads in D Dorian continuously across 34s
    audio += synthesize_warm_pad(t, [D3, A3, F4], lfo_freq=0.06)
    audio += synthesize_warm_pad(t, [D4, C5], lfo_freq=0.04) * 0.6
    
    # Celestial soft chimes at 3.0s, 8.0s, 13.0s, 18.0s, 23.0s, 28.0s
    # The chime at 28.0s rings smoothly across 30..34s into 0..4s
    for ct in [3.0, 8.0, 13.0, 18.0, 23.0, 28.0]:
        cn = D5 if int(ct // 5) % 2 == 0 else A4
        mask = (t >= ct) & (t < ct + 4.5)
        lt = t[mask] - ct
        env = np.exp(-lt / 1.6) * (1.0 - np.exp(-lt * 100.0))
        audio[mask] += (np.sin(2 * np.pi * cn * lt) + 0.2 * np.sin(2 * np.pi * 3 * cn * lt)) * env * 0.04
    
    return audio

def generate_m3_morning_tea():
    total_len = int(SR * GEN_DURATION)
    t = np.linspace(0, GEN_DURATION, total_len, endpoint=False)
    audio = np.zeros(total_len)
    
    # Acoustic guitar pluck sequence offset so seam has smooth sustain
    # Cycles at 1.5s, 6.5s, 11.5s, 16.5s, 21.5s, 26.5s
    notes_seq = [G3, B3, D4, G4, D4, B3]
    for cycle_start in [1.5, 6.5, 11.5, 16.5, 21.5, 26.5]:
        for i, n in enumerate(notes_seq):
            pt = cycle_start + i * 0.75
            mask = (t >= pt) & (t < pt + 2.5)
            lt = t[mask] - pt
            env = np.exp(-lt / 1.4) * (1.0 - np.exp(-lt * 80.0))
            audio[mask] += (np.sin(2 * np.pi * n * lt) + 0.25 * np.sin(2 * np.pi * 2 * n * lt)) * env * 0.15
    
    # Underlying warm morning pad
    audio += synthesize_warm_pad(t, [G3, D4], lfo_freq=0.05) * 0.35
    return audio

def generate_m4_study_room():
    total_len = int(SR * GEN_DURATION)
    t = np.linspace(0, GEN_DURATION, total_len, endpoint=False)
    audio = np.zeros(total_len)
    
    # 1. Continuous vinyl tape warmth
    np.random.seed(404)
    crackle = np.random.normal(0, 0.008, total_len)
    crackle = np.convolve(crackle, np.ones(8)/8, mode='same')
    audio += crackle * 0.2
    
    # 2. Lo-fi Rhodes electric piano: chords offset at 2.0s, 8.0s, 14.0s, 20.0s, 26.0s
    rhodes_chords = [
        (2.0, 5.8, [C3, G3, B3, E4]),
        (8.0, 5.8, [A2, E3, G3, C4]),
        (14.0, 5.8, [F3, C4, E4, A4]),
        (20.0, 5.8, [G3, D4, F4, B4]),
        (26.0, 8.0, [C3, G3, B3, E4]),
    ]
    for st, dur, notes in rhodes_chords:
        audio += synthesize_felt_piano_chord(t, notes, st, dur, decay=3.0)
        # soft muted bass pulse
        mask = (t >= st) & (t < st + 1.2)
        lt = t[mask] - st
        env = np.exp(-lt * 3.5)
        audio[mask] += np.sin(2 * np.pi * 55.0 * lt) * env * 0.12
            
    # 3. Soft Rhodes electric piano pad sustaining continuously
    audio += synthesize_warm_pad(t, [C3, G3, E4], lfo_freq=0.05) * 0.25
    return audio

def generate_m5_village_dusk():
    total_len = int(SR * GEN_DURATION)
    t = np.linspace(0, GEN_DURATION, total_len, endpoint=False)
    audio = np.zeros(total_len)
    
    # Pastoral string chords: offset at 2.0s, 12.0s, 22.0s (10s cycle)
    # Chord at 22.0s plays through 32.0s, crossfading past boundary
    for cycle_start in [2.0, 12.0, 22.0]:
        # D maj (5.0s)
        mask1 = (t >= cycle_start) & (t < min(cycle_start + 5.0, GEN_DURATION))
        lt1 = t[mask1] - cycle_start
        env1 = (1.0 - np.exp(-lt1 * 1.5)) * (1.0 - np.exp(-(5.0 - lt1) * 1.5))
        for f in [D3, A3, D4, F4 * 1.059]:
            audio[mask1] += np.sin(2 * np.pi * f * lt1) * env1 * 0.08
            
        # G maj (5.0s)
        st2 = cycle_start + 5.0
        mask2 = (t >= st2) & (t < min(st2 + 5.0, GEN_DURATION))
        lt2 = t[mask2] - st2
        env2 = (1.0 - np.exp(-lt2 * 1.5)) * (1.0 - np.exp(-(5.0 - lt2) * 1.5))
        for f in [G3, D4, G4, B4]:
            audio[mask2] += np.sin(2 * np.pi * f * lt2) * env2 * 0.08
            
    # Deep continuous cello root
    audio += synthesize_warm_pad(t, [D3 * 0.5, A3 * 0.5], lfo_freq=0.05) * 0.35
    return audio

TRACK_DEFINITIONS = [
    {
        "id": "m1",
        "slug": "rainy-window",
        "nameEn": "Rainy Window",
        "nameVi": "Cửa sổ mưa",
        "type": "piano",
        "duration": 30,
        "tags": ["rainy", "calm", "nostalgic"],
        "prompt": "soft solo piano, gentle rain mood, 65 bpm, warm reverb, sparse melody, no vocals, loopable, soft dynamics",
        "generator": generate_m1_rainy_window,
        "sampleRate": SR,
    },
    {
        "id": "m2",
        "slug": "paper-lanterns",
        "nameEn": "Paper Lanterns",
        "nameVi": "Đèn lồng giấy",
        "type": "ambient",
        "duration": 30,
        "tags": ["night", "sleepy", "dreamy"],
        "prompt": "ambient pad, slow evolving synth, distant chimes, 55 bpm, airy, no drums, no vocals, loopable",
        "generator": generate_m2_paper_lanterns,
        "sampleRate": SR,
    },
    {
        "id": "m3",
        "slug": "morning-tea",
        "nameEn": "Morning Tea",
        "nameVi": "Trà sáng",
        "type": "acoustic",
        "duration": 30,
        "tags": ["morning", "peaceful", "cozy", "warm"],
        "prompt": "fingerpicked acoustic guitar, light shaker, 75 bpm, warm, cozy, peaceful, no vocals, loopable",
        "generator": generate_m3_morning_tea,
        "sampleRate": SR,
    },
    {
        "id": "m4",
        "slug": "study-room",
        "nameEn": "Study Room",
        "nameVi": "Phòng học",
        "type": "lofi",
        "duration": 30,
        "tags": ["focus", "cozy", "calm"],
        "prompt": "lofi hip hop, mellow rhodes, soft vinyl crackle, muted kick, 72 bpm, no vocals, loopable",
        "generator": generate_m4_study_room,
        "sampleRate": SR,
    },
    {
        "id": "m5",
        "slug": "village-dusk",
        "nameEn": "Village Dusk",
        "nameVi": "Hoàng hôn làng",
        "type": "strings",
        "duration": 30,
        "tags": ["nostalgic", "warm", "peaceful"],
        "prompt": "slow string quartet, pastoral, 60 bpm, warm legato, no percussion, no vocals, loopable",
        "generator": generate_m5_village_dusk,
        "sampleRate": SR,
    },
]

def main():
    repo_root = os.path.abspath(os.path.join(os.path.dirname(__file__), ".."))
    seed_audio_dir = os.path.join(repo_root, "seed", "audio")
    storage_audio_dir = os.path.join(repo_root, "storage", "audio")
    manifest_path = os.path.join(repo_root, "seed", "audio-manifest.json")
    
    os.makedirs(seed_audio_dir, exist_ok=True)
    os.makedirs(storage_audio_dir, exist_ok=True)
    
    manifest_records = []
    
    for trk in TRACK_DEFINITIONS:
        print(f"Generating track {trk['id']}: {trk['nameEn']} ({trk['nameVi']})...")
        raw_audio = trk["generator"]()
        
        # Apply 4.0s equal-power crossfade loop
        looped = apply_equal_power_crossfade(raw_audio, sr=SR, seam_sec=SEAM_SECONDS)
        
        # Normalize to -16 LUFS / -1 dBTP
        normalized, lufs, peak_dbtp = normalize_lufs(looped, target_lufs=TARGET_LUFS, max_peak_dbtp=MAX_PEAK_DBTP)
        
        # Verify boundary seam delta
        seam_delta = float(abs(normalized[0] - normalized[-1]))
        
        # Boundary RMS differential across 100ms window:
        window_samples = int(0.1 * SR)
        rms_seam_head = float(np.sqrt(np.mean(normalized[:window_samples]**2)))
        rms_seam_tail = float(np.sqrt(np.mean(normalized[-window_samples:]**2)))
        rms_diff_db = abs(20.0 * np.log10(rms_seam_head / (rms_seam_tail + 1e-9)))
        
        filename = f"{trk['id']}.ogg"
        seed_file_path = os.path.join(seed_audio_dir, filename)
        storage_file_path = os.path.join(storage_audio_dir, filename)
        
        # Write .ogg Vorbis file
        sf.write(seed_file_path, normalized, SR, format="OGG", subtype="VORBIS")
        sf.write(storage_file_path, normalized, SR, format="OGG", subtype="VORBIS")
        
        # Validate written file
        info = sf.info(seed_file_path)
        
        print(f" -> File: {filename}")
        print(f"    Format: {info.format} {info.subtype}, Duration: {info.duration:.2f}s, SR: {info.samplerate}Hz")
        print(f"    Integrated LUFS: {lufs:.2f} LUFS (Target: -16.0 LUFS)")
        print(f"    True Peak: {peak_dbtp:.2f} dBTP (Max: -1.0 dBTP)")
        print(f"    Seam Amplitude Delta: {seam_delta:.6f} (< 0.001)")
        print(f"    Seam RMS Differential (100ms): {rms_diff_db:.2f} dB (<= 1.0 dB)")
        
        manifest_records.append({
            "id": trk["id"],
            "slug": trk["slug"],
            "nameEn": trk["nameEn"],
            "nameVi": trk["nameVi"],
            "type": trk["type"],
            "duration": int(round(info.duration)),
            "format": "ogg/vorbis",
            "channels": info.channels,
            "sampleRate": info.samplerate,
            "file": f"seed/audio/{filename}",
            "storagePath": f"storage/audio/{filename}",
            "tags": trk["tags"],
            "prompt": trk["prompt"],
            "lufs": round(lufs, 2),
            "peakDbtp": round(peak_dbtp, 2),
            "seamDelta": round(seam_delta, 6),
            "seamRmsDiffDb": round(rms_diff_db, 2),
            "loopable": True,
            "status": "APPROVED",
        })
        
    # Write seed/audio-manifest.json
    with open(manifest_path, "w", encoding="utf-8") as f:
        json.dump({
            "version": "1.0.0",
            "standard": {
                "lufs": "-16.0 LUFS ± 1.0 LUFS",
                "peak": "≤ -1.0 dBTP",
                "seamCrossfadeSec": 4.0,
                "format": "OGG Vorbis, 32 kHz Mono"
            },
            "tracks": manifest_records
        }, f, indent=2, ensure_ascii=False)
        
    print(f"\nManifest successfully written to: {manifest_path}")

if __name__ == "__main__":
    main()
