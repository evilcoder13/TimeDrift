'use client';

import React, { useState, useMemo, useRef, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useLocale, useTranslations } from 'next-intl';
import { ProUpsellModal } from '@/components/modals/ProUpsellModal';
import { DurationPickerSheet } from '@/components/player/DurationPickerSheet';

interface TagItem {
  id: string;
  slug: string;
  nameEn: string;
  nameVi: string;
}

interface SceneItem {
  id: string;
  name: string;
  description: string;
  bundlePath: string | null;
  tags: TagItem[];
}

interface MusicItem {
  id: string;
  name: string;
  type: string;
  seconds: number;
  file: string | null;
  tags: TagItem[];
}

interface CustomPairClientProps {
  isPro: boolean;
  scenes: SceneItem[];
  musics: MusicItem[];
}

/**
 * Calculates Jaccard similarity index between two tag arrays (Rule R7)
 * J = |A ∩ B| / |A ∪ B|
 */
function calculateJaccardScore(tagsA: TagItem[], tagsB: TagItem[]): { score: number; sharedCount: number } {
  const setA = new Set(tagsA.map((t) => t.slug));
  const setB = new Set(tagsB.map((t) => t.slug));

  let sharedCount = 0;
  for (const slug of setA) {
    if (setB.has(slug)) sharedCount++;
  }

  const unionSize = new Set([...setA, ...setB]).size;
  const score = unionSize > 0 ? Math.round((sharedCount / unionSize) * 100) : 0;

  return { score, sharedCount };
}

export const CustomPairClient: React.FC<CustomPairClientProps> = ({
  isPro,
  scenes,
  musics,
}) => {
  const locale = useLocale();
  const router = useRouter();
  const tCustom = useTranslations('custom');
  const tTags = useTranslations('tags');

  const [selectedScene, setSelectedScene] = useState<SceneItem | null>(scenes[0] || null);
  const [selectedMusic, setSelectedMusic] = useState<MusicItem | null>(musics[0] || null);

  // Audition audio state
  const [auditioningId, setAuditioningId] = useState<string | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  // Tag filter states
  const [sceneTag, setSceneTag] = useState<string>('all');
  const [musicTag, setMusicTag] = useState<string>('all');

  // Modals
  const [isUpsellOpen, setIsUpsellOpen] = useState<boolean>(!isPro);
  const [isDurationOpen, setIsDurationOpen] = useState<boolean>(false);

  // Cleanup audition audio on unmount
  useEffect(() => {
    return () => {
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current = null;
      }
    };
  }, []);

  // Filtered lists
  const filteredScenes = useMemo(() => {
    if (sceneTag === 'all') return scenes;
    return scenes.filter((s) => s.tags.some((t) => t.slug === sceneTag));
  }, [scenes, sceneTag]);

  const filteredMusics = useMemo(() => {
    if (musicTag === 'all') return musics;
    return musics.filter((m) => m.tags.some((t) => t.slug === musicTag));
  }, [musics, musicTag]);

  // Jaccard similarity score
  const compatibility = useMemo(() => {
    if (!selectedScene || !selectedMusic) return { score: 0, sharedCount: 0 };
    return calculateJaccardScore(selectedScene.tags, selectedMusic.tags);
  }, [selectedScene, selectedMusic]);

  // Audio audition (15s audition with gentle stop)
  const toggleAudition = (music: MusicItem) => {
    if (!music.file) return;

    if (auditioningId === music.id) {
      if (audioRef.current) {
        audioRef.current.pause();
      }
      setAuditioningId(null);
      return;
    }

    if (audioRef.current) {
      audioRef.current.pause();
    }

    const audioUrl = `/media/audio/${music.file.replace(/^storage\/audio\//, '').replace(/^seed\/audio\//, '')}`;
    const audio = new Audio(audioUrl);
    audioRef.current = audio;
    setAuditioningId(music.id);

    audio.play().catch(() => {
      setAuditioningId(null);
    });

    // Auto-stop after 15 seconds
    setTimeout(() => {
      if (audioRef.current === audio) {
        audio.pause();
        setAuditioningId(null);
      }
    }, 15000);
  };

  const handleLaunchDrift = () => {
    if (!isPro) {
      setIsUpsellOpen(true);
      return;
    }
    if (!selectedScene || !selectedMusic) return;
    setIsDurationOpen(true);
  };

  const handleStartSession = (minutes: number) => {
    setIsDurationOpen(false);
    if (!selectedScene || !selectedMusic) return;
    router.push(
      `/${locale}/play?sceneId=${selectedScene.id}&musicId=${selectedMusic.id}&duration=${minutes}`
    );
  };

  return (
    <div className="relative min-h-[calc(100vh-4rem)] max-w-7xl mx-auto px-4 sm:px-6 py-8">
      {/* Studio Header */}
      <div className="max-w-2xl mx-auto text-center space-y-3 pb-8">
        <h1 className="font-serif text-3xl sm:text-4xl font-semibold text-ink tracking-tight">
          {tCustom('title')}
        </h1>
        <p className="text-ink-soft text-sm sm:text-base leading-relaxed">
          {tCustom('subtitle')}
        </p>
      </div>

      {/* Main Split Browser */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 pb-32">
        {/* Left Column: Scene Selector */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="font-serif text-lg font-semibold text-ink">
              {tCustom('step_scene')}
            </h2>
            <span className="text-xs text-ink-muted">
              {filteredScenes.length} scenes
            </span>
          </div>

          {/* Scene Tag Chips */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-2 no-scrollbar">
            {['all', 'calm', 'night', 'nature', 'rain', 'cozy'].map((tag) => (
              <button
                key={tag}
                type="button"
                onClick={() => setSceneTag(tag)}
                className={`whitespace-nowrap px-3 py-1 rounded-full text-xs font-medium transition-colors ${
                  sceneTag === tag
                    ? 'bg-ink text-paper'
                    : 'bg-paper-light text-ink-soft border border-ink/10 hover:border-ink/25'
                }`}
              >
                #{tag}
              </button>
            ))}
          </div>

          {/* Scene Cards Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 max-h-[520px] overflow-y-auto pr-1">
            {filteredScenes.map((scene) => {
              const isSelected = selectedScene?.id === scene.id;
              return (
                <div
                  key={scene.id}
                  onClick={() => setSelectedScene(scene)}
                  className={`cursor-pointer rounded-card p-3 border transition-all ${
                    isSelected
                      ? 'bg-paper-light border-accent shadow-ink-sm ring-1 ring-accent'
                      : 'bg-paper-light/60 border-ink/10 hover:border-ink/25 hover:bg-paper-light'
                  }`}
                >
                  <div className="aspect-video w-full rounded bg-paper-dark flex items-center justify-center text-ink-soft/40 text-2xl mb-2">
                    ◯
                  </div>
                  <h3 className="font-serif text-sm font-semibold text-ink line-clamp-1">
                    {scene.name}
                  </h3>
                  <div className="flex gap-1 mt-1.5 flex-wrap">
                    {scene.tags.slice(0, 2).map((t) => (
                      <span
                        key={t.id}
                        className="text-[10px] px-1.5 py-0.5 rounded-full bg-paper border border-ink/10 text-ink-soft"
                      >
                        #{locale === 'vi' ? t.nameVi : t.nameEn}
                      </span>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Right Column: Melody Selector */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="font-serif text-lg font-semibold text-ink">
              {tCustom('step_music')}
            </h2>
            <span className="text-xs text-ink-muted">
              {filteredMusics.length} tracks
            </span>
          </div>

          {/* Melody Tag Chips */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-2 no-scrollbar">
            {['all', 'calm', 'piano', 'ambient', 'acoustic', 'warm'].map((tag) => (
              <button
                key={tag}
                type="button"
                onClick={() => setMusicTag(tag)}
                className={`whitespace-nowrap px-3 py-1 rounded-full text-xs font-medium transition-colors ${
                  musicTag === tag
                    ? 'bg-ink text-paper'
                    : 'bg-paper-light text-ink-soft border border-ink/10 hover:border-ink/25'
                }`}
              >
                #{tag}
              </button>
            ))}
          </div>

          {/* Music List */}
          <div className="space-y-2.5 max-h-[520px] overflow-y-auto pr-1">
            {filteredMusics.map((music) => {
              const isSelected = selectedMusic?.id === music.id;
              const isAuditioning = auditioningId === music.id;
              return (
                <div
                  key={music.id}
                  onClick={() => setSelectedMusic(music)}
                  className={`cursor-pointer rounded-card p-3 border transition-all flex items-center justify-between gap-3 ${
                    isSelected
                      ? 'bg-paper-light border-accent shadow-ink-sm ring-1 ring-accent'
                      : 'bg-paper-light/60 border-ink/10 hover:border-ink/25 hover:bg-paper-light'
                  }`}
                >
                  <div className="space-y-0.5 flex-1 min-w-0">
                    <h3 className="font-serif text-sm font-semibold text-ink line-clamp-1">
                      {music.name}
                    </h3>
                    <p className="text-xs text-ink-soft capitalize">
                      {music.type} • {music.seconds}s loop
                    </p>
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        toggleAudition(music);
                      }}
                      className="px-2.5 py-1 rounded-full text-xs font-medium bg-paper border border-ink/10 hover:border-ink/30 text-ink"
                    >
                      {isAuditioning ? tCustom('audition_stop') : tCustom('audition')}
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Sticky Bottom Action Tray & Jaccard Compatibility Badge (Rule R7) */}
      <div className="fixed bottom-0 left-0 right-0 z-30 bg-paper/95 backdrop-blur-md border-t border-ink/15 py-4 px-4 sm:px-6 shadow-ink-md">
        <div className="max-w-4xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
          {/* Pair Summary & Compatibility Badge */}
          <div className="flex items-center gap-4 text-left w-full sm:w-auto">
            <div className="space-y-0.5">
              <p className="text-xs font-mono uppercase text-ink-muted tracking-wider">
                Active Selection
              </p>
              <h3 className="font-serif text-base font-semibold text-ink line-clamp-1">
                {selectedScene?.name || '—'} & {selectedMusic?.name || '—'}
              </h3>
            </div>

            {/* Jaccard Badge */}
            <div className="ml-auto sm:ml-4 inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-accent/15 border border-accent/30 text-accent text-xs font-medium">
              <span>✦</span>
              <span>
                {tCustom('match_score', { score: compatibility.score })}
              </span>
              {compatibility.sharedCount > 0 && (
                <span className="text-[10px] text-ink-soft hidden sm:inline">
                  ({compatibility.sharedCount} shared tags)
                </span>
              )}
            </div>
          </div>

          {/* Action CTA */}
          <div className="w-full sm:w-auto flex items-center gap-3">
            <button
              type="button"
              onClick={handleLaunchDrift}
              disabled={!selectedScene || !selectedMusic}
              className="w-full sm:w-auto px-6 py-3 rounded-card bg-accent hover:bg-accent-hover text-paper-light dark:text-paper font-medium text-sm transition-all shadow-ink-sm flex items-center justify-center gap-2 disabled:opacity-50"
            >
              <span>{tCustom('play_custom')}</span>
              {!isPro && <span>🔒</span>}
              {isPro && <span>→</span>}
            </button>
          </div>
        </div>
      </div>

      {/* Pro Sanctuary Upsell Modal */}
      <ProUpsellModal
        isOpen={isUpsellOpen}
        onClose={() => setIsUpsellOpen(false)}
        reason={tCustom('pro_required_desc')}
      />

      {/* Duration Picker Sheet */}
      <DurationPickerSheet
        isOpen={isDurationOpen}
        onClose={() => setIsDurationOpen(false)}
        onStart={handleStartSession}
        isPro={isPro}
        templateTitle={`${selectedScene?.name} • ${selectedMusic?.name}`}
      />
    </div>
  );
};
