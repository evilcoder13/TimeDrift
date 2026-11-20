import path from "node:path";
import fs from "node:fs/promises";
import { ApiError } from "../errors";

export interface MusicWorkerGenerateRequest {
  prompt: string;
  seconds: 30 | 45 | 60;
  out_path: string;
}

export interface MusicWorkerGenerateResponse {
  out_path: string;
  duration_sec: number;
  integrated_lufs: number;
  true_peak_dbtp: number;
  sample_rate: number;
  channels: number;
}

export interface MusicWorkerHealthResponse {
  status: string;
  model_loaded: boolean;
  device: string;
  version: string;
}

const DEFAULT_WORKER_URL = process.env.MUSIC_WORKER_URL || "http://127.0.0.1:8100";
const DEFAULT_TIMEOUT_MS = Number(process.env.MUSIC_WORKER_TIMEOUT_MS) || 120000;

export class MusicClient {
  private baseUrl: string;
  private timeoutMs: number;

  constructor(baseUrl: string = DEFAULT_WORKER_URL, timeoutMs: number = DEFAULT_TIMEOUT_MS) {
    this.baseUrl = baseUrl.replace(/\/$/, "");
    this.timeoutMs = timeoutMs;
  }

  /**
   * Health check on FastAPI MusicGen worker (:8100/health)
   */
  async checkHealth(): Promise<MusicWorkerHealthResponse> {
    try {
      const controller = new AbortController();
      const id = setTimeout(() => controller.abort(), 5000);
      const res = await fetch(`${this.baseUrl}/health`, {
        signal: controller.signal,
      });
      clearTimeout(id);

      if (!res.ok) {
        throw new Error(`Worker returned status ${res.status}`);
      }
      return (await res.json()) as MusicWorkerHealthResponse;
    } catch (err: any) {
      throw new ApiError(503, "WORKER_UNAVAILABLE", `Music worker is unreachable at ${this.baseUrl}: ${err.message}`);
    }
  }

  /**
   * Trigger audio generation on MusicGen worker
   */
  async generateAudio(params: {
    musicId: string;
    prompt: string;
    seconds: 30 | 45 | 60;
    outPath?: string;
  }): Promise<MusicWorkerGenerateResponse> {
    const outPath =
      params.outPath ||
      path.resolve(process.cwd(), "storage/audio", `${params.musicId}.ogg`);

    // Ensure output directory exists
    await fs.mkdir(path.dirname(outPath), { recursive: true });

    const payload: MusicWorkerGenerateRequest = {
      prompt: params.prompt,
      seconds: params.seconds,
      out_path: outPath,
    };

    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), this.timeoutMs);

    try {
      const res = await fetch(`${this.baseUrl}/generate`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
        signal: controller.signal,
      });

      if (!res.ok) {
        let errorDetail = "Music generation failed";
        try {
          const data = await res.json();
          if (data.detail) errorDetail = data.detail;
        } catch {
          errorDetail = await res.text();
        }
        throw new ApiError(
          res.status >= 500 ? 502 : 400,
          "GENERATION_FAILED",
          `MusicGen worker failed: ${errorDetail}`
        );
      }

      const result = (await res.json()) as MusicWorkerGenerateResponse;

      // If music worker runs on a remote VPS (no shared storage), download the generated .ogg
      const existsLocally = await fs
        .access(outPath)
        .then(() => true)
        .catch(() => false);

      if (!existsLocally) {
        const filename = path.basename(outPath);
        const dlRes = await fetch(`${this.baseUrl}/download/${encodeURIComponent(filename)}`, {
          signal: controller.signal,
        });
        if (!dlRes.ok) {
          throw new ApiError(
            502,
            "GENERATION_FAILED",
            `Failed to download generated audio from remote worker (${dlRes.status})`
          );
        }
        const buf = Buffer.from(await dlRes.arrayBuffer());
        await fs.writeFile(outPath, buf);
      }

      return result;
    } catch (err: any) {
      if (err instanceof ApiError) throw err;
      if (err.name === "AbortError") {
        throw new ApiError(504, "TIMEOUT", `Music generation timed out after ${this.timeoutMs}ms`);
      }
      throw new ApiError(503, "WORKER_UNAVAILABLE", `Failed to communicate with music worker: ${err.message}`);
    } finally {
      clearTimeout(timer);
    }
  }
}

export const musicClient = new MusicClient();
