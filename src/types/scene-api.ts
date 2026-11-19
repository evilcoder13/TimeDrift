export interface SceneOpts {
  seed: number;         // Deterministic PRNG seed (Mulberry32)
  dayLengthSec: number; // Duration of full day/night cycle in seconds (default 900)
  startTau: number;     // Starting point: 0..1 (0.0 = midnight, 0.25 = dawn, 0.5 = noon, 0.75 = dusk)
  reducedMotion: boolean;
}

export interface SceneHandle {
  pause(): void;
  resume(): void;
  setSpeed(mult: number): void; // Range 0.25..1.0
  destroy(): void;
}

export type SceneMountFn = (svg: SVGSVGElement, opts: SceneOpts) => SceneHandle;

// Bidirectional postMessage protocol types
export type HostToParentMessage =
  | { type: 'HOST_READY'; timestamp: number }
  | { type: 'SCENE_MOUNTED'; sceneId?: string }
  | { type: 'SCENE_ERROR'; message: string; stack?: string };

export type ParentToHostMessage =
  | { type: 'LOAD_SCENE'; bundleUrl: string; opts: SceneOpts; sceneId?: string }
  | { type: 'SET_PLAY_STATE'; paused: boolean }
  | { type: 'SET_SPEED'; speed: number }
  | { type: 'UPDATE_TAU'; tau: number }
  | { type: 'DESTROY' };
