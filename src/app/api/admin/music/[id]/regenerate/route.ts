import { NextResponse } from "next/server";
import { prisma } from "@/server/db";
import { requireAdmin } from "@/server/guards";
import { z } from "zod";

const regenSchema = z.object({
  prompt: z.string().min(10).max(500).optional(),
});

export async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await requireAdmin();
    const { id } = await params;
    const body = await req.json().catch(() => ({}));
    const parsed = regenSchema.safeParse(body);

    const track = await prisma.music.findUnique({
      where: { id },
    });

    if (!track) {
      return NextResponse.json({ error: { code: "NOT_FOUND", message: "Music track not found" } }, { status: 404 });
    }

    const prompt = parsed.success && parsed.data.prompt ? parsed.data.prompt : track.prompt;

    const updated = await prisma.music.update({
      where: { id },
      data: {
        status: "QUEUED",
        prompt,
      },
    });

    const job = await prisma.genJob.create({
      data: {
        kind: "music",
        targetId: id,
        status: "QUEUED",
        attempts: 0,
        model: "MusicGen-small",
        log: `Re-queued music generation for '${track.name}'`,
      },
    });

    return NextResponse.json({ music: updated, jobId: job.id });
  } catch (err: unknown) {
    const error = err as { statusCode?: number; code?: string; message?: string };
    return NextResponse.json(
      { error: { code: error.code || "INTERNAL_ERROR", message: error.message || "Failed to regenerate music" } },
      { status: error.statusCode || 500 }
    );
  }
}
