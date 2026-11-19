import { NextResponse } from "next/server";
import { prisma } from "@/server/db";
import { handler } from "@/server/http";
import { selectRandomDrift } from "@/server/rules";

/**
 * GET /api/random
 * Implements Rule R6: Deterministic Random Selection
 * Supports:
 * - ?excludeId=: avoids repeating immediate prior item (templateId or sceneId)
 * - ?tag=: optional tag filter for selection
 */
export const GET = handler(async (req: Request) => {
  const url = new URL(req.url);
  const excludeId = url.searchParams.get("excludeId") ?? undefined;
  const tag = url.searchParams.get("tag") ?? undefined;

  // 1. Fetch published templates
  const templateWhere: {
    published: boolean;
    tags?: { some: { slug: string } };
  } = { published: true };

  if (tag && tag !== "all") {
    templateWhere.tags = { some: { slug: tag } };
  }

  const dbTemplates = await prisma.template.findMany({
    where: templateWhere,
    include: {
      tags: true,
      scene: true,
      music: true,
    },
  });

  // Filter templates whose underlying scene and music are both published (R8 integrity)
  const validTemplates = dbTemplates.filter((t) => t.scene.published && t.music.published);

  // 2. Fetch published scenes and music
  // When a tag is specified:
  // We prefer scenes with that tag; for music, we search all published music (or music matching the scene/tag)
  // because Fallback 1 is: random published scene matching tag + published music sharing >= 1 tag with scene;
  // and Fallback 2 is: random published scene matching tag + any published music.
  const sceneWhere: {
    published: boolean;
    status: string;
    tags?: { some: { slug: string } };
  } = { published: true, status: "READY" };

  if (tag && tag !== "all") {
    sceneWhere.tags = { some: { slug: tag } };
  }

  const musicWhere = { published: true, status: "READY" };

  const [dbScenes, dbMusic] = await Promise.all([
    prisma.scene.findMany({
      where: sceneWhere,
      include: { tags: true },
    }),
    prisma.music.findMany({
      where: musicWhere,
      include: { tags: true },
    }),
  ]);

  const source = {
    templates: validTemplates.map((t) => ({
      id: t.id,
      published: t.published,
      sceneId: t.sceneId,
      musicId: t.musicId,
    })),
    scenes: dbScenes.map((s) => ({
      id: s.id,
      published: s.published,
      tags: s.tags.map((t) => t.slug),
    })),
    music: dbMusic.map((m) => ({
      id: m.id,
      published: m.published,
      tags: m.tags.map((t) => t.slug),
    })),
  };

  const selection = selectRandomDrift(source, {
    lastPlayedTemplateId: excludeId,
    lastPlayedSceneId: excludeId,
  });

  // Fetch full details of the chosen music & scene
  const [selectedScene, selectedMusic, selectedTemplate] = await Promise.all([
    prisma.scene.findUnique({
      where: { id: selection.sceneId },
      include: { tags: true },
    }),
    prisma.music.findUnique({
      where: { id: selection.musicId },
      include: { tags: true },
    }),
    selection.templateId
      ? prisma.template.findUnique({
          where: { id: selection.templateId },
          include: { tags: true },
        })
      : null,
  ]);

  return NextResponse.json({
    type: selection.type,
    templateId: selection.templateId ?? null,
    template: selectedTemplate,
    sceneId: selection.sceneId,
    scene: selectedScene,
    musicId: selection.musicId,
    music: selectedMusic,
  });
});
