'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useLocale, useTranslations } from 'next-intl';
import { ProUpsellModal } from '@/components/modals/ProUpsellModal';

interface PlaylistItemData {
  id?: string;
  templateId?: string | null;
  sceneId?: string | null;
  musicId?: string | null;
  minutes: number;
}

interface PlaylistRecord {
  id: string;
  name: string;
  items: PlaylistItemData[];
}

interface TemplateRecord {
  id: string;
  name: string;
  music: { name: string };
  scene: { name: string };
}

interface PlaylistsClientProps {
  isPro: boolean;
  playlists: PlaylistRecord[];
  availableTemplates: TemplateRecord[];
}

export const PlaylistsClient: React.FC<PlaylistsClientProps> = ({
  isPro,
  playlists: initialPlaylists,
  availableTemplates,
}) => {
  const locale = useLocale();
  const router = useRouter();
  const tPlaylists = useTranslations('playlists');

  const [playlists, setPlaylists] = useState<PlaylistRecord[]>(initialPlaylists);
  const [isUpsellOpen, setIsUpsellOpen] = useState<boolean>(!isPro);

  // New Journey Modal State
  const [isCreating, setIsCreating] = useState<boolean>(false);
  const [journeyTitle, setJourneyTitle] = useState<string>('');
  const [items, setItems] = useState<{ templateId: string; minutes: number }[]>([]);
  const [selectedTemplateId, setSelectedTemplateId] = useState<string>(
    availableTemplates[0]?.id || ''
  );
  const [itemDuration, setItemDuration] = useState<number>(15);
  const [isSaving, setIsSaving] = useState<boolean>(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Rule R5 calculation
  const totalMinutes = items.reduce((sum, item) => sum + item.minutes, 0);
  const isCapExceeded = totalMinutes > 720;
  const isCountExceeded = items.length > 50;
  const canSave = journeyTitle.trim().length > 0 && items.length > 0 && !isCapExceeded && !isCountExceeded;

  const handleAddItem = () => {
    if (!selectedTemplateId) return;
    setItems((prev) => [...prev, { templateId: selectedTemplateId, minutes: itemDuration }]);
    setErrorMsg(null);
  };

  const handleRemoveItem = (index: number) => {
    setItems((prev) => prev.filter((_, i) => i !== index));
  };

  const handleMoveItem = (index: number, direction: 'up' | 'down') => {
    const targetIndex = direction === 'up' ? index - 1 : index + 1;
    if (targetIndex < 0 || targetIndex >= items.length) return;

    setItems((prev) => {
      const copy = [...prev];
      const temp = copy[index];
      copy[index] = copy[targetIndex];
      copy[targetIndex] = temp;
      return copy;
    });
  };

  const handleSaveJourney = async () => {
    if (!canSave || !isPro) return;

    setIsSaving(true);
    setErrorMsg(null);

    try {
      const payload = {
        title: journeyTitle.trim(),
        items: items.map((item, index) => ({
          order: index,
          templateId: item.templateId,
          durationMinutes: item.minutes,
        })),
      };

      const res = await fetch('/api/playlists', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        const errorData = await res.json().catch(() => ({}));
        throw new Error(errorData?.error?.message || 'Failed to save journey');
      }

      const { playlist } = await res.json();
      setPlaylists((prev) => [playlist, ...prev]);
      setIsCreating(false);
      setJourneyTitle('');
      setItems([]);
    } catch (err: unknown) {
      setErrorMsg((err as Error).message || 'Error creating journey');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="relative min-h-[calc(100vh-4rem)] max-w-5xl mx-auto px-4 sm:px-6 py-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-8 border-b border-ink/10">
        <div className="space-y-1">
          <h1 className="font-serif text-3xl font-semibold text-ink tracking-tight">
            {tPlaylists('title')}
          </h1>
          <p className="text-ink-soft text-sm">
            {tPlaylists('subtitle')}
          </p>
        </div>

        <button
          type="button"
          onClick={() => {
            if (!isPro) {
              setIsUpsellOpen(true);
              return;
            }
            setIsCreating(true);
          }}
          className="px-5 py-2.5 rounded-card bg-accent hover:bg-accent-hover text-paper-light dark:text-paper font-medium text-sm transition-colors shadow-ink-sm flex items-center justify-center gap-2 self-start sm:self-auto"
        >
          <span>+ {tPlaylists('new_journey')}</span>
          {!isPro && <span>🔒</span>}
        </button>
      </div>

      {/* Playlists List */}
      <div className="py-8 space-y-4">
        {playlists.length === 0 ? (
          <div className="text-center py-16 px-4 bg-paper-light/50 border border-ink/10 rounded-sheet space-y-3">
            <p className="text-ink-soft text-sm sm:text-base">
              {tPlaylists('empty')}
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {playlists.map((pl) => {
              const count = pl.items?.length || 0;
              const totalMins = pl.items?.reduce((s, it) => s + (it.minutes || 0), 0) || 0;
              return (
                <div
                  key={pl.id}
                  className="p-5 rounded-card bg-paper-light border border-ink/10 hover:border-ink/25 shadow-ink-sm flex flex-col justify-between space-y-4 transition-all"
                >
                  <div className="space-y-1">
                    <h2 className="font-serif text-lg font-semibold text-ink line-clamp-1">
                      {pl.name}
                    </h2>
                    <p className="text-xs text-ink-soft font-mono">
                      {tPlaylists('item_count', { count })} • {totalMins} min
                    </p>
                  </div>

                  <div className="flex items-center justify-between pt-2 border-t border-ink/5">
                    <button
                      type="button"
                      onClick={() => router.push(`/${locale}/playlists/${pl.id}`)}
                      className="text-xs font-medium text-ink-soft hover:text-ink transition-colors"
                    >
                      Edit →
                    </button>
                    <button
                      type="button"
                      onClick={() => router.push(`/${locale}/playlists/${pl.id}/play`)}
                      className="px-4 py-1.5 rounded-full bg-ink text-paper text-xs font-medium shadow-ink-sm hover:scale-105 transition-transform"
                    >
                      {tPlaylists('play')} ▶
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Create Journey Modal */}
      {isCreating && (
        <div
          role="dialog"
          aria-modal="true"
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-ink/40 backdrop-blur-sm transition-opacity"
          onClick={() => setIsCreating(false)}
        >
          <div
            className="relative w-full max-w-xl bg-paper-light border border-ink/15 rounded-sheet p-6 sm:p-8 shadow-ink-md space-y-6 max-h-[90vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="space-y-1">
              <h2 className="font-serif text-2xl font-semibold text-ink">
                {tPlaylists('new_journey')}
              </h2>
              <p className="text-xs text-ink-soft">
                {tPlaylists('subtitle')}
              </p>
            </div>

            {/* Title Input */}
            <div className="space-y-1.5">
              <label className="text-xs font-semibold uppercase tracking-wider text-ink-muted">
                Journey Name
              </label>
              <input
                type="text"
                value={journeyTitle}
                onChange={(e) => setJourneyTitle(e.target.value)}
                placeholder={tPlaylists('journey_title_placeholder')}
                className="w-full px-3.5 py-2.5 rounded-card bg-paper border border-ink/15 text-ink text-sm focus:outline-none focus:border-accent"
              />
            </div>

            {/* Add Item Builder */}
            <div className="p-4 rounded-card bg-paper border border-ink/10 space-y-3">
              <h3 className="text-xs font-semibold uppercase tracking-wider text-ink-muted">
                Add Scene & Melody Item
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                <select
                  value={selectedTemplateId}
                  onChange={(e) => setSelectedTemplateId(e.target.value)}
                  className="sm:col-span-2 px-3 py-2 rounded-card bg-paper-light border border-ink/15 text-xs text-ink focus:outline-none"
                >
                  {availableTemplates.map((tpl) => (
                    <option key={tpl.id} value={tpl.id}>
                      {tpl.name} ({tpl.music.name})
                    </option>
                  ))}
                </select>
                <div className="flex items-center gap-1.5">
                  <input
                    type="number"
                    min={3}
                    max={720}
                    value={itemDuration}
                    onChange={(e) => setItemDuration(parseInt(e.target.value, 10) || 3)}
                    className="w-16 px-2 py-2 rounded-card bg-paper-light border border-ink/15 text-xs text-ink text-center"
                  />
                  <span className="text-xs text-ink-muted">min</span>
                  <button
                    type="button"
                    onClick={handleAddItem}
                    className="ml-auto px-3 py-2 rounded-card bg-ink text-paper text-xs font-medium"
                  >
                    + Add
                  </button>
                </div>
              </div>
            </div>

            {/* Items List & Reordering */}
            <div className="space-y-2">
              <div className="flex items-center justify-between text-xs text-ink-muted">
                <span>{items.length} items (max 50)</span>
                <span className={isCapExceeded ? 'text-danger font-semibold' : ''}>
                  {tPlaylists('total_duration', { minutes: totalMinutes })}
                </span>
              </div>

              {/* Rule R5 Progress Bar */}
              <div className="w-full h-1.5 bg-paper-dark rounded-full overflow-hidden">
                <div
                  className={`h-full transition-all duration-300 ${
                    isCapExceeded ? 'bg-danger' : totalMinutes > 600 ? 'bg-accent' : 'bg-ink'
                  }`}
                  style={{ width: `${Math.min(100, (totalMinutes / 720) * 100)}%` }}
                />
              </div>

              {isCapExceeded && (
                <p className="text-xs text-danger font-medium">
                  {tPlaylists('cap_warning')}
                </p>
              )}

              <div className="space-y-1.5 max-h-48 overflow-y-auto pr-1">
                {items.map((it, idx) => {
                  const tpl = availableTemplates.find((t) => t.id === it.templateId);
                  return (
                    <div
                      key={idx}
                      className="flex items-center justify-between p-2.5 rounded-card bg-paper border border-ink/10 text-xs"
                    >
                      <div className="flex items-center gap-2">
                        <span className="font-mono text-ink-muted">#{idx + 1}</span>
                        <span className="font-medium text-ink">{tpl?.name || 'Item'}</span>
                        <span className="text-ink-soft">({it.minutes}m)</span>
                      </div>

                      <div className="flex items-center gap-1.5">
                        <button
                          type="button"
                          disabled={idx === 0}
                          onClick={() => handleMoveItem(idx, 'up')}
                          className="px-1.5 py-0.5 rounded bg-paper-light border border-ink/10 text-ink-soft disabled:opacity-30"
                        >
                          ↑
                        </button>
                        <button
                          type="button"
                          disabled={idx === items.length - 1}
                          onClick={() => handleMoveItem(idx, 'down')}
                          className="px-1.5 py-0.5 rounded bg-paper-light border border-ink/10 text-ink-soft disabled:opacity-30"
                        >
                          ↓
                        </button>
                        <button
                          type="button"
                          onClick={() => handleRemoveItem(idx)}
                          className="px-1.5 py-0.5 rounded text-danger hover:bg-danger/10"
                        >
                          ✕
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {errorMsg && (
              <p className="text-xs text-danger font-medium">{errorMsg}</p>
            )}

            {/* Actions */}
            <div className="flex items-center justify-end gap-3 pt-2 border-t border-ink/10">
              <button
                type="button"
                onClick={() => setIsCreating(false)}
                className="px-4 py-2 rounded-card text-ink-soft hover:text-ink text-xs font-medium"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={!canSave || isSaving}
                onClick={handleSaveJourney}
                className="px-5 py-2.5 rounded-card bg-accent hover:bg-accent-hover text-paper-light dark:text-paper text-xs font-medium shadow-ink-sm disabled:opacity-50"
              >
                {isSaving ? 'Saving...' : tPlaylists('save')}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Dignified Pro Upsell Modal */}
      <ProUpsellModal
        isOpen={isUpsellOpen}
        onClose={() => setIsUpsellOpen(false)}
        reason="Curated multi-step journeys and sequential playback require a Pro Sanctuary subscription."
      />
    </div>
  );
};
