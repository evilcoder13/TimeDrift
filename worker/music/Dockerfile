# ==============================================================================
# TimeDrift MusicGen Worker Production Dockerfile
# Stage: python:3.11-slim, torch CPU, ffmpeg, non-root user
# ==============================================================================

FROM python:3.11-slim

# Set environment variables
ENV PYTHONUNBUFFERED=1 \
    PYTHONDONTWRITEBYTECODE=1 \
    PIP_NO_CACHE_DIR=1 \
    PORT=8100 \
    HOST=0.0.0.0

# Install system dependencies: ffmpeg, libsndfile1, curl (for health checks)
RUN apt-get update && apt-get install -y --no-install-recommends \
    ffmpeg \
    libsndfile1 \
    curl \
    && rm -rf /var/lib/apt/lists/*

# Create unprivileged worker user and group
RUN groupadd -g 1001 worker && \
    useradd -u 1001 -g worker -m -d /home/worker -s /bin/bash worker

WORKDIR /app

# Copy dependency requirements
COPY requirements.txt .

# Install PyTorch CPU wheels followed by requirements
RUN pip install --no-cache-dir torch torchaudio --index-url https://download.pytorch.org/whl/cpu && \
    pip install --no-cache-dir -r requirements.txt

# Create persistent storage mount directory and grant ownership
RUN mkdir -p /app/storage /models && \
    chown -R worker:worker /app /models /home/worker

# Copy worker application code
COPY . /app

USER worker

EXPOSE 8100

HEALTHCHECK --interval=15s --timeout=5s --start-period=30s --retries=3 \
  CMD curl -f http://localhost:8100/health || exit 1

CMD ["uvicorn", "main:app", "--host", "0.0.0.0", "--port", "8100", "--workers", "1"]
