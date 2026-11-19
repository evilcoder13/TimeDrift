"use client";

import React, { useState, useEffect, useRef } from "react";
import {
  Layers,
  Sparkles,
  Music,
  Film,
  Plus,
  Play,
  Pause,
  Trash2,
  CheckCircle,
  AlertCircle,
  X,
  Volume2,
} from "lucide-react";
import { SceneFrame } from "@/components/player/SceneFrame";

interface TagItem {
  id: string;
  slug: string;
  nameEn: string;
}

interface SceneItem {
  id: string;
  name: string;
  published: boolean;
  status: string;
  bundlePath: string | null;
  tags: TagItem[];
}

interface MusicItem {
  id: string;
  name: string;
  type: string;
  file: string | null;
  published: boolean;
  status: string;
  tags: TagItem[];
}

interface Suggestion {
  music: MusicItem;
  score: number;
  sharedTags: TagItem[];
}

interface TemplateItem {
  id: string;
  name: string;
  published: boolean;
  scene: SceneItem;
  music: MusicItem;
  tags: TagItem[];
}

export default function TemplateBuilderPage() {
  const [templates, setTemplates] = useState<TemplateItem[]>([]);
  const [scenes, setScenes] = useState<SceneItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Suggestion Builder State
  const [selectedSceneId, setSelectedSceneId] = useState<string>("");
  const [selectedMusicId, setSelectedMusicId] = useState<string>("");
  const [templateName, setTemplateName] = useState<string>("");
  const [suggestions, setSuggestions] = useState<Suggestion[]>([]);
  const [loadingSuggestions, setLoadingSuggestions] = useState(false);
  const [showLowSimilarity, setShowLowSimilarity] = useState(false);
  const [creating, setCreating] = useState(false);

  // Synchronized Audition State
  const [isAuditioning, setIsAuditioning] = useState(false);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [tRes, sRes] = await Promise.all([
        fetch("/api/admin/templates"),
        fetch("/api/admin/scenes"),
      ]);
      if (tRes.ok) {
        const tData = await tRes.json();
        setTemplates(tData.templates || []);
      }
      if (sRes.ok) {
        const sData = await sRes.json();
        // Only published ready scenes can form published templates
        setScenes(sData.scenes || []);
        if (sData.scenes?.length > 0 && !selectedSceneId) {
          setSelectedSceneId(sData.scenes[0].id);
        }
      }
    } catch {
      setError("Failed to load template data");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  // Fetch suggestions when selectedSceneId changes
  useEffect(() => {
    if (!selectedSceneId) return;

    const fetchSuggestions = async () => {
      setLoadingSuggestions(true);
      try {
        const res = await fetch(`/api/admin/templates/suggest?sceneId=${selectedSceneId}`);
        if (res.ok) {
          const data = await res.json();
          setSuggestions(data.suggestions || []);
          if (data.suggestions?.length > 0) {
            setSelectedMusicId(data.suggestions[0].music.id);
            // Default template title
            const activeScene = scenes.find((s) => s.id === selectedSceneId);
            if (activeScene) {
              setTemplateName(`${activeScene.name} & ${data.suggestions[0].music.name}`);
            }
          }
        }
      } catch {
        console.error("Suggestion fetch failed");
      } finally {
        setLoadingSuggestions(false);
      }
    };

    fetchSuggestions();
  }, [selectedSceneId, scenes]);

  const selectedScene = scenes.find((s) => s.id === selectedSceneId);
  const selectedSuggestion = suggestions.find((s) => s.music.id === selectedMusicId);
  const selectedMusic = selectedSuggestion?.music;

  // Rule R8 check: Can publish template only if BOTH scene and music are published
  const canPublish = selectedScene?.published && selectedMusic?.published;

  const handleCreateTemplate = async (publishImmediate: boolean) => {
    if (!selectedSceneId || !selectedMusicId || !templateName) return;
    setCreating(true);
    setError(null);

    try {
      const res = await fetch("/api/admin/templates", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: templateName,
          sceneId: selectedSceneId,
          musicId: selectedMusicId,
          published: publishImmediate,
        }),
      });

      if (!res.ok) {
        const err = await res.json();
        setError(err.error?.message || "Failed to create template (Rule R8 check)");
      } else {
        fetchData();
        setIsAuditioning(false);
      }
    } catch {
      setError("Error creating template");
    } finally {
      setCreating(false);
    }
  };

  const toggleTemplatePublish = async (tpl: TemplateItem) => {
    try {
      const res = await fetch(`/api/admin/templates/${tpl.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ published: !tpl.published }),
      });
      if (res.ok) {
        fetchData();
      } else {
        const err = await res.json();
        alert(err.error?.message || "Cannot toggle publish (Rule R8)");
      }
    } catch {
      alert("Error toggling publish");
    }
  };

  const handleDeleteTemplate = async (tplId: string) => {
    try {
      const res = await fetch(`/api/admin/templates/${tplId}`, { method: "DELETE" });
      if (res.ok) {
        fetchData();
      }
    } catch {
      alert("Error deleting template");
    }
  };

  const toggleAudition = () => {
    if (isAuditioning) {
      if (audioRef.current) audioRef.current.pause();
      setIsAuditioning(false);
    } else {
      if (selectedMusic && audioRef.current) {
        const audioUrl = selectedMusic.file?.startsWith("storage/audio/")
          ? `/media/audio/${selectedMusic.file.replace("storage/audio/", "")}`
          : `/media/audio/${selectedMusic.id}.ogg`;
        audioRef.current.src = audioUrl;
        audioRef.current.play().catch(() => {});
        setIsAuditioning(true);
      }
    }
  };

  // Filter suggestions by minimum score (Rule R7: hide < 0.2 by default)
  const displayedSuggestions = suggestions.filter((s) => showLowSimilarity || s.score >= 0.2);

  const bundleFilename = selectedScene?.bundlePath ? selectedScene.bundlePath.split("/").pop() : `${selectedScene?.id}.bundle.js`;
  const bundleUrl = selectedScene?.status === "READY" ? `/media/scenes/${bundleFilename}` : undefined;

  return (
    <div className="space-y-8">
      <audio ref={audioRef} loop onEnded={() => {}} />

      {/* Header */}
      <div className="pb-4 border-b border-ink/10">
        <div className="flex items-center gap-2 mb-1">
          <span className="font-mono text-xs px-2 py-0.5 rounded bg-accent/10 text-accent font-semibold">AD-4</span>
          <h1 className="font-serif text-2xl font-medium text-ink">Template Builder & Jaccard Matcher</h1>
        </div>
        <p className="text-xs text-ink-soft">
          Ranked pairing via Jaccard tag similarity (Rule R7) and publish integrity verification (Rule R8).
        </p>
      </div>

      {error && (
        <div className="p-4 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-600 dark:text-rose-400 text-xs font-mono flex items-center justify-between">
          <span>{error}</span>
          <button onClick={() => setError(null)}><X className="w-4 h-4" /></button>
        </div>
      )}

      {/* Interactive Assembly Workspace */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column: Scene Selector & Candidate Melodies (7 cols) */}
        <div className="lg:col-span-7 space-y-4">
          <div className="p-5 rounded-2xl border border-ink/10 bg-paper-light space-y-4">
            <h3 className="font-serif text-base font-medium text-ink flex items-center gap-2">
              <Film className="w-4 h-4 text-accent" />
              1. Choose Animated Scene
            </h3>

            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5 max-h-48 overflow-y-auto pr-1">
              {scenes.map((s) => (
                <button
                  key={s.id}
                  onClick={() => setSelectedSceneId(s.id)}
                  className={`p-3 rounded-xl border text-left transition-all ${
                    selectedSceneId === s.id
                      ? "border-accent bg-accent/10 shadow-sm"
                      : "border-ink/10 bg-paper hover:border-ink/20"
                  }`}
                >
                  <div className="font-medium text-xs text-ink truncate">{s.name}</div>
                  <div className="text-[10px] text-ink-muted truncate font-mono">
                    {s.tags.map((t) => t.slug).join(", ")}
                  </div>
                  {!s.published && (
                    <span className="inline-block mt-1 text-[9px] px-1 rounded bg-amber-500/15 text-amber-600 font-mono">
                      Draft (R8 note)
                    </span>
                  )}
                </button>
              ))}
            </div>
          </div>

          {/* Jaccard Melodies List */}
          <div className="p-5 rounded-2xl border border-ink/10 bg-paper-light space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="font-serif text-base font-medium text-ink flex items-center gap-2">
                <Music className="w-4 h-4 text-accent" />
                2. Recommended Melodies (Rule R7 Jaccard Ranking)
              </h3>
              <label className="flex items-center gap-1.5 text-xs text-ink-soft cursor-pointer">
                <input
                  type="checkbox"
                  checked={showLowSimilarity}
                  onChange={(e) => setShowLowSimilarity(e.target.checked)}
                  className="accent-accent"
                />
                <span>Show low similarity (&lt; 0.2)</span>
              </label>
            </div>

            {loadingSuggestions ? (
              <div className="py-8 text-center text-xs text-ink-muted">
                Calculating Jaccard tag similarity index...
              </div>
            ) : (
              <div className="space-y-2 max-h-72 overflow-y-auto pr-1">
                {displayedSuggestions.map((sug) => {
                  const isSelected = selectedMusicId === sug.music.id;
                  const sharedCount = sug.sharedTags.length;
                  return (
                    <button
                      key={sug.music.id}
                      onClick={() => setSelectedMusicId(sug.music.id)}
                      className={`w-full p-3.5 rounded-xl border text-left flex items-center justify-between transition-all ${
                        isSelected
                          ? "border-accent bg-accent/10 shadow-sm"
                          : "border-ink/10 bg-paper hover:border-ink/20"
                      }`}
                    >
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <span className="font-medium text-xs text-ink">{sug.music.name}</span>
                          <span className="text-[10px] font-mono uppercase px-1.5 py-0.5 rounded bg-ink/5 text-ink-soft">
                            {sug.music.type}
                          </span>
                          {!sug.music.published && (
                            <span className="text-[9px] px-1 rounded bg-amber-500/15 text-amber-600 font-mono">
                              Draft
                            </span>
                          )}
                        </div>
                        <div className="text-[10px] text-ink-muted flex items-center gap-2">
                          <span>Shared tags: {sug.sharedTags.map((t) => t.slug).join(", ") || "None"}</span>
                          {sharedCount >= 2 && (
                            <span className="text-emerald-600 dark:text-emerald-400 font-medium">
                              (Director &ge; 2 target passed)
                            </span>
                          )}
                        </div>
                      </div>

                      {/* Score Badge */}
                      <div className="text-right flex flex-col items-end">
                        <span className="text-xs font-mono font-bold text-accent">
                          Score: {(sug.score * 100).toFixed(0)}%
                        </span>
                        <span className="text-[10px] font-mono text-ink-muted">
                          Jaccard: {sug.score.toFixed(2)}
                        </span>
                      </div>
                    </button>
                  );
                })}
                {displayedSuggestions.length === 0 && (
                  <div className="py-6 text-center text-xs text-ink-muted">
                    No matching melody tracks found.
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Right Column: Unified Audition & Publish Cockpit (5 cols) */}
        <div className="lg:col-span-5 space-y-4">
          <div className="p-5 rounded-2xl border border-ink/10 bg-paper-light space-y-4 sticky top-24">
            <h3 className="font-serif text-base font-medium text-ink flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-accent" />
              Unified Audition & Creation
            </h3>

            {/* Live Synchronized Mini-Preview */}
            <div className="rounded-xl overflow-hidden aspect-[16/9] bg-paper border border-ink/10 relative flex items-center justify-center">
              {bundleUrl ? (
                <SceneFrame
                  bundleUrl={bundleUrl}
                  sceneId={selectedScene?.id}
                  className="w-full h-full"
                  paused={!isAuditioning}
                />
              ) : (
                <div className="text-xs text-ink-muted text-center p-4">
                  Select a validated scene to audition.
                </div>
              )}

              {/* Audition Play/Pause floating toggle */}
              <button
                onClick={toggleAudition}
                className="absolute bottom-3 right-3 px-3 py-1.5 rounded-full bg-ink/90 text-paper text-xs font-medium flex items-center gap-1.5 shadow-lg hover:bg-ink transition-colors"
              >
                {isAuditioning ? <Pause className="w-3.5 h-3.5" /> : <Play className="w-3.5 h-3.5" />}
                {isAuditioning ? "Pause Audition" : "Sync Audition"}
              </button>
            </div>

            {/* Template Title Input */}
            <div className="space-y-1">
              <label className="block text-xs font-medium text-ink">Template Title</label>
              <input
                type="text"
                value={templateName}
                onChange={(e) => setTemplateName(e.target.value)}
                placeholder="e.g. Rainy Porch & Felt Piano"
                className="w-full px-3 py-2 rounded-xl border border-ink/15 bg-paper text-xs text-ink focus:border-accent outline-none"
              />
            </div>

            {/* Rule R8 Guard Indicator */}
            <div className={`p-3 rounded-xl border text-xs font-mono space-y-1 ${
              canPublish
                ? "bg-emerald-500/10 border-emerald-500/20 text-emerald-700 dark:text-emerald-400"
                : "bg-amber-500/10 border-amber-500/20 text-amber-700 dark:text-amber-400"
            }`}>
              <div className="flex items-center gap-1.5 font-semibold">
                {canPublish ? <CheckCircle className="w-4 h-4" /> : <AlertCircle className="w-4 h-4" />}
                Rule R8 Publish Status
              </div>
              <div>
                Scene Published: {selectedScene?.published ? "Yes (✓)" : "No (Draft)"} · Melody Published: {selectedMusic?.published ? "Yes (✓)" : "No (Draft)"}
              </div>
              {!canPublish && (
                <div className="text-[10px] mt-1 text-ink-soft">
                  Both items must be published to enable live template broadcast. Draft creation allowed.
                </div>
              )}
            </div>

            {/* Creation Buttons */}
            <div className="grid grid-cols-2 gap-2 pt-2">
              <button
                type="button"
                onClick={() => handleCreateTemplate(false)}
                disabled={creating || !templateName}
                className="px-4 py-2.5 rounded-xl border border-ink/15 text-xs text-ink hover:bg-ink/5 font-medium transition-colors"
              >
                Save as Draft
              </button>

              <button
                type="button"
                onClick={() => handleCreateTemplate(true)}
                disabled={creating || !canPublish || !templateName}
                className={`px-4 py-2.5 rounded-xl text-xs font-medium transition-colors shadow-sm ${
                  canPublish
                    ? "bg-accent text-paper-light hover:bg-accent-hover"
                    : "bg-ink/10 text-ink-muted cursor-not-allowed"
                }`}
                title={!canPublish ? "Rule R8: Both scene and melody must be published" : ""}
              >
                Publish Live (R8)
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Existing Templates Table */}
      <div className="p-5 rounded-2xl border border-ink/10 bg-paper-light space-y-4">
        <h3 className="font-serif text-lg font-medium text-ink flex items-center gap-2">
          <Layers className="w-5 h-5 text-accent" />
          Published & Draft Templates Catalog ({templates.length})
        </h3>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-ink/10 text-ink-muted uppercase tracking-wider font-mono">
                <th className="py-3 px-4">Template</th>
                <th className="py-3 px-4">Scene Part</th>
                <th className="py-3 px-4">Melody Part</th>
                <th className="py-3 px-4">Tags</th>
                <th className="py-3 px-4">Published (R8)</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-ink/5">
              {templates.map((tpl) => (
                <tr key={tpl.id} className="hover:bg-ink/[0.02] transition-colors">
                  <td className="py-3 px-4 font-medium text-ink">
                    <div className="flex items-center gap-2">
                      <Layers className="w-3.5 h-3.5 text-accent" />
                      {tpl.name}
                    </div>
                  </td>
                  <td className="py-3 px-4 text-ink-soft">
                    {tpl.scene?.name}
                    {!tpl.scene?.published && (
                      <span className="text-[10px] text-amber-500 ml-1 font-mono">(Draft)</span>
                    )}
                  </td>
                  <td className="py-3 px-4 text-ink-soft">
                    {tpl.music?.name}
                    {!tpl.music?.published && (
                      <span className="text-[10px] text-amber-500 ml-1 font-mono">(Draft)</span>
                    )}
                  </td>
                  <td className="py-3 px-4">
                    <div className="flex flex-wrap gap-1">
                      {tpl.tags.map((t) => (
                        <span key={t.id} className="px-1.5 py-0.5 rounded text-[10px] bg-ink/5 text-ink-soft font-mono">
                          {t.slug}
                        </span>
                      ))}
                    </div>
                  </td>
                  <td className="py-3 px-4">
                    <button
                      onClick={() => toggleTemplatePublish(tpl)}
                      className={`px-2.5 py-1 rounded-full text-[11px] font-medium transition-colors ${
                        tpl.published
                          ? "bg-emerald-500/15 text-emerald-600 dark:text-emerald-400"
                          : "bg-ink/10 text-ink-muted"
                      }`}
                    >
                      {tpl.published ? "Published" : "Draft"}
                    </button>
                  </td>
                  <td className="py-3 px-4 text-right">
                    <button
                      onClick={() => handleDeleteTemplate(tpl.id)}
                      className="p-1.5 rounded-lg hover:bg-rose-500/10 text-rose-500 transition-colors"
                      title="Delete template"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </td>
                </tr>
              ))}
              {templates.length === 0 && (
                <tr>
                  <td colSpan={6} className="py-8 text-center text-ink-muted">
                    No templates built yet. Select a scene and recommended melody above to create one.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
