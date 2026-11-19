import { NextResponse } from "next/server";
import { prisma } from "@/server/db";
import { requireAdmin } from "@/server/guards";
import { z } from "zod";

const createSceneSchema = z.object({
  name: z.string().min(1).max(100),
  description: z.string().min(5).max(300),
  tagIds: z.array(z.string()).min(1),
  prompt: z.string().min(10).max(500),
  model: z.string().optional(),
});

export async function GET() {
  try {
    await requireAdmin();
    const scenes = await prisma.scene.findMany({
      include: {
        tags: true,
        _count: {
          select: { templates: true },
        },
      },
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json({ scenes });
  } catch (err: unknown) {
    const error = err as { statusCode?: number; code?: string; message?: string };
    return NextResponse.json(
      { error: { code: error.code || "INTERNAL_ERROR", message: error.message || "Failed to load scenes" } },
      { status: error.statusCode || 500 }
    );
  }
}

export async function POST(req: Request) {
  try {
    await requireAdmin();
    const body = await req.json();
    const parsed = createSceneSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: { code: "VALIDATION", message: parsed.error.issues[0]?.message || "Invalid payload" } },
        { status: 400 }
      );
    }

    const { name, description, tagIds, prompt, model } = parsed.data;

    const scene = await prisma.scene.create({
      data: {
        name,
        description,
        prompt,
        model: model || process.env.LLM_MODEL || "Qwen3.5-4B-3D-Coder",
        status: "QUEUED",
        published: false,
        tags: {
          connect: tagIds.map((id) => ({ id })),
        },
      },
      include: { tags: true },
    });

    const job = await prisma.genJob.create({
      data: {
        kind: "scene",
        targetId: scene.id,
        status: "QUEUED",
        attempts: 0,
        model: scene.model,
        log: `Queued scene generation for '${name}' via ${scene.model}`,
      },
    });

    return NextResponse.json({ scene, jobId: job.id }, { status: 201 });
  } catch (err: unknown) {
    const error = err as { statusCode?: number; code?: string; message?: string };
    return NextResponse.json(
      { error: { code: error.code || "INTERNAL_ERROR", message: error.message || "Failed to create scene" } },
      { status: error.statusCode || 500 }
    );
  }
}
