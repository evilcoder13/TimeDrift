import { NextResponse } from "next/server";
import { prisma } from "@/server/db";
import { requireAdmin } from "@/server/guards";

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await requireAdmin();
    const { id } = await params;

    const job = await prisma.genJob.findUnique({
      where: { id },
    });

    if (!job) {
      return NextResponse.json({ error: { code: "NOT_FOUND", message: "Job not found" } }, { status: 404 });
    }

    return NextResponse.json({ job });
  } catch (err: unknown) {
    const error = err as { statusCode?: number; code?: string; message?: string };
    return NextResponse.json(
      { error: { code: error.code || "INTERNAL_ERROR", message: error.message || "Failed to load job" } },
      { status: error.statusCode || 500 }
    );
  }
}
