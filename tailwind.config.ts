import type { Config } from 'tailwindcss';

const config: Config = {
  darkMode: ['class', '[data-theme="night"]'],
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        paper: {
          light: 'var(--color-paper-light)',
          DEFAULT: 'var(--color-paper)',
          dark: 'var(--color-paper-dark)',
        },
        ink: {
          DEFAULT: 'var(--color-ink)',
          soft: 'var(--color-ink-soft)',
          muted: 'var(--color-ink-muted)',
        },
        accent: {
          DEFAULT: 'var(--color-accent)',
          hover: 'var(--color-accent-hover)',
        },
        danger: {
          DEFAULT: 'var(--color-danger)',
        },
      },
      fontFamily: {
        serif: ['var(--font-fraunces)', 'Georgia', 'serif'],
        sans: ['var(--font-inter)', 'system-ui', 'sans-serif'],
      },
      borderRadius: {
        card: '14px',
        sheet: '20px',
      },
      boxShadow: {
        'ink-sm': '0 2px 8px -2px var(--shadow-ink-color)',
        'ink-md': '0 8px 24px -4px var(--shadow-ink-color)',
        lantern: '0 0 24px -2px var(--shadow-lantern-color)',
      },
      transitionTimingFunction: {
        gentle: 'cubic-bezier(0.16, 1, 0.3, 1)',
        daynight: 'cubic-bezier(0.4, 0, 0.2, 1)',
        breathe: 'cubic-bezier(0.45, 0.05, 0.55, 0.95)',
      },
      transitionDuration: {
        recede: '800ms',
        daynight: '800ms',
      },
      maxWidth: {
        'focal-safe': '640px',
      },
    },
  },
  plugins: [],
};

export default config;
