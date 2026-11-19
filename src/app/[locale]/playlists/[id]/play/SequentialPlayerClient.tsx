'use client';

import React from 'react';

interface SequentialPlayerClientProps {
  locale: string;
  playlistId: string;
  playlistName: string;
  items: Array<{
    id: string;
    order: number;
    minutes: number;
    title: string;
    scene: { id: string; name: string; bundlePath: string | null };
    music: { id: string; name: string; file: string | null; seconds: number };
  }>;
}

export function SequentialPlayerClient({ playlistName }: SequentialPlayerClientProps) {
  return (
    <div className="p-8 text-center">
      <h1 className="text-2xl font-serif">{playlistName}</h1>
      <p className="text-sm opacity-75 mt-2">Sequential Player Initializing...</p>
    </div>
  );
}
