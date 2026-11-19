'use client';

import { useState, useEffect, useRef, useCallback } from 'react';

export interface WallClockTimerState {
  targetDurationMs: number;
  elapsedMs: number;
  remainingMs: number;
  progress: number; // 0.0 -> 1.0 (Day/Night progression)
  isCompleted: boolean;
  formattedTime: string; // MM:SS or HH:MM:SS
}

/**
 * useWallClockTimer
 *
 * Implements drift-free wall-clock countdown based on performance.now() and timestamp targets (URD §3.2.3).
 * Survives tab backgrounding and throttle without drift.
 * Computes day/night progression: clamp(elapsedMs / targetDurationMs, 0.0, 1.0).
 */
export function useWallClockTimer(
  durationMinutes: number,
  isPaused: boolean,
  onComplete?: () => void
) {
  const targetDurationMs = durationMinutes * 60 * 1000;

  const [remainingMs, setRemainingMs] = useState<number>(targetDurationMs);
  const [elapsedMs, setElapsedMs] = useState<number>(0);
  const [progress, setProgress] = useState<number>(0);
  const [isCompleted, setIsCompleted] = useState<boolean>(false);

  // Keep track of accumulated elapsed time when paused
  const accumulatedElapsedRef = useRef<number>(0);
  const lastResumeTimeRef = useRef<number>(0);
  const animationFrameRef = useRef<number | null>(null);
  const completedTriggeredRef = useRef<boolean>(false);

  // Resume or start tracking
  useEffect(() => {
    if (!isPaused && !isCompleted) {
      lastResumeTimeRef.current = performance.now();
    }
  }, [isPaused, isCompleted]);

  // Main high-resolution update loop
  useEffect(() => {
    if (isPaused || isCompleted) {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
      return;
    }

    const tick = () => {
      const now = performance.now();
      const currentElapsed = accumulatedElapsedRef.current + (now - lastResumeTimeRef.current);
      const remaining = Math.max(0, targetDurationMs - currentElapsed);
      const p = Math.min(1.0, Math.max(0.0, currentElapsed / targetDurationMs));

      setElapsedMs(currentElapsed);
      setRemainingMs(remaining);
      setProgress(p);

      if (remaining <= 0) {
        setIsCompleted(true);
        if (!completedTriggeredRef.current) {
          completedTriggeredRef.current = true;
          onComplete?.();
        }
        return;
      }

      animationFrameRef.current = requestAnimationFrame(tick);
    };

    animationFrameRef.current = requestAnimationFrame(tick);

    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
      // Save progress if pausing
      if (!isPaused && !isCompleted) {
        accumulatedElapsedRef.current += performance.now() - lastResumeTimeRef.current;
      }
    };
  }, [isPaused, isCompleted, targetDurationMs, onComplete]);

  // Format MM:SS or HH:MM:SS
  const formatTime = useCallback((ms: number): string => {
    const totalSec = Math.ceil(ms / 1000);
    const hours = Math.floor(totalSec / 3600);
    const mins = Math.floor((totalSec % 3600) / 60);
    const secs = totalSec % 60;

    const pad = (n: number) => n.toString().padStart(2, '0');

    if (hours > 0) {
      return `${pad(hours)}:${pad(mins)}:${pad(secs)}`;
    }
    return `${pad(mins)}:${pad(secs)}`;
  }, []);

  const resetTimer = useCallback((newDurationMinutes?: number) => {
    const newTarget = (newDurationMinutes ?? durationMinutes) * 60 * 1000;
    accumulatedElapsedRef.current = 0;
    lastResumeTimeRef.current = performance.now();
    completedTriggeredRef.current = false;
    setIsCompleted(false);
    setElapsedMs(0);
    setProgress(0);
    setRemainingMs(newTarget);
  }, [durationMinutes]);

  return {
    targetDurationMs,
    elapsedMs,
    remainingMs,
    progress,
    isCompleted,
    formattedTime: formatTime(remainingMs),
    resetTimer,
  };
}
