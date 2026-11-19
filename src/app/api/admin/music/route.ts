import { NextResponse } from "next/server";
import { prisma } from "@/server/db";
import { requireAdmin } from "@/server/guards";
import { z } from "zod";

const createMusicSchema = z.object({
  name: z.string().min(1).max(100),
  type: z.enum([
    "lofi",
    "piano",
    "ambient",
    "acoustic",
    "strings",
    "nature-ambient",
    "chillhop",
    "music-box",
  ]),
  tagIds: z.array(z.string()).min(1),
  prompt: z.string().min(10).max(500),
  seconds: z.union([z.literal(30), z.literal(45), z.literal(60)]), // Rule R10
});

export async function GET() {
  try {
    await requireAdmin();
    const tracks = await prisma.music.findMany({
      include: {
        tags: true,
        _count: {
          select: { templates: true },
        },
      },
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json({ music: tracks });
  } catch (err: unknown) {
    const error = err as { statusCode?: number; code?: string; message?: string };
    return NextResponse.json(
      { error: { code: error.code || "INTERNAL_ERROR", message: error.message || "Failed to load music tracks" } },
      { status: error.statusCode || 500 }
    );
  }
}

export async function POST(req: Request) {
  try {
    await requireAdmin();
    const body = await req.json();
    const parsed = createMusicSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: { code: "VALIDATION", message: parsed.error.issues[0]?.message || "Invalid payload" } },
        { status: 400 }
      );
    }

    const { name, type, tagIds, prompt, seconds } = parsed.data;

    // Create Music record in QUEUED status
    const music = await prisma.music.create({
      data: {
        name,
        type,
        prompt,
        seconds,
        status: "QUEUED",
        published: false,
        tags: {
          connect: tagIds.map((id) => ({ id })),
        },
      },
      include: { tags: true },
    });

    // Enqueue GenJob
    const job = await prisma.genJob.create({
      data: {
        kind: "music",
        targetId: music.id,
        status: "QUEUED",
        attempts: 0,
        model: "MusicGen-small",
        log: `Queued music generation for '${name}' (${seconds}s, ${type})`,
      },
    });

    return NextResponse.json({ music, jobId: job.id }, { status: 201 });
  } catch (err: unknown) {
    const error = err as { statusCode?: number; code?: string; message?: string };
    return NextResponse.json(
      { error: { code: error.code || "INTERNAL_ERROR", message: error.message || "Failed to create music" } },
      { status: error.statusCode || 500 }
    );
  }
}
