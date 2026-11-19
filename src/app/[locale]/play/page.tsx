import React from 'react';
import { prisma } from '@/server/db';
import { getCurrentSession } from '@/server/guards';
import { isProActive } from '@/server/rules';
import { PlayerClient } from './PlayerClient';
import { redirect } from 'next/navigation';

export const dynamic = 'force-dynamic';

interface PlayPageProps {
  params: Promise<{ locale: string }>;
  searchParams: Promise<{
    templateId?: string;
    sceneId?: string;
    musicId?: string;
    playlistId?: string;
    duration?: string;
    random?: string;
  }>;
}

export default async function PlayPage({ params, searchParams }: PlayPageProps) {
  const { locale } = await params;
  const sParams = await searchParams;
  const session = await getCurrentSession();
  const isPro = isProActive(session?.user);

  let initialDuration = parseInt(sParams.duration || '15', 10);
  if (isNaN(initialDuration) || initialDuration < 3) initialDuration = 15;
  if (!isPro && initialDuration > 15) initialDuration = 15;

  let sceneData: { id: string; name: string; bundlePath: string | null } | null = null;
  let musicData: { id: string; name: string; file: string | null; seconds: number } | null = null;
  let templateTitle: string | null = null;

  // 1. Template-based session
  if (sParams.templateId) {
    const template = await prisma.template.findUnique({
      where: { id: sParams.templateId, published: true },
      include: {
        scene: true,
        music: true,
      },
    });

    if (template && template.scene.published && template.music.published) {
      templateTitle = template.name;
      sceneData = {
        id: template.scene.id,
        name: template.scene.name,
        bundlePath: template.scene.bundlePath,
      };
      musicData = {
        id: template.music.id,
        name: template.music.name,
        file: template.music.file,
        seconds: template.music.seconds,
      };
    }
  }

  // 2. Custom pair session
  if (!sceneData && sParams.sceneId && sParams.musicId) {
    const scene = await prisma.scene.findUnique({
      where: { id: sParams.sceneId, published: true },
    });
    const music = await prisma.music.findUnique({
      where: { id: sParams.musicId, published: true },
    });

    if (scene && music) {
      sceneData = {
        id: scene.id,
        name: scene.name,
        bundlePath: scene.bundlePath,
      };
      musicData = {
        id: music.id,
        name: music.name,
        file: music.file,
        seconds: music.seconds,
      };
    }
  }

  // 3. Random or fallback if nothing matched
  if (!sceneData || !musicData) {
    const templates = await prisma.template.findMany({
      where: {
        published: true,
        scene: { published: true },
        music: { published: true },
      },
      include: {
        scene: true,
        music: true,
      },
    });

    if (templates.length > 0) {
      const chosen = templates[Math.floor(Math.random() * templates.length)];
      templateTitle = chosen.name;
      sceneData = {
        id: chosen.scene.id,
        name: chosen.scene.name,
        bundlePath: chosen.scene.bundlePath,
      };
      musicData = {
        id: chosen.music.id,
        name: chosen.music.name,
        file: chosen.music.file,
        seconds: chosen.music.seconds,
      };
    } else {
      // Find any published scene & music
      const scene = await prisma.scene.findFirst({
        where: { published: true, bundlePath: { not: null } },
      });
      const music = await prisma.music.findFirst({
        where: { published: true, file: { not: null } },
      });

      if (scene && music) {
        sceneData = {
          id: scene.id,
          name: scene.name,
          bundlePath: scene.bundlePath,
        };
        musicData = {
          id: music.id,
          name: music.name,
          file: music.file,
          seconds: music.seconds,
        };
      }
    }
  }

  if (!sceneData || !musicData) {
    redirect(`/${locale}`);
  }

  return (
    <PlayerClient
      locale={locale}
      scene={sceneData}
      music={musicData}
      title={templateTitle || `${sceneData.name} • ${musicData.name}`}
      durationMinutes={initialDuration}
      isPro={isPro}
    />
  );
}
