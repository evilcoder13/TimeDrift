/**
 * @file seed/scenes/s4-window-desk.ts
 * @scene S4: Window Desk at Twilight / Bàn bên cửa sổ
 * @tags focus, cozy, warm, calm
 * Compliant with TimeDriftSceneModule contract (P1_URD §2.5, SCENE_GUIDE §2, ADR-005).
 */

import type { TimeDriftSceneModule, SceneOpts, SceneHandle, SceneMetadata } from '../../src/types/scene';
import { mulberry32, minJerk, lerp } from '../../vendor/line-art-animation/lib/motion';

export const metadata: SceneMetadata = {
  id: 's4',
  nameEn: 'Window Desk at Twilight',
  nameVi: 'Bàn bên cửa sổ',
  descriptionEn: 'Interior windowsill overlooking twilight; hot tea steam rising smoothly, resting cat with subtle breathing cycle and tail flick.',
  descriptionVi: 'Góc bàn bên khung cửa sổ nhìn ra hoàng hôn; làn khói trà nghi ngút bốc lên, chú mèo nằm lười thở đều nhè nhẹ và khẽ vẫy đuôi.',
  tags: ['focus', 'cozy', 'warm', 'calm'],
  baseReference: 'new hand-drawn composition',
  maxFigures: 1,
  viewBox: '0 0 1920 1080',
  centerSafeZone: { minX: 640, maxX: 1280, minY: 200, maxY: 900 },
};

interface SteamPuff {
  x: number;
  y: number;
  baseX: number;
  speed: number;
  phase: number;
  scale: number;
  alpha: number;
}

class WindowDeskScene implements TimeDriftSceneModule {
  public id = metadata.id;
  public title = metadata.nameEn;
  public metadata = metadata;

  private scale = 1;
  private offsetX = 0;
  private offsetY = 0;

  private time = 0;
  private progress = 0.75; // Twilight / dusk
  private pointerX = 960;
  private pointerInfluence = 0;

  // Steam particles with 5th-order minimum-jerk fluid motion
  private steamPuffs: SteamPuff[] = [];

  // Resting cat breathing & tail flick
  private cat = {
    x: 1040,
    y: 770,
    breathPhase: 0,
    tailPhase: 0,
  };

  init(canvas: HTMLCanvasElement, _ctx: CanvasRenderingContext2D): void {
    const rng = mulberry32(404);

    this.steamPuffs = [];
    for (let i = 0; i < 24; i++) {
      this.steamPuffs.push({
        x: 820,
        y: 710 - i * 14,
        baseX: 820,
        speed: 24 + rng() * 16,
        phase: rng() * Math.PI * 2,
        scale: 1 + rng() * 1.5,
        alpha: 0.2 + rng() * 0.4,
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
    this.pointerInfluence = Math.max(0, this.pointerInfluence - clampedDt * 0.35);

    // Resting cat breathing cycle (T ~ 4.5s) and slow tail flick
    this.cat.breathPhase = (this.cat.breathPhase + clampedDt * (Math.PI * 2 / 4.5)) % (Math.PI * 2);
    this.cat.tailPhase = (this.cat.tailPhase + clampedDt * (Math.PI * 2 / 3.8)) % (Math.PI * 2);

    // Rising tea steam using 5th-order minimum jerk curve
    for (const s of this.steamPuffs) {
      s.y -= s.speed * clampedDt;
      const progressT = (710 - s.y) / 260; // 0 to 1
      const jerk = minJerk(Math.max(0, Math.min(1, progressT)));
      const lateralSway = Math.sin(this.time * 1.4 + s.phase) * (18 * jerk);
      s.x = s.baseX + lateralSway;

      if (s.y < 450) {
        s.y = 710;
        s.x = s.baseX;
      }
    }
  }

  render(ctx: CanvasRenderingContext2D): void {
    ctx.save();
    ctx.translate(this.offsetX, this.offsetY);
    ctx.scale(this.scale, this.scale);

    // Background sky outside window
    const dayFactor = 0.5 - 0.5 * Math.cos(this.progress * Math.PI * 2);
    const bgR = Math.round(lerp(24, 248, dayFactor));
    const bgG = Math.round(lerp(22, 241, dayFactor));
    const bgB = Math.round(lerp(38, 230, dayFactor));
    ctx.fillStyle = `rgb(${bgR}, ${bgG}, ${bgB})`;
    ctx.fillRect(0, 0, 1920, 1080);

    // Twilight Gradient outside window pane
    const skyGrad = ctx.createLinearGradient(960, 200, 960, 750);
    if (dayFactor > 0.4) {
      skyGrad.addColorStop(0, 'rgba(215, 230, 245, 0.4)');
      skyGrad.addColorStop(1, 'rgba(253, 240, 215, 0.6)');
    } else {
      skyGrad.addColorStop(0, 'rgba(18, 20, 36, 0.95)');
      skyGrad.addColorStop(0.7, 'rgba(48, 38, 62, 0.85)');
      skyGrad.addColorStop(1, 'rgba(194, 139, 56, 0.4)'); // Amber twilight horizon
    }
    ctx.fillStyle = skyGrad;
    ctx.fillRect(520, 210, 880, 560);

    // Ink stroke colors
    const inkR = Math.round(lerp(235, 43, dayFactor));
    const inkG = Math.round(lerp(231, 42, dayFactor));
    const inkB = Math.round(lerp(222, 40, dayFactor));
    const inkColor = `rgb(${inkR}, ${inkG}, ${inkB})`;
    ctx.strokeStyle = inkColor;
    ctx.fillStyle = inkColor;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';

    // Distant tree silhouette and stars/crescent moon outside
    if (dayFactor < 0.45) {
      // Crescent Moon
      ctx.lineWidth = 1.6;
      ctx.beginPath();
      ctx.arc(1180, 320, 26, 0.5, Math.PI * 1.5, false);
      ctx.quadraticCurveTo(1192, 320, 1180, 346);
      ctx.stroke();

      // Distant tree silhouette
      ctx.lineWidth = 1.4;
      ctx.beginPath();
      ctx.moveTo(600, 770);
      ctx.lineTo(600, 620);
      ctx.quadraticCurveTo(640, 560, 680, 580);
      ctx.quadraticCurveTo(620, 610, 600, 640);
      ctx.stroke();
    }

    // Window Frame Structure (Centered in 1920x1080)
    ctx.lineWidth = 6.0;
    ctx.strokeRect(520, 210, 880, 560);

    // Inner mullions (cross bars)
    ctx.lineWidth = 3.5;
    ctx.beginPath();
    // Vertical center mullion
    ctx.moveTo(960, 210);
    ctx.lineTo(960, 770);
    // Horizontal mullion
    ctx.moveTo(520, 480);
    ctx.lineTo(1400, 480);
    ctx.stroke();

    // Wooden Windowsill & Desk Surface
    ctx.lineWidth = 5.0;
    ctx.beginPath();
    ctx.moveTo(440, 770);
    ctx.lineTo(1480, 770);
    ctx.stroke();

    ctx.lineWidth = 2.4;
    ctx.beginPath();
    ctx.moveTo(400, 830);
    ctx.lineTo(1520, 830);
    ctx.stroke();

    // Wood grain lines on desk
    ctx.lineWidth = 1.0;
    for (let w = 0; w < 4; w++) {
      const lineY = 788 + w * 12;
      ctx.beginPath();
      ctx.moveTo(480, lineY);
      ctx.bezierCurveTo(800, lineY + 3, 1100, lineY - 2, 1440, lineY + 1);
      ctx.stroke();
    }

    // Teacup with hot tea on desk (Focal point: x: 820, y: 770)
    ctx.lineWidth = 2.2;
    // Cup saucer
    ctx.beginPath();
    ctx.ellipse(820, 770, 38, 7, 0, 0, Math.PI * 2);
    ctx.stroke();

    // Ceramic cup body
    ctx.beginPath();
    ctx.moveTo(796, 768);
    ctx.quadraticCurveTo(792, 730, 800, 715);
    ctx.lineTo(840, 715);
    ctx.quadraticCurveTo(848, 730, 844, 768);
    ctx.closePath();
    ctx.stroke();

    // Cup rim ellipse
    ctx.beginPath();
    ctx.ellipse(820, 715, 20, 5, 0, 0, Math.PI * 2);
    ctx.stroke();

    // Cup handle
    ctx.beginPath();
    ctx.arc(846, 738, 9, -Math.PI * 0.4, Math.PI * 0.5);
    ctx.stroke();

    // Rising Steam Curves (Organic sinusoidal wisps)
    ctx.lineWidth = 1.4;
    for (const s of this.steamPuffs) {
      const hNorm = (710 - s.y) / 260; // 0..1
      const alpha = (1 - hNorm) * 0.55;
      ctx.strokeStyle = `rgba(${inkR}, ${inkG}, ${inkB}, ${alpha})`;
      ctx.beginPath();
      ctx.arc(s.x, s.y, 4 * s.scale, 0, Math.PI * 2);
      ctx.stroke();
    }
    ctx.strokeStyle = inkColor;

    // Resting Cat on Windowsill (x: 1040, y: 770)
    const c = this.cat;
    ctx.save();
    ctx.translate(c.x, c.y);

    const breathOffset = Math.sin(c.breathPhase) * 2.2;
    const tailAngle = Math.sin(c.tailPhase) * 0.18;

    // Cat body (curled sleeping oval with breathing cycle)
    ctx.lineWidth = 2.4;
    ctx.beginPath();
    ctx.ellipse(0, -18 - breathOffset * 0.5, 46, 26 + breathOffset, 0, 0, Math.PI * 2);
    ctx.stroke();

    // Cat head
    ctx.beginPath();
    ctx.arc(-36, -24, 18, 0, Math.PI * 2);
    ctx.stroke();

    // Cat ears
    ctx.beginPath();
    ctx.moveTo(-48, -36);
    ctx.lineTo(-42, -50);
    ctx.lineTo(-34, -40);
    ctx.moveTo(-32, -40);
    ctx.lineTo(-24, -50);
    ctx.lineTo(-20, -36);
    ctx.stroke();

    // Sleeping eye slits & nose
    ctx.lineWidth = 1.4;
    ctx.beginPath();
    ctx.moveTo(-44, -22);
    ctx.quadraticCurveTo(-40, -19, -36, -22);
    ctx.moveTo(-32, -22);
    ctx.quadraticCurveTo(-28, -19, -24, -22);
    ctx.stroke();

    // Cat tail flicking gently outside windowsill
    ctx.save();
    ctx.translate(42, -10);
    ctx.rotate(tailAngle);
    ctx.lineWidth = 2.4;
    ctx.beginPath();
    ctx.moveTo(0, 0);
    ctx.bezierCurveTo(24, 4, 38, -18, 48, -12);
    ctx.stroke();
    ctx.restore();

    ctx.restore();

    // Desk Lamp Amber Glow (Active during twilight/night)
    const lampGlow = Math.max(0, 1 - dayFactor * 1.4);
    if (lampGlow > 0.05) {
      // Desk lamp neck & shade
      ctx.lineWidth = 3.0;
      ctx.beginPath();
      ctx.moveTo(640, 770);
      ctx.lineTo(640, 640);
      ctx.quadraticCurveTo(650, 580, 710, 590);
      ctx.stroke();

      // Lamp shade
      ctx.beginPath();
      ctx.moveTo(690, 580);
      ctx.lineTo(740, 600);
      ctx.lineTo(715, 620);
      ctx.closePath();
      ctx.stroke();

      // Radial warm amber desk glow
      const lampGrad = ctx.createRadialGradient(720, 615, 6, 720, 650, 220);
      lampGrad.addColorStop(0, `rgba(242, 196, 109, ${0.85 * lampGlow})`);
      lampGrad.addColorStop(0.5, `rgba(242, 196, 109, ${0.28 * lampGlow})`);
      lampGrad.addColorStop(1, 'rgba(242, 196, 109, 0)');
      ctx.fillStyle = lampGrad;
      ctx.beginPath();
      ctx.arc(720, 650, 220, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = inkColor;
    }

    ctx.restore();
  }

  destroy(): void {
    this.steamPuffs = [];
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

const scene: TimeDriftSceneModule = new WindowDeskScene();
export default scene;
