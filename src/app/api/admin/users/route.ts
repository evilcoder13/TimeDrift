import { NextResponse } from "next/server";
import { prisma } from "@/server/db";
import { requireAdmin } from "@/server/guards";
import { z } from "zod";

const updateUserSchema = z.object({
  role: z.enum(["USER", "ADMIN"]).optional(),
  isPro: z.boolean().optional(),
  proUntil: z.string().nullable().optional(),
});

export async function GET() {
  try {
    await requireAdmin();
    const users = await prisma.user.findMany({
      orderBy: { createdAt: "desc" },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        isPro: true,
        proUntil: true,
        proTransferCode: true,
        locale: true,
        createdAt: true,
      },
    });

    return NextResponse.json({ users });
  } catch (err: unknown) {
    const error = err as { statusCode?: number; code?: string; message?: string };
    return NextResponse.json(
      { error: { code: error.code || "INTERNAL_ERROR", message: error.message || "Failed to load users" } },
      { status: error.statusCode || 500 }
    );
  }
}

export async function PATCH(req: Request) {
  try {
    await requireAdmin();
    const url = new URL(req.url);
    const id = url.searchParams.get("id");
    if (!id) {
      return NextResponse.json({ error: { code: "VALIDATION", message: "User id required" } }, { status: 400 });
    }

    const body = await req.json();
    const parsed = updateUserSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: { code: "VALIDATION", message: parsed.error.issues[0]?.message || "Invalid payload" } },
        { status: 400 }
      );
    }

    const updateData: Record<string, unknown> = {};
    if (parsed.data.role !== undefined) updateData.role = parsed.data.role;
    if (parsed.data.isPro !== undefined) updateData.isPro = parsed.data.isPro;
    if (parsed.data.proUntil !== undefined) {
      updateData.proUntil = parsed.data.proUntil ? new Date(parsed.data.proUntil) : null;
    }

    const updated = await prisma.user.update({
      where: { id },
      data: updateData,
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        isPro: true,
        proUntil: true,
      },
    });

    return NextResponse.json({ user: updated });
  } catch (err: unknown) {
    const error = err as { statusCode?: number; code?: string; message?: string };
    return NextResponse.json(
      { error: { code: error.code || "INTERNAL_ERROR", message: error.message || "Failed to update user" } },
      { status: error.statusCode || 500 }
    );
  }
}
