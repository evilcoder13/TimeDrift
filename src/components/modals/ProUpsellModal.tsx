'use client';

import React from 'react';
import { useTranslations } from 'next-intl';

interface ProUpsellModalProps {
  isOpen: boolean;
  onClose: () => void;
  reason?: string;
}

export const ProUpsellModal: React.FC<ProUpsellModalProps> = ({
  isOpen,
  onClose,
  reason,
}) => {
  const tUpsell = useTranslations('upsell');

  if (!isOpen) return null;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="pro-upsell-title"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-ink/40 backdrop-blur-sm transition-opacity duration-300 animate-fadeIn"
      onClick={onClose}
    >
      <div
        className="relative w-full max-w-lg bg-paper-light border border-ink/15 rounded-sheet p-6 sm:p-8 shadow-ink-md space-y-6 text-left"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="space-y-2">
          <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-accent/15 text-accent text-xs font-semibold uppercase tracking-wider">
            <span>✨ Sanctuary Pass</span>
          </div>
          <h2
            id="pro-upsell-title"
            className="font-serif text-2xl sm:text-3xl font-semibold text-ink tracking-tight"
          >
            {tUpsell('title')}
          </h2>
          <p className="text-ink-soft text-sm sm:text-base leading-relaxed">
            {reason || tUpsell('subtitle')}
          </p>
        </div>

        {/* Value Pillars */}
        <div className="space-y-3.5 py-2 border-y border-ink/10">
          <div className="flex items-start gap-3">
            <span className="text-accent text-lg leading-none mt-0.5">✦</span>
            <div>
              <h3 className="text-sm font-semibold text-ink">
                {tUpsell('features.timers_title')}
              </h3>
              <p className="text-xs text-ink-soft leading-normal">
                {tUpsell('features.timers_desc')}
              </p>
            </div>
          </div>

          <div className="flex items-start gap-3">
            <span className="text-accent text-lg leading-none mt-0.5">✦</span>
            <div>
              <h3 className="text-sm font-semibold text-ink">
                {tUpsell('features.custom_title')}
              </h3>
              <p className="text-xs text-ink-soft leading-normal">
                {tUpsell('features.custom_desc')}
              </p>
            </div>
          </div>

          <div className="flex items-start gap-3">
            <span className="text-accent text-lg leading-none mt-0.5">✦</span>
            <div>
              <h3 className="text-sm font-semibold text-ink">
                {tUpsell('features.playlists_title')}
              </h3>
              <p className="text-xs text-ink-soft leading-normal">
                {tUpsell('features.playlists_desc')}
              </p>
            </div>
          </div>

          <div className="flex items-start gap-3">
            <span className="text-accent text-lg leading-none mt-0.5">✦</span>
            <div>
              <h3 className="text-sm font-semibold text-ink">
                {tUpsell('features.unlimited_title')}
              </h3>
              <p className="text-xs text-ink-soft leading-normal">
                {tUpsell('features.unlimited_desc')}
              </p>
            </div>
          </div>
        </div>

        {/* Actions */}
        <div className="flex flex-col sm:flex-row items-center gap-3 pt-2">
          <button
            type="button"
            onClick={() => {
              // In dev/demo, simulate Pro upgrade activation or forward to account
              window.location.href = '/account';
            }}
            className="w-full sm:w-auto flex-1 px-5 py-3 rounded-card bg-accent hover:bg-accent-hover text-paper-light dark:text-paper font-medium text-sm transition-colors text-center shadow-sm"
          >
            {tUpsell('cta_unlock')}
          </button>
          <button
            type="button"
            onClick={onClose}
            className="w-full sm:w-auto px-5 py-3 rounded-card text-ink-soft hover:text-ink hover:bg-paper font-medium text-sm transition-colors text-center"
          >
            {tUpsell('cta_dismiss')}
          </button>
        </div>
      </div>
    </div>
  );
};
