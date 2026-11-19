/**
 * @file vendor/line-art-animation/lib/daynight.ts
 * Dynamic ambient lighting, palette interpolation, and day/night transitions.
 * Vendored from JDhruv14/line-art-animation (MIT).
 */

import { lerp } from './motion';

export interface DayNightPalette {
  tau: number;
  bg: string;
  ink: string;
  inkSoft: string;
  inkMuted: string;
  paperFill: string;
  glow: string;
  glowOpacity: number;
}

interface ColorRGB {
  r: number;
  g: number;
  b: number;
}

function parseHex(hex: string): ColorRGB {
  const clean = hex.replace('#', '');
  const r = parseInt(clean.substring(0, 2), 16);
  const g = parseInt(clean.substring(2, 4), 16);
  const b = parseInt(clean.substring(4, 6), 16);
  return { r, g, b };
}

function formatRgb(c: ColorRGB): string {
  return `rgb(${Math.round(c.r)}, ${Math.round(c.g)}, ${Math.round(c.b)})`;
}

function lerpColor(c1: ColorRGB, c2: ColorRGB, t: number): ColorRGB {
  return {
    r: lerp(c1.r, c2.r, t),
    g: lerp(c1.g, c2.g, t),
    b: lerp(c1.b, c2.b, t),
  };
}

// Canonical Day & Night Design Tokens (docs/design/TOKENS.md)
const DAY_BG = parseHex('#F4EFE6'); // Paper base
const DAY_INK = parseHex('#2B2A28'); // Sumi ink
const DAY_INK_SOFT = parseHex('#635F59');
const DAY_INK_MUTED = parseHex('#969188');
const DAY_PP = parseHex('#FDFBF7');

const NIGHT_BG = parseHex('#161822'); // Midnight paper
const NIGHT_INK = parseHex('#EDE9DF'); // Bone ink
const NIGHT_INK_SOFT = parseHex('#A2A098');
const NIGHT_INK_MUTED = parseHex('#585A66');
const NIGHT_PP = parseHex('#232734');

const LANTERN_GLOW = '#F2C46D';

/**
 * Calculates current palette for a given tau in [0..1).
 * tau = 0.0: midnight
 * tau = 0.25: dawn / early morning
 * tau = 0.5: noon / full daylight
 * tau = 0.75: dusk / twilight
 */
export function palette(tau: number): DayNightPalette {
  const normTau = ((tau % 1) + 1) % 1;
  // Day factor: 0 at midnight (tau=0), 1 at noon (tau=0.5)
  // cos(0) = 1 -> 0.5 - 0.5*1 = 0
  // cos(PI) = -1 -> 0.5 - 0.5*(-1) = 1
  const dayFactor = 0.5 - 0.5 * Math.cos(normTau * Math.PI * 2);
  const nightFactor = 1 - dayFactor;

  const bg = formatRgb(lerpColor(NIGHT_BG, DAY_BG, dayFactor));
  const ink = formatRgb(lerpColor(NIGHT_INK, DAY_INK, dayFactor));
  const inkSoft = formatRgb(lerpColor(NIGHT_INK_SOFT, DAY_INK_SOFT, dayFactor));
  const inkMuted = formatRgb(lerpColor(NIGHT_INK_MUTED, DAY_INK_MUTED, dayFactor));
  const paperFill = formatRgb(lerpColor(NIGHT_PP, DAY_PP, dayFactor));

  // Glow is strongest at night (tau near 0 or 1)
  const glowOpacity = Math.max(0, Math.min(1, Math.pow(nightFactor, 1.5)));

  return {
    tau: normTau,
    bg,
    ink,
    inkSoft,
    inkMuted,
    paperFill,
    glow: LANTERN_GLOW,
    glowOpacity,
  };
}

/**
 * Applies the calculated palette to the root SVG and its themeable classes.
 */
export function applyPalette(svg: SVGSVGElement, p: DayNightPalette): void {
  svg.style.backgroundColor = p.bg;
  svg.style.color = p.ink;

  // Set CSS variables on svg
  svg.style.setProperty('--color-ink', p.ink);
  svg.style.setProperty('--color-ink-soft', p.inkSoft);
  svg.style.setProperty('--color-ink-muted', p.inkMuted);
  svg.style.setProperty('--color-paper', p.paperFill);
  svg.style.setProperty('--color-glow', p.glow);
  svg.style.setProperty('--glow-opacity', p.glowOpacity.toFixed(3));

  // Update paper-fill elements with class .pp
  const ppElements = svg.querySelectorAll<SVGElement>('.pp');
  for (let i = 0; i < ppElements.length; i++) {
    ppElements[i].setAttribute('fill', p.paperFill);
  }

  // Update glow elements with class .lantern-glow
  const glowElements = svg.querySelectorAll<SVGElement>('.lantern-glow');
  for (let i = 0; i < glowElements.length; i++) {
    glowElements[i].setAttribute('opacity', p.glowOpacity.toFixed(3));
  }
}
