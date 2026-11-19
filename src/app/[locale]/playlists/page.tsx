import React from 'react';
import { prisma } from '@/server/db';
import { getCurrentSession } from '@/server/guards';
import { isProActive } from '@/server/rules';
import { PlaylistsClient } from './PlaylistsClient';

export const dynamic = 'force-dynamic';

export default async function PlaylistsPage() {
  const session = await getCurrentSession();
  const isPro = isProActive(session?.user);

  // Zero playlist data leakage for non-Pro users (URD §3.1.3 / Rule R4)
  if (!isPro) {
    return <PlaylistsClient isPro={false} playlists={[]} availableTemplates={[]} />;
  }

  let userPlaylists: any[] = [];

  if (session?.user?.id && isPro) {
    userPlaylists = await prisma.playlist.findMany({
      where: { userId: session.user.id },
      include: {
        items: {
          orderBy: { order: 'asc' },
        },
      },
      orderBy: { updatedAt: 'desc' },
    });
  }

  // Pre-fetch published templates for the journey item builder
  const templates = await prisma.template.findMany({
    where: { published: true, scene: { published: true }, music: { published: true } },
    include: { scene: true, music: true, tags: true },
  });

  return (
    <PlaylistsClient
      isPro={isPro}
      playlists={userPlaylists}
      availableTemplates={templates}
    />
  );
}
