import { NextResponse } from "next/server";
import { prisma } from "@/server/db";
import { handler } from "@/server/http";

export const GET = handler(async (req: Request) => {
  const url = new URL(req.url);
  const tag = url.searchParams.get("tag");

  const whereClause: {
    published: boolean;
    tags?: { some: { slug: string } };
  } = {
    published: true,
  };

  if (tag && tag !== "all") {
    whereClause.tags = {
      some: { slug: tag },
    };
  }

  const templates = await prisma.template.findMany({
    where: whereClause,
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
    orderBy: { createdAt: "desc" },
  });

  return NextResponse.json({ templates });
});
