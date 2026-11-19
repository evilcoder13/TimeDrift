'use client';

import React, { useState } from 'react';
import { useTranslations } from 'next-intl';

interface DurationPickerSheetProps {
  isOpen: boolean;
  onClose: () => void;
  onStart: (minutes: number) => void;
  isPro?: boolean;
  initialMinutes?: number;
  templateTitle?: string;
  onProRequired?: () => void;
}

export const DurationPickerSheet: React.FC<DurationPickerSheetProps> = ({
  isOpen,
  onClose,
  onStart,
  isPro = false,
  initialMinutes = 15,
  templateTitle,
  onProRequired,
}) => {
  const t = useTranslations('duration');
  const [selectedMinutes, setSelectedMinutes] = useState<number>(initialMinutes);

  if (!isOpen) return null;

  // Presets defined by rules R1 & R3
  const freePresets = [3, 5, 10, 15];
  const proPresets = [30, 60, 120, 240, 480, 720];

  const handlePresetClick = (preset: number, isLocked: boolean) => {
    if (isLocked) {
      if (onProRequired) {
        onProRequired();
      }
      return;
    }
    setSelectedMinutes(preset);
  };

  const handleSliderChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = parseInt(e.target.value, 10);
    if (!isPro && val > 15) {
      setSelectedMinutes(15);
      if (onProRequired) onProRequired();
      return;
    }
    setSelectedMinutes(val);
  };

  const handleStart = () => {
    onStart(selectedMinutes);
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="duration-sheet-title"
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-ink/40 backdrop-blur-sm transition-opacity duration-300 animate-fadeIn"
      onClick={onClose}
    >
      <div
        className="relative w-full max-w-lg bg-paper-light border-t sm:border border-ink/15 rounded-t-sheet sm:rounded-sheet p-6 sm:p-8 shadow-ink-md space-y-6 text-left max-h-[90vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Handle for mobile */}
        <div className="w-12 h-1.5 bg-ink/15 rounded-full mx-auto sm:hidden -mt-2 mb-2" />

        {/* Header */}
        <div className="space-y-1">
          <h2
            id="duration-sheet-title"
            className="font-serif text-2xl font-semibold text-ink tracking-tight"
          >
            {t('title')}
          </h2>
          {templateTitle && (
            <p className="text-sm font-serif italic text-accent line-clamp-1">
              {templateTitle}
            </p>
          )}
          <p className="text-ink-soft text-sm">
            {t('subtitle')}
          </p>
        </div>

        {/* Presets Grid */}
        <div className="space-y-3">
          <label className="text-xs font-semibold uppercase tracking-wider text-ink-muted">
            {t('presets.15')} & Presets
          </label>
          <div className="grid grid-cols-4 sm:grid-cols-5 gap-2">
            {freePresets.map((preset) => (
              <button
                key={preset}
                type="button"
                onClick={() => handlePresetClick(preset, false)}
                className={`py-2 px-1 rounded-card text-xs sm:text-sm font-medium transition-all text-center border ${
                  selectedMinutes === preset
                    ? 'bg-ink text-paper border-ink shadow-ink-sm'
                    : 'bg-paper border-ink/10 text-ink hover:border-ink/30'
                }`}
              >
                {t(`presets.${preset}` as any) || `${preset}m`}
              </button>
            ))}

            {proPresets.map((preset) => (
              <button
                key={preset}
                type="button"
                onClick={() => handlePresetClick(preset, !isPro)}
                className={`py-2 px-1 rounded-card text-xs sm:text-sm font-medium transition-all text-center border relative ${
                  selectedMinutes === preset && isPro
                    ? 'bg-ink text-paper border-ink shadow-ink-sm'
                    : isPro
                    ? 'bg-paper border-ink/10 text-ink hover:border-ink/30'
                    : 'bg-paper/40 border-dashed border-ink/15 text-ink-muted hover:border-accent hover:text-accent'
                }`}
                title={!isPro ? t('locked_pro') : undefined}
              >
                <span>{t(`presets.${preset}` as any) || `${preset}m`}</span>
                {!isPro && (
                  <span className="ml-1 text-[10px] text-accent font-sans">🔒</span>
                )}
              </button>
            ))}
          </div>
        </div>

        {/* Stepped Custom Slider */}
        <div className="space-y-3 py-2">
          <div className="flex justify-between items-baseline">
            <label
              htmlFor="duration-slider"
              className="text-xs font-semibold uppercase tracking-wider text-ink-muted"
            >
              {t('custom_slider_label')}
            </label>
            <span className="font-serif text-lg font-semibold text-accent">
              {t('minutes_display', { minutes: selectedMinutes })}
            </span>
          </div>

          <div className="relative">
            <input
              id="duration-slider"
              type="range"
              min={3}
              max={isPro ? 720 : 15}
              step={1}
              value={selectedMinutes}
              onChange={handleSliderChange}
              className="w-full h-2 bg-paper-dark rounded-lg appearance-none cursor-pointer accent-accent"
            />
            <div className="flex justify-between text-[11px] text-ink-muted mt-1.5 font-mono">
              <span>3m</span>
              {!isPro ? (
                <span className="text-accent">15m (Free max)</span>
              ) : (
                <span>720m (12h)</span>
              )}
            </div>
          </div>

          <p className="text-xs text-ink-soft leading-relaxed italic">
            {!isPro ? t('free_limit_hint') : t('pro_limit_hint')}
          </p>
        </div>

        {/* CTA Actions */}
        <div className="flex flex-col sm:flex-row items-center gap-3 pt-2">
          <button
            type="button"
            onClick={handleStart}
            className="w-full sm:w-auto flex-1 px-6 py-3.5 rounded-card bg-accent hover:bg-accent-hover text-paper-light dark:text-paper font-medium text-sm transition-colors text-center shadow-ink-sm"
          >
            {t('start_session')} ({selectedMinutes}m)
          </button>
          <button
            type="button"
            onClick={onClose}
            className="w-full sm:w-auto px-5 py-3.5 rounded-card text-ink-soft hover:text-ink hover:bg-paper font-medium text-sm transition-colors text-center"
          >
            {t('cancel')}
          </button>
        </div>
      </div>
    </div>
  );
};
