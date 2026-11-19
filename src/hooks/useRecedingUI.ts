'use client';

import { useState, useEffect, useCallback, useRef } from 'react';

/**
 * Receding UI Hook (URD §2.1.1, §3.1.1)
 * Controls fade out to opacity 0 after inactivity (default 4000ms).
 * Any mouse movement, touch, or keypress brings it back immediately.
 */
export function useRecedingUI(timeoutMs = 4000) {
  const [isVisible, setIsVisible] = useState(true);
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  const resetTimer = useCallback(() => {
    setIsVisible(true);
    if (timerRef.current) {
      clearTimeout(timerRef.current);
    }
    timerRef.current = setTimeout(() => {
      setIsVisible(false);
    }, timeoutMs);
  }, [timeoutMs]);

  useEffect(() => {
    resetTimer();

    const handleActivity = () => {
      resetTimer();
    };

    window.addEventListener('mousemove', handleActivity);
    window.addEventListener('mousedown', handleActivity);
    window.addEventListener('keydown', handleActivity);
    window.addEventListener('touchstart', handleActivity);

    return () => {
      if (timerRef.current) {
        clearTimeout(timerRef.current);
      }
      window.removeEventListener('mousemove', handleActivity);
      window.removeEventListener('mousedown', handleActivity);
      window.removeEventListener('keydown', handleActivity);
      window.removeEventListener('touchstart', handleActivity);
    };
  }, [resetTimer]);

  return { isVisible, resetTimer };
}
