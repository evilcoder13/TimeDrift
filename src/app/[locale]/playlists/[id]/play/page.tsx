import React from 'react';
import { prisma } from '@/server/db';
import { getCurrentSession } from '@/server/guards';
import { isProActive } from '@/server/rules';
import { SequentialPlayerClient } from './SequentialPlayerClient';
import { notFound, redirect } from 'next/navigation';

export const dynamic = 'force-dynamic';

interface SequentialPlayPageProps {
  params: Promise<{ locale: string; id: string }>;
}

export default async function SequentialPlayPage({ params }: SequentialPlayPageProps) {
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

  if (!playlist) {
    notFound();
  }

  // Populate items and filter unpublished per Rule R12 cascade protection
  const validItems: Array<{
    id: string;
    order: number;
    minutes: number;
    title: string;
    scene: { id: string; name: string; bundlePath: string | null };
    music: { id: string; name: string; file: string | null; seconds: number };
  }> = [];

  for (const item of playlist.items) {
    if (item.templateId) {
      const template = await prisma.template.findUnique({
        where: { id: item.templateId },
        include: { scene: true, music: true },
      });
      // Skip if unpublished (R12)
      if (template && template.published && template.scene.published && template.music.published) {
        validItems.push({
          id: item.id,
          order: item.order,
          minutes: item.minutes,
          title: template.name,
          scene: {
            id: template.scene.id,
            name: template.scene.name,
            bundlePath: template.scene.bundlePath,
          },
          music: {
            id: template.music.id,
            name: template.music.name,
            file: template.music.file,
            seconds: template.music.seconds,
          },
        });
      }
    } else if (item.sceneId && item.musicId) {
      const scene = await prisma.scene.findUnique({ where: { id: item.sceneId } });
      const music = await prisma.music.findUnique({ where: { id: item.musicId } });
      // Skip if unpublished (R12)
      if (scene && scene.published && music && music.published) {
        validItems.push({
          id: item.id,
          order: item.order,
          minutes: item.minutes,
          title: `${scene.name} • ${music.name}`,
          scene: {
            id: scene.id,
            name: scene.name,
            bundlePath: scene.bundlePath,
          },
          music: {
            id: music.id,
            name: music.name,
            file: music.file,
            seconds: music.seconds,
          },
        });
      }
    }
  }

  if (validItems.length === 0) {
    redirect(`/${locale}/playlists/${id}`);
  }

  return (
    <SequentialPlayerClient
      locale={locale}
      playlistId={playlist.id}
      playlistName={playlist.name}
      items={validItems}
    />
  );
}
