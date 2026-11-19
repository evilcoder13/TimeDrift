import { NextResponse } from "next/server";
import { prisma } from "@/server/db";
import fs from "node:fs/promises";
import path from "node:path";

export const dynamic = "force-dynamic";

export async function GET() {
  const timestamp = new Date().toISOString();
  const uptimeSeconds = Math.floor(process.uptime());

  const checks: {
    database: { status: "ok" | "error"; latencyMs?: number; error?: string };
    storage: { status: "ok" | "error"; freeDiskGb?: number; error?: string };
    musicWorker: { status: "ok" | "error"; latencyMs?: number; isDummy?: boolean; error?: string };
    llm: { status: "ok" | "error"; latencyMs?: number; model?: string; error?: string };
  } = {
    database: { status: "error" },
    storage: { status: "error" },
    musicWorker: { status: "error" },
    llm: { status: "error" },
  };

  let isHealthy = true;

  // 1. Database check (SELECT 1 via prisma.$queryRaw)
  try {
    const dbStart = Date.now();
    await prisma.$queryRaw`SELECT 1;`;
    const latencyMs = Date.now() - dbStart;
    checks.database = { status: "ok", latencyMs };
  } catch (err: unknown) {
    isHealthy = false;
    checks.database = {
      status: "error",
      error: err instanceof Error ? err.message : "Database connection failed",
    };
  }

  // 2. Storage check (read/write check in storage directory)
  try {
    const storageDir = process.env.STORAGE_DIR || "./storage";
    const resolvedDir = path.resolve(process.cwd(), storageDir);
    await fs.mkdir(resolvedDir, { recursive: true });

    // Test writability with temporary probe file
    const testFile = path.join(resolvedDir, `.probe-${Date.now()}`);
    await fs.writeFile(testFile, "ok");
    await fs.unlink(testFile);

    // Approximate disk space or stat verification
    const stat = await fs.stat(resolvedDir);
    checks.storage = {
      status: "ok",
      // If statfs is supported in modern Node.js, we can inspect free space, else fallback
      freeDiskGb: typeof fs.statfs === "function" ? Math.round(((await fs.statfs(resolvedDir)).bavail * (await fs.statfs(resolvedDir)).bsize) / (1024 * 1024 * 1024) * 10) / 10 : 10.0,
    };
  } catch (err: unknown) {
    isHealthy = false;
    checks.storage = {
      status: "error",
      error: err instanceof Error ? err.message : "Storage access failed",
    };
  }

  // 3. Music Worker Reachability (GET /health)
  const workerUrl = process.env.MUSIC_WORKER_URL || "http://127.0.0.1:8100";
  try {
    const workerStart = Date.now();
    const ctrl = new AbortController();
    const tid = setTimeout(() => ctrl.abort(), 2000);
    const res = await fetch(`${workerUrl}/health`, { signal: ctrl.signal });
    clearTimeout(tid);
    const latencyMs = Date.now() - workerStart;
    if (res.ok) {
      const data = await res.json();
      checks.musicWorker = {
        status: "ok",
        latencyMs,
        isDummy: data.is_dummy ?? false,
      };
    } else {
      checks.musicWorker = {
        status: "error",
        latencyMs,
        error: `Worker returned status ${res.status}`,
      };
    }
  } catch (err: unknown) {
    checks.musicWorker = {
      status: "error",
      error: err instanceof Error ? err.message : "Worker connection failed",
    };
  }

  // 4. LLM Server Reachability (GET /models)
  const llmUrl = process.env.LLM_BASE_URL || "http://10.1.123.123:8000/v1";
  const defaultModel = process.env.LLM_MODEL || "Qwen3.5-4B-3D-Coder";
  try {
    const llmStart = Date.now();
    const ctrl = new AbortController();
    const tid = setTimeout(() => ctrl.abort(), 2000);
    const res = await fetch(`${llmUrl}/models`, { signal: ctrl.signal });
    clearTimeout(tid);
    const latencyMs = Date.now() - llmStart;
    if (res.ok) {
      checks.llm = {
        status: "ok",
        latencyMs,
        model: defaultModel,
      };
    } else {
      checks.llm = {
        status: "error",
        latencyMs,
        error: `LLM returned status ${res.status}`,
      };
    }
  } catch (err: unknown) {
    checks.llm = {
      status: "error",
      error: err instanceof Error ? err.message : "LLM reachability failed",
    };
  }

  // Degradation logic:
  // If DB or Storage fails -> 503 SERVICE UNAVAILABLE (critical)
  // If Worker or LLM is down -> 200 with status: "degraded" (or "healthy" if everything ok)
  const hasCriticalFailure = checks.database.status !== "ok" || checks.storage.status !== "ok";
  const hasWorkerOrLlmDown = checks.musicWorker.status !== "ok" || checks.llm.status !== "ok";

  const overallStatus = hasCriticalFailure ? "unhealthy" : (hasWorkerOrLlmDown ? "degraded" : "healthy");

  const responseBody = {
    status: overallStatus,
    timestamp,
    version: "1.0.0",
    uptimeSeconds,
    checks,
  };

  return NextResponse.json(
    responseBody,
    { status: hasCriticalFailure ? 503 : 200 }
  );
}
