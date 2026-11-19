/**
 * @file seed/scenes/s5-starry-hill.ts
 * @scene S5: Starry Hill & Lone Pine / Đồi sao & Cây thông cô đơn
 * @tags night, dreamy, sleepy, calm, nature
 * Compliant with TimeDriftSceneModule contract (P1_URD §2.5, SCENE_GUIDE §2, ADR-005).
 */

import type { TimeDriftSceneModule, SceneOpts, SceneHandle, SceneMetadata } from '../../src/types/scene';
import { mulberry32, lerp } from '../../vendor/line-art-animation/lib/motion';

export const metadata: SceneMetadata = {
  id: 's5',
  nameEn: 'Starry Hill & Lone Pine',
  nameVi: 'Đồi sao & Cây thông cô đơn',
  descriptionEn: 'Ancient pine silhouette gently swaying on a grassy knoll; floating fireflies and twinkling night stars breathing softly.',
  descriptionVi: 'Bóng cây thông cổ thụ đung đưa khẽ khàng trên đỉnh đồi; đàn đom đóm lượn lờ và muôn vì sao đêm nhấp nháy êm đềm.',
  tags: ['night', 'dreamy', 'sleepy', 'calm', 'nature'],
  baseReference: 'new hand-drawn composition',
  maxFigures: 0,
  viewBox: '0 0 1920 1080',
  centerSafeZone: { minX: 640, maxX: 1280, minY: 200, maxY: 900 },
};

interface Star {
  x: number;
  y: number;
  size: number;
  phase: number;
  speed: number;
}

interface Firefly {
  x: number;
  y: number;
  baseX: number;
  baseY: number;
  phaseX: number;
  phaseY: number;
  glowPhase: number;
}

class StarryHillScene implements TimeDriftSceneModule {
  public id = metadata.id;
  public title = metadata.nameEn;
  public metadata = metadata;

  private scale = 1;
  private offsetX = 0;
  private offsetY = 0;

  private time = 0;
  private progress = 0.0; // Midnight / full night
  private pointerX = 960;
  private pointerInfluence = 0;

  // Starry sky & floating fireflies
  private stars: Star[] = [];
  private fireflies: Firefly[] = [];

  init(canvas: HTMLCanvasElement, _ctx: CanvasRenderingContext2D): void {
    const rng = mulberry32(777);

    // Star field
    this.stars = [];
    for (let i = 0; i < 95; i++) {
      this.stars.push({
        x: rng() * 1920,
        y: rng() * 650,
        size: 1.0 + rng() * 2.2,
        phase: rng() * Math.PI * 2,
        speed: 0.6 + rng() * 1.4,
      });
    }

    // Fireflies floating near pine tree in center safe zone [640..1280]
    this.fireflies = [];
    for (let i = 0; i < 28; i++) {
      const bx = 760 + rng() * 400;
      const by = 480 + rng() * 320;
      this.fireflies.push({
        x: bx,
        y: by,
        baseX: bx,
        baseY: by,
        phaseX: rng() * Math.PI * 2,
        phaseY: rng() * Math.PI * 2,
        glowPhase: rng() * Math.PI * 2,
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

    // Fireflies organic Brownian trigonometric drift
    for (const f of this.fireflies) {
      f.phaseX = (f.phaseX + clampedDt * 0.8) % (Math.PI * 2);
      f.phaseY = (f.phaseY + clampedDt * 0.6) % (Math.PI * 2);
      f.glowPhase = (f.glowPhase + clampedDt * 2.1) % (Math.PI * 2);

      f.x = f.baseX + Math.sin(f.phaseX) * 45 + Math.cos(f.phaseY * 0.5) * 20;
      f.y = f.baseY + Math.cos(f.phaseY) * 35 + Math.sin(f.phaseX * 0.5) * 15;
    }
  }

  render(ctx: CanvasRenderingContext2D): void {
    ctx.save();
    ctx.translate(this.offsetX, this.offsetY);
    ctx.scale(this.scale, this.scale);

    // Day/Night background interpolation
    const dayFactor = 0.5 - 0.5 * Math.cos(this.progress * Math.PI * 2);
    const bgR = Math.round(lerp(16, 246, dayFactor));
    const bgG = Math.round(lerp(18, 242, dayFactor));
    const bgB = Math.round(lerp(28, 232, dayFactor));
    ctx.fillStyle = `rgb(${bgR}, ${bgG}, ${bgB})`;
    ctx.fillRect(0, 0, 1920, 1080);

    // Sumi ink color
    const inkR = Math.round(lerp(238, 42, dayFactor));
    const inkG = Math.round(lerp(233, 41, dayFactor));
    const inkB = Math.round(lerp(224, 39, dayFactor));
    const inkColor = `rgb(${inkR}, ${inkG}, ${inkB})`;
    ctx.strokeStyle = inkColor;
    ctx.fillStyle = inkColor;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';

    // Night stars breathing via smooth sinusoidal opacity
    const starVisibility = Math.max(0, 1 - dayFactor * 2.0);
    if (starVisibility > 0.05) {
      for (const s of this.stars) {
        const twinkle = (Math.sin(this.time * s.speed + s.phase) * 0.5 + 0.5) * starVisibility;
        ctx.fillStyle = `rgba(${inkR}, ${inkG}, ${inkB}, ${twinkle * 0.85})`;
        ctx.beginPath();
        ctx.arc(s.x, s.y, s.size, 0, Math.PI * 2);
        ctx.fill();
      }
      ctx.fillStyle = inkColor;
    }

    // Rolling Grassy Hills in center safe zone
    ctx.lineWidth = 2.4;
    ctx.beginPath();
    ctx.moveTo(0, 780);
    ctx.bezierCurveTo(420, 720, 740, 810, 1140, 740);
    ctx.bezierCurveTo(1450, 690, 1720, 770, 1920, 720);
    ctx.stroke();

    // Foreground knoll where the pine tree stands
    ctx.lineWidth = 3.2;
    ctx.beginPath();
    ctx.moveTo(240, 880);
    ctx.bezierCurveTo(620, 760, 1080, 780, 1560, 910);
    ctx.stroke();

    // Gentle grass blades along knoll ridge
    ctx.lineWidth = 1.2;
    for (let g = 0; g < 45; g++) {
      const gx = 620 + g * 14;
      const gy = 770 + Math.sin(g * 0.3) * 15;
      const gSway = Math.sin(this.time * 1.2 + g * 0.4) * 5;
      ctx.beginPath();
      ctx.moveTo(gx, gy);
      ctx.lineTo(gx + gSway, gy - 14);
      ctx.stroke();
    }

    // Ancient Lone Pine Silhouette (Focal Subject: x: 920, y: 770, T ~ 3.8s sway)
    const pineSway = Math.sin(this.time * (Math.PI * 2 / 3.8)) * 10 +
                    this.pointerInfluence * (this.pointerX > 920 ? 6 : -6);

    ctx.save();
    ctx.translate(920, 770);

    // Trunk
    ctx.lineWidth = 9.0;
    ctx.beginPath();
    ctx.moveTo(0, 0);
    ctx.quadraticCurveTo(-15 + pineSway * 0.3, -130, -5 + pineSway * 0.7, -250);
    ctx.quadraticCurveTo(5 + pineSway * 0.85, -340, pineSway, -420);
    ctx.stroke();

    // Trunk wood texture hatching
    ctx.lineWidth = 1.4;
    for (let t = -30; t > -400; t -= 35) {
      ctx.beginPath();
      ctx.moveTo(-6 + (pineSway / 420) * -t, t);
      ctx.lineTo(6 + (pineSway / 420) * -t, t + 4);
      ctx.stroke();
    }

    // Pine branches & needle clusters (Layered Japanese pine / Matsu style)
    const branches = [
      { y: -220, len: 140, dir: -1, angle: -0.2 },
      { y: -260, len: 170, dir: 1, angle: 0.15 },
      { y: -310, len: 130, dir: -1, angle: -0.1 },
      { y: -350, len: 150, dir: 1, angle: 0.2 },
      { y: -390, len: 90, dir: -1, angle: -0.05 },
      { y: -420, len: 70, dir: 1, angle: 0.1 },
    ];

    for (const b of branches) {
      const bTipX = b.dir * b.len + pineSway * ((-b.y) / 420);
      const bTipY = b.y + Math.sin(this.time * 1.5 + b.y) * 4;

      ctx.lineWidth = 3.6;
      ctx.beginPath();
      ctx.moveTo(pineSway * ((-b.y) / 420), b.y);
      ctx.quadraticCurveTo(bTipX * 0.6, b.y - 15, bTipX, bTipY);
      ctx.stroke();

      // Cloud-like pine needle cluster
      ctx.lineWidth = 1.8;
      ctx.beginPath();
      ctx.ellipse(bTipX, bTipY, 45, 14, b.angle, 0, Math.PI * 2);
      ctx.stroke();

      // Delicate needle radiating strokes
      ctx.lineWidth = 1.0;
      for (let n = -30; n <= 30; n += 10) {
        ctx.beginPath();
        ctx.moveTo(bTipX + n, bTipY);
        ctx.lineTo(bTipX + n * 1.2, bTipY - 12);
        ctx.stroke();
      }
    }

    ctx.restore();

    // Floating Fireflies (Warm golden ember glow at night)
    const fireflyGlowFactor = Math.max(0, 1 - dayFactor * 1.6);
    if (fireflyGlowFactor > 0.05) {
      for (const f of this.fireflies) {
        const glowAlpha = (Math.sin(f.glowPhase) * 0.5 + 0.5) * fireflyGlowFactor;

        // Radial golden haze
        const fGrad = ctx.createRadialGradient(f.x, f.y, 1, f.x, f.y, 22);
        fGrad.addColorStop(0, `rgba(242, 196, 109, ${0.9 * glowAlpha})`);
        fGrad.addColorStop(0.4, `rgba(242, 196, 109, ${0.35 * glowAlpha})`);
        fGrad.addColorStop(1, 'rgba(242, 196, 109, 0)');
        ctx.fillStyle = fGrad;
        ctx.beginPath();
        ctx.arc(f.x, f.y, 22, 0, Math.PI * 2);
        ctx.fill();

        // Core bright ember
        ctx.fillStyle = `rgba(255, 245, 210, ${glowAlpha})`;
        ctx.beginPath();
        ctx.arc(f.x, f.y, 2.0, 0, Math.PI * 2);
        ctx.fill();
      }
      ctx.fillStyle = inkColor;
    }

    ctx.restore();
  }

  destroy(): void {
    this.stars = [];
    this.fireflies = [];
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

const scene: TimeDriftSceneModule = new StarryHillScene();
export default scene;
