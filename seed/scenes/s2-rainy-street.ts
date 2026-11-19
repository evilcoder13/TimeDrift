/**
 * @file seed/scenes/s2-rainy-street.ts
 * @scene S2: Rainy Street Lanterns / Phố mưa đèn lồng
 * @tags rainy, cozy, night, calm, nostalgic
 * Compliant with TimeDriftSceneModule contract (P1_URD §2.5, SCENE_GUIDE §2, ADR-005).
 */

import type { TimeDriftSceneModule, SceneOpts, SceneHandle, SceneMetadata } from '../../src/types/scene';
import { mulberry32, lerp } from '../../vendor/line-art-animation/lib/motion';

export const metadata: SceneMetadata = {
  id: 's2',
  nameEn: 'Rainy Street Lanterns',
  nameVi: 'Phố mưa đèn lồng',
  descriptionEn: 'Diagonal sumi rain streaks across wet pavement; a lone umbrella walker strolls unhurriedly past glowing lanterns.',
  descriptionVi: 'Những vạt mưa nghiêng trên phố đá ướt ánh đèn; bóng người che ô thong thả bước qua những ngọn đèn lồng ấm áp.',
  tags: ['rainy', 'cozy', 'night', 'calm', 'nostalgic'],
  baseReference: 'vendor/line-art-animation examples/walker + rain',
  maxFigures: 1,
  viewBox: '0 0 1920 1080',
  centerSafeZone: { minX: 640, maxX: 1280, minY: 200, maxY: 900 },
};

interface RainStreak {
  x: number;
  y: number;
  length: number;
  speed: number;
}

interface Ripple {
  x: number;
  y: number;
  radius: number;
  maxRadius: number;
  opacity: number;
  growth: number;
}

class RainyStreetScene implements TimeDriftSceneModule {
  public id = metadata.id;
  public title = metadata.nameEn;
  public metadata = metadata;

  private scale = 1;
  private offsetX = 0;
  private offsetY = 0;

  private time = 0;
  private progress = 0.8; // Night-heavy
  private pointerX = 960;
  private pointerInfluence = 0;

  // Rain, ripples, lone umbrella stroller
  private rainStreaks: RainStreak[] = [];
  private ripples: Ripple[] = [];
  private walker = {
    x: 720,
    y: 820,
    speed: 16, // Very unhurried
    dir: 1,
    phase: 0,
    umbrellaSway: 0,
  };

  init(canvas: HTMLCanvasElement, _ctx: CanvasRenderingContext2D): void {
    const rng = mulberry32(17);

    // Diagonal rain streaks across 1920x1080
    this.rainStreaks = [];
    for (let i = 0; i < 110; i++) {
      this.rainStreaks.push({
        x: rng() * 2200 - 200,
        y: rng() * 1080,
        length: 22 + rng() * 32,
        speed: 420 + rng() * 280,
      });
    }

    // Puddle ripples on wet pavement
    this.ripples = [];
    for (let i = 0; i < 12; i++) {
      this.ripples.push({
        x: 640 + rng() * 640,
        y: 820 + rng() * 180,
        radius: rng() * 18,
        maxRadius: 24 + rng() * 20,
        opacity: 0.1 + rng() * 0.4,
        growth: 14 + rng() * 12,
      });
    }

    this.onResize(canvas.width, canvas.height);
  }

  onResize(w: number, h: number): void {
    this.scale = Math.min(w / 1920, h / 1080);
    this.offsetX = (w - 1920 * this.scale) / 2;
    this.offsetY = (h - 1080 * this.scale) / 2;
  }

  onPointerMove(x: number, _y: number): void {
    this.pointerX = (x - this.offsetX) / this.scale;
    this.pointerInfluence = Math.min(1.0, this.pointerInfluence + 0.1);
  }

  update(dt: number, progress: number): void {
    const clampedDt = Math.min(dt, 0.1);
    this.time += clampedDt;
    this.progress = progress;
    this.pointerInfluence = Math.max(0, this.pointerInfluence - clampedDt * 0.3);

    // Update rain fall (falling diagonally down-right)
    for (const r of this.rainStreaks) {
      r.y += r.speed * clampedDt;
      r.x += r.speed * 0.28 * clampedDt;
      if (r.y > 1080) {
        r.y = -40;
        r.x = (r.x + 350) % 2200 - 200;
      }
    }

    // Expanding puddle ripples
    for (const rip of this.ripples) {
      rip.radius += rip.growth * clampedDt;
      rip.opacity -= clampedDt * 0.45;
      if (rip.opacity <= 0 || rip.radius >= rip.maxRadius) {
        rip.radius = 2;
        rip.opacity = 0.45;
      }
    }

    // Umbrella walker strolling inside center safe window [640..1280]
    this.walker.phase = (this.walker.phase + clampedDt * 1.8) % (Math.PI * 2);
    this.walker.x += this.walker.dir * this.walker.speed * clampedDt;
    this.walker.umbrellaSway = Math.sin(this.time * 1.5) * 0.08;

    if (this.walker.dir > 0 && this.walker.x > 1260) {
      this.walker.dir = -1;
    } else if (this.walker.dir < 0 && this.walker.x < 660) {
      this.walker.dir = 1;
    }
  }

  render(ctx: CanvasRenderingContext2D): void {
    ctx.save();
    ctx.translate(this.offsetX, this.offsetY);
    ctx.scale(this.scale, this.scale);

    // Background transition
    const dayFactor = 0.5 - 0.5 * Math.cos(this.progress * Math.PI * 2);
    const bgR = Math.round(lerp(18, 238, dayFactor));
    const bgG = Math.round(lerp(20, 234, dayFactor));
    const bgB = Math.round(lerp(28, 226, dayFactor));
    ctx.fillStyle = `rgb(${bgR}, ${bgG}, ${bgB})`;
    ctx.fillRect(0, 0, 1920, 1080);

    // Sumi ink color
    const inkR = Math.round(lerp(230, 43, dayFactor));
    const inkG = Math.round(lerp(226, 42, dayFactor));
    const inkB = Math.round(lerp(218, 40, dayFactor));
    const inkColor = `rgb(${inkR}, ${inkG}, ${inkB})`;
    ctx.strokeStyle = inkColor;
    ctx.fillStyle = inkColor;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';

    // Old architectural street silhouettes (traditional townhouses / shophouses)
    ctx.lineWidth = 2.2;
    // Left shophouse eaves
    ctx.beginPath();
    ctx.moveTo(120, 780);
    ctx.lineTo(120, 480);
    ctx.lineTo(440, 440);
    ctx.lineTo(600, 520);
    ctx.lineTo(600, 780);
    ctx.stroke();

    // Curved tiled roof overhang
    ctx.lineWidth = 3.0;
    ctx.beginPath();
    ctx.moveTo(80, 485);
    ctx.quadraticCurveTo(340, 430, 620, 515);
    ctx.stroke();

    // Right shophouse
    ctx.lineWidth = 2.2;
    ctx.beginPath();
    ctx.moveTo(1320, 780);
    ctx.lineTo(1320, 510);
    ctx.lineTo(1520, 450);
    ctx.lineTo(1800, 490);
    ctx.lineTo(1800, 780);
    ctx.stroke();

    ctx.lineWidth = 3.0;
    ctx.beginPath();
    ctx.moveTo(1300, 515);
    ctx.quadraticCurveTo(1540, 440, 1840, 485);
    ctx.stroke();

    // Stone paved street horizon & perspective hatching
    ctx.lineWidth = 2.0;
    ctx.beginPath();
    ctx.moveTo(0, 800);
    ctx.lineTo(1920, 800);
    ctx.stroke();

    // Subtle pavement stone cracks & perspective lines
    ctx.lineWidth = 1.0;
    for (let p = 0; p < 8; p++) {
      const lineY = 820 + p * 30;
      ctx.beginPath();
      ctx.moveTo(560 - p * 35, lineY);
      ctx.lineTo(1360 + p * 35, lineY);
      ctx.stroke();
    }

    // Street Lanterns (Warm Amber Glow on rainy cobblestones)
    const lanterns = [
      { x: 580, y: 560 },
      { x: 960, y: 530 },
      { x: 1340, y: 550 },
    ];

    const nightGlow = Math.max(0.15, 1 - dayFactor * 1.3);

    for (const lt of lanterns) {
      // Bracket
      ctx.lineWidth = 2.4;
      ctx.beginPath();
      ctx.moveTo(lt.x - 20, lt.y - 10);
      ctx.quadraticCurveTo(lt.x, lt.y - 18, lt.x + 8, lt.y);
      ctx.lineTo(lt.x + 8, lt.y + 12);
      ctx.stroke();

      // Octagonal Lantern frame
      ctx.lineWidth = 1.8;
      ctx.strokeRect(lt.x - 4, lt.y + 12, 24, 38);

      // Radial Amber Glow through rain
      const grad = ctx.createRadialGradient(
        lt.x + 8, lt.y + 31, 3,
        lt.x + 8, lt.y + 31, 85
      );
      grad.addColorStop(0, `rgba(242, 196, 109, ${0.9 * nightGlow})`);
      grad.addColorStop(0.4, `rgba(242, 196, 109, ${0.35 * nightGlow})`);
      grad.addColorStop(1, 'rgba(242, 196, 109, 0)');
      ctx.fillStyle = grad;
      ctx.beginPath();
      ctx.arc(lt.x + 8, lt.y + 31, 85, 0, Math.PI * 2);
      ctx.fill();

      // Puddle reflection beneath lantern
      const refGrad = ctx.createRadialGradient(
        lt.x + 8, 830, 2,
        lt.x + 8, 830, 50
      );
      refGrad.addColorStop(0, `rgba(242, 196, 109, ${0.45 * nightGlow})`);
      refGrad.addColorStop(1, 'rgba(242, 196, 109, 0)');
      ctx.fillStyle = refGrad;
      ctx.beginPath();
      ctx.ellipse(lt.x + 8, 830, 40, 10, 0, 0, Math.PI * 2);
      ctx.fill();

      ctx.fillStyle = inkColor;
    }

    // Expanding puddle ripples
    for (const rip of this.ripples) {
      ctx.strokeStyle = `rgba(${inkR}, ${inkG}, ${inkB}, ${rip.opacity})`;
      ctx.lineWidth = 1.2;
      ctx.beginPath();
      ctx.ellipse(rip.x, rip.y, rip.radius, rip.radius * 0.35, 0, 0, Math.PI * 2);
      ctx.stroke();
    }
    ctx.strokeStyle = inkColor;

    // Lone Umbrella Walker
    const w = this.walker;
    ctx.save();
    ctx.translate(w.x, w.y);
    ctx.scale(w.dir, 1);

    const legA = Math.sin(w.phase) * 12;
    const legB = -Math.sin(w.phase) * 12;
    const bob = Math.abs(Math.sin(w.phase * 2)) * 2.5;

    // Puddle ripple under feet
    ctx.lineWidth = 1.0;
    ctx.beginPath();
    ctx.ellipse(0, 0, 18, 5, 0, 0, Math.PI * 2);
    ctx.stroke();

    // Long trench coat / kimono
    ctx.lineWidth = 2.0;
    ctx.beginPath();
    ctx.moveTo(0, -68 - bob);
    ctx.lineTo(8, -25 - bob);
    ctx.lineTo(-8, -25 - bob);
    ctx.closePath();
    ctx.stroke();

    // Legs
    ctx.beginPath();
    ctx.moveTo(3, -25 - bob);
    ctx.lineTo(3 + legA, 0);
    ctx.moveTo(-3, -25 - bob);
    ctx.lineTo(-3 + legB, 0);
    ctx.stroke();

    // Head
    ctx.beginPath();
    ctx.arc(0, -78 - bob, 7, 0, Math.PI * 2);
    ctx.stroke();

    // Umbrella shaft & canopy
    ctx.save();
    ctx.rotate(w.umbrellaSway);
    ctx.lineWidth = 2.2;
    ctx.beginPath();
    ctx.moveTo(4, -58 - bob);
    ctx.lineTo(0, -96 - bob);
    ctx.stroke();

    // Umbrella curved dome
    ctx.lineWidth = 2.6;
    ctx.beginPath();
    ctx.arc(0, -96 - bob, 38, Math.PI, 0, false);
    ctx.stroke();

    // Spoke ribs
    ctx.lineWidth = 1.2;
    ctx.beginPath();
    ctx.moveTo(-38, -96 - bob);
    ctx.quadraticCurveTo(0, -112 - bob, 38, -96 - bob);
    ctx.stroke();
    ctx.restore();

    ctx.restore();

    // Diagonal Sumi Rain Streaks (rendered in foreground)
    ctx.lineWidth = 1.4;
    ctx.strokeStyle = `rgba(${inkR}, ${inkG}, ${inkB}, 0.42)`;
    for (const r of this.rainStreaks) {
      ctx.beginPath();
      ctx.moveTo(r.x, r.y);
      ctx.lineTo(r.x + r.length * 0.28, r.y + r.length);
      ctx.stroke();
    }

    ctx.restore();
  }

  destroy(): void {
    this.rainStreaks = [];
    this.ripples = [];
  }

  mount(svg: SVGSVGElement, opts: SceneOpts): SceneHandle {
    svg.setAttribute('viewBox', '0 0 1920 1080');
    let speed = opts.reducedMotion ? 0.25 : 1.0;
    let paused = false;
    let tau = opts.startTau;
    let raf = 0;
    let last = performance.now();

    const fo = document.createElementNS('http://www.w3.org/2000/svg', 'foreignObject');
    fo.setAttribute('width', '1920');
    fo.setAttribute('height', '1080');
    fo.setAttribute('x', '0');
    fo.setAttribute('y', '0');

    const cvs = document.createElement('canvas');
    cvs.width = 1920;
    cvs.height = 1080;
    cvs.style.width = '100%';
    cvs.style.height = '100%';
    fo.appendChild(cvs);
    svg.appendChild(fo);

    const ctx = cvs.getContext('2d')!;
    this.init(cvs, ctx);

    const frame = (now: number) => {
      const dt = Math.min(0.1, (now - last) / 1000) * speed;
      last = now;
      if (!paused) {
        tau = (tau + dt / opts.dayLengthSec) % 1.0;
        this.update(dt, tau);
        this.render(ctx);
      }
      raf = requestAnimationFrame(frame);
    };

    raf = requestAnimationFrame(frame);

    return {
      pause: () => { paused = true; },
      resume: () => { paused = false; last = performance.now(); },
      setSpeed: (m: number) => { speed = Math.max(0.25, Math.min(1.0, m)); },
      destroy: () => {
        cancelAnimationFrame(raf);
        this.destroy();
        svg.replaceChildren();
      },
    };
  }
}

const scene: TimeDriftSceneModule = new RainyStreetScene();
export default scene;
