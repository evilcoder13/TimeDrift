import { NextResponse } from "next/server";
import { prisma } from "@/server/db";

interface RouteParams {
  params: Promise<{ id: string }>;
}

export async function GET(
  _req: Request,
  { params }: RouteParams
) {
  try {
    const { id } = await params;

    if (!id) {
      return NextResponse.json({ error: { code: "BAD_REQUEST", message: "Template ID parameter is required" } }, { status: 400 });
    }

    const template = await prisma.template.findFirst({
      where: {
        id,
        published: true, // Only published templates (Rule R8/R12)
      },
      include: {
        tags: true,
        music: {
          select: {
            id: true,
            name: true,
            type: true,
            seconds: true,
            file: true,
            durationSec: true,
            published: true,
            tags: true,
          },
        },
        scene: {
          select: {
            id: true,
            name: true,
            description: true,
            bundlePath: true,
            published: true,
            tags: true,
          },
        },
      },
    });

    if (!template) {
      return NextResponse.json({ error: { code: "NOT_FOUND", message: "Template not found or unpublished" } }, { status: 404 });
    }

    return NextResponse.json({ template });
  } catch (err: unknown) {
    const error = err as { statusCode?: number; code?: string; message?: string };
    return NextResponse.json(
      { error: { code: error.code || "INTERNAL_ERROR", message: error.message || "Failed to fetch template" } },
      { status: error.statusCode || 500 }
    );
  }
}
