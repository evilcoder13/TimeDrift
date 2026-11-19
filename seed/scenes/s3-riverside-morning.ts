/**
 * @file seed/scenes/s3-riverside-morning.ts
 * @scene S3: Riverside Morning / Sáng bên sông
 * @tags morning, peaceful, nature, calm, warm
 * Compliant with TimeDriftSceneModule contract (P1_URD §2.5, SCENE_GUIDE §2, ADR-005).
 */

import type { TimeDriftSceneModule, SceneOpts, SceneHandle, SceneMetadata } from '../../src/types/scene';
import { mulberry32, lerp } from '../../vendor/line-art-animation/lib/motion';

export const metadata: SceneMetadata = {
  id: 's3',
  nameEn: 'Riverside Morning',
  nameVi: 'Sáng bên sông',
  descriptionEn: 'Wide calm river at dawn; wooden sampan boat gently drifting, a lone fisherman casting in silhouette, two birds in leisurely flight.',
  descriptionVi: 'Mặt sông phẳng lặng trong sương sớm; con thuyền tam bản êm đềm lướt sóng, bóng người buông câu và đôi cánh chim lượn thong thả.',
  tags: ['morning', 'peaceful', 'nature', 'calm', 'warm'],
  baseReference: 'new hand-drawn composition',
  maxFigures: 3,
  viewBox: '0 0 1920 1080',
  centerSafeZone: { minX: 640, maxX: 1280, minY: 200, maxY: 900 },
};

interface Bird {
  x: number;
  y: number;
  speed: number;
  wingPhase: number;
  arcRadius: number;
}

class RiversideMorningScene implements TimeDriftSceneModule {
  public id = metadata.id;
  public title = metadata.nameEn;
  public metadata = metadata;

  private scale = 1;
  private offsetX = 0;
  private offsetY = 0;

  private time = 0;
  private progress = 0.25; // Dawn / early morning
  private pointerX = 960;
  private pointerInfluence = 0;

  // Sampan boat floating gently
  private boat = {
    x: 880,
    y: 720,
    baseY: 720,
    heavePhase: 0,
    pitchPhase: 0.5,
  };

  // Flying birds in wide leisurely arcs
  private birds: Bird[] = [];

  init(canvas: HTMLCanvasElement, _ctx: CanvasRenderingContext2D): void {
    const rng = mulberry32(101);

    this.birds = [
      { x: 780, y: 320, speed: 28, wingPhase: 0, arcRadius: 60 },
      { x: 920, y: 280, speed: 24, wingPhase: 1.2, arcRadius: 45 },
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
    this.pointerInfluence = Math.min(1.0, this.pointerInfluence + 0.1);
  }

  update(dt: number, progress: number): void {
    const clampedDt = Math.min(dt, 0.1);
    this.time += clampedDt;
    this.progress = progress;
    this.pointerInfluence = Math.max(0, this.pointerInfluence - clampedDt * 0.3);

    // Sampan boat sinusoidal heave and pitch (T ~ 5.5s)
    this.boat.heavePhase = (this.boat.heavePhase + clampedDt * (Math.PI * 2 / 5.5)) % (Math.PI * 2);
    this.boat.pitchPhase = (this.boat.pitchPhase + clampedDt * (Math.PI * 2 / 6.2)) % (Math.PI * 2);
    this.boat.y = this.boat.baseY + Math.sin(this.boat.heavePhase) * 6;

    // Drifting birds flying across center zone [600..1300]
    for (const b of this.birds) {
      b.wingPhase = (b.wingPhase + clampedDt * 3.0) % (Math.PI * 2);
      b.x += b.speed * clampedDt;
      b.y += Math.sin(this.time * 0.4 + b.wingPhase * 0.2) * (clampedDt * 8);

      if (b.x > 1380) {
        b.x = 580;
      }
    }
  }

  render(ctx: CanvasRenderingContext2D): void {
    ctx.save();
    ctx.translate(this.offsetX, this.offsetY);
    ctx.scale(this.scale, this.scale);

    // Day/Night background interpolation
    const dayFactor = 0.5 - 0.5 * Math.cos(this.progress * Math.PI * 2);
    const bgR = Math.round(lerp(20, 246, dayFactor));
    const bgG = Math.round(lerp(23, 242, dayFactor));
    const bgB = Math.round(lerp(32, 234, dayFactor));
    ctx.fillStyle = `rgb(${bgR}, ${bgG}, ${bgB})`;
    ctx.fillRect(0, 0, 1920, 1080);

    // Sumi ink color
    const inkR = Math.round(lerp(235, 43, dayFactor));
    const inkG = Math.round(lerp(231, 42, dayFactor));
    const inkB = Math.round(lerp(222, 40, dayFactor));
    const inkColor = `rgb(${inkR}, ${inkG}, ${inkB})`;
    ctx.strokeStyle = inkColor;
    ctx.fillStyle = inkColor;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';

    // Morning Sun / Evening Moon in center safe horizon
    const celestialY = lerp(450, 220, dayFactor);
    ctx.lineWidth = 1.8;
    ctx.beginPath();
    ctx.arc(960, celestialY, 44, 0, Math.PI * 2);
    ctx.stroke();

    if (dayFactor > 0.15) {
      // Gentle morning glow wash
      const sunGlow = ctx.createRadialGradient(960, celestialY, 10, 960, celestialY, 180);
      sunGlow.addColorStop(0, `rgba(242, 196, 109, ${0.35 * dayFactor})`);
      sunGlow.addColorStop(1, 'rgba(242, 196, 109, 0)');
      ctx.fillStyle = sunGlow;
      ctx.beginPath();
      ctx.arc(960, celestialY, 180, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = inkColor;
    }

    // Distant Layered Mountains (Atmospheric perspective)
    ctx.lineWidth = 1.4;
    ctx.beginPath();
    ctx.moveTo(0, 520);
    ctx.bezierCurveTo(450, 440, 820, 510, 1240, 460);
    ctx.bezierCurveTo(1560, 420, 1780, 480, 1920, 450);
    ctx.stroke();

    ctx.lineWidth = 2.0;
    ctx.beginPath();
    ctx.moveTo(0, 580);
    ctx.bezierCurveTo(380, 520, 750, 600, 1160, 540);
    ctx.bezierCurveTo(1520, 490, 1800, 570, 1920, 530);
    ctx.stroke();

    // River Waterlines (Gentle sinusoidal horizontal ripples)
    for (let r = 0; r < 7; r++) {
      const lineY = 660 + r * 50;
      const wave = Math.sin(this.time * 0.8 + r) * 14;
      ctx.lineWidth = 1.1;
      ctx.beginPath();
      ctx.moveTo(420, lineY);
      ctx.quadraticCurveTo(960 + wave, lineY - 4, 1500, lineY);
      ctx.stroke();
    }

    // River reeds on shorelines
    for (let i = 0; i < 18; i++) {
      const reedX = 460 + i * 16;
      const reedSway = Math.sin(this.time * 1.1 + i * 0.5) * 8;
      ctx.lineWidth = 1.6;
      ctx.beginPath();
      ctx.moveTo(reedX, 860);
      ctx.quadraticCurveTo(reedX + reedSway * 0.5, 800, reedX + reedSway, 750);
      ctx.stroke();
    }

    // Wooden Sampan Boat (Focal point within center safe zone [640..1280])
    ctx.save();
    ctx.translate(this.boat.x, this.boat.y);
    const pitch = Math.sin(this.boat.pitchPhase) * 0.04;
    ctx.rotate(pitch);

    // Boat hull
    ctx.lineWidth = 3.0;
    ctx.beginPath();
    ctx.moveTo(-110, -10);
    ctx.quadraticCurveTo(-60, 24, 0, 26);
    ctx.quadraticCurveTo(70, 24, 120, -12);
    ctx.quadraticCurveTo(90, 4, 0, 8);
    ctx.quadraticCurveTo(-70, 4, -110, -10);
    ctx.closePath();
    ctx.stroke();

    // Woven bamboo canopy (Mui thuyen)
    ctx.lineWidth = 2.2;
    ctx.beginPath();
    ctx.arc(-15, -12, 34, Math.PI, 0, false);
    ctx.stroke();
    // Canopy cross-hatching
    for (let c = -40; c <= 10; c += 12) {
      ctx.lineWidth = 1.0;
      ctx.beginPath();
      ctx.moveTo(c, -12);
      ctx.lineTo(c + 8, -42);
      ctx.stroke();
    }

    // Fisherman Silhouette standing at stern
    ctx.lineWidth = 2.0;
    // Hat
    ctx.beginPath();
    ctx.moveTo(60, -58);
    ctx.lineTo(75, -70);
    ctx.lineTo(90, -58);
    ctx.closePath();
    ctx.stroke();

    // Body
    ctx.beginPath();
    ctx.moveTo(75, -58);
    ctx.lineTo(75, -22);
    ctx.stroke();

    // Bamboo fishing rod
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.moveTo(75, -42);
    ctx.quadraticCurveTo(140, -80, 210, -30);
    ctx.stroke();

    // Fishing line dropping into water with ripple
    const rodEndWave = Math.sin(this.time * 1.5) * 4;
    ctx.lineWidth = 0.8;
    ctx.beginPath();
    ctx.moveTo(210, -30);
    ctx.lineTo(210, 35 + rodEndWave);
    ctx.stroke();

    // Water ripple at line contact
    ctx.lineWidth = 1.0;
    ctx.beginPath();
    ctx.ellipse(210, 36 + rodEndWave, 10, 3, 0, 0, Math.PI * 2);
    ctx.stroke();

    // Water displacement reflection under hull
    ctx.lineWidth = 1.2;
    ctx.beginPath();
    ctx.ellipse(0, 32, 90, 8, 0, 0, Math.PI * 2);
    ctx.stroke();

    ctx.restore();

    // Flying Birds in gentle soaring arcs
    for (const b of this.birds) {
      ctx.save();
      ctx.translate(b.x, b.y);

      const wingFlap = Math.sin(b.wingPhase) * 10;
      ctx.lineWidth = 1.8;
      ctx.beginPath();
      ctx.moveTo(-16, wingFlap);
      ctx.quadraticCurveTo(-8, -4, 0, 0);
      ctx.quadraticCurveTo(8, -4, 16, wingFlap);
      ctx.stroke();

      ctx.restore();
    }

    ctx.restore();
  }

  destroy(): void {
    this.birds = [];
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

const scene: TimeDriftSceneModule = new RiversideMorningScene();
export default scene;
