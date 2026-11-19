import { NextResponse } from "next/server";
import { prisma } from "@/server/db";
import { requireAdmin } from "@/server/guards";
import { z } from "zod";

const createTagSchema = z.object({
  slug: z.string().regex(/^[a-z0-9]+(-[a-z0-9]+)*$/, "Slug must be lowercase alphanumeric with hyphens"),
  nameEn: z.string().min(1, "English name is required").max(50),
  nameVi: z.string().min(1, "Vietnamese name is required").max(50),
});

export async function GET() {
  try {
    await requireAdmin();
    const tags = await prisma.tag.findMany({
      include: {
        _count: {
          select: {
            music: true,
            scenes: true,
            templates: true,
          },
        },
      },
      orderBy: { slug: "asc" },
    });

    return NextResponse.json({ tags });
  } catch (err: unknown) {
    const error = err as { statusCode?: number; code?: string; message?: string };
    return NextResponse.json(
      { error: { code: error.code || "INTERNAL_ERROR", message: error.message || "Failed to load tags" } },
      { status: error.statusCode || 500 }
    );
  }
}

export async function POST(req: Request) {
  try {
    await requireAdmin();
    const body = await req.json();
    const parsed = createTagSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: { code: "VALIDATION", message: parsed.error.issues[0]?.message || "Invalid payload" } },
        { status: 400 }
      );
    }

    const existing = await prisma.tag.findUnique({
      where: { slug: parsed.data.slug },
    });
    if (existing) {
      return NextResponse.json(
        { error: { code: "CONFLICT", message: "Tag with this slug already exists" } },
        { status: 409 }
      );
    }

    const tag = await prisma.tag.create({
      data: parsed.data,
    });

    return NextResponse.json({ tag }, { status: 201 });
  } catch (err: unknown) {
    const error = err as { statusCode?: number; code?: string; message?: string };
    return NextResponse.json(
      { error: { code: error.code || "INTERNAL_ERROR", message: error.message || "Failed to create tag" } },
      { status: error.statusCode || 500 }
    );
  }
}
