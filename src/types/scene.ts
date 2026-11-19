/**
 * @file src/types/scene.ts
 * @description Canonical TypeScript interface definitions for TimeDrift Line-Art Scenes (@timedrift/scene-api).
 * Strictly adheres to P1_URD §2.5, SCENE_GUIDE §2, and ADR-005.
 */

/**
 * Configuration options supplied to mount or initialize a scene.
 */
export interface SceneOpts {
  /** Deterministic PRNG seed (Mulberry32) */
  seed: number;
  /** Duration of full day/night cycle in seconds (default: 900) */
  dayLengthSec: number;
  /** Starting phase: 0..1 (0.0 = midnight, 0.25 = dawn, 0.5 = noon, 0.75 = dusk) */
  startTau: number;
  /** Whether reduced motion is requested by user accessibility settings */
  reducedMotion: boolean;
}

/**
 * Lifecycle control handle returned by scene mounting functions.
 */
export interface SceneHandle {
  /** Pauses the internal animation loop and physics updates */
  pause(): void;
  /** Resumes the internal animation loop and physics updates */
  resume(): void;
  /** Adjusts speed multiplier (clamped to 0.25..1.0) */
  setSpeed(mult: number): void;
  /** Teardown and clean up all timers, RAF loops, DOM elements, and listeners */
  destroy(): void;
}

/**
 * Standard scene mount function for SVG hosts.
 */
export type SceneMountFn = (svg: SVGSVGElement, opts: SceneOpts) => SceneHandle;

/**
 * Canonical Metadata describing a TimeDrift Scene.
 */
export interface SceneMetadata {
  id: string;
  nameEn: string;
  nameVi: string;
  descriptionEn: string;
  descriptionVi: string;
  tags: string[];
  baseReference?: string;
  maxFigures: number;
  viewBox: string;
  centerSafeZone: {
    minX: number;
    maxX: number;
    minY: number;
    maxY: number;
  };
}

/**
 * Complete TimeDrift Scene Module contract.
 * Supports both canvas-based rendering (init/update/render) and SVG container mounting (mount).
 */
export interface TimeDriftSceneModule {
  id: string;
  title: string;
  metadata: SceneMetadata;

  /**
   * Initializes the scene on an HTML5 canvas context.
   */
  init(canvas: HTMLCanvasElement, ctx: CanvasRenderingContext2D): void;

  /**
   * Advances simulation time and day/night cycle progress.
   * @param dt Delta time in seconds (clamped to max 0.1s).
   * @param progress Day/night cycle progress: 0.0 (day/noon) to 1.0 (night/midnight).
   */
  update(dt: number, progress: number): void;

  /**
   * Renders the current frame onto the canvas.
   */
  render(ctx: CanvasRenderingContext2D): void;

  /**
   * Handles canvas or viewport resize while maintaining 1920x1080 internal resolution coordinate space.
   */
  onResize(width: number, height: number): void;

  /**
   * Optional gentle pointer interaction (e.g. slight breeze, water ripple).
   */
  onPointerMove?(x: number, y: number): void;

  /**
   * Tears down any animation loops, listeners, or state.
   */
  destroy(): void;

  /**
   * Direct SVG mount entrypoint implementing SceneMountFn contract (SCENE_GUIDE §2).
   */
  mount?(svg: SVGSVGElement, opts: SceneOpts): SceneHandle;
}
