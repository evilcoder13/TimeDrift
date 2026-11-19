import { EventEmitter } from "node:events";
import path from "node:path";
import { prisma } from "../db";
import { musicClient } from "../services/music-client";
import { sceneValidator } from "../services/scene-validator";

export interface JobProgressEvent {
  jobId: string;
  kind: "music" | "scene";
  targetId: string;
  status: "QUEUED" | "RUNNING" | "VALIDATING" | "READY" | "FAILED";
  log?: string;
  attempts?: number;
}

export class JobRunner extends EventEmitter {
  private isProcessingMusic = false;
  private isProcessingScene = false;
  private pollInterval: NodeJS.Timeout | null = null;
  private running = false;

  constructor() {
    super();
  }

  /**
   * Start the background job runner daemon
   */
  start(pollMs = 2000): void {
    if (this.running) return;
    this.running = true;

    // Run crash recovery on startup
    this.recoverCrashedJobs().catch((err) => {
      console.error("[JobRunner] Error during crash recovery:", err);
    });

    // Schedule polling
    this.pollInterval = setInterval(() => {
      this.tick();
    }, pollMs);

    // Initial immediate tick
    this.tick();
  }

  /**
   * Stop runner polling
   */
  stop(): void {
    if (this.pollInterval) {
      clearInterval(this.pollInterval);
      this.pollInterval = null;
    }
    this.running = false;
  }

  /**
   * Crash recovery & orphan detection:
   * Any GenJob in RUNNING or VALIDATING status without active runner process
   * is flagged. If attempts >= 3, set to FAILED; otherwise resets to QUEUED.
   */
  async recoverCrashedJobs(): Promise<void> {
    const tenMinutesAgo = new Date(Date.now() - 10 * 60 * 1000);

    const staleJobs = await prisma.genJob.findMany({
      where: {
        status: { in: ["RUNNING", "VALIDATING"] },
        updatedAt: { lt: tenMinutesAgo },
      },
    });

    for (const job of staleJobs) {
      if (job.attempts >= 3) {
        await prisma.genJob.update({
          where: { id: job.id },
          data: {
            status: "FAILED",
            log: "Job aborted: runner restarted or timed out after 3 attempts.",
          },
        });
        this.emitStatus({
          jobId: job.id,
          kind: job.kind as any,
          targetId: job.targetId,
          status: "FAILED",
          log: "Job aborted: runner restarted or timed out.",
        });
      } else {
        // Reset to QUEUED
        await prisma.genJob.update({
          where: { id: job.id },
          data: {
            status: "QUEUED",
            log: `Recovered orphaned job from previous run (attempt ${job.attempts}).`,
          },
        });
        this.emitStatus({
          jobId: job.id,
          kind: job.kind as any,
          targetId: job.targetId,
          status: "QUEUED",
        });
      }
    }
  }

  /**
   * Main scheduling tick: processes 1 music job and 1 scene job concurrently
   */
  async tick(): Promise<void> {
    if (!this.isProcessingMusic) {
      this.processNextJob("music").catch((err) => {
        console.error("[JobRunner] Error processing music queue:", err);
      });
    }
    if (!this.isProcessingScene) {
      this.processNextJob("scene").catch((err) => {
        console.error("[JobRunner] Error processing scene queue:", err);
      });
    }
  }

  /**
   * Atomic dequeue and execution per kind
   */
  private async processNextJob(kind: "music" | "scene"): Promise<void> {
    if (kind === "music") {
      this.isProcessingMusic = true;
    } else {
      this.isProcessingScene = true;
    }

    try {
      // Find oldest QUEUED job
      const nextJob = await prisma.genJob.findFirst({
        where: { kind, status: "QUEUED" },
        orderBy: { createdAt: "asc" },
      });

      if (!nextJob) return;

      // Atomic transition to RUNNING
      const job = await prisma.genJob.update({
        where: { id: nextJob.id, status: "QUEUED" },
        data: {
          status: "RUNNING",
          attempts: { increment: 1 },
          log: "Processing started...",
        },
      });

      this.emitStatus({
        jobId: job.id,
        kind,
        targetId: job.targetId,
        status: "RUNNING",
        attempts: job.attempts,
      });

      if (kind === "music") {
        await this.executeMusicJob(job);
      } else {
        await this.executeSceneJob(job);
      }
    } catch (err: any) {
      // Ignore if another tick took it
    } finally {
      if (kind === "music") {
        this.isProcessingMusic = false;
      } else {
        this.isProcessingScene = false;
      }
    }
  }

  /**
   * Execute Music Generation Job via MusicClient
   */
  private async executeMusicJob(job: { id: string; targetId: string; attempts: number }): Promise<void> {
    try {
      const music = await prisma.music.findUnique({
        where: { id: job.targetId },
      });

      if (!music) {
        throw new Error(`Target Music ID ${job.targetId} not found.`);
      }

      await prisma.music.update({
        where: { id: music.id },
        data: { status: "RUNNING" },
      });

      const outPath = path.resolve(process.cwd(), "storage/audio", `${music.id}.ogg`);
      const result = await musicClient.generateAudio({
        musicId: music.id,
        prompt: music.prompt,
        seconds: music.seconds as 30 | 45 | 60,
        outPath,
      });

      // Mark Music as READY
      await prisma.music.update({
        where: { id: music.id },
        data: {
          status: "READY",
          file: `storage/audio/${music.id}.ogg`,
          durationSec: result.duration_sec,
        },
      });

      // Mark Job as READY
      await prisma.genJob.update({
        where: { id: job.id },
        data: {
          status: "READY",
          log: `Successfully generated ${result.duration_sec}s audio. LUFS: ${result.integrated_lufs}, dBTP: ${result.true_peak_dbtp}`,
        },
      });

      this.emitStatus({
        jobId: job.id,
        kind: "music",
        targetId: job.targetId,
        status: "READY",
      });
    } catch (err: any) {
      const errorMsg = err.message || "Unknown error";
      await prisma.music.update({
        where: { id: job.targetId },
        data: { status: "FAILED" },
      }).catch(() => {});

      await prisma.genJob.update({
        where: { id: job.id },
        data: {
          status: "FAILED",
          log: `Music generation failed: ${errorMsg}`,
        },
      });

      this.emitStatus({
        jobId: job.id,
        kind: "music",
        targetId: job.targetId,
        status: "FAILED",
        log: errorMsg,
      });
    }
  }

  /**
   * Execute Scene Job (Validation / Regeneration)
   */
  private async executeSceneJob(job: { id: string; targetId: string; attempts: number }): Promise<void> {
    try {
      const scene = await prisma.scene.findUnique({
        where: { id: job.targetId },
      });

      if (!scene) {
        throw new Error(`Target Scene ID ${job.targetId} not found.`);
      }

      // Transition to VALIDATING
      await prisma.genJob.update({
        where: { id: job.id },
        data: { status: "VALIDATING", log: "Executing 4-stage Scene Validator..." },
      });
      await prisma.scene.update({
        where: { id: scene.id },
        data: { status: "VALIDATING" },
      });

      this.emitStatus({
        jobId: job.id,
        kind: "scene",
        targetId: job.targetId,
        status: "VALIDATING",
      });

      // Check if sourcePath exists or scene prompt exists
      let sourceCode = "";
      if (scene.sourcePath) {
        try {
          const fs = await import("node:fs/promises");
          sourceCode = await fs.readFile(path.resolve(process.cwd(), scene.sourcePath), "utf-8");
        } catch {
          // If file not on disk, prompt might have source
          sourceCode = scene.prompt;
        }
      } else {
        sourceCode = scene.prompt;
      }

      const bundlePath = path.resolve(process.cwd(), "storage/bundles", `${scene.id}.js`);
      const sourcePath = path.resolve(process.cwd(), "storage/scenes", `${scene.id}.ts`);

      const valResult = await sceneValidator.validateScene(sourceCode, {
        sceneId: scene.id,
        saveBundlePath: bundlePath,
        saveSourcePath: sourcePath,
      });

      if (!valResult.valid) {
        throw new Error(`Stage ${valResult.stage} validation failed: ${valResult.error}`);
      }

      // Scene validation passed -> READY
      await prisma.scene.update({
        where: { id: scene.id },
        data: {
          status: "READY",
          bundlePath: `storage/bundles/${scene.id}.js`,
          sourcePath: `storage/scenes/${scene.id}.ts`,
        },
      });

      await prisma.genJob.update({
        where: { id: job.id },
        data: {
          status: "READY",
          log: `Validation passed (Nodes: ${valResult.domNodeCount}, Diff: ${valResult.pixelDiff} bytes). Bundle created.`,
        },
      });

      this.emitStatus({
        jobId: job.id,
        kind: "scene",
        targetId: job.targetId,
        status: "READY",
      });
    } catch (err: any) {
      const errorMsg = err.message || "Unknown error";
      await prisma.scene.update({
        where: { id: job.targetId },
        data: { status: "FAILED" },
      }).catch(() => {});

      await prisma.genJob.update({
        where: { id: job.id },
        data: {
          status: "FAILED",
          log: `Scene job failed: ${errorMsg}`,
        },
      });

      this.emitStatus({
        jobId: job.id,
        kind: "scene",
        targetId: job.targetId,
        status: "FAILED",
        log: errorMsg,
      });
    }
  }

  private emitStatus(evt: JobProgressEvent): void {
    this.emit("progress", evt);
    this.emit(`job:${evt.jobId}`, evt);
  }
}

// Global runner singleton instance
const globalForRunner = globalThis as unknown as { jobRunner?: JobRunner };
export const jobRunner = globalForRunner.jobRunner ?? new JobRunner();
if (process.env.NODE_ENV !== "production") {
  globalForRunner.jobRunner = jobRunner;
}
