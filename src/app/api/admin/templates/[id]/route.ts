import { NextResponse } from "next/server";
import { prisma } from "@/server/db";
import { requireAdmin } from "@/server/guards";
import { z } from "zod";

const updateTemplateSchema = z.object({
  name: z.string().min(1).max(100).optional(),
  published: z.boolean().optional(),
  tagIds: z.array(z.string()).optional(),
});

export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await requireAdmin();
    const { id } = await params;
    const body = await req.json();
    const parsed = updateTemplateSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: { code: "VALIDATION", message: parsed.error.issues[0]?.message || "Invalid payload" } },
        { status: 400 }
      );
    }

    const template = await prisma.template.findUnique({
      where: { id },
      include: { scene: true, music: true },
    });

    if (!template) {
      return NextResponse.json({ error: { code: "NOT_FOUND", message: "Template not found" } }, { status: 404 });
    }

    // Business Rule R8: check both scene and music published
    if (parsed.data.published === true) {
      if (!template.scene.published || !template.music.published) {
        return NextResponse.json(
          {
            error: {
              code: "VALIDATION",
              message: "Cannot publish template when referenced scene or melody is not published (R8)",
            },
          },
          { status: 400 }
        );
      }
    }

    const updateData: Record<string, unknown> = {};
    if (parsed.data.name !== undefined) updateData.name = parsed.data.name;
    if (parsed.data.published !== undefined) updateData.published = parsed.data.published;
    if (parsed.data.tagIds !== undefined) {
      updateData.tags = {
        set: parsed.data.tagIds.map((tid) => ({ id: tid })),
      };
    }

    const updated = await prisma.template.update({
      where: { id },
      data: updateData,
      include: { scene: true, music: true, tags: true },
    });

    return NextResponse.json({ template: updated });
  } catch (err: unknown) {
    const error = err as { statusCode?: number; code?: string; message?: string };
    return NextResponse.json(
      { error: { code: error.code || "INTERNAL_ERROR", message: error.message || "Failed to update template" } },
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

    await prisma.template.delete({
      where: { id },
    });

    return NextResponse.json({ success: true });
  } catch (err: unknown) {
    const error = err as { statusCode?: number; code?: string; message?: string };
    return NextResponse.json(
      { error: { code: error.code || "INTERNAL_ERROR", message: error.message || "Failed to delete template" } },
      { status: error.statusCode || 500 }
    );
  }
}
