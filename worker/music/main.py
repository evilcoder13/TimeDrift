import os
import asyncio
import logging
from contextlib import asynccontextmanager
from typing import Literal
from fastapi import FastAPI, HTTPException
from pydantic import BaseModel, Field

from audio_utils import equal_power_crossfade, normalize_loudness, save_ogg_vorbis
from generator import load_model, generate_audio, is_dummy_mode

logging.basicConfig(level=logging.INFO, format="%(asctime)s [%(levelname)s] %(message)s")
logger = logging.getLogger("music-worker")

# Serial generation lock to prevent CPU starvation
_generation_lock = asyncio.Lock()


@asynccontextmanager
async def lifespan(app: FastAPI):
    # Attempt loading model in background thread on startup
    asyncio.create_task(asyncio.to_thread(load_model))
    yield


app = FastAPI(title="TimeDrift MusicGen Worker", version="1.0.0", lifespan=lifespan)


class GenerateRequest(BaseModel):
    prompt: str = Field(..., min_length=1, max_length=500)
    seconds: Literal[30, 45, 60]  # Enforces R10 strictly
    out_path: str = Field(...)


class GenerateResponse(BaseModel):
    out_path: str
    duration_sec: float
    integrated_lufs: float
    true_peak_dbtp: float
    sample_rate: int
    channels: int


@app.get("/health")
def health():
    return {
        "status": "ok",
        "model_loaded": True,
        "is_dummy": is_dummy_mode(),
        "device": "cpu",
        "version": "1.0.0"
    }


@app.post("/generate", response_model=GenerateResponse)
async def generate(req: GenerateRequest):
    if not req.out_path.endswith(".ogg"):
        raise HTTPException(status_code=400, detail="out_path must end with .ogg")

    if _generation_lock.locked():
        logger.info("Generation request queued/waiting for current job to finish.")

    async with _generation_lock:
        logger.info(f"Starting generation for {req.seconds}s: '{req.prompt}' -> {req.out_path}")
        try:
            # 1. Raw generation: (seconds + 4.0s)
            raw_audio, sr = await asyncio.to_thread(
                generate_audio,
                prompt=req.prompt,
                target_seconds=req.seconds,
                crossfade_sec=4.0
            )

            # 2. Equal-power crossfade (4.0s loop)
            loop_audio = equal_power_crossfade(raw_audio, sr, crossfade_sec=4.0)

            # 3. Loudness normalization (-16.0 LUFS, -1.0 dBTP max)
            norm_audio, final_lufs, final_peak = normalize_loudness(
                loop_audio,
                sr,
                target_lufs=-16.0,
                max_dbtp=-1.0
            )

            # 4. Save to Ogg Vorbis
            await asyncio.to_thread(save_ogg_vorbis, norm_audio, sr, req.out_path)

            duration_sec = float(len(norm_audio) / sr)

            logger.info(
                f"Generation complete: duration={duration_sec:.2f}s, LUFS={final_lufs:.2f}, peak={final_peak:.2f}dBTP"
            )

            return GenerateResponse(
                out_path=req.out_path,
                duration_sec=duration_sec,
                integrated_lufs=round(final_lufs, 2),
                true_peak_dbtp=round(final_peak, 2),
                sample_rate=sr,
                channels=1
            )
        except Exception as e:
            logger.exception("Generation error")
            raise HTTPException(status_code=500, detail=f"Generation failed: {str(e)}")
