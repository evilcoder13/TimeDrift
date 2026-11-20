import { NextResponse } from "next/server";
import { requireAdmin } from "@/server/guards";
import { prisma } from "@/server/db";

export async function GET() {
  try {
    await requireAdmin();

    const llmUrl = process.env.LLM_BASE_URL || "http://100.100.91.61:8000/v1";
    const workerUrl = process.env.MUSIC_WORKER_URL || "http://100.100.91.61:8100";

    // Test timedrift_llm reachability
    let llmReachable = false;
    let llmLatency = 0;
    try {
      const start = Date.now();
      const ctrl = new AbortController();
      const tid = setTimeout(() => ctrl.abort(), 3000);
      const res = await fetch(`${llmUrl}/models`, { signal: ctrl.signal });
      clearTimeout(tid);
      llmLatency = Date.now() - start;
      llmReachable = res.ok;
    } catch {
      llmReachable = false;
    }

    // Test Music Worker reachability
    let workerReachable = false;
    let workerLatency = 0;
    try {
      const start = Date.now();
      const ctrl = new AbortController();
      const tid = setTimeout(() => ctrl.abort(), 3000);
      const res = await fetch(`${workerUrl}/health`, { signal: ctrl.signal });
      clearTimeout(tid);
      workerLatency = Date.now() - start;
      workerReachable = res.ok;
    } catch {
      workerReachable = false;
    }

    // Active jobs count
    const [runningJobs, queuedJobs] = await Promise.all([
      prisma.genJob.count({ where: { status: "RUNNING" } }),
      prisma.genJob.count({ where: { status: "QUEUED" } }),
    ]);

    return NextResponse.json({
      health: {
        llm: {
          url: llmUrl,
          reachable: llmReachable,
          latencyMs: llmLatency,
        },
        omlx: {
          url: llmUrl,
          reachable: llmReachable,
          latencyMs: llmLatency,
        },
        worker: {
          url: workerUrl,
          reachable: workerReachable,
          latencyMs: workerLatency,
        },
        queue: {
          running: runningJobs,
          queued: queuedJobs,
        },
      },
    });
  } catch (err: unknown) {
    const error = err as { statusCode?: number; code?: string; message?: string };
    return NextResponse.json(
      { error: { code: error.code || "INTERNAL_ERROR", message: error.message || "Failed to check health" } },
      { status: error.statusCode || 500 }
    );
  }
}
