'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useTranslations } from 'next-intl';

interface PlaylistItemData {
  id: string;
  templateId: string | null;
  sceneId: string | null;
  musicId: string | null;
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

interface PlaylistDetailClientProps {
  locale: string;
  playlist: PlaylistRecord;
  availableTemplates: TemplateRecord[];
}

export const PlaylistDetailClient: React.FC<PlaylistDetailClientProps> = ({
  locale,
  playlist,
  availableTemplates,
}) => {
  const router = useRouter();
  const tPlaylists = useTranslations('playlists');

  const [title, setTitle] = useState(playlist.name);
  const [items, setItems] = useState<
    { id?: string; templateId?: string | null; minutes: number }[]
  >(
    playlist.items.map((i) => ({
      id: i.id,
      templateId: i.templateId,
      minutes: i.minutes,
    }))
  );

  const [selectedTemplateId, setSelectedTemplateId] = useState(
    availableTemplates[0]?.id || ''
  );
  const [itemDuration, setItemDuration] = useState(15);
  const [isSaving, setIsSaving] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Rule R5 calculation
  const totalMinutes = items.reduce((sum, item) => sum + item.minutes, 0);
  const isCapExceeded = totalMinutes > 720;
  const isCountExceeded = items.length > 50;
  const canSave = title.trim().length > 0 && items.length > 0 && !isCapExceeded && !isCountExceeded;

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

  const handleSave = async () => {
    if (!canSave) return;
    setIsSaving(true);
    setErrorMsg(null);

    try {
      const payload = {
        title: title.trim(),
        items: items.map((item, index) => ({
          order: index,
          templateId: item.templateId,
          durationMinutes: item.minutes,
        })),
      };

      const res = await fetch(`/api/playlists/${playlist.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        const errorData = await res.json().catch(() => ({}));
        throw new Error(errorData?.error?.message || 'Failed to update playlist');
      }

      router.push(`/${locale}/playlists`);
    } catch (err: unknown) {
      setErrorMsg((err as Error).message || 'Error updating journey');
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!confirm('Are you sure you want to delete this journey?')) return;

    try {
      const res = await fetch(`/api/playlists/${playlist.id}`, {
        method: 'DELETE',
      });
      if (res.ok) {
        router.push(`/${locale}/playlists`);
      }
    } catch {}
  };

  return (
    <div className="relative min-h-[calc(100vh-4rem)] max-w-4xl mx-auto px-4 sm:px-6 py-8 space-y-6">
      {/* Top Header */}
      <div className="flex items-center justify-between pb-6 border-b border-ink/10">
        <div>
          <button
            type="button"
            onClick={() => router.push(`/${locale}/playlists`)}
            className="text-xs text-ink-soft hover:text-ink transition-colors mb-1"
          >
            ← Back to Journeys
          </button>
          <h1 className="font-serif text-2xl font-semibold text-ink">
            Edit Journey
          </h1>
        </div>

        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={handleDelete}
            className="px-3.5 py-2 rounded-card text-xs font-medium text-danger hover:bg-danger/10 transition-colors"
          >
            Delete
          </button>
          <button
            type="button"
            onClick={() => router.push(`/${locale}/playlists/${playlist.id}/play`)}
            className="px-5 py-2 rounded-card bg-ink text-paper text-xs font-medium shadow-ink-sm hover:scale-105 transition-transform"
          >
            {tPlaylists('play')} ▶
          </button>
        </div>
      </div>

      {/* Title Input */}
      <div className="space-y-1.5">
        <label className="text-xs font-semibold uppercase tracking-wider text-ink-muted">
          Journey Name
        </label>
        <input
          type="text"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          className="w-full px-3.5 py-2.5 rounded-card bg-paper-light border border-ink/15 text-ink text-sm focus:outline-none focus:border-accent"
        />
      </div>

      {/* Add Item Box */}
      <div className="p-4 rounded-card bg-paper-light border border-ink/10 space-y-3">
        <h3 className="text-xs font-semibold uppercase tracking-wider text-ink-muted">
          Add Scene & Melody Item
        </h3>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
          <select
            value={selectedTemplateId}
            onChange={(e) => setSelectedTemplateId(e.target.value)}
            className="sm:col-span-2 px-3 py-2 rounded-card bg-paper border border-ink/15 text-xs text-ink focus:outline-none"
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
              className="w-16 px-2 py-2 rounded-card bg-paper border border-ink/15 text-xs text-ink text-center"
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

      {/* Items List & Rule R5 Status */}
      <div className="space-y-3">
        <div className="flex items-center justify-between text-xs text-ink-muted">
          <span>{items.length} items (max 50)</span>
          <span className={isCapExceeded ? 'text-danger font-semibold' : ''}>
            {tPlaylists('total_duration', { minutes: totalMinutes })}
          </span>
        </div>

        {/* Progress bar */}
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

        <div className="space-y-2">
          {items.map((it, idx) => {
            const tpl = availableTemplates.find((t) => t.id === it.templateId);
            return (
              <div
                key={idx}
                className="flex items-center justify-between p-3 rounded-card bg-paper-light border border-ink/10 text-xs shadow-sm"
              >
                <div className="flex items-center gap-3">
                  <span className="font-mono text-ink-muted">#{idx + 1}</span>
                  <span className="font-medium text-ink">{tpl?.name || 'Item'}</span>
                  <span className="text-ink-soft">({it.minutes}m)</span>
                </div>

                <div className="flex items-center gap-1.5">
                  <button
                    type="button"
                    disabled={idx === 0}
                    onClick={() => handleMoveItem(idx, 'up')}
                    className="px-2 py-1 rounded bg-paper border border-ink/10 text-ink-soft disabled:opacity-30"
                  >
                    ↑
                  </button>
                  <button
                    type="button"
                    disabled={idx === items.length - 1}
                    onClick={() => handleMoveItem(idx, 'down')}
                    className="px-2 py-1 rounded bg-paper border border-ink/10 text-ink-soft disabled:opacity-30"
                  >
                    ↓
                  </button>
                  <button
                    type="button"
                    onClick={() => handleRemoveItem(idx)}
                    className="px-2 py-1 rounded text-danger hover:bg-danger/10"
                  >
                    ✕
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {errorMsg && <p className="text-xs text-danger font-medium">{errorMsg}</p>}

      {/* Save Button */}
      <div className="pt-4 border-t border-ink/10 flex justify-end">
        <button
          type="button"
          disabled={!canSave || isSaving}
          onClick={handleSave}
          className="px-6 py-3 rounded-card bg-accent hover:bg-accent-hover text-paper-light dark:text-paper text-sm font-medium shadow-ink-sm disabled:opacity-50"
        >
          {isSaving ? 'Saving...' : tPlaylists('save')}
        </button>
      </div>
    </div>
  );
};
