'use client';

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { useTranslations } from 'next-intl';
import { SceneFrame } from '@/components/player/SceneFrame';
import { WebAudioPlayer } from '@/lib/audio/web-audio-player';
import { useWallClockTimer } from '@/hooks/useWallClockTimer';
import { useWakeLock } from '@/hooks/useWakeLock';
import { useRecedingUI } from '@/hooks/useRecedingUI';
import { EndScreenModal } from '@/components/player/EndScreenModal';
import { ThemeToggle } from '@/components/navigation/ThemeToggle';

interface PlayerClientProps {
  locale: string;
  scene: {
    id: string;
    name: string;
    bundlePath: string | null;
  };
  music: {
    id: string;
    name: string;
    file: string | null;
    seconds: number;
  };
  title: string;
  durationMinutes: number;
  isPro: boolean;
}

export const PlayerClient: React.FC<PlayerClientProps> = ({
  locale,
  scene,
  music,
  title,
  durationMinutes,
  isPro: _isPro,
}) => {
  const router = useRouter();
  const tPlayer = useTranslations('player');

  const [isPaused, setIsPaused] = useState<boolean>(false);
  const [volume, setVolume] = useState<number>(0.8);
  const [isMuted, setIsMuted] = useState<boolean>(false);
  const [isFullscreen, setIsFullscreen] = useState<boolean>(false);
  const [isEnding, setIsEnding] = useState<boolean>(false);
  const [isEndModalOpen, setIsEndModalOpen] = useState<boolean>(false);

  const audioPlayerRef = useRef<WebAudioPlayer | null>(null);

  // Receding UI chrome hook (4.0s inactivity rule - URD §3.2.4)
  const { isVisible: isChromeVisible } = useRecedingUI(4000);

  // Wake Lock hook (URD §3.2.6)
  useWakeLock(!isPaused && !isEndModalOpen);

  // Audio bundle URL formatting
  const audioUrl = music.file
    ? `/media/audio/${music.file.replace(/^storage\/audio\//, '').replace(/^seed\/audio\//, '')}`
    : null;

  const bundleUrl = scene.bundlePath
    ? `/media/scenes/${scene.bundlePath.replace(/^storage\/scenes\//, '')}`
    : undefined;

  // Handle timer completion (Rule R2: 10.0s logarithmic audio fade and scene pause)
  const handleTimerComplete = useCallback(() => {
    setIsEnding(true);
    if (audioPlayerRef.current) {
      audioPlayerRef.current.fadeOutAndStop(() => {
        setIsPaused(true);
        setIsEnding(false);
        setIsEndModalOpen(true);
      });
    } else {
      setIsPaused(true);
      setIsEnding(false);
      setIsEndModalOpen(true);
    }
  }, []);

  // Wall-Clock drift-free countdown timer (URD §3.2.3)
  const { formattedTime, progress, resetTimer } = useWallClockTimer(
    durationMinutes,
    isPaused || isEndModalOpen,
    handleTimerComplete
  );

  // Setup Web Audio player and initialize audio buffer
  useEffect(() => {
    const player = new WebAudioPlayer();
    audioPlayerRef.current = player;

    if (audioUrl) {
      player
        .loadAudio(audioUrl)
        .then(() => {
          player.start(0.8);
        })
        .catch((err) => {
          console.warn('Web Audio autoload paused pending user interaction:', err);
        });
    }

    return () => {
      player.destroy();
      audioPlayerRef.current = null;
    };
  }, [audioUrl]);

  // Media Session API integration (URD §3.2.6)
  useEffect(() => {
    if (typeof window !== 'undefined' && 'mediaSession' in navigator) {
      navigator.mediaSession.metadata = new MediaMetadata({
        title: title,
        artist: music.name,
        album: 'TimeDrift',
      });

      navigator.mediaSession.setActionHandler('play', () => {
        setIsPaused(false);
        audioPlayerRef.current?.resume();
      });

      navigator.mediaSession.setActionHandler('pause', () => {
        setIsPaused(true);
        audioPlayerRef.current?.pause();
      });

      navigator.mediaSession.setActionHandler('stop', () => {
        audioPlayerRef.current?.stop();
        router.push(`/${locale}`);
      });
    }
  }, [title, music.name, locale, router]);

  // Handle play / pause toggle
  const togglePlayPause = () => {
    if (isPaused) {
      setIsPaused(false);
      audioPlayerRef.current?.resume();
      if ('mediaSession' in navigator) navigator.mediaSession.playbackState = 'playing';
    } else {
      setIsPaused(true);
      audioPlayerRef.current?.pause();
      if ('mediaSession' in navigator) navigator.mediaSession.playbackState = 'paused';
    }
  };

  // Handle volume slider
  const handleVolumeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = parseFloat(e.target.value);
    setVolume(val);
    if (audioPlayerRef.current) {
      audioPlayerRef.current.setVolume(val);
    }
  };

  // Handle mute toggle
  const toggleMute = () => {
    if (audioPlayerRef.current) {
      const muted = audioPlayerRef.current.toggleMute();
      setIsMuted(muted);
    }
  };

  // Fullscreen toggle
  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen().catch(() => {});
      setIsFullscreen(true);
    } else {
      document.exitFullscreen().catch(() => {});
      setIsFullscreen(false);
    }
  };

  // End Screen actions
  const handleReplay = () => {
    setIsEndModalOpen(false);
    setIsEnding(false);
    setIsPaused(false);
    resetTimer(durationMinutes);
    if (audioPlayerRef.current) {
      audioPlayerRef.current.start(volume);
    }
  };

  const handleRandomNext = async () => {
    try {
      const res = await fetch(`/api/random?excludeId=${scene.id}`);
      if (res.ok) {
        const data = await res.json();
        if (data.type === 'TEMPLATE' && data.template?.id) {
          router.push(`/${locale}/play?templateId=${data.template.id}&duration=${durationMinutes}`);
          return;
        } else if (data.type === 'CUSTOM' && data.scene?.id && data.music?.id) {
          router.push(`/${locale}/play?sceneId=${data.scene.id}&musicId=${data.music.id}&duration=${durationMinutes}`);
          return;
        }
      }
      router.push(`/${locale}/play?random=1&duration=${durationMinutes}`);
    } catch {
      router.push(`/${locale}/play?random=1&duration=${durationMinutes}`);
    }
  };

  const handleBackHome = () => {
    audioPlayerRef.current?.stop();
    window.location.href = `/${locale}`;
  };

  return (
    <div
      className={`fixed inset-0 w-screen h-screen overflow-hidden bg-paper transition-colors duration-daynight ${
        !isChromeVisible ? 'cursor-none' : 'cursor-default'
      }`}
    >
      {/* Background Sandboxed Line-Art Canvas Host */}
      <SceneFrame
        bundleUrl={bundleUrl}
        sceneId={scene.id}
        paused={isPaused}
        tau={progress}
        opts={{
          startTau: progress,
        }}
        className="w-full h-full object-cover"
      />

      {/* Receding Chrome UI Overlay (URD §3.2.4) */}
      <div
        className={`fixed inset-0 pointer-events-none transition-opacity duration-recede flex flex-col justify-between p-6 sm:p-8 z-30 ${
          isChromeVisible && !isEndModalOpen ? 'opacity-100 pointer-events-auto' : 'opacity-0'
        }`}
      >
        {/* Top Header Bar */}
        <div className="flex items-center justify-between w-full max-w-6xl mx-auto">
          {/* Exit Button */}
          <button
            type="button"
            onClick={handleBackHome}
            aria-label={tPlayer('exit')}
            className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-paper/80 backdrop-blur-md border border-ink/10 text-ink-soft hover:text-ink text-xs font-medium shadow-sm transition-colors"
          >
            <span>←</span>
            <span>{tPlayer('exit')}</span>
          </button>

          {/* Title & Attribution */}
          <div className="text-center px-4">
            <h1 className="font-serif text-base sm:text-lg font-semibold text-ink line-clamp-1">
              {title}
            </h1>
            <p className="text-[11px] text-ink-soft line-clamp-1 font-sans">
              {scene.name} • {music.name}
            </p>
          </div>

          {/* Controls: Theme & Fullscreen */}
          <div className="flex items-center gap-2">
            <ThemeToggle />
            <button
              type="button"
              onClick={toggleFullscreen}
              aria-label={isFullscreen ? tPlayer('controls.fullscreen_exit') : tPlayer('controls.fullscreen_enter')}
              className="p-2 rounded-full bg-paper/80 backdrop-blur-md border border-ink/10 text-ink-soft hover:text-ink text-xs shadow-sm transition-colors"
            >
              {isFullscreen ? '⤓' : '⤢'}
            </button>
          </div>
        </div>

        {/* Floating Bottom Control Bar */}
        <div className="w-full max-w-lg mx-auto flex items-center justify-between px-6 py-3.5 rounded-sheet bg-paper/85 dark:bg-paper-dark/85 backdrop-blur-md border border-ink/15 shadow-ink-md">
          {/* Play / Pause Button */}
          <button
            type="button"
            onClick={togglePlayPause}
            aria-label={isPaused ? tPlayer('controls.play') : tPlayer('controls.pause')}
            className="w-10 h-10 rounded-full bg-ink text-paper flex items-center justify-center text-sm shadow-ink-sm hover:scale-105 active:scale-95 transition-transform"
          >
            {isPaused ? '▶' : '❚❚'}
          </button>

          {/* Wall-Clock Remaining Countdown Ring */}
          <div className="flex flex-col items-center">
            <span className="font-mono text-base sm:text-lg font-semibold tracking-wider text-ink">
              {formattedTime}
            </span>
            <span className="text-[10px] uppercase font-sans text-ink-soft tracking-wider">
              {isEnding ? tPlayer('dissolving') : tPlayer('time_remaining', { time: '' })}
            </span>
          </div>

          {/* Volume Control */}
          <div className="hidden sm:flex items-center gap-2">
            <button
              type="button"
              onClick={toggleMute}
              className="text-xs text-ink-soft hover:text-ink"
            >
              {isMuted ? '🔇' : '🔉'}
            </button>
            <input
              type="range"
              min={0}
              max={1}
              step={0.05}
              value={isMuted ? 0 : volume}
              onChange={handleVolumeChange}
              className="w-16 h-1.5 bg-paper-dark rounded-lg appearance-none cursor-pointer accent-accent"
            />
          </div>

          {/* Random Next Glyph */}
          <button
            type="button"
            onClick={handleRandomNext}
            aria-label={tPlayer('controls.next_random')}
            className="w-9 h-9 rounded-full bg-paper hover:bg-paper-dark text-accent border border-ink/10 flex items-center justify-center text-sm shadow-sm transition-colors"
            title={tPlayer('controls.next_random')}
          >
            ⚄
          </button>
        </div>
      </div>

      {/* Tranquil End Screen Modal (Rule R2) */}
      <EndScreenModal
        isOpen={isEndModalOpen}
        onReplay={handleReplay}
        onRandom={handleRandomNext}
        onBack={handleBackHome}
      />
    </div>
  );
};
