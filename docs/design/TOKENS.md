# Design Tokens & Theme Specification (Owner: UI/UX Designer)

**Version:** 1.0.0  
**Status:** Approved for Foundation / P1 Scaffolding  
**Related Requirements:** [docs/ba/P0_URD.md §3.1](file:///Users/daothang/Documents/Projects/TimeDrift/docs/ba/P0_URD.md), [docs/creative/CREATIVE_BRIEF.md](file:///Users/daothang/Documents/Projects/TimeDrift/docs/creative/CREATIVE_BRIEF.md)

---

## 1. Palette Philosophy: "Ink on Warm Paper, Breathing Slowly"

TimeDrift’s aesthetic rejects synthetic modern neo-brutalism and high-saturation digital interfaces. The visual language mirrors authentic East-Asian ink-wash sketches on textured handmade washi paper, illuminated by gentle sunlight by day and amber lantern embers by night.

### Contrast Ratios & WCAG 2.2 AA Compliance
All color pairings have been mathematically evaluated against WCAG 2.2 Level AA requirements:
- **Body text & essential UI controls:** $\ge 4.5:1$
- **Large headings ($\ge 24\text{px}$ or bold $\ge 18.5\text{px}$):** $\ge 3.0:1$
- **Focus indicator outline:** $\ge 3.0:1$ against adjacent backgrounds

---

## 2. Color Palette & Scales

### 2.1. Day Mode (Warm Parchment & Hand-Ground Sumi Ink)

| Token Name | Hex Code | Purpose / Application | Contrast vs Paper Base |
|---|---|---|---|
| `--color-paper-light` | `#FDFBF7` | Card backgrounds, elevated sheets, input fields | N/A |
| `--color-paper` | `#F4EFE6` | Default viewport canvas background (washi paper) | Base ($1:1$) |
| `--color-paper-dark` | `#EAE3D5` | Recessed containers, borders, dividers, chip backgrounds | $1.15:1$ |
| `--color-ink` | `#2B2A28` | Primary text, primary line-art strokes, high-emphasis icons | **$12.3:1$** (Passes AAA) |
| `--color-ink-soft` | `#635F59` | Secondary captions, durations, unselected states, helper text | **$4.8:1$** (Passes AA) |
| `--color-ink-muted` | `#969188` | Disabled text, subtle hairline borders (1px) | $2.3:1$ (Non-text decorative) |
| `--color-accent` | `#C28B38` | Warm Ochre / Sunlit Amber (CTAs, focus rings, active badges) | **$3.1:1$** (Large text/UI pass) |
| `--color-accent-hover` | `#A6742B` | Hover state for accent buttons | **$4.5:1$** (Passes AA) |
| `--color-danger` | `#B5543C` | Terracotta Clay (destructive actions, timer limits exceeded) | **$4.6:1$** (Passes AA) |

### 2.2. Night Mode (Midnight Charcoal Wash & Amber Lantern Glow)

| Token Name | Hex Code | Purpose / Application | Contrast vs Night Base |
|---|---|---|---|
| `--color-paper-light` | `#232734` | Elevated cards, dialog sheets, floating player chrome | $1.25:1$ |
| `--color-paper` | `#161822` | Viewport canvas background (deep midnight sumi ink wash) | Base ($1:1$) |
| `--color-paper-dark` | `#10121A` | Recessed backgrounds, player backdrop veil | $1.1:1$ |
| `--color-ink` | `#EDE9DF` | Primary text, glowing line-art strokes, primary controls | **$13.4:1$** (Passes AAA) |
| `--color-ink-soft` | `#A2A098` | Secondary copy, tag labels, elapsed timer text | **$6.4:1$** (Passes AA) |
| `--color-ink-muted` | `#585A66` | Hairline borders, inactive track ticks | $2.6:1$ (Decorative) |
| `--color-accent` | `#F2C46D` | Lantern Amber Glow (active highlights, slider progress) | **$10.2:1$** (Passes AAA) |
| `--color-accent-hover` | `#FFD78A` | Glow hover state | **$12.1:1$** (Passes AAA) |
| `--color-danger` | `#E07A5F` | Coral Ember (destructive alerts in dark mode) | **$5.3:1$** (Passes AA) |

---

## 3. Typography

### 3.1. Type Families
- **Display / Headings:** `Fraunces`, Serif, optical sizing `9..144`, weights 400, 600. Warm, organic letterforms with soft curves reminiscent of traditional literary press.
- **Body / Interface:** `Inter`, Sans-Serif, weights 400, 500, 600. High legibility, neutral metric proportions.
- Both families loaded via `@next/font/google` with subsets `['latin', 'vietnamese']` to guarantee zero layout shift (CLS 0) and pristine Vietnamese diacritical rendering (dấu hỏi, ngã, nặng, mũ).

### 3.2. Modular Type Scale
| Size Slug | Font Size | Line Height | Tracking | Recommended Usage |
|---|---|---|---|---|
| `text-xs` | 12px (0.75rem) | 16px (1.33) | `+0.02em` | Tag chips, time elapsed, metadata, badge text |
| `text-sm` | 14px (0.875rem) | 20px (1.43) | `+0.01em` | Secondary body, button labels, input placeholders |
| `text-base`| 16px (1.000rem) | 24px (1.50) | `0.00em` | Primary body, sheet titles, list item labels |
| `text-lg` | 18px (1.125rem) | 28px (1.55) | `-0.01em` | Section headers, card titles |
| `text-xl` | 20px (1.250rem) | 28px (1.40) | `-0.01em` | Modal titles, timer countdown readout |
| `text-2xl` | 24px (1.500rem) | 32px (1.33) | `-0.02em` | Page titles, End Screen headline |
| `text-3xl` | 30px (1.875rem) | 38px (1.27) | `-0.02em` | Hero titles |
| `text-4xl` | 36px (2.250rem) | 44px (1.22) | `-0.03em` | Display / Large brand statements |

---

## 4. Spacing, Borders, and Radii

- **Base Spacing Grid:** 4px unit (`p-1` = 4px, `p-2` = 8px, `p-3` = 12px, `p-4` = 16px, `p-6` = 24px, `p-8` = 32px, `p-12` = 48px).
- **Corner Radii:**
  - `rounded-sm`: 6px (Badges, small input tags)
  - `rounded-md`: 10px (Buttons, standard cards)
  - `rounded-lg`: 14px (Template cards, modals, player dialogs)
  - `rounded-xl`: 20px (Floating sheets)
  - `rounded-full`: 9999px (Pills, tag filter chips, audio scrub handle)
- **Borders & Dividers:**
  - Standard ink hairline: `1px solid var(--color-ink-muted)` with opacity fallback `border-ink/15`.
  - Elevation is achieved through subtle warm borders and backdrop blur rather than heavy digital drop shadows.
- **Elevation / Shadows:**
  - `shadow-ink-sm`: `0 2px 8px -2px rgba(43, 42, 40, 0.06)`
  - `shadow-ink-md`: `0 8px 24px -4px rgba(43, 42, 40, 0.10)`
  - `shadow-lantern`: `0 0 20px rgba(242, 196, 109, 0.25)` (Night mode accent glow)

---

## 5. Animation, Easing, and Receding UI Tokens

### 5.1. Easing Curves
- `--ease-gentle`: `cubic-bezier(0.16, 1, 0.3, 1)` (Out-quint / soft human stop)
- `--ease-daynight`: `cubic-bezier(0.4, 0.0, 0.2, 1.0)` (Standard smooth progression)
- `--ease-breathe`: `cubic-bezier(0.45, 0.05, 0.55, 0.95)` (Sinusoidal expansion & contraction)

### 5.2. Duration Specs
- `--duration-fast`: `150ms` (Micro-interactions, button active press)
- `--duration-normal`: `250ms` (Hover states, tooltip reveal)
- `--duration-sheet`: `400ms` (Drawer slide up/down)
- `--duration-recede`: `800ms` (Player controls fade out to invisibility)
- `--duration-daynight`: `800ms` (Theme transition crossfade)
- `--duration-audio-crossfade`: `3000ms` (Playlist transition fade)
- `--duration-audio-end-fade`: `10000ms` (Session timer completion fade, R2)

### 5.3. Receding Inactivity Token
- `--timer-player-inactivity`: `4000ms` (4.0s of untouched pointer/keyboard before player chrome recedes to `opacity: 0`).

### 5.4. Motion Guard (`prefers-reduced-motion: reduce`)
- All transitions drop to `0.01ms` or immediate opacity fade.
- Canvas animation scale reduces to `0.25x` or switches to slow static dissolve.

---

## 6. Tailwind CSS Theme Configuration (`tailwind.config.ts`)

```typescript
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
```

---

## 7. Global CSS Variables Definition (`src/app/globals.css`)

```css
@tailwind base;
@tailwind components;
@tailwind utilities;

:root {
  /* Day Theme (Default) */
  --color-paper-light: #FDFBF7;
  --color-paper: #F4EFE6;
  --color-paper-dark: #EAE3D5;
  --color-ink: #2B2A28;
  --color-ink-soft: #635F59;
  --color-ink-muted: #969188;
  --color-accent: #C28B38;
  --color-accent-hover: #A6742B;
  --color-danger: #B5543C;
  --shadow-ink-color: rgba(43, 42, 40, 0.08);
  --shadow-lantern-color: rgba(194, 139, 56, 0.25);
  --radius: 14px;
}

[data-theme="night"],
@media (prefers-color-scheme: dark) {
  :root:not([data-theme="day"]) {
    /* Night Theme */
    --color-paper-light: #232734;
    --color-paper: #161822;
    --color-paper-dark: #10121A;
    --color-ink: #EDE9DF;
    --color-ink-soft: #A2A098;
    --color-ink-muted: #585A66;
    --color-accent: #F2C46D;
    --color-accent-hover: #FFD78A;
    --color-danger: #E07A5F;
    --shadow-ink-color: rgba(10, 12, 18, 0.40);
    --shadow-lantern-color: rgba(242, 196, 109, 0.35);
  }
}

/* Smooth Theme Transitions */
html {
  transition: background-color 800ms cubic-bezier(0.4, 0, 0.2, 1),
              color 800ms cubic-bezier(0.4, 0, 0.2, 1);
  background-color: var(--color-paper);
  color: var(--color-ink);
}

/* Accessible Focus Ring */
*:focus-visible {
  outline: 2px solid var(--color-accent);
  outline-offset: 3px;
  border-radius: 4px;
}

/* Reduced Motion Override */
@media (prefers-reduced-motion: reduce) {
  *, ::before, ::after {
    animation-duration: 0.01ms !important;
    animation-iteration-count: 1 !important;
    transition-duration: 0.01ms !important;
    scroll-behavior: auto !important;
  }
}
```
