import React from 'react';
import { prisma } from '@/server/db';
import { getCurrentSession } from '@/server/guards';
import { isProActive } from '@/server/rules';
import { HomeDiscoveryClient } from './HomeDiscoveryClient';

export const dynamic = 'force-dynamic';

export default async function HomePage() {
  const session = await getCurrentSession();
  const isPro = isProActive(session?.user);

  // Fetch all published templates with music, scene, tags
  const templates = await prisma.template.findMany({
    where: {
      published: true,
      scene: { published: true },
      music: { published: true },
    },
    include: {
      tags: true,
      scene: {
        select: {
          id: true,
          name: true,
          description: true,
          bundlePath: true,
          tags: true,
        },
      },
      music: {
        select: {
          id: true,
          name: true,
          type: true,
          seconds: true,
          tags: true,
        },
      },
    },
    orderBy: { createdAt: 'desc' },
  });

  // Fetch unique tags present in published templates
  const tags = await prisma.tag.findMany({
    where: {
      templates: {
        some: {
          published: true,
        },
      },
    },
    orderBy: { slug: 'asc' },
  });

  return (
    <HomeDiscoveryClient
      templates={templates}
      tags={tags}
      isPro={isPro}
    />
  );
}
