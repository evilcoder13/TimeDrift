/**
 * @file vendor/line-art-animation/lib/motion.ts
 * Natural physics, organic easing curves, damped oscillators, and loops.
 * Vendored from JDhruv14/line-art-animation (MIT).
 */

import type { SceneOpts, SceneHandle } from '../../../src/types/scene';

/**
 * 5th-order minimum-jerk polynomial for smooth biological transitions.
 * 10t^3 - 15t^4 + 6t^5 for t in [0, 1].
 */
export function minJerk(t: number): number {
  const ct = Math.max(0, Math.min(1, t));
  return ct * ct * ct * (10 + ct * (-15 + 6 * ct));
}

/**
 * Harmonic spring step simulation.
 * Returns [nextValue, nextVelocity].
 */
export function spring(
  val: number,
  target: number,
  vel: number,
  config: { stiffness?: number; damping?: number; dt?: number } = {}
): [number, number] {
  const stiffness = config.stiffness ?? 120;
  const damping = config.damping ?? 14;
  const dt = config.dt ?? 0.016;

  const force = -stiffness * (val - target) - damping * vel;
  const nVel = vel + force * dt;
  const nVal = val + nVel * dt;
  return [nVal, nVel];
}

/**
 * Simple damped pendulum calculation.
 * Returns [nextAngle, nextAngularVel].
 */
export function pendulum(
  theta: number,
  omega: number,
  dt: number,
  length = 1.0,
  gravity = 9.8,
  damping = 0.05
): [number, number] {
  const alpha = -(gravity / length) * Math.sin(theta) - damping * omega;
  const nextOmega = omega + alpha * dt;
  const nextTheta = theta + nextOmega * dt;
  return [nextTheta, nextOmega];
}

/**
 * Deterministic Mulberry32 32-bit PRNG generator.
 */
export function mulberry32(seed: number): () => number {
  let s = (seed >>> 0) || 1;
  return () => {
    s = (s + 0x6d2b79f5) >>> 0;
    let t = Math.imul(s ^ (s >>> 15), 1 | s);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/**
 * Linear interpolation helper.
 */
export function lerp(a: number, b: number, t: number): number {
  return a + (b - a) * t;
}

/**
 * Animation loop runner coordinating SceneHandle lifecycle.
 */
export function run(
  opts: SceneOpts,
  onFrame: (dt: number, tau: number) => void
): SceneHandle {
  let paused = false;
  let speed = opts.reducedMotion ? 0.25 : 1.0;
  let tau = opts.startTau;
  let lastTime = performance.now();
  let rafId = 0;

  const loop = (now: number) => {
    const rawDt = (now - lastTime) / 1000;
    lastTime = now;
    const dt = Math.min(0.1, Math.max(0.001, rawDt)) * speed;

    if (!paused) {
      tau = (tau + dt / opts.dayLengthSec) % 1.0;
      onFrame(dt, tau);
    }

    rafId = requestAnimationFrame(loop);
  };

  rafId = requestAnimationFrame(loop);

  return {
    pause: () => {
      paused = true;
    },
    resume: () => {
      paused = false;
      lastTime = performance.now();
    },
    setSpeed: (mult: number) => {
      speed = Math.max(0.25, Math.min(1.0, mult));
    },
    destroy: () => {
      cancelAnimationFrame(rafId);
    },
  };
}
