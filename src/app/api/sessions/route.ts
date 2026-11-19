import { NextResponse } from "next/server";
import { prisma } from "@/server/db";
import { handler, ApiError } from "@/server/http";
import { guards } from "@/server/guards";
import { isProActive, validateSessionDuration } from "@/server/rules";
import { SessionCreateSchema } from "@/lib/schemas/api";

/**
 * POST /api/sessions
 * Validates session duration against user role (Free: 3-15m Rule R1; Pro: 3-720m Rule R3).
 * Custom pairings or playlists also require active Pro status (Rule R4).
 * Returns session details, endsAt timestamp, and media references.
 */
export const POST = handler(async (req: Request) => {
  const body = await req.json();
  const parsed = SessionCreateSchema.safeParse(body);

  if (!parsed.success) {
    throw new ApiError(400, "VALIDATION", parsed.error.issues[0]?.message || "Invalid session request");
  }

  const { entityId, type, minutes } = parsed.data;

  // Resolve user and active Pro status (Rule R9)
  const session = await guards.getCurrentSession();
  const user = session?.user?.id
    ? await prisma.user.findUnique({
        where: { id: session.user.id },
      })
    : null;

  const isPro = isProActive(user);

  // If requesting > 15 minutes, Pro is strictly required (Rule R3/R4)
  if (minutes > 15 && !isPro) {
    throw new ApiError(
      403,
      "PRO_REQUIRED",
      "Sessions longer than 15 minutes require an active Pro subscription.",
      { rule: "R3", requested: minutes }
    );
  }

  // Validate duration bounds (R1 for Free: 3..15, R3 for Pro: 3..720)
  validateSessionDuration(minutes, isPro);

  // Custom pairings and playlists require Pro tier (Rule R4)
  if ((type === "CUSTOM" || type === "PLAYLIST") && !isPro) {
    throw new ApiError(
      403,
      "PRO_REQUIRED",
      "Custom pairing and playlists require an active Pro subscription.",
      { rule: "R4" }
    );
  }

  let musicUrl: string | null = null;
  let sceneBundleUrl: string | null = null;
  let entityDetails: Record<string, unknown> | null = null;

  if (type === "TEMPLATE") {
    const template = await prisma.template.findFirst({
      where: { id: entityId, published: true },
      include: {
        music: true,
        scene: true,
      },
    });

    if (!template || !template.music.published || !template.scene.published) {
      throw new ApiError(404, "NOT_FOUND", "Template not found or contains unpublished media");
    }

    musicUrl = template.music.file;
    sceneBundleUrl = template.scene.bundlePath;
    entityDetails = {
      templateId: template.id,
      name: template.name,
      musicId: template.musicId,
      sceneId: template.sceneId,
    };
  } else if (type === "PLAYLIST") {
    const playlist = await prisma.playlist.findFirst({
      where: { id: entityId },
      include: {
        items: {
          orderBy: { order: "asc" },
        },
      },
    });

    if (!playlist) {
      throw new ApiError(404, "NOT_FOUND", "Playlist not found");
    }

    entityDetails = {
      playlistId: playlist.id,
      name: playlist.name,
      itemCount: playlist.items.length,
    };
  } else if (type === "CUSTOM") {
    // For custom pair, entityId could be sceneId:musicId or sceneId
    // If client passes comma or colon separated, or just sceneId
    const parts = entityId.split(":");
    const sceneId = parts[0];
    const musicId = parts[1];

    if (!sceneId || !musicId) {
      throw new ApiError(400, "VALIDATION", "Custom session requires entityId in format 'sceneId:musicId'");
    }

    const [scene, music] = await Promise.all([
      prisma.scene.findFirst({ where: { id: sceneId, published: true } }),
      prisma.music.findFirst({ where: { id: musicId, published: true } }),
    ]);

    if (!scene || !music) {
      throw new ApiError(404, "NOT_FOUND", "Referenced scene or music track not found or unpublished");
    }

    musicUrl = music.file;
    sceneBundleUrl = scene.bundlePath;
    entityDetails = {
      sceneId: scene.id,
      musicId: music.id,
    };
  }

  const now = new Date();
  const endsAt = new Date(now.getTime() + minutes * 60 * 1000);

  return NextResponse.json({
    valid: true,
    type,
    entityId,
    minutes,
    startedAt: now.toISOString(),
    endsAt: endsAt.toISOString(),
    music: { url: musicUrl },
    scene: { bundleUrl: sceneBundleUrl },
    entity: entityDetails,
  });
});
