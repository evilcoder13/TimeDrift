'use client';

import { useEffect, useRef, useCallback } from 'react';

/**
 * useWakeLock
 *
 * Screen Wake Lock API keeping device screen active during relax playback (URD §3.2.6).
 * Handles visibility changes and re-acquires lock upon returning to tab.
 */
export function useWakeLock(isActive: boolean) {
  const wakeLockRef = useRef<WakeLockSentinel | null>(null);

  const requestLock = useCallback(async () => {
    if (typeof window === 'undefined' || !('wakeLock' in navigator)) {
      return;
    }

    try {
      if (!wakeLockRef.current || wakeLockRef.current.released) {
        wakeLockRef.current = await navigator.wakeLock.request('screen');
        wakeLockRef.current.addEventListener('release', () => {
          // Lock released
        });
      }
    } catch {
      // Wake lock requests can fail if battery saver is on or document isn't active
    }
  }, []);

  const releaseLock = useCallback(async () => {
    if (wakeLockRef.current && !wakeLockRef.current.released) {
      try {
        await wakeLockRef.current.release();
      } catch {
        // Ignore errors on release
      } finally {
        wakeLockRef.current = null;
      }
    }
  }, []);

  useEffect(() => {
    if (isActive) {
      requestLock();
    } else {
      releaseLock();
    }

    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible' && isActive) {
        requestLock();
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);

    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      releaseLock();
    };
  }, [isActive, requestLock, releaseLock]);

  return { requestLock, releaseLock };
}
