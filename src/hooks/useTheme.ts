'use client';

import { useState, useEffect } from 'react';

export type Theme = 'day' | 'night';

export function useTheme() {
  const [theme, setTheme] = useState<Theme>('day');

  useEffect(() => {
    // Check localStorage or system preference
    const savedTheme = localStorage.getItem('timedrift_theme') as Theme | null;
    if (savedTheme === 'day' || savedTheme === 'night') {
      setTheme(savedTheme);
      document.documentElement.setAttribute('data-theme', savedTheme);
    } else {
      const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
      const initialTheme: Theme = prefersDark ? 'night' : 'day';
      setTheme(initialTheme);
      document.documentElement.setAttribute('data-theme', initialTheme);
    }
  }, []);

  const toggleTheme = () => {
    const nextTheme: Theme = theme === 'day' ? 'night' : 'day';
    setTheme(nextTheme);
    document.documentElement.setAttribute('data-theme', nextTheme);
    localStorage.setItem('timedrift_theme', nextTheme);
  };

  return { theme, toggleTheme };
}
