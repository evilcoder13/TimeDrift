# Design System (Owner: Designer)

## Tokens
| Token | Day | Night |
|---|---|---|
| `--paper` | `#F4EFE4` | `#1E2233` |
| `--ink` | `#2B2A28` | `#E6E1D3` |
| `--ink-soft` | `#6B665E` | `#9A9789` |
| `--accent` (glow) | `#E0A458` | `#F2C46D` |
| `--danger` | `#B5543C` | `#E07A5F` |
UI theme follows system `prefers-color-scheme`; player chrome follows scene palette via postMessage `palette` event (optional).

- Type: headings **Fraunces** (serif, soft), body **Inter**; both support Vietnamese diacritics. Scale 14/16/20/28/40.
- Radius 14px cards, 999px chips. Shadows: none; use 1px ink-soft hairlines (ink aesthetic).
- Motion: 200–400ms ease-out; respect `prefers-reduced-motion`.
- Spacing: 4px base grid.

## Components
Button (primary/ghost/icon), Chip (tag, selectable), Card (template: thumbnail 16:9, name, tag chips), Sheet (bottom on mobile, dialog on desktop — use `<dialog>`), DurationPicker (presets + slider + lock badge), PlayerControls (auto-hide), Timer ring, EndScreen, ProBadge, UpsellSheet, JobStatusCard, CodeEditor (admin), DataTable (admin), Toast.

## Iconography
Thin 1.5px line icons (Lucide) to match line-art.

## Deliverables (Designer)
- [ ] Figma (or Penpot) file: tokens, components, all screens in UX_FLOWS (mobile 390 + desktop 1440), day & night
- [ ] App icon + PWA maskable icons (512/192), splash
- [ ] Empty-state illustrations (line-art, can reuse seed scene stills)
