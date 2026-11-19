/**
 * @file seed/scenes/s1-bamboo-village.ts
 * @scene S1: Bamboo Village in Mist / Làng tre trong sương (Lantern Village)
 * @tags morning, peaceful, nature, warm, nostalgic
 * Compliant with TimeDriftSceneModule contract (P1_URD §2.5, SCENE_GUIDE §2, ADR-005).
 */

import type { TimeDriftSceneModule, SceneOpts, SceneHandle, SceneMetadata } from '../../src/types/scene';
import { mulberry32, minJerk, lerp } from '../../vendor/line-art-animation/lib/motion';

export const metadata: SceneMetadata = {
  id: 's1',
  nameEn: 'Bamboo Village in Mist',
  nameVi: 'Làng tre trong sương',
  descriptionEn: 'Hillside bamboo village in morning mist; villagers stroll softly, lanterns glow at dusk, wind chimes sway.',
  descriptionVi: 'Ngôi làng tre trên sườn đồi trong sương mai; người dân thong thả tản bộ, lồng đèn tỏa sáng khi hoàng hôn, chuông gió đu đưa.',
  tags: ['morning', 'peaceful', 'nature', 'warm', 'nostalgic'],
  baseReference: 'vendor/line-art-animation examples/village',
  maxFigures: 2,
  viewBox: '0 0 1920 1080',
  centerSafeZone: { minX: 640, maxX: 1280, minY: 200, maxY: 900 },
};

interface Villager {
  x: number;
  y: number;
  speed: number;
  dir: number;
  phase: number;
  scale: number;
}

interface BambooStem {
  x: number;
  height: number;
  curve: number;
  thickness: number;
  phaseOffset: number;
}

class BambooVillageScene implements TimeDriftSceneModule {
  public id = metadata.id;
  public title = metadata.nameEn;
  public metadata = metadata;

  private canvas!: HTMLCanvasElement;
  private width = 1920;
  private height = 1080;
  private scale = 1;
  private offsetX = 0;
  private offsetY = 0;

  private time = 0;
  private progress = 0.25; // 0 = midnight, 0.25 = dawn, 0.5 = noon, 0.75 = dusk
  private pointerX = 960;
  private pointerInfluence = 0;

  // Visual elements
  private bambooStems: BambooStem[] = [];
  private villagers: Villager[] = [];
  private mistBands: Array<{ y: number; speed: number; opacity: number; phase: number }> = [];

  init(canvas: HTMLCanvasElement, _ctx: CanvasRenderingContext2D): void {
    this.canvas = canvas;
    const rng = mulberry32(42);

    // Generate bamboo grove in center safe & flanks
    this.bambooStems = [];
    const count = 38;
    for (let i = 0; i < count; i++) {
      this.bambooStems.push({
        x: 100 + i * (1720 / count) + (rng() - 0.5) * 40,
        height: 600 + rng() * 380,
        curve: (rng() - 0.5) * 28,
        thickness: 3 + rng() * 4,
        phaseOffset: rng() * Math.PI * 2,
      });
    }

    // 2 strolling villagers within safe horizontal window [640..1280]
    this.villagers = [
      { x: 740, y: 780, speed: 22, dir: 1, phase: 0, scale: 0.9 },
      { x: 1140, y: 810, speed: 18, dir: -1, phase: Math.PI * 0.7, scale: 0.95 },
    ];

    // Ambient mist layers
    this.mistBands = [
      { y: 640, speed: 14, opacity: 0.12, phase: 0 },
      { y: 720, speed: 10, opacity: 0.18, phase: 1.5 },
      { y: 800, speed: 8, opacity: 0.15, phase: 3.1 },
    ];

    this.onResize(canvas.width, canvas.height);
  }

  onResize(w: number, h: number): void {
    this.scale = Math.min(w / 1920, h / 1080);
    this.offsetX = (w - 1920 * this.scale) / 2;
    this.offsetY = (h - 1080 * this.scale) / 2;
  }

  onPointerMove(x: number, _y: number): void {
    this.pointerX = (x - this.offsetX) / this.scale;
    this.pointerInfluence = Math.min(1.0, this.pointerInfluence + 0.15);
  }

  update(dt: number, progress: number): void {
    const clampedDt = Math.min(dt, 0.1);
    this.time += clampedDt;
    this.progress = progress;
    this.pointerInfluence = Math.max(0, this.pointerInfluence - clampedDt * 0.35);

    // Update villagers gait and position (looping safely within center 640px window)
    for (const v of this.villagers) {
      v.phase = (v.phase + clampedDt * 2.2) % (Math.PI * 2);
      v.x += v.dir * v.speed * clampedDt;

      // Wrap smoothly around horizontal bounds [600..1320]
      if (v.dir > 0 && v.x > 1320) {
        v.x = 600;
      } else if (v.dir < 0 && v.x < 600) {
        v.x = 1320;
      }
    }
  }

  render(ctx: CanvasRenderingContext2D): void {
    ctx.save();
    ctx.translate(this.offsetX, this.offsetY);
    ctx.scale(this.scale, this.scale);

    // Day/Night background interpolation
    const isNight = this.progress < 0.2 || this.progress > 0.8;
    const dayFactor = 0.5 - 0.5 * Math.cos(this.progress * Math.PI * 2);

    const bgR = Math.round(lerp(22, 244, dayFactor));
    const bgG = Math.round(lerp(24, 239, dayFactor));
    const bgB = Math.round(lerp(34, 230, dayFactor));
    ctx.fillStyle = `rgb(${bgR}, ${bgG}, ${bgB})`;
    ctx.fillRect(0, 0, 1920, 1080);

    // Sumi ink styling
    const inkR = Math.round(lerp(237, 43, dayFactor));
    const inkG = Math.round(lerp(233, 42, dayFactor));
    const inkB = Math.round(lerp(223, 40, dayFactor));
    const inkColor = `rgb(${inkR}, ${inkG}, ${inkB})`;
    ctx.strokeStyle = inkColor;
    ctx.fillStyle = inkColor;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';

    // Distant Misty Hills
    ctx.lineWidth = 1.8;
    ctx.beginPath();
    ctx.moveTo(0, 560);
    ctx.bezierCurveTo(480, 510, 850, 580, 1280, 530);
    ctx.bezierCurveTo(1580, 490, 1780, 540, 1920, 520);
    ctx.stroke();

    // Bamboo Grove
    for (const b of this.bambooStems) {
      const sway = Math.sin(this.time * 0.7 + b.phaseOffset) * 12 +
                   this.pointerInfluence * (this.pointerX > b.x ? 8 : -8);
      ctx.lineWidth = b.thickness;
      ctx.beginPath();
      ctx.moveTo(b.x, 920);
      ctx.quadraticCurveTo(b.x + sway * 0.5, 920 - b.height * 0.5, b.x + sway, 920 - b.height);
      ctx.stroke();

      // Bamboo nodes & delicate leaves
      for (let j = 1; j <= 5; j++) {
        const segY = 920 - (b.height / 6) * j;
        const segX = b.x + (sway / 6) * j;
        ctx.lineWidth = b.thickness + 1.2;
        ctx.beginPath();
        ctx.moveTo(segX - b.thickness, segY);
        ctx.lineTo(segX + b.thickness, segY);
        ctx.stroke();

        // Little leaves
        ctx.lineWidth = 1.2;
        ctx.beginPath();
        ctx.moveTo(segX, segY);
        ctx.quadraticCurveTo(segX + 16, segY - 8, segX + 28, segY - 4);
        ctx.stroke();
      }
    }

    // Hillside path in foreground
    ctx.lineWidth = 2.4;
    ctx.beginPath();
    ctx.moveTo(480, 830);
    ctx.bezierCurveTo(780, 810, 1140, 840, 1440, 820);
    ctx.stroke();

    // Lantern Posts with Dusk/Night warm amber glow (ADR-005)
    const lanternPositions = [
      { x: 680, y: 730 },
      { x: 960, y: 710 },
      { x: 1240, y: 740 },
    ];

    const nightOpacity = Math.max(0, 1 - dayFactor * 1.5);

    for (const lp of lanternPositions) {
      // Wooden post
      ctx.lineWidth = 3.2;
      ctx.beginPath();
      ctx.moveTo(lp.x, lp.y + 90);
      ctx.lineTo(lp.x, lp.y);
      ctx.lineTo(lp.x + 18, lp.y - 12);
      ctx.stroke();

      // Hanging lantern
      const chimeSway = Math.sin(this.time * 1.2 + lp.x) * 4;
      ctx.lineWidth = 1.4;
      ctx.beginPath();
      ctx.moveTo(lp.x + 18, lp.y - 12);
      ctx.lineTo(lp.x + 18 + chimeSway * 0.3, lp.y + 8);
      ctx.stroke();

      // Lantern box
      ctx.lineWidth = 2.0;
      ctx.strokeRect(lp.x + 10 + chimeSway * 0.3, lp.y + 8, 16, 26);

      // Night Amber Glow
      if (nightOpacity > 0.05) {
        const grad = ctx.createRadialGradient(
          lp.x + 18, lp.y + 21, 2,
          lp.x + 18, lp.y + 21, 55
        );
        grad.addColorStop(0, `rgba(242, 196, 109, ${0.85 * nightOpacity})`);
        grad.addColorStop(0.5, `rgba(242, 196, 109, ${0.35 * nightOpacity})`);
        grad.addColorStop(1, 'rgba(242, 196, 109, 0)');
        ctx.fillStyle = grad;
        ctx.beginPath();
        ctx.arc(lp.x + 18, lp.y + 21, 55, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = inkColor;
      }
    }

    // Strolling Villagers (Procedural line-art kinematics)
    for (const v of this.villagers) {
      ctx.save();
      ctx.translate(v.x, v.y);
      ctx.scale(v.scale * v.dir, v.scale);

      const legL = Math.sin(v.phase) * 14;
      const legR = -Math.sin(v.phase) * 14;
      const bob = Math.abs(Math.sin(v.phase * 2)) * 3;

      // Head with conical straw hat (nón lá)
      ctx.lineWidth = 1.8;
      ctx.beginPath();
      ctx.arc(0, -68 - bob, 7, 0, Math.PI * 2);
      ctx.stroke();
      // Hat
      ctx.beginPath();
      ctx.moveTo(-18, -66 - bob);
      ctx.lineTo(0, -78 - bob);
      ctx.lineTo(18, -66 - bob);
      ctx.closePath();
      ctx.stroke();

      // Torso & Robe
      ctx.beginPath();
      ctx.moveTo(0, -61 - bob);
      ctx.lineTo(0, -22 - bob);
      ctx.stroke();

      // Legs
      ctx.beginPath();
      ctx.moveTo(0, -22 - bob);
      ctx.lineTo(legL, 0);
      ctx.moveTo(0, -22 - bob);
      ctx.lineTo(legR, 0);
      ctx.stroke();

      // Walking staff
      ctx.lineWidth = 1.2;
      ctx.beginPath();
      ctx.moveTo(12, -45 - bob);
      ctx.lineTo(14, 2);
      ctx.stroke();

      ctx.restore();
    }

    // Gentle Morning Mist Layers
    for (const m of this.mistBands) {
      const mistOffset = Math.sin(this.time * 0.4 + m.phase) * 50;
      ctx.fillStyle = isNight
        ? `rgba(22, 24, 34, ${m.opacity * 0.6})`
        : `rgba(253, 251, 247, ${m.opacity * (1 - dayFactor * 0.3)})`;
      ctx.beginPath();
      ctx.ellipse(960 + mistOffset, m.y, 700, 24, 0, 0, Math.PI * 2);
      ctx.fill();
    }

    ctx.restore();
  }

  destroy(): void {
    this.bambooStems = [];
    this.villagers = [];
    this.mistBands = [];
  }

  mount(svg: SVGSVGElement, opts: SceneOpts): SceneHandle {
    svg.setAttribute('viewBox', '0 0 1920 1080');
    let speed = opts.reducedMotion ? 0.25 : 1.0;
    let paused = false;
    let tau = opts.startTau;
    let raf = 0;
    let last = performance.now();

    // Embedded canvas inside SVG foreignObject for high-performance fluid rendering
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

const scene: TimeDriftSceneModule = new BambooVillageScene();
export default scene;
