import { NextResponse } from "next/server";
import { prisma } from "@/server/db";
import { requireAdmin } from "@/server/guards";
import { z } from "zod";
import fs from "fs";
import path from "path";

const regenSceneSchema = z.object({
  name: z.string().min(1).max(100).optional(),
  description: z.string().min(5).max(300).optional(),
  prompt: z.string().min(10).max(500).optional(),
  model: z.string().optional(),
  tagIds: z.array(z.string()).optional(),
});

export async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await requireAdmin();
    const { id } = await params;
    const body = await req.json().catch(() => ({}));
    const parsed = regenSceneSchema.safeParse(body);

    const scene = await prisma.scene.findUnique({
      where: { id },
      include: { tags: true },
    });

    if (!scene) {
      return NextResponse.json({ error: { code: "NOT_FOUND", message: "Scene not found" } }, { status: 404 });
    }

    const updateData: Record<string, unknown> = {
      status: "QUEUED",
      published: false,
    };

    if (parsed.success) {
      if (parsed.data.name) updateData.name = parsed.data.name;
      if (parsed.data.description) updateData.description = parsed.data.description;
      if (parsed.data.prompt) updateData.prompt = parsed.data.prompt;
      if (parsed.data.model) updateData.model = parsed.data.model;
      if (parsed.data.tagIds) {
        updateData.tags = {
          set: parsed.data.tagIds.map((tid) => ({ id: tid })),
        };
      }
    }

    // Clean up previous failed source and bundle files if they were invalid
    if (scene.sourcePath) {
      try {
        const fullSource = path.resolve(process.cwd(), scene.sourcePath);
        if (fs.existsSync(fullSource)) fs.unlinkSync(fullSource);
      } catch {}
      updateData.sourcePath = null;
    }
    if (scene.bundlePath) {
      try {
        const fullBundle = path.resolve(process.cwd(), scene.bundlePath);
        if (fs.existsSync(fullBundle)) fs.unlinkSync(fullBundle);
      } catch {}
      updateData.bundlePath = null;
    }

    const updated = await prisma.scene.update({
      where: { id },
      data: updateData,
      include: { tags: true },
    });

    const modelToUse = (updateData.model as string) || updated.model || process.env.LLM_MODEL || "default";

    // Create GenJob for generation
    const job = await prisma.genJob.create({
      data: {
        kind: "scene",
        targetId: id,
        status: "QUEUED",
        attempts: 0,
        model: modelToUse,
        log: `Re-queued scene generation for '${updated.name}' using model ${modelToUse}`,
      },
    });

    // Trigger runner
    const { jobRunner } = await import("@/server/jobs/runner");
    jobRunner.start();

    return NextResponse.json({ scene: updated, jobId: job.id });
  } catch (err: unknown) {
    const error = err as { statusCode?: number; code?: string; message?: string };
    return NextResponse.json(
      { error: { code: error.code || "INTERNAL_ERROR", message: error.message || "Failed to rebuild scene" } },
      { status: error.statusCode || 500 }
    );
  }
}
