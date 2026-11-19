import { NextResponse } from "next/server";
import { prisma } from "@/server/db";
import { requireAdmin } from "@/server/guards";
import { z } from "zod";

const updateMusicSchema = z.object({
  name: z.string().min(1).max(100).optional(),
  published: z.boolean().optional(),
  tagIds: z.array(z.string()).optional(),
});

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await requireAdmin();
    const { id } = await params;
    const track = await prisma.music.findUnique({
      where: { id },
      include: { tags: true, templates: true },
    });

    if (!track) {
      return NextResponse.json({ error: { code: "NOT_FOUND", message: "Music track not found" } }, { status: 404 });
    }

    return NextResponse.json({ music: track });
  } catch (err: unknown) {
    const error = err as { statusCode?: number; code?: string; message?: string };
    return NextResponse.json(
      { error: { code: error.code || "INTERNAL_ERROR", message: error.message || "Failed to get music track" } },
      { status: error.statusCode || 500 }
    );
  }
}

export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await requireAdmin();
    const { id } = await params;
    const body = await req.json();
    const parsed = updateMusicSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: { code: "VALIDATION", message: parsed.error.issues[0]?.message || "Invalid payload" } },
        { status: 400 }
      );
    }

    const current = await prisma.music.findUnique({
      where: { id },
    });

    if (!current) {
      return NextResponse.json({ error: { code: "NOT_FOUND", message: "Music track not found" } }, { status: 404 });
    }

    // Business Rule R10: Music must have status READY to publish
    if (parsed.data.published === true && current.status !== "READY") {
      return NextResponse.json(
        { error: { code: "VALIDATION", message: "Music must have status READY to publish (R10)" } },
        { status: 400 }
      );
    }

    const updateData: Record<string, unknown> = {};
    if (parsed.data.name !== undefined) updateData.name = parsed.data.name;
    if (parsed.data.published !== undefined) updateData.published = parsed.data.published;
    if (parsed.data.tagIds !== undefined) {
      updateData.tags = {
        set: parsed.data.tagIds.map((tid) => ({ id: tid })),
      };
    }

    const updated = await prisma.music.update({
      where: { id },
      data: updateData,
      include: { tags: true },
    });

    return NextResponse.json({ music: updated });
  } catch (err: unknown) {
    const error = err as { statusCode?: number; code?: string; message?: string };
    return NextResponse.json(
      { error: { code: error.code || "INTERNAL_ERROR", message: error.message || "Failed to update music" } },
      { status: error.statusCode || 500 }
    );
  }
}

export async function DELETE(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await requireAdmin();
    const { id } = await params;

    // Business Rule R12: Check dependent templates
    const dependentTemplates = await prisma.template.findMany({
      where: { musicId: id },
      select: { id: true, name: true },
    });

    if (dependentTemplates.length > 0) {
      return NextResponse.json(
        {
          error: {
            code: "CONFLICT_IN_USE",
            message: "Cannot delete music track currently referenced by templates (R12)",
            references: dependentTemplates,
          },
        },
        { status: 409 }
      );
    }

    await prisma.music.delete({
      where: { id },
    });

    return NextResponse.json({ success: true });
  } catch (err: unknown) {
    const error = err as { statusCode?: number; code?: string; message?: string };
    return NextResponse.json(
      { error: { code: error.code || "INTERNAL_ERROR", message: error.message || "Failed to delete music" } },
      { status: error.statusCode || 500 }
    );
  }
}
