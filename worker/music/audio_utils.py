import os
import numpy as np
import soundfile as sf
import pyloudnorm as pyln


def find_nearest_zero_crossing(signal: np.ndarray, index: int, window: int) -> int:
    """
    Find index of nearest zero-crossing around `index` within `window` samples.
    """
    start = max(0, index - window)
    end = min(len(signal) - 1, index + window)
    if start >= end:
        return index

    segment = signal[start:end]
    zero_crossings = np.where(np.diff(np.signbit(segment)))[0] + start
    if len(zero_crossings) == 0:
        return index

    nearest = zero_crossings[np.argmin(np.abs(zero_crossings - index))]
    return int(nearest)


def equal_power_crossfade(audio: np.ndarray, sample_rate: int, crossfade_sec: float = 4.0) -> np.ndarray:
    """
    Equal-power crossfade loop processor:
    Crossfade the trailing `crossfade_sec` of `audio` into the leading `crossfade_sec`.
    audio is expected to be 1D (mono) of length (target_len + crossfade_samples).
    Returns an array of length target_len.
    """
    if audio.ndim > 1:
        audio = np.mean(audio, axis=-1)

    crossfade_len = int(round(crossfade_sec * sample_rate))
    total_len = len(audio)

    if total_len <= crossfade_len:
        raise ValueError(f"Audio length ({total_len}) must be greater than crossfade length ({crossfade_len})")

    target_len = total_len - crossfade_len

    # Boundary alignment via zero-crossing within +/- 50ms
    search_window = int(0.050 * sample_rate)
    aligned_split = find_nearest_zero_crossing(audio, target_len, search_window)
    crossfade_len = total_len - aligned_split
    target_len = aligned_split

    head = audio[:crossfade_len].copy()
    tail = audio[-crossfade_len:].copy()
    body = audio[crossfade_len:target_len].copy()

    # Equal power curves:
    # gain_head(t) = sin(pi/2 * t/L)  (fades IN head)
    # gain_tail(t) = cos(pi/2 * t/L)  (fades OUT tail)
    t = np.linspace(0.0, 1.0, crossfade_len, endpoint=False)
    gain_head = np.sin(0.5 * np.pi * t)
    gain_tail = np.cos(0.5 * np.pi * t)

    seam = (tail * gain_tail) + (head * gain_head)

    # Output: seam (which is the beginning of the loop), followed by body
    result = np.concatenate([seam, body])
    return result


def normalize_loudness(
    audio: np.ndarray,
    sample_rate: int,
    target_lufs: float = -16.0,
    max_dbtp: float = -1.0
) -> tuple[np.ndarray, float, float]:
    """
    Normalize loudness to target_lufs (-16 LUFS +/- 0.5) and true peak <= max_dbtp (-1.0 dBTP).
    Returns (normalized_audio, integrated_lufs, true_peak_dbtp).
    """
    meter = pyln.Meter(sample_rate)
    # pyloudnorm requires float in [-1.0, 1.0] range or at least 2D / 1D float
    audio = audio.astype(np.float64)

    # Handle silence or near-zero
    peak = np.max(np.abs(audio))
    if peak < 1e-6:
        return audio, -70.0, -70.0

    current_lufs = meter.integrated_loudness(audio)
    if np.isneginf(current_lufs) or np.isnan(current_lufs):
        current_lufs = -70.0

    normalized = pyln.normalize.loudness(audio, current_lufs, target_lufs)

    # Soft peak limiting if exceeding max_dbtp (-1.0 dBTP)
    target_peak_lin = 10.0 ** (max_dbtp / 20.0)
    peak_val = np.max(np.abs(normalized))
    if peak_val > target_peak_lin:
        # Soft tanh limiting around target_peak_lin to preserve integrated loudness
        # while preventing harsh digital clipping and maintaining peak <= max_dbtp
        normalized = np.tanh(normalized / target_peak_lin) * target_peak_lin
        peak_dbtp = max_dbtp
    else:
        peak_dbtp = 20.0 * np.log10(peak_val) if peak_val > 0 else -100.0

    final_lufs = meter.integrated_loudness(normalized)
    return normalized, float(final_lufs), float(peak_dbtp)


def save_ogg_vorbis(audio: np.ndarray, sample_rate: int, out_path: str) -> None:
    """
    Save mono audio to Ogg Vorbis format.
    """
    os.makedirs(os.path.dirname(os.path.abspath(out_path)), exist_ok=True)
    # soundfile format 'OGG', subtype 'VORBIS'
    sf.write(out_path, audio, sample_rate, format='OGG', subtype='VORBIS')
