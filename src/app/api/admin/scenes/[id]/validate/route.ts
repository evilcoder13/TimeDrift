import { NextResponse } from "next/server";
import { prisma } from "@/server/db";
import { requireAdmin } from "@/server/guards";
import { sceneValidator } from "@/server/services/scene-validator";
import fs from "node:fs/promises";
import path from "node:path";

export async function POST(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await requireAdmin();
    const { id } = await params;

    const scene = await prisma.scene.findUnique({
      where: { id },
    });

    if (!scene) {
      return NextResponse.json(
        { error: { code: "NOT_FOUND", message: "Scene not found" } },
        { status: 404 }
      );
    }

    // Mark scene as VALIDATING
    await prisma.scene.update({
      where: { id },
      data: { status: "VALIDATING" },
    });

    // Obtain source code
    let sourceCode = "";
    if (scene.sourcePath) {
      try {
        const fullPath = path.resolve(process.cwd(), scene.sourcePath);
        sourceCode = await fs.readFile(fullPath, "utf-8");
      } catch {
        sourceCode = scene.prompt;
      }
    } else {
      sourceCode = scene.prompt;
    }

    const bundlePath = path.resolve(process.cwd(), "storage/bundles", `${scene.id}.js`);
    const sourcePath = path.resolve(process.cwd(), "storage/scenes", `${scene.id}.ts`);

    const result = await sceneValidator.validateScene(sourceCode, {
      sceneId: scene.id,
      saveBundlePath: bundlePath,
      saveSourcePath: sourcePath,
    });

    if (!result.valid) {
      await prisma.scene.update({
        where: { id },
        data: { status: "FAILED" },
      });
      return NextResponse.json(
        {
          error: {
            code: "VALIDATION_FAILED",
            message: `Stage ${result.stage} validation failed: ${result.error}`,
            stage: result.stage,
          },
        },
        { status: 422 }
      );
    }

    const updated = await prisma.scene.update({
      where: { id },
      data: {
        status: "READY",
        bundlePath: `storage/bundles/${scene.id}.js`,
        sourcePath: `storage/scenes/${scene.id}.ts`,
      },
    });

    return NextResponse.json({
      valid: true,
      stage: 4,
      scene: updated,
      domNodeCount: result.domNodeCount,
      pixelDiff: result.pixelDiff,
    });
  } catch (err: unknown) {
    const error = err as { statusCode?: number; code?: string; message?: string };
    return NextResponse.json(
      {
        error: {
          code: error.code || "INTERNAL_ERROR",
          message: error.message || "Failed to validate scene",
        },
      },
      { status: error.statusCode || 500 }
    );
  }
}
