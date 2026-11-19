'use client';

import React, { useState, useEffect } from 'react';

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
}

export const InstallPrompt: React.FC = () => {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [isDismissed, setIsDismissed] = useState<boolean>(false);

  useEffect(() => {
    const handler = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
    };

    window.addEventListener('beforeinstallprompt', handler);

    return () => {
      window.removeEventListener('beforeinstallprompt', handler);
    };
  }, []);

  if (!deferredPrompt || isDismissed) {
    return null;
  }

  const handleInstall = async () => {
    if (!deferredPrompt) return;
    await deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    if (outcome === 'accepted') {
      setDeferredPrompt(null);
    }
  };

  return (
    <div className="fixed bottom-6 right-6 z-40 max-w-sm p-4 rounded-sheet bg-paper-light border border-ink/15 shadow-ink-md flex items-center justify-between gap-4 animate-fadeIn">
      <div className="space-y-0.5">
        <h4 className="font-serif text-sm font-semibold text-ink">
          Add TimeDrift to Home
        </h4>
        <p className="text-xs text-ink-soft">
          Install for a fullscreen tactile sanctuary.
        </p>
      </div>

      <div className="flex items-center gap-2">
        <button
          type="button"
          onClick={handleInstall}
          className="px-3 py-1.5 rounded-card bg-accent hover:bg-accent-hover text-paper-light dark:text-paper text-xs font-medium shadow-sm transition-colors"
        >
          Install
        </button>
        <button
          type="button"
          onClick={() => setIsDismissed(true)}
          className="p-1 rounded-card text-ink-muted hover:text-ink text-xs transition-colors"
        >
          ✕
        </button>
      </div>
    </div>
  );
};
