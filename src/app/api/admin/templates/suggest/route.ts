import { NextResponse } from "next/server";
import { prisma } from "@/server/db";
import { requireAdmin } from "@/server/guards";
import { jaccardTags } from "@/server/rules";

export async function GET(req: Request) {
  try {
    await requireAdmin();
    const url = new URL(req.url);
    const sceneId = url.searchParams.get("sceneId");

    if (!sceneId) {
      return NextResponse.json(
        { error: { code: "VALIDATION", message: "sceneId query parameter is required" } },
        { status: 400 }
      );
    }

    const scene = await prisma.scene.findUnique({
      where: { id: sceneId },
      include: { tags: true },
    });

    if (!scene) {
      return NextResponse.json({ error: { code: "NOT_FOUND", message: "Scene not found" } }, { status: 404 });
    }

    // Get all published ready music tracks
    const allMusic = await prisma.music.findMany({
      where: { published: true, status: "READY" },
      include: { tags: true },
    });

    const sceneTags = scene.tags.map((t) => t.slug);

    // Compute Jaccard tag similarity (R7)
    const suggestions = allMusic.map((m) => {
      const musicTags = m.tags.map((t) => t.slug);
      const score = jaccardTags(sceneTags, musicTags);
      const sharedTags = scene.tags.filter((st) => m.tags.some((mt) => mt.id === st.id));

      return {
        music: m,
        score: Math.round(score * 100) / 100,
        sharedTags,
      };
    });

    // Sort descending by score
    suggestions.sort((a, b) => b.score - a.score);

    return NextResponse.json({
      scene,
      suggestions,
    });
  } catch (err: unknown) {
    const error = err as { statusCode?: number; code?: string; message?: string };
    return NextResponse.json(
      { error: { code: error.code || "INTERNAL_ERROR", message: error.message || "Failed to calculate suggestions" } },
      { status: error.statusCode || 500 }
    );
  }
}
