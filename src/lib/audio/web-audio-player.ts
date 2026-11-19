/**
 * Web Audio Gapless Looping Engine (FE-5 / URD §3.2.2 / AUDIO_GUIDE §4)
 *
 * Provides:
 * - Gapless audio looping using dual Web Audio AudioBufferSourceNodes (ping-pong)
 * - 3.0s exponential fade-in upon start
 * - 10.0s logarithmic fade-out upon timer expiration (Rule R2)
 * - Master volume control and pause/resume scheduling
 * - Seam-free 4.0s equal-power crossfade across audio boundaries
 */

export class WebAudioPlayer {
  private ctx: AudioContext | null = null;
  private masterGain: GainNode | null = null;
  private fadeGain: GainNode | null = null;

  private buffer: AudioBuffer | null = null;
  private activeSourceA: AudioBufferSourceNode | null = null;
  private activeSourceB: AudioBufferSourceNode | null = null;
  private gainA: GainNode | null = null;
  private gainB: GainNode | null = null;

  private loopTimer: NodeJS.Timeout | null = null;
  private isPlaying: boolean = false;
  private isMuted: boolean = false;
  private currentVolume: number = 0.8;
  private crossfadeDuration: number = 4.0; // 4s seamless seam crossfade
  private currentBufferPingPong: boolean = false; // toggle A and B

  constructor() {
    // AudioContext is initialized lazily upon first user interaction
  }

  private initContext(): AudioContext {
    if (!this.ctx) {
      const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      this.ctx = new AudioCtx();

      // Master gain for user volume
      this.masterGain = this.ctx.createGain();
      this.masterGain.gain.setValueAtTime(this.currentVolume, this.ctx.currentTime);

      // Fade gain for session start (3s in) and session end (10s out)
      this.fadeGain = this.ctx.createGain();
      this.fadeGain.gain.setValueAtTime(0.001, this.ctx.currentTime);

      this.fadeGain.connect(this.masterGain);
      this.masterGain.connect(this.ctx.destination);
    }

    if (this.ctx.state === 'suspended') {
      this.ctx.resume();
    }

    return this.ctx;
  }

  /**
   * Loads and decodes audio buffer from URL
   */
  async loadAudio(url: string): Promise<AudioBuffer> {
    const ctx = this.initContext();
    const res = await fetch(url);
    if (!res.ok) {
      throw new Error(`Failed to load audio: ${res.statusText}`);
    }
    const arrayBuffer = await res.arrayBuffer();
    this.buffer = await ctx.decodeAudioData(arrayBuffer);
    return this.buffer;
  }

  /**
   * Starts gapless looping playback with 3.0s smooth fade-in
   */
  start(startVolume: number = 0.8) {
    if (!this.buffer) {
      throw new Error('AudioBuffer not loaded. Call loadAudio() first.');
    }

    const ctx = this.initContext();
    this.currentVolume = startVolume;
    this.isPlaying = true;

    // Reset fade gain and ramp in over 3.0 seconds
    const now = ctx.currentTime;
    if (this.fadeGain) {
      this.fadeGain.gain.cancelScheduledValues(now);
      this.fadeGain.gain.setValueAtTime(0.0001, now);
      this.fadeGain.gain.exponentialRampToValueAtTime(1.0, now + 3.0);
    }

    // Schedule dual-buffer looping
    this.schedulePingPongLoop();
  }

  /**
   * Ping-pong scheduling between Source A and Source B with equal-power crossfade
   */
  private schedulePingPongLoop() {
    if (!this.isPlaying || !this.ctx || !this.buffer || !this.fadeGain) return;

    const ctx = this.ctx;
    const bufferDuration = this.buffer.duration;
    // Crossfade time cannot exceed half the buffer duration
    const crossfade = Math.min(this.crossfadeDuration, bufferDuration / 2);
    const loopInterval = (bufferDuration - crossfade) * 1000;

    const playNode = (isA: boolean) => {
      if (!this.isPlaying || !this.buffer || !this.ctx || !this.fadeGain) return;

      const now = this.ctx.currentTime;
      const source = this.ctx.createBufferSource();
      source.buffer = this.buffer;

      const gain = this.ctx.createGain();
      // Ramp in current node
      gain.gain.setValueAtTime(0.0001, now);
      gain.gain.exponentialRampToValueAtTime(1.0, now + crossfade);

      source.connect(gain);
      gain.connect(this.fadeGain);
      source.start(now);

      if (isA) {
        if (this.gainB && this.activeSourceB) {
          // Ramp out previous node B
          this.gainB.gain.cancelScheduledValues(now);
          this.gainB.gain.setValueAtTime(this.gainB.gain.value, now);
          this.gainB.gain.exponentialRampToValueAtTime(0.0001, now + crossfade);
          const oldSource = this.activeSourceB;
          setTimeout(() => {
            try { oldSource.stop(); oldSource.disconnect(); } catch {}
          }, crossfade * 1000 + 200);
        }
        this.activeSourceA = source;
        this.gainA = gain;
      } else {
        if (this.gainA && this.activeSourceA) {
          // Ramp out previous node A
          this.gainA.gain.cancelScheduledValues(now);
          this.gainA.gain.setValueAtTime(this.gainA.gain.value, now);
          this.gainA.gain.exponentialRampToValueAtTime(0.0001, now + crossfade);
          const oldSource = this.activeSourceA;
          setTimeout(() => {
            try { oldSource.stop(); oldSource.disconnect(); } catch {}
          }, crossfade * 1000 + 200);
        }
        this.activeSourceB = source;
        this.gainB = gain;
      }
    };

    // Trigger initial node
    playNode(this.currentBufferPingPong);

    // Schedule subsequent node ping-pong
    const queueNext = () => {
      if (!this.isPlaying) return;
      this.currentBufferPingPong = !this.currentBufferPingPong;
      playNode(this.currentBufferPingPong);
      this.loopTimer = setTimeout(queueNext, Math.max(1000, loopInterval));
    };

    this.loopTimer = setTimeout(queueNext, Math.max(1000, loopInterval));
  }

  /**
   * Pauses playback
   */
  pause() {
    this.isPlaying = false;
    if (this.loopTimer) {
      clearTimeout(this.loopTimer);
      this.loopTimer = null;
    }
    if (this.ctx && this.ctx.state === 'running') {
      this.ctx.suspend();
    }
  }

  /**
   * Resumes playback
   */
  resume() {
    if (this.ctx && this.ctx.state === 'suspended') {
      this.ctx.resume();
    }
    this.isPlaying = true;
    this.schedulePingPongLoop();
  }

  /**
   * Sets master user volume (0.0 to 1.0)
   */
  setVolume(volume: number) {
    this.currentVolume = Math.max(0, Math.min(1, volume));
    if (this.masterGain && this.ctx && !this.isMuted) {
      this.masterGain.gain.cancelScheduledValues(this.ctx.currentTime);
      this.masterGain.gain.setValueAtTime(this.currentVolume, this.ctx.currentTime);
    }
  }

  /**
   * Toggle mute
   */
  toggleMute(): boolean {
    this.isMuted = !this.isMuted;
    if (this.masterGain && this.ctx) {
      this.masterGain.gain.cancelScheduledValues(this.ctx.currentTime);
      this.masterGain.gain.setValueAtTime(this.isMuted ? 0 : this.currentVolume, this.ctx.currentTime);
    }
    return this.isMuted;
  }

  /**
   * Rule R2: 10.0-second logarithmic fade-out upon timer expiration
   */
  fadeOutAndStop(onFinished?: () => void) {
    if (!this.ctx || !this.fadeGain || !this.isPlaying) {
      this.stop();
      onFinished?.();
      return;
    }

    const now = this.ctx.currentTime;
    const fadeDuration = 10.0; // 10s per Rule R2

    if (this.loopTimer) {
      clearTimeout(this.loopTimer);
      this.loopTimer = null;
    }

    // Schedule 10s smooth logarithmic ramp down
    this.fadeGain.gain.cancelScheduledValues(now);
    this.fadeGain.gain.setValueAtTime(Math.max(0.0001, this.fadeGain.gain.value), now);
    this.fadeGain.gain.exponentialRampToValueAtTime(0.0001, now + fadeDuration);

    setTimeout(() => {
      this.stop();
      onFinished?.();
    }, fadeDuration * 1000);
  }

  /**
   * Complete stop and cleanup
   */
  stop() {
    this.isPlaying = false;
    if (this.loopTimer) {
      clearTimeout(this.loopTimer);
      this.loopTimer = null;
    }

    try {
      this.activeSourceA?.stop();
      this.activeSourceA?.disconnect();
    } catch {}
    try {
      this.activeSourceB?.stop();
      this.activeSourceB?.disconnect();
    } catch {}

    this.activeSourceA = null;
    this.activeSourceB = null;
    this.gainA = null;
    this.gainB = null;
  }

  destroy() {
    this.stop();
    if (this.ctx) {
      try {
        this.ctx.close();
      } catch {}
      this.ctx = null;
    }
  }
}
