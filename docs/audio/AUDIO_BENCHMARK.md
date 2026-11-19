# Audio Environment Verification & Benchmark Report (AUD-1)

**Date:** 2026-11-18  
**Author:** Audio Maker (TimeDrift)  
**Target Hardware:** Apple M1 (8 cores: 4 performance + 4 efficiency), 8GB / 16GB Unified Memory, Darwin 25.1.0 (macOS), Apple Silicon `arm64`.  
**Model Architecture:** Meta MusicGen-small (`facebook/musicgen-small`, ~300M parameters, 32kHz EnCodec audio decoder).

---

## 1. Environment & Tooling Verification Status

During the Phase P0 baseline inspection for task AUD-1 / OPS-1, the host audio toolchain was verified:

| Tool / Dependency | Target Requirement | Host Status | Resolution / Action Path for P1 |
|---|---|---|---|
| **Python** | `3.11.x` | `3.11.13` present via `uv` (`~/.local/share/uv/python/cpython-3.11.13-macos-aarch64-none/bin/python3`) | Ready to be used for `worker/music/` virtualenv (`uv venv --python 3.11`). |
| **FFmpeg** | `6.0+` with Vorbis & Ogg support | **Not installed** on system `$PATH` | Required for loop crossfading, LUFS measurement and `.ogg` Vorbis encoding. Will be installed via static binary / package manager during worker setup (`OPS-1` / `worker/music/setup.sh`). |
| **PyTorch (`torch`)** | `torch >= 2.1.0` (CPU / MPS) | Not installed in base env | Will be installed into `worker/music/.venv` via `uv pip install torch torchvision torchaudio` or requirements. |
| **Transformers** | `transformers >= 4.31.0` | Not installed in base env | Will be installed into `worker/music/.venv`. |
| **Pyloudnorm** | EBU R128 compliance | Not installed in base env | Will be installed into `worker/music/.venv` for $-16\text{ LUFS} \pm 1$ normalization. |
| **Scipy / Soundfile** | Audio I/O | Not installed in base env | Will be installed into `worker/music/.venv`. |

---

## 2. Benchmark Expectations & Real-Time Factor (RTF)

As specified in [docs/ba/P0_URD.md](file:///Users/daothang/Documents/Projects/TimeDrift/docs/ba/P0_URD.md) §3.3.1 and [docs/audio/AUDIO_GUIDE.md](file:///Users/daothang/Documents/Projects/TimeDrift/docs/audio/AUDIO_GUIDE.md) §2:

### 2.1. Hardware Profile Target: Apple M1 / ARM64 CPU
- **Generation Duration:** $N + 4\text{ s}$ audio (e.g. 34s audio for a 30s loopable clip to allow a 4.0s equal-power crossfade).
- **Sampling Rate:** MusicGen generates at 32,000 Hz (32 kHz mono).
- **Inference Precision:** `torch.float32` on CPU (or `torch.bfloat16` / MPS if accelerated).
- **Generation Parameters:**
  - `guidance_scale`: `3.0`
  - `temperature`: `1.0`
  - `top_k`: `250`
  - `max_new_tokens`: $1500$ tokens for 30s audio (50 tokens/sec in EnCodec codebooks).

### 2.2. Quantitative Latency & RTF Targets
$$\text{RTF} = \frac{\text{Wall-clock Inference Time (seconds)}}{\text{Generated Audio Length (seconds)}}$$

| Clip Length | Generated Audio ($+4\text{s}$) | Expected RTF | Target Inference Window | URD Pass Threshold |
|---|---|---|---|---|
| **30 s** | 34 s | $2.5\times - 3.8\times$ | 85 s – 120 s | $\le 120\text{ s}$ ($\text{RTF} \le 4.0\times$) |
| **45 s** | 49 s | $2.5\times - 3.8\times$ | 125 s – 180 s | $\le 196\text{ s}$ ($\text{RTF} \le 4.0\times$) |
| **60 s** | 64 s | $2.5\times - 3.8\times$ | 160 s – 240 s | $\le 256\text{ s}$ ($\text{RTF} \le 4.0\times$) |

- **Post-Processing Time (Crossfade + LUFS Normalize + FFmpeg Encode):** $1.5\text{ s} - 3.0\text{ s}$ total per clip.
- **Resource Constraints:** Single worker queue (`worker/music/`). No concurrent generation jobs to prevent CPU thermal throttling and memory exhaustion.

---

## 3. Acoustic Verification & Quality Protocol (R10)

Before any generated music is promoted to `READY` and published in templates, it must pass the automated and sensory QA checklist:

1. **Integrated Loudness:** $-16.0 \text{ LUFS} \pm 1.0 \text{ LUFS}$ integrated (pyloudnorm EBU R128).
2. **True Peak Limit:** $\le -1.0\text{ dBTP}$ (prevent DAC clipping).
3. **Loop Seam Continuity:**
   - 4.0s equal-power crossfade ($\cos/\sin$ curve).
   - Zero-crossing alignment at start and end frames.
   - Amplitude differential $|x[\text{end}] - x[0]| < 0.001$.
   - Boundary RMS jump $\le 1.0\text{ dB}$.
   - Human audition: 3 consecutive loop cycles on headphones without clicks, pops, or tonal discontinuity.
4. **Negative Guard Adherence:** Zero vocal artifacts, harsh cymbals, or abrupt drop transients.
