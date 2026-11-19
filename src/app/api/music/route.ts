import { NextResponse } from "next/server";
import { prisma } from "@/server/db";
import { handler } from "@/server/http";

export const GET = handler(async (req: Request) => {
  const url = new URL(req.url);
  const tag = url.searchParams.get("tag");

  const whereClause: {
    published: boolean;
    status: string;
    tags?: { some: { slug: string } };
  } = {
    published: true,
    status: "READY",
  };

  if (tag && tag !== "all") {
    whereClause.tags = {
      some: { slug: tag },
    };
  }

  const music = await prisma.music.findMany({
    where: whereClause,
    select: {
      id: true,
      name: true,
      type: true,
      seconds: true,
      file: true,
      durationSec: true,
      published: true,
      tags: true,
      createdAt: true,
    },
    orderBy: { createdAt: "desc" },
  });

  return NextResponse.json({ music });
});
