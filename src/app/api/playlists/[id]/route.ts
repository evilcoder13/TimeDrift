import { NextResponse } from "next/server";
import { prisma } from "@/server/db";
import { requirePro } from "@/server/guards";
import { validatePlaylist } from "@/server/rules";
import { PlaylistUpdateSchema } from "@/lib/schemas/api";
import { ApiError } from "@/server/errors";

interface RouteParams {
  params: Promise<{ id: string }>;
}

/**
 * GET /api/playlists/:id
 * Pro Only (Rule R4). Returns playlist with ordered items.
 * Implements Rule R12: Cascade protection - flags or filters unpublished scene/music.
 */
export async function GET(req: Request, { params }: RouteParams) {
  try {
    const user = await requirePro();
    const { id } = await params;

    const playlist = await prisma.playlist.findUnique({
      where: { id },
      include: {
        items: {
          orderBy: { order: "asc" },
        },
      },
    });

    if (!playlist || playlist.userId !== user.id) {
      return NextResponse.json({ error: { code: "NOT_FOUND", message: "Playlist not found" } }, { status: 404 });
    }

    const enrichedItems = await Promise.all(
      playlist.items.map(async (item) => {
        let isPublished = true;
        let template = null;
        let scene = null;
        let music = null;

        if (item.templateId) {
          template = await prisma.template.findUnique({
            where: { id: item.templateId },
            include: { scene: true, music: true, tags: true },
          });
          if (!template || !template.published || !template.scene.published || !template.music.published) {
            isPublished = false;
          }
        } else {
          if (item.sceneId) {
            scene = await prisma.scene.findUnique({
              where: { id: item.sceneId },
              include: { tags: true },
            });
            if (!scene || !scene.published) isPublished = false;
          }
          if (item.musicId) {
            music = await prisma.music.findUnique({
              where: { id: item.musicId },
              include: { tags: true },
            });
            if (!music || !music.published) isPublished = false;
          }
        }

        return {
          ...item,
          isPublished,
          template,
          scene,
          music,
        };
      })
    );

    return NextResponse.json({
      playlist: {
        ...playlist,
        items: enrichedItems,
      },
    });
  } catch (err: unknown) {
    const error = err as { statusCode?: number; code?: string; message?: string };
    return NextResponse.json(
      { error: { code: error.code || "INTERNAL_ERROR", message: error.message || "Request failed" } },
      { status: error.statusCode || 500 }
    );
  }
}

/**
 * PUT /api/playlists/:id
 * Pro Only (Rule R4, R5). Updates title and items with 720-min cap validation.
 */
export async function PUT(req: Request, { params }: RouteParams) {
  try {
    const user = await requirePro();
    const { id } = await params;

    const existing = await prisma.playlist.findUnique({
      where: { id },
    });

    if (!existing || existing.userId !== user.id) {
      return NextResponse.json({ error: { code: "NOT_FOUND", message: "Playlist not found" } }, { status: 404 });
    }

    const body = await req.json();
    const parsed = PlaylistUpdateSchema.safeParse(body);
    if (!parsed.success) {
      const isDurationIssue = parsed.error.issues.some((i) =>
        i.message.includes("Total playlist duration cannot exceed 720 minutes")
      );
      return NextResponse.json(
        {
          error: {
            code: isDurationIssue ? "PLAYLIST_LIMIT_EXCEEDED" : "VALIDATION",
            message: parsed.error.issues[0]?.message || "Invalid playlist data",
          },
        },
        { status: 400 }
      );
    }

    const { title, items } = parsed.data;

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
      return NextResponse.json(
        {
          error: {
            code: "PLAYLIST_LIMIT_EXCEEDED",
            message: error.message || "Playlist limit exceeded",
          },
        },
        { status: 400 }
      );
    }

    const updated = await prisma.$transaction(async (tx) => {
      await tx.playlistItem.deleteMany({
        where: { playlistId: id },
      });

      return await tx.playlist.update({
        where: { id },
        data: {
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
    });

    return NextResponse.json({ playlist: updated });
  } catch (err: unknown) {
    const error = err as { statusCode?: number; code?: string; message?: string };
    return NextResponse.json(
      { error: { code: error.code || "INTERNAL_ERROR", message: error.message || "Update failed" } },
      { status: error.statusCode || 500 }
    );
  }
}

/**
 * DELETE /api/playlists/:id
 * Pro Only (Rule R4). Deletes user's playlist.
 */
export async function DELETE(req: Request, { params }: RouteParams) {
  try {
    const user = await requirePro();
    const { id } = await params;

    const existing = await prisma.playlist.findUnique({
      where: { id },
    });

    if (!existing || existing.userId !== user.id) {
      return NextResponse.json({ error: { code: "NOT_FOUND", message: "Playlist not found" } }, { status: 404 });
    }

    await prisma.playlist.delete({
      where: { id },
    });

    return NextResponse.json({ success: true });
  } catch (err: unknown) {
    const error = err as { statusCode?: number; code?: string; message?: string };
    return NextResponse.json(
      { error: { code: error.code || "INTERNAL_ERROR", message: error.message || "Deletion failed" } },
      { status: error.statusCode || 500 }
    );
  }
}
