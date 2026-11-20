import os
import logging
import numpy as np

try:
    import torch
except ImportError:
    torch = None  # type: ignore

logger = logging.getLogger(__name__)

SAMPLE_RATE = 32000
MODEL_ID = os.getenv("MUSICGEN_MODEL_ID", "facebook/musicgen-small")

_model = None
_processor = None
_device = "cpu"
_is_dummy = False


def load_model():
    global _model, _processor, _device, _is_dummy

    if _model is not None:
        return _model, _processor

    if os.getenv("USE_PROCEDURAL_DUMMY", "").lower() in ("1", "true", "yes") or torch is None:
        logger.info("USE_PROCEDURAL_DUMMY set (or torch not installed). Initializing procedural ambient generator.")
        _is_dummy = True
        _model = "dummy"
        _processor = None
        return _model, _processor

    logger.info(f"Loading MusicGen model ({MODEL_ID}) on {_device}...")
    try:
        from transformers import AutoProcessor, MusicgenForConditionalGeneration
        _processor = AutoProcessor.from_pretrained(MODEL_ID)
        _model = MusicgenForConditionalGeneration.from_pretrained(
            MODEL_ID,
            torch_dtype=torch.float32
        ).to(_device)
        _is_dummy = False
        logger.info("MusicGen model loaded successfully.")
    except Exception as e:
        logger.warning(f"Could not load Hugging Face MusicGen model ({e}). Initializing procedural fallback generator.")
        _is_dummy = True
        _model = "dummy"
        _processor = None

    return _model, _processor


def is_dummy_mode() -> bool:
    return _is_dummy


def generate_audio(
    prompt: str,
    target_seconds: int,
    crossfade_sec: float = 4.0
) -> tuple[np.ndarray, int]:
    """
    Generate audio for (target_seconds + crossfade_sec) seconds.
    Returns (audio_numpy_1d, sample_rate).
    """
    total_seconds = target_seconds + crossfade_sec
    load_model()

    if _is_dummy:
        # Generate procedural relaxing audio (soft chords + subtle pink noise/wind)
        t = np.linspace(0, total_seconds, int(SAMPLE_RATE * total_seconds), endpoint=False)
        # Soft chord frequencies: C major / A minor relax tones (220, 261.63, 329.63, 392.0)
        freqs = [220.0, 261.63, 329.63, 392.0]
        audio = np.zeros_like(t)
        for i, f in enumerate(freqs):
            # Slow modulation (LFO)
            lfo = 0.5 * (1.0 + np.sin(2 * np.pi * 0.1 * (i + 1) * t))
            audio += 0.2 * lfo * np.sin(2 * np.pi * f * t)

        # Gentle noise texture
        noise = np.random.normal(0, 0.02, size=len(t))
        # Simple smoothing filter for gentle sound
        audio = audio + noise
        audio = audio / (np.max(np.abs(audio)) + 1e-6)
        return audio.astype(np.float32), SAMPLE_RATE

    # HF MusicGen generation
    inputs = _processor(
        text=[prompt],
        padding=True,
        return_tensors="pt"
    ).to(_device)

    # MusicGen frame rate is 50 frames per second of audio
    # tokens = 50 * total_seconds
    max_new_tokens = int(50 * total_seconds)

    with torch.no_grad():
        output = _model.generate(
            **inputs,
            max_new_tokens=max_new_tokens,
            guidance_scale=3.0,
            temperature=1.0,
            top_k=250,
            do_sample=True
        )

    # Output shape is (batch_size, channels, time)
    audio_arr = output[0, 0].cpu().numpy()
    sr = _model.config.audio_encoder.sampling_rate or SAMPLE_RATE
    return audio_arr.astype(np.float32), sr
