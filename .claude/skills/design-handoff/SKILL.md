---
name: design-handoff
description: Turn TimeDrift designs into implementable specs - CSS tokens, component specs, states and assets. Use when the Designer delivers screens or the Frontend implements them.
---
# Design Handoff

## Tokens → `src/app/globals.css`
```css
:root { --paper:#F4EFE4; --ink:#2B2A28; --ink-soft:#6B665E; --accent:#E0A458; --danger:#B5543C; --radius:14px; }
@media (prefers-color-scheme: dark) { :root { --paper:#1E2233; --ink:#E6E1D3; --ink-soft:#9A9789; --accent:#F2C46D; --danger:#E07A5F; } }
```
Map them in `tailwind.config.ts` (`colors.paper = 'var(--paper)'`, …). Fonts come from next/font: Fraunces (headings) and Inter (body), both with the `vietnamese` subset.

## Component spec template (one per component in DESIGN_SYSTEM.md)
```
### <Component>
Anatomy: … | Sizes: … | States: default/hover/focus-visible/active/disabled/loading
Behaviour: … | A11y: role, label, keyboard | Motion: duration/easing, reduced-motion variant
```

## Required states for each screen
Empty, loading, error, offline, locked (Pro), autoplay-blocked ("Tap to start").

## Assets
`public/icons/icon-192.png`, `icon-512.png`, `maskable-512.png`, `apple-touch-icon.png`, plus SVG empty-state art. Line weight 1.5px, colour `currentColor`.

## Acceptance
Contrast is at least AA. The focus ring is visible on paper and night backgrounds. Layouts are checked at 390 and 1440.
