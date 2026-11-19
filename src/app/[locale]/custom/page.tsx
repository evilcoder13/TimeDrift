import React from 'react';
import { prisma } from '@/server/db';
import { getCurrentSession } from '@/server/guards';
import { isProActive } from '@/server/rules';
import { CustomPairClient } from './CustomPairClient';

export const dynamic = 'force-dynamic';

export default async function CustomPage() {
  const session = await getCurrentSession();
  const isPro = isProActive(session?.user);

  // Zero asset leakage for non-Pro users (URD §3.1.3 / Rule R4)
  if (!isPro) {
    return <CustomPairClient isPro={false} scenes={[]} musics={[]} />;
  }

  // Fetch published scenes with tags
  const scenes = await prisma.scene.findMany({
    where: { published: true, bundlePath: { not: null } },
    include: { tags: true },
    orderBy: { createdAt: 'desc' },
  });

  // Fetch published music with tags
  const musics = await prisma.music.findMany({
    where: { published: true, file: { not: null } },
    include: { tags: true },
    orderBy: { createdAt: 'desc' },
  });

  return (
    <CustomPairClient
      isPro={isPro}
      scenes={scenes}
      musics={musics}
    />
  );
}
