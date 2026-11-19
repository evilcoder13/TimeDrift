import { NextResponse } from "next/server";
import { prisma } from "@/server/db";
import { handler, ApiError } from "@/server/http";
import { guards } from "@/server/guards";
import { validatePlaylist } from "@/server/rules";
import { PlaylistCreateSchema } from "@/lib/schemas/api";

/**
 * GET /api/playlists
 * Pro Only (Rule R4). Returns user's saved playlists with ordered items.
 */
export const GET = handler(async () => {
  const user = await guards.requirePro();

  const playlists = await prisma.playlist.findMany({
    where: { userId: user.id },
    include: {
      items: {
        orderBy: { order: "asc" },
      },
    },
    orderBy: { updatedAt: "desc" },
  });

  return NextResponse.json({ playlists });
});

/**
 * POST /api/playlists
 * Pro Only (Rule R4). Creates playlist with item count and cumulative duration validation (Rule R5).
 */
export const POST = handler(async (req: Request) => {
  const user = await guards.requirePro();
  const body = await req.json();

  const parsed = PlaylistCreateSchema.safeParse(body);
  if (!parsed.success) {
    const isDurationIssue = parsed.error.issues.some((i) =>
      i.message.includes("Total playlist duration cannot exceed 720 minutes")
    );
    throw new ApiError(
      400,
      isDurationIssue ? "PLAYLIST_LIMIT_EXCEEDED" : "VALIDATION",
      parsed.error.issues[0]?.message || "Invalid playlist data",
      { issues: parsed.error.issues }
    );
  }

  const { title, items } = parsed.data;

  // Server-side Business Rule R5 validation
  const normalizedItems = items.map((item) => ({
    templateId: item.templateId ?? null,
    sceneId: item.sceneId ?? null,
    musicId: item.musicId ?? null,
    minutes: item.durationMinutes ?? item.minutes ?? 15,
  }));

  try {
    validatePlaylist(normalizedItems, true);
  } catch (err: unknown) {
    const error = err as { code?: string; message?: string; statusCode?: number };
    if (error.code === "PLAYLIST_DURATION_EXCEEDED" || error.code === "PLAYLIST_ITEM_COUNT_INVALID") {
      throw new ApiError(400, "PLAYLIST_LIMIT_EXCEEDED", error.message || "Playlist limit exceeded", {
        originalCode: error.code,
      });
    }
    throw err;
  }

  // Create playlist and items transactionally
  const playlist = await prisma.playlist.create({
    data: {
      userId: user.id,
      name: title,
      items: {
        create: items.map((item, index) => ({
          order: item.order ?? index,
          templateId: item.templateId ?? null,
          sceneId: item.sceneId ?? null,
          musicId: item.musicId ?? null,
          minutes: item.durationMinutes ?? item.minutes ?? 15,
        })),
      },
    },
    include: {
      items: {
        orderBy: { order: "asc" },
      },
    },
  });

  return NextResponse.json({ playlist }, { status: 201 });
});
