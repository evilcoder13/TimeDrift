import os
import tempfile
import pytest
import numpy as np
import soundfile as sf
import pyloudnorm as pyln
from fastapi.testclient import TestClient

from main import app
from audio_utils import equal_power_crossfade, normalize_loudness, find_nearest_zero_crossing

client = TestClient(app)


def test_health():
    response = client.get("/health")
    assert response.status_code == 200
    data = response.json()
    assert data["status"] == "ok"
    assert data["model_loaded"] is True
    assert data["device"] == "cpu"
    assert "version" in data


def test_zero_crossing_boundary():
    # Signal with known zero crossing at index 50
    t = np.linspace(-1, 1, 100)
    signal = t.copy()
    idx = find_nearest_zero_crossing(signal, 52, window=10)
    # Zero crossing is at t=0, which is index 49 or 50
    assert abs(signal[idx]) <= 0.05


def test_crossfade_equal_power():
    sample_rate = 32000
    # Generate 34s synthetic audio with constant RMS amplitude 0.5
    duration = 34.0
    t = np.linspace(0, duration, int(sample_rate * duration), endpoint=False)
    # Sine wave
    raw = 0.5 * np.sin(2 * np.pi * 440 * t)

    processed = equal_power_crossfade(raw, sample_rate, crossfade_sec=4.0)

    # Output duration should be 30.0s (+/- 0.05s search window)
    expected_len = int(30.0 * sample_rate)
    assert abs(len(processed) - expected_len) <= int(0.05 * sample_rate)

    # Seam continuity check: |x[end] - x[0]| should be small
    seam_diff = abs(processed[-1] - processed[0])
    # The jump between end and beginning is smooth
    assert seam_diff < 0.15


def test_loudness_normalization():
    sample_rate = 32000
    duration = 10.0
    t = np.linspace(0, duration, int(sample_rate * duration), endpoint=False)
    raw = 0.1 * np.sin(2 * np.pi * 220 * t)  # Quiet audio

    norm, lufs, peak = normalize_loudness(raw, sample_rate, target_lufs=-16.0, max_dbtp=-1.0)

    # Target LUFS should be within +/- 0.5 LUFS
    assert abs(lufs - (-16.0)) <= 0.5
    # True peak must not exceed -1.0 dBTP
    assert peak <= -1.0 + 1e-3


def test_generate_endpoint_contract():
    with tempfile.NamedTemporaryFile(suffix=".ogg", delete=False) as tmp:
        tmp_path = tmp.name

    try:
        # Invalid duration (R10 requires 30, 45, or 60)
        invalid_resp = client.post("/generate", json={
            "prompt": "piano relax music",
            "seconds": 20,
            "out_path": tmp_path
        })
        assert invalid_resp.status_code == 422

        # Invalid extension
        invalid_ext_resp = client.post("/generate", json={
            "prompt": "piano relax music",
            "seconds": 30,
            "out_path": "/tmp/test.wav"
        })
        assert invalid_ext_resp.status_code == 400

        # Valid generation (30s)
        resp = client.post("/generate", json={
            "prompt": "soft solo piano, gentle rain mood, 65 bpm, warm reverb, sparse melody, no vocals, loopable",
            "seconds": 30,
            "out_path": tmp_path
        })
        assert resp.status_code == 200
        data = resp.json()
        assert data["out_path"] == tmp_path
        assert abs(data["duration_sec"] - 30.0) < 0.1
        assert abs(data["integrated_lufs"] - (-16.0)) <= 0.5
        assert data["true_peak_dbtp"] <= -1.0 + 1e-3
        assert data["sample_rate"] == 32000
        assert data["channels"] == 1

        # Check file exists and can be read
        assert os.path.exists(tmp_path)
        audio_data, file_sr = sf.read(tmp_path)
        assert file_sr == 32000
        assert len(audio_data) > 0
    finally:
        if os.path.exists(tmp_path):
            os.remove(tmp_path)
