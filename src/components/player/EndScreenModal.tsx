'use client';

import React from 'react';
import { useTranslations } from 'next-intl';

interface EndScreenModalProps {
  isOpen: boolean;
  onReplay: () => void;
  onRandom: () => void;
  onBack: () => void;
}

/**
 * EndScreenModal (FE-5 / Rule R2 / URD §3.2.7)
 *
 * Tranquil End screen appearing after the 10-second audio fade-out and scene pause.
 * Displays 3 unhurried equal-weight actions:
 * 1. Replay (same scene/music and duration)
 * 2. Random (R6 deterministic random drift)
 * 3. Back to Library
 *
 * Strict Non-Interference: Zero countdowns, zero auto-redirects, zero popups or rating prompts.
 */
export const EndScreenModal: React.FC<EndScreenModalProps> = ({
  isOpen,
  onReplay,
  onRandom,
  onBack,
}) => {
  const tEnd = useTranslations('end_screen');

  if (!isOpen) return null;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="end-screen-title"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-paper/85 dark:bg-paper-dark/90 backdrop-blur-md transition-opacity duration-recede animate-fadeIn"
    >
      <div className="relative w-full max-w-md text-center space-y-8 p-6 sm:p-8">
        {/* Serene sumi icon */}
        <div className="mx-auto w-16 h-16 rounded-full border border-ink/20 flex items-center justify-center text-accent text-2xl font-serif">
          ✦
        </div>

        {/* Headings */}
        <div className="space-y-3">
          <h2
            id="end-screen-title"
            className="font-serif text-3xl sm:text-4xl font-semibold text-ink tracking-tight"
          >
            {tEnd('title')}
          </h2>
          <p className="text-ink-soft text-base leading-relaxed max-w-xs mx-auto">
            {tEnd('subtitle')}
          </p>
        </div>

        {/* 3 Equal-weight Tranquil Actions */}
        <div className="flex flex-col gap-3 pt-2">
          <button
            type="button"
            onClick={onReplay}
            className="w-full py-3.5 px-6 rounded-card bg-paper-light border border-ink/15 hover:border-ink/35 text-ink font-medium text-sm transition-all duration-normal shadow-ink-sm flex items-center justify-center gap-2"
          >
            <span>{tEnd('replay')}</span>
            <span className="text-accent">↺</span>
          </button>

          <button
            type="button"
            onClick={onRandom}
            className="w-full py-3.5 px-6 rounded-card bg-paper-light border border-ink/15 hover:border-ink/35 text-ink font-medium text-sm transition-all duration-normal shadow-ink-sm flex items-center justify-center gap-2"
          >
            <span>{tEnd('random')}</span>
            <span className="text-accent">⚄</span>
          </button>

          <button
            type="button"
            onClick={onBack}
            className="w-full py-3.5 px-6 rounded-card text-ink-soft hover:text-ink hover:bg-paper font-medium text-sm transition-colors duration-normal"
          >
            {tEnd('home')}
          </button>
        </div>
      </div>
    </div>
  );
};
