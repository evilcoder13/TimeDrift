/**
 * @file vendor/line-art-animation/lib/ink.ts
 * Vector Primitives, Ink Aesthetics, and SVG Helpers.
 * Vendored from JDhruv14/line-art-animation (MIT).
 */

export interface InkDefsResult {
  filter: string;
  glowFilter: string;
}

/**
 * Injects standard SVG `<defs>` including procedural ink bleed/roughening turbulence filters
 * and gradient glow markers. Returns the filter ID string for application to root containers.
 */
export function inkDefs(svg: SVGSVGElement): InkDefsResult {
  let defs = svg.querySelector('defs');
  if (!defs) {
    defs = document.createElementNS('http://www.w3.org/2000/svg', 'defs');
    svg.insertBefore(defs, svg.firstChild);
  }

  const filterId = 'ink-filter-' + Math.floor(Math.random() * 100000);
  const glowId = 'glow-filter-' + Math.floor(Math.random() * 100000);

  defs.innerHTML += `
    <filter id="${filterId}" x="-10%" y="-10%" width="120%" height="120%">
      <feTurbulence type="fractalNoise" baseFrequency="0.04" numOctaves="3" result="noise" />
      <feDisplacementMap in="SourceGraphic" in2="noise" scale="1.5" xChannelSelector="R" yChannelSelector="G" />
    </filter>
    <filter id="${glowId}" x="-50%" y="-50%" width="200%" height="200%">
      <feGaussianBlur stdDeviation="6" result="blur" />
      <feMerge>
        <feMergeNode in="blur" />
        <feMergeNode in="SourceGraphic" />
      </feMerge>
    </filter>
  `;

  return { filter: `url(#${filterId})`, glowFilter: `url(#${glowId})` };
}

/**
 * Lightweight DOM creation helper for SVG elements with attribute mapping and parent attachment.
 */
export function el<K extends keyof SVGElementTagNameMap>(
  tag: K,
  attrs: Record<string, any> = {},
  parent?: SVGElement
): SVGElementTagNameMap[K] {
  const element = document.createElementNS('http://www.w3.org/2000/svg', tag);
  for (const [key, value] of Object.entries(attrs)) {
    if (value !== undefined && value !== null) {
      if (key === 'className') {
        element.setAttribute('class', String(value));
      } else {
        element.setAttribute(key, String(value));
      }
    }
  }
  if (parent) {
    parent.appendChild(element);
  }
  return element;
}

/**
 * Generates an organic double-stroke limb segment between two 2D points,
 * leaving subtle open ends at joint connections.
 */
export function limb(
  p1: [number, number],
  p2: [number, number],
  width = 3,
  parent?: SVGElement
): SVGPathElement {
  const dx = p2[0] - p1[0];
  const dy = p2[1] - p1[1];
  const len = Math.sqrt(dx * dx + dy * dy) || 1;
  const nx = -dy / len;
  const ny = dx / len;

  const w2 = width / 2;
  const mx = (p1[0] + p2[0]) / 2 + nx * (width * 0.2);
  const my = (p1[1] + p2[1]) / 2 + ny * (width * 0.2);

  const d = `M ${p1[0] + nx * w2} ${p1[1] + ny * w2} ` +
            `Q ${mx + nx * w2} ${my + ny * w2} ${p2[0] + nx * w2} ${p2[1] + ny * w2} ` +
            `M ${p1[0] - nx * w2} ${p1[1] - ny * w2} ` +
            `Q ${mx - nx * w2} ${my - ny * w2} ${p2[0] - nx * w2} ${p2[1] - ny * w2}`;

  return el('path', {
    d,
    fill: 'none',
    stroke: 'currentColor',
    'stroke-width': 1.5,
    'stroke-linecap': 'round',
    'stroke-linejoin': 'round'
  }, parent);
}

/**
 * Renders a stylized shoe/foot contour aligned with character travel direction.
 */
export function shoe(
  x: number,
  y: number,
  dir = 1,
  scale = 1,
  parent?: SVGElement
): SVGPathElement {
  const heelX = x - dir * 4 * scale;
  const toeX = x + dir * 10 * scale;
  const heelY = y;
  const toeY = y + 1 * scale;

  const d = `M ${heelX} ${heelY} Q ${x} ${y - 3 * scale} ${toeX} ${toeY} Q ${x + dir * 3 * scale} ${y + 2 * scale} ${heelX} ${heelY}`;

  return el('path', {
    d,
    fill: 'currentColor',
    stroke: 'none'
  }, parent);
}

/**
 * Transforms and positions characters or composite objects within the scene coordinate space.
 */
export function place(
  container: SVGElement | any[],
  x = 0,
  y = 0,
  dir = 1,
  scale: number | [number, number] = 1,
  parent?: SVGElement
): SVGGElement {
  const sx = typeof scale === 'number' ? scale * dir : scale[0] * dir;
  const sy = typeof scale === 'number' ? scale : scale[1];

  let g: SVGGElement;
  if (container instanceof SVGElement && container.tagName.toLowerCase() === 'g') {
    g = container as SVGGElement;
  } else {
    g = el('g', {}, parent);
    if (Array.isArray(container)) {
      // container array of elements or parts
      for (const item of container) {
        if (item instanceof SVGElement) {
          g.appendChild(item);
        }
      }
    } else if (container instanceof SVGElement) {
      g.appendChild(container);
    }
  }

  g.setAttribute('transform', `translate(${x}, ${y}) scale(${sx}, ${sy})`);
  return g;
}
