import { NextResponse } from "next/server";
import { prisma } from "@/server/db";
import { requireAdmin } from "@/server/guards";
import { z } from "zod";
import fs from "fs";
import path from "path";

const updateSceneSchema = z.object({
  name: z.string().min(1).max(100).optional(),
  description: z.string().min(5).max(300).optional(),
  prompt: z.string().min(10).max(500).optional(),
  model: z.string().optional(),
  published: z.boolean().optional(),
  tagIds: z.array(z.string()).optional(),
  sourceCode: z.string().optional(),
});

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await requireAdmin();
    const { id } = await params;
    const scene = await prisma.scene.findUnique({
      where: { id },
      include: { tags: true, templates: true },
    });

    if (!scene) {
      return NextResponse.json({ error: { code: "NOT_FOUND", message: "Scene not found" } }, { status: 404 });
    }

    // Try reading source code if sourcePath exists
    let sourceCode = "";
    if (scene.sourcePath) {
      try {
        const fullPath = path.resolve(process.cwd(), scene.sourcePath);
        if (fs.existsSync(fullPath)) {
          sourceCode = fs.readFileSync(fullPath, "utf-8");
        }
      } catch {
        // Source file read fail
      }
    }

    return NextResponse.json({ scene, sourceCode });
  } catch (err: unknown) {
    const error = err as { statusCode?: number; code?: string; message?: string };
    return NextResponse.json(
      { error: { code: error.code || "INTERNAL_ERROR", message: error.message || "Failed to get scene" } },
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
    const parsed = updateSceneSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: { code: "VALIDATION", message: parsed.error.issues[0]?.message || "Invalid payload" } },
        { status: 400 }
      );
    }

    const current = await prisma.scene.findUnique({
      where: { id },
    });

    if (!current) {
      return NextResponse.json({ error: { code: "NOT_FOUND", message: "Scene not found" } }, { status: 404 });
    }

    // Business Rule R11: Scene must have status READY to publish
    if (parsed.data.published === true && current.status !== "READY") {
      return NextResponse.json(
        { error: { code: "VALIDATION", message: "Scene must have status READY to publish (R11)" } },
        { status: 400 }
      );
    }

    const updateData: Record<string, unknown> = {};
    if (parsed.data.name !== undefined) updateData.name = parsed.data.name;
    if (parsed.data.description !== undefined) updateData.description = parsed.data.description;
    if (parsed.data.prompt !== undefined) updateData.prompt = parsed.data.prompt;
    if (parsed.data.model !== undefined) updateData.model = parsed.data.model;
    if (parsed.data.published !== undefined) updateData.published = parsed.data.published;
    if (parsed.data.tagIds !== undefined) {
      updateData.tags = {
        set: parsed.data.tagIds.map((tid) => ({ id: tid })),
      };
    }

    // Business Rule R11: If source code is modified, write to storage/scenes and reset status to VALIDATING, enqueue job
    if (parsed.data.sourceCode !== undefined) {
      const sourcePath = `storage/scenes/${id}.ts`;
      const fullPath = path.resolve(process.cwd(), sourcePath);
      fs.mkdirSync(path.dirname(fullPath), { recursive: true });
      fs.writeFileSync(fullPath, parsed.data.sourceCode, "utf-8");

      updateData.sourcePath = sourcePath;
      updateData.status = "VALIDATING";
      updateData.published = false;

      // Enqueue GenJob for validation
      await prisma.genJob.create({
        data: {
          kind: "scene",
          targetId: id,
          status: "QUEUED",
          attempts: 0,
          model: current.model,
          log: `Re-validating scene '${current.name}' after admin code modification (R11)`,
        },
      });
    }

    const updated = await prisma.scene.update({
      where: { id },
      data: updateData,
      include: { tags: true },
    });

    return NextResponse.json({ scene: updated });
  } catch (err: unknown) {
    const error = err as { statusCode?: number; code?: string; message?: string };
    return NextResponse.json(
      { error: { code: error.code || "INTERNAL_ERROR", message: error.message || "Failed to update scene" } },
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

    // Business Rule R12: Cascade check
    const dependentTemplates = await prisma.template.findMany({
      where: { sceneId: id },
      select: { id: true, name: true },
    });

    if (dependentTemplates.length > 0) {
      return NextResponse.json(
        {
          error: {
            code: "CONFLICT_IN_USE",
            message: "Cannot delete scene currently referenced by templates (R12)",
            references: dependentTemplates,
          },
        },
        { status: 409 }
      );
    }

    await prisma.scene.delete({
      where: { id },
    });

    return NextResponse.json({ success: true });
  } catch (err: unknown) {
    const error = err as { statusCode?: number; code?: string; message?: string };
    return NextResponse.json(
      { error: { code: error.code || "INTERNAL_ERROR", message: error.message || "Failed to delete scene" } },
      { status: error.statusCode || 500 }
    );
  }
}
