import { NextResponse } from "next/server";
import { prisma } from "@/server/db";
import { requireAdmin } from "@/server/guards";
import { z } from "zod";

const createTemplateSchema = z.object({
  name: z.string().min(1).max(100),
  sceneId: z.string().min(1),
  musicId: z.string().min(1),
  published: z.boolean().optional().default(false),
  tagIds: z.array(z.string()).optional(),
});

export async function GET() {
  try {
    await requireAdmin();
    const templates = await prisma.template.findMany({
      include: {
        scene: { include: { tags: true } },
        music: { include: { tags: true } },
        tags: true,
      },
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json({ templates });
  } catch (err: unknown) {
    const error = err as { statusCode?: number; code?: string; message?: string };
    return NextResponse.json(
      { error: { code: error.code || "INTERNAL_ERROR", message: error.message || "Failed to load templates" } },
      { status: error.statusCode || 500 }
    );
  }
}

export async function POST(req: Request) {
  try {
    await requireAdmin();
    const body = await req.json();
    const parsed = createTemplateSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: { code: "VALIDATION", message: parsed.error.issues[0]?.message || "Invalid payload" } },
        { status: 400 }
      );
    }

    const { name, sceneId, musicId, published, tagIds } = parsed.data;

    // Check scene and music existence
    const scene = await prisma.scene.findUnique({
      where: { id: sceneId },
      include: { tags: true },
    });
    const music = await prisma.music.findUnique({
      where: { id: musicId },
      include: { tags: true },
    });

    if (!scene || !music) {
      return NextResponse.json(
        { error: { code: "NOT_FOUND", message: "Referenced scene or music track does not exist" } },
        { status: 404 }
      );
    }

    // Business Rule R8: Template cannot be published if scene or music is unpublished
    if (published && (!scene.published || !music.published)) {
      return NextResponse.json(
        {
          error: {
            code: "VALIDATION",
            message: "Cannot publish template when scene or music is unpublished (R8: TEMPLATE_PARTS_NOT_PUBLISHED)",
          },
        },
        { status: 400 }
      );
    }

    // Pre-calculate intersecting tags if tagIds not explicitly provided
    let finalTagIds = tagIds;
    if (!finalTagIds || finalTagIds.length === 0) {
      const musicTagIds = new Set(music.tags.map((t) => t.id));
      finalTagIds = scene.tags.filter((t) => musicTagIds.has(t.id)).map((t) => t.id);
    }

    const template = await prisma.template.create({
      data: {
        name,
        sceneId,
        musicId,
        published,
        tags: {
          connect: finalTagIds.map((id) => ({ id })),
        },
      },
      include: {
        scene: true,
        music: true,
        tags: true,
      },
    });

    return NextResponse.json({ template }, { status: 201 });
  } catch (err: unknown) {
    const error = err as { statusCode?: number; code?: string; message?: string };
    return NextResponse.json(
      { error: { code: error.code || "INTERNAL_ERROR", message: error.message || "Failed to create template" } },
      { status: error.statusCode || 500 }
    );
  }
}
