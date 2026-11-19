'use client';

import React from 'react';
import { Sun, Moon } from 'lucide-react';
import { useTheme } from '@/hooks/useTheme';
import { useTranslations } from 'next-intl';

export const ThemeToggle: React.FC = () => {
  const { theme, toggleTheme } = useTheme();
  const t = useTranslations('app');

  return (
    <button
      type="button"
      onClick={toggleTheme}
      className="inline-flex items-center justify-center w-10 h-10 rounded-full border border-ink/15 bg-paper-light text-ink hover:border-ink/30 transition-all duration-normal focus-visible:ring-2 focus-visible:ring-accent outline-none"
      aria-label={theme === 'day' ? t('theme_night') : t('theme_day')}
      title={theme === 'day' ? t('theme_night') : t('theme_day')}
    >
      {theme === 'day' ? (
        <Moon className="w-4 h-4 text-ink-soft transition-transform duration-normal hover:scale-110" />
      ) : (
        <Sun className="w-4 h-4 text-accent transition-transform duration-normal hover:scale-110" />
      )}
    </button>
  );
};

export default ThemeToggle;
