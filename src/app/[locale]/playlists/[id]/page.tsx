import React from 'react';
import { prisma } from '@/server/db';
import { getCurrentSession } from '@/server/guards';
import { isProActive } from '@/server/rules';
import { PlaylistDetailClient } from './PlaylistDetailClient';
import { notFound, redirect } from 'next/navigation';

export const dynamic = 'force-dynamic';

interface PlaylistPageProps {
  params: Promise<{ locale: string; id: string }>;
}

export default async function PlaylistDetailPage({ params }: PlaylistPageProps) {
  const { locale, id } = await params;
  const session = await getCurrentSession();
  const isPro = isProActive(session?.user);

  if (!isPro) {
    redirect(`/${locale}/playlists`);
  }

  const playlist = await prisma.playlist.findUnique({
    where: { id },
    include: {
      items: {
        orderBy: { order: 'asc' },
      },
    },
  });

  if (!playlist || (session?.user?.id && playlist.userId !== session.user.id)) {
    notFound();
  }

  const templates = await prisma.template.findMany({
    where: { published: true, scene: { published: true }, music: { published: true } },
    include: { scene: true, music: true, tags: true },
  });

  return (
    <PlaylistDetailClient
      locale={locale}
      playlist={playlist}
      availableTemplates={templates}
    />
  );
}
