import { describe, it, expect, vi, beforeEach } from "vitest";
import { JobRunner } from "../../src/server/jobs/runner";
import { prisma } from "../../src/server/db";

describe("BE-4: JobRunner", () => {
  let runner: JobRunner;

  beforeEach(() => {
    runner = new JobRunner();
  });

  it("initializes with event emitter capabilities", () => {
    let emitted = false;
    runner.on("progress", () => {
      emitted = true;
    });

    runner.emit("progress", {
      jobId: "job-1",
      kind: "music",
      targetId: "m-1",
      status: "RUNNING",
    });

    expect(emitted).toBe(true);
  });

  it("recovers orphaned jobs exceeding timeout threshold", async () => {
    const mockFindMany = vi.spyOn(prisma.genJob, "findMany").mockResolvedValue([
      {
        id: "stale-1",
        kind: "music",
        targetId: "m-1",
        status: "RUNNING",
        attempts: 1,
        model: "MusicGen-small",
        log: "Working...",
        createdAt: new Date(),
        updatedAt: new Date(Date.now() - 15 * 60 * 1000),
      },
      {
        id: "stale-2",
        kind: "scene",
        targetId: "s-1",
        status: "VALIDATING",
        attempts: 3,
        model: "Qwen3.5-4B-3D-Coder",
        log: "Validating...",
        createdAt: new Date(),
        updatedAt: new Date(Date.now() - 15 * 60 * 1000),
      },
    ] as any);

    const mockUpdate = vi.spyOn(prisma.genJob, "update").mockResolvedValue({} as any);

    await runner.recoverCrashedJobs();

    expect(mockFindMany).toHaveBeenCalled();
    // stale-1 should be reset to QUEUED (attempts < 3)
    expect(mockUpdate).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { id: "stale-1" },
        data: expect.objectContaining({ status: "QUEUED" }),
      })
    );
    // stale-2 should be marked FAILED (attempts >= 3)
    expect(mockUpdate).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { id: "stale-2" },
        data: expect.objectContaining({ status: "FAILED" }),
      })
    );

    mockFindMany.mockRestore();
    mockUpdate.mockRestore();
  });
});
