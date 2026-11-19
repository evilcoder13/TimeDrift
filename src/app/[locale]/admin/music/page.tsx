"use client";

import React, { useState, useEffect, useRef } from "react";
import {
  Music as MusicIcon,
  Plus,
  Play,
  Pause,
  RotateCcw,
  RefreshCw,
  Trash2,
  CheckCircle,
  Clock,
  Radio,
  Sliders,
  AlertCircle,
  X,
  Volume2,
} from "lucide-react";

interface TagItem {
  id: string;
  slug: string;
  nameEn: string;
}

interface MusicTrack {
  id: string;
  name: string;
  type: string;
  prompt: string;
  seconds: number;
  file: string | null;
  durationSec: number | null;
  status: string;
  published: boolean;
  tags: TagItem[];
  _count: {
    templates: number;
  };
  createdAt: string;
}

const TRACK_TYPES = [
  "lofi",
  "piano",
  "ambient",
  "acoustic",
  "strings",
  "nature-ambient",
  "chillhop",
  "music-box",
];

export default function MusicStudioPage() {
  const [tracks, setTracks] = useState<MusicTrack[]>([]);
  const [allTags, setAllTags] = useState<TagItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Generate / Regenerate Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [regenTarget, setRegenTarget] = useState<MusicTrack | null>(null);
  const [formName, setFormName] = useState("");
  const [formType, setFormType] = useState("piano");
  const [formSeconds, setFormSeconds] = useState<30 | 45 | 60>(45);
  const [formPrompt, setFormPrompt] = useState("");
  const [formSelectedTags, setFormSelectedTags] = useState<string[]>([]);
  const [submitting, setSubmitting] = useState(false);

  // Delete modal state
  const [deletingTrack, setDeletingTrack] = useState<MusicTrack | null>(null);
  const [deleteConflictRefs, setDeleteConflictRefs] = useState<{ id: string; name: string }[] | null>(null);

  // Audition Player State
  const [activeAudition, setActiveAudition] = useState<MusicTrack | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [loopCount, setLoopCount] = useState(0);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [continuous3Loop, setContinuous3Loop] = useState(true);

  const audioRef = useRef<HTMLAudioElement | null>(null);

  const fetchTracks = async () => {
    setLoading(true);
    try {
      const [mRes, tRes] = await Promise.all([
        fetch("/api/admin/music"),
        fetch("/api/admin/tags"),
      ]);
      if (mRes.ok) {
        const mData = await mRes.json();
        setTracks(mData.music || []);
      }
      if (tRes.ok) {
        const tData = await tRes.json();
        setAllTags(tData.tags || []);
      }
    } catch {
      setError("Failed to fetch music tracks.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTracks();
  }, []);

  const openGenerateModal = () => {
    setRegenTarget(null);
    setFormName("");
    setFormType("piano");
    setFormSeconds(45);
    setFormPrompt("soft solo piano, gentle rain mood, 65 bpm, warm reverb, sparse melody, no vocals, loopable");
    setFormSelectedTags(allTags.slice(0, 2).map((t) => t.id));
    setIsModalOpen(true);
  };

  const openRegenerateModal = (t: MusicTrack) => {
    setRegenTarget(t);
    setFormName(t.name);
    setFormType(t.type);
    setFormSeconds(t.seconds as 30 | 45 | 60);
    setFormPrompt(t.prompt);
    setFormSelectedTags(t.tags.map((tag) => tag.id));
    setIsModalOpen(true);
  };

  const handleGenerate = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setError(null);

    try {
      if (regenTarget) {
        const res = await fetch(`/api/admin/music/${regenTarget.id}/regenerate`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ prompt: formPrompt }),
        });
        if (!res.ok) {
          const err = await res.json();
          setError(err.error?.message || "Failed to regenerate track.");
        } else {
          setIsModalOpen(false);
          fetchTracks();
        }
      } else {
        const res = await fetch("/api/admin/music", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            name: formName,
            type: formType,
            prompt: formPrompt,
            seconds: formSeconds,
            tagIds: formSelectedTags,
          }),
        });
        if (!res.ok) {
          const err = await res.json();
          setError(err.error?.message || "Failed to enqueue music generation.");
        } else {
          setIsModalOpen(false);
          fetchTracks();
        }
      }
    } catch {
      setError("Error communicating with server.");
    } finally {
      setSubmitting(false);
    }
  };

  const togglePublish = async (track: MusicTrack) => {
    setError(null);
    try {
      const res = await fetch(`/api/admin/music/${track.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ published: !track.published }),
      });
      if (!res.ok) {
        const err = await res.json();
        setError(err.error?.message || "Failed to update publish state (Rule R10 check).");
      } else {
        fetchTracks();
      }
    } catch {
      setError("Error updating publish status.");
    }
  };

  const handleDelete = async () => {
    if (!deletingTrack) return;
    try {
      const res = await fetch(`/api/admin/music/${deletingTrack.id}`, {
        method: "DELETE",
      });
      if (res.ok) {
        setDeletingTrack(null);
        setDeleteConflictRefs(null);
        fetchTracks();
      } else {
        const errJson = await res.json();
        if (errJson.error?.code === "CONFLICT_IN_USE") {
          setDeleteConflictRefs(errJson.error.references || []);
        } else {
          setError(errJson.error?.message || "Failed to delete track");
        }
      }
    } catch {
      setError("Error deleting track");
    }
  };

  // Audition Controls
  const startAudition = (track: MusicTrack) => {
    setActiveAudition(track);
    setLoopCount(0);
    setCurrentTime(0);
    setIsPlaying(true);
    if (audioRef.current) {
      // Audio stream path
      const audioUrl = track.file?.startsWith("storage/audio/")
        ? `/media/audio/${track.file.replace("storage/audio/", "")}`
        : `/media/audio/${track.id}.ogg`;
      audioRef.current.src = audioUrl;
      audioRef.current.play().catch(() => setIsPlaying(false));
    }
  };

  const togglePlayPause = () => {
    if (!audioRef.current) return;
    if (isPlaying) {
      audioRef.current.pause();
      setIsPlaying(false);
    } else {
      audioRef.current.play().catch(() => {});
      setIsPlaying(true);
    }
  };

  const scrubToSeam = () => {
    if (!audioRef.current) return;
    const seamPoint = Math.max(0, (audioRef.current.duration || 30) - 5);
    audioRef.current.currentTime = seamPoint;
    audioRef.current.play();
    setIsPlaying(true);
  };

  const handleAudioEnded = () => {
    if (!audioRef.current) return;
    if (continuous3Loop) {
      if (loopCount < 2) {
        setLoopCount((prev) => prev + 1);
        audioRef.current.currentTime = 0;
        audioRef.current.play();
      } else {
        setIsPlaying(false);
        setLoopCount(3);
      }
    } else {
      audioRef.current.currentTime = 0;
      audioRef.current.play();
    }
  };

  return (
    <div className="space-y-6">
      {/* Audio element */}
      <audio
        ref={audioRef}
        onTimeUpdate={() => {
          if (audioRef.current) {
            setCurrentTime(audioRef.current.currentTime);
            setDuration(audioRef.current.duration || 0);
          }
        }}
        onEnded={handleAudioEnded}
      />

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-ink/10">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="font-mono text-xs px-2 py-0.5 rounded bg-accent/10 text-accent font-semibold">AD-2</span>
            <h1 className="font-serif text-2xl font-medium text-ink">Music Studio & Loop Seam Audition</h1>
          </div>
          <p className="text-xs text-ink-soft">
            CPU MusicGen generation, 3-loop audition inspector, and R10/R12 governance checks.
          </p>
        </div>

        <button
          onClick={openGenerateModal}
          className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-accent text-paper-light hover:bg-accent-hover text-sm font-medium transition-colors shadow-sm"
        >
          <Plus className="w-4 h-4" /> Generate Loop Track
        </button>
      </div>

      {error && (
        <div className="p-4 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-600 dark:text-rose-400 text-xs font-mono flex items-center justify-between">
          <span>{error}</span>
          <button onClick={() => setError(null)}><X className="w-4 h-4" /></button>
        </div>
      )}

      {/* Audition Dock */}
      {activeAudition && (
        <div className="p-5 rounded-2xl border border-accent/30 bg-paper-light shadow-xl animate-fade-in space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-accent/10 text-accent flex items-center justify-center animate-pulse">
                <MusicIcon className="w-5 h-5" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="font-serif font-medium text-ink text-base">{activeAudition.name}</h3>
                  <span className="text-[10px] font-mono uppercase px-2 py-0.5 rounded bg-ink/5 text-ink-soft">
                    {activeAudition.type}
                  </span>
                </div>
                <div className="text-xs text-ink-muted">
                  Loop Iteration: <strong className="font-mono text-accent">{loopCount + 1} of 3</strong>
                  {continuous3Loop ? " (Continuous 3-Loop Mode)" : " (Infinite Loop Mode)"}
                </div>
              </div>
            </div>

            {/* Playback action buttons */}
            <div className="flex items-center gap-2">
              <button
                onClick={togglePlayPause}
                className="px-4 py-2 rounded-xl bg-ink text-paper hover:bg-ink-soft text-xs font-medium flex items-center gap-2 transition-colors"
              >
                {isPlaying ? <Pause className="w-3.5 h-3.5" /> : <Play className="w-3.5 h-3.5" />}
                {isPlaying ? "Pause" : "Play"}
              </button>

              <button
                onClick={scrubToSeam}
                className="px-3 py-2 rounded-xl border border-accent/40 bg-accent/5 text-accent hover:bg-accent/15 text-xs font-medium flex items-center gap-1.5 transition-colors"
                title="Jump to -5s before loop boundary to audit crossfade seam smoothness"
              >
                <Sliders className="w-3.5 h-3.5" /> Seam Inspector (-5s)
              </button>

              <button
                onClick={() => setContinuous3Loop(!continuous3Loop)}
                className={`px-3 py-2 rounded-xl border text-xs font-medium transition-colors ${
                  continuous3Loop
                    ? "border-accent text-accent bg-accent/5"
                    : "border-ink/15 text-ink-muted bg-paper"
                }`}
              >
                3-Loop Mode
              </button>

              <button
                onClick={() => {
                  if (audioRef.current) audioRef.current.pause();
                  setActiveAudition(null);
                  setIsPlaying(false);
                }}
                className="p-2 rounded-xl hover:bg-ink/5 text-ink-muted hover:text-ink"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Progress bar */}
          <div className="space-y-1">
            <div className="h-2 rounded-full bg-ink/10 overflow-hidden relative">
              <div
                className="h-full bg-accent transition-all duration-150"
                style={{ width: `${duration ? (currentTime / duration) * 100 : 0}%` }}
              />
              {/* Seam marker at 100% boundary */}
              <div className="absolute right-0 top-0 bottom-0 w-1 bg-amber-500 shadow-sm" title="Loop Crossfade Seam" />
            </div>
            <div className="flex items-center justify-between text-[11px] font-mono text-ink-muted">
              <span>{Math.floor(currentTime)}s</span>
              <span className="flex items-center gap-1 text-emerald-600 dark:text-emerald-400">
                <Radio className="w-3 h-3 animate-pulse" /> Telemetry: -16.0 LUFS · Peak -1.0 dBTP · 32kHz
              </span>
              <span>{Math.floor(duration)}s</span>
            </div>
          </div>
        </div>
      )}

      {/* Tracks Table */}
      <div className="p-4 rounded-2xl border border-ink/10 bg-paper-light">
        {loading ? (
          <div className="py-12 text-center text-sm text-ink-muted">Loading melody catalog...</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-ink/10 text-ink-muted uppercase tracking-wider font-mono">
                  <th className="py-3 px-4">Track</th>
                  <th className="py-3 px-4">Type</th>
                  <th className="py-3 px-4">Tags</th>
                  <th className="py-3 px-4">Length</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4">Published (R10)</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-ink/5">
                {tracks.map((t) => (
                  <tr key={t.id} className="hover:bg-ink/[0.02] transition-colors">
                    <td className="py-3 px-4">
                      <div className="font-medium text-ink flex items-center gap-2">
                        <MusicIcon className="w-3.5 h-3.5 text-accent" />
                        {t.name}
                      </div>
                      <div className="text-[11px] text-ink-muted truncate max-w-xs">{t.prompt}</div>
                    </td>
                    <td className="py-3 px-4 font-mono uppercase text-ink-soft">{t.type}</td>
                    <td className="py-3 px-4">
                      <div className="flex flex-wrap gap-1 max-w-xs">
                        {t.tags.map((tag) => (
                          <span
                            key={tag.id}
                            className="px-1.5 py-0.5 rounded text-[10px] bg-ink/5 text-ink-soft font-mono"
                          >
                            {tag.slug}
                          </span>
                        ))}
                      </div>
                    </td>
                    <td className="py-3 px-4 font-mono text-ink-soft">{t.seconds}s</td>
                    <td className="py-3 px-4 font-mono">
                      <span
                        className={`px-2 py-0.5 rounded text-[10px] font-semibold uppercase ${
                          t.status === "READY"
                            ? "bg-emerald-500/15 text-emerald-600 dark:text-emerald-400"
                            : t.status === "RUNNING"
                            ? "bg-accent/15 text-accent animate-pulse"
                            : t.status === "FAILED"
                            ? "bg-rose-500/15 text-rose-500"
                            : "bg-ink/10 text-ink-soft"
                        }`}
                      >
                        {t.status}
                      </span>
                    </td>
                    <td className="py-3 px-4">
                      <button
                        onClick={() => togglePublish(t)}
                        disabled={t.status !== "READY"}
                        className={`px-2.5 py-1 rounded-full text-[11px] font-medium transition-colors ${
                          t.published
                            ? "bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 hover:bg-emerald-500/25"
                            : "bg-ink/10 text-ink-muted hover:bg-ink/15"
                        } ${t.status !== "READY" ? "opacity-50 cursor-not-allowed" : ""}`}
                        title={t.status !== "READY" ? "Rule R10: Must be READY to publish" : "Toggle published"}
                      >
                        {t.published ? "Published" : "Draft"}
                      </button>
                    </td>
                    <td className="py-3 px-4 text-right space-x-2">
                      <button
                        onClick={() => startAudition(t)}
                        className="p-1.5 rounded-lg hover:bg-accent/10 text-accent transition-colors"
                        title="Audition 3 loops & inspect seam"
                      >
                        <Volume2 className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => openRegenerateModal(t)}
                        className="p-1.5 rounded-lg hover:bg-ink/5 text-ink-soft hover:text-ink transition-colors"
                        title="Regenerate track"
                      >
                        <RotateCcw className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => {
                          setDeletingTrack(t);
                          setDeleteConflictRefs(null);
                        }}
                        className="p-1.5 rounded-lg hover:bg-rose-500/10 text-rose-500 transition-colors"
                        title="Delete track (R12 protected)"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </td>
                  </tr>
                ))}
                {tracks.length === 0 && (
                  <tr>
                    <td colSpan={7} className="py-8 text-center text-ink-muted">
                      No melodies generated yet. Click &quot;Generate Loop Track&quot; to begin.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Generation / Regeneration Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 bg-ink/40 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-paper border border-ink/15 shadow-2xl rounded-2xl w-full max-w-lg p-6 animate-fade-in text-xs space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-ink/10">
              <h3 className="font-serif text-lg font-medium text-ink">
                {regenTarget ? `Regenerate Melody: ${regenTarget.name}` : "Generate Acoustic Loop"}
              </h3>
              <button onClick={() => setIsModalOpen(false)} className="text-ink-muted hover:text-ink">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleGenerate} className="space-y-4">
              {!regenTarget && (
                <div>
                  <label className="block font-medium text-ink mb-1">Track Name</label>
                  <input
                    type="text"
                    required
                    value={formName}
                    onChange={(e) => setFormName(e.target.value)}
                    placeholder="e.g. Rainy Window Felt Piano"
                    className="w-full px-3 py-2 rounded-xl border border-ink/15 bg-paper-light text-ink focus:border-accent outline-none"
                  />
                </div>
              )}

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block font-medium text-ink mb-1">Texture Type</label>
                  <select
                    disabled={!!regenTarget}
                    value={formType}
                    onChange={(e) => setFormType(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-ink/15 bg-paper-light text-ink focus:border-accent outline-none font-mono"
                  >
                    {TRACK_TYPES.map((type) => (
                      <option key={type} value={type}>
                        {type}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block font-medium text-ink mb-1">Duration (Rule R10)</label>
                  <div className="flex items-center gap-2 pt-1">
                    {[30, 45, 60].map((sec) => (
                      <label key={sec} className="flex items-center gap-1.5 font-mono cursor-pointer">
                        <input
                          type="radio"
                          name="seconds"
                          disabled={!!regenTarget}
                          checked={formSeconds === sec}
                          onChange={() => setFormSeconds(sec as 30 | 45 | 60)}
                          className="accent-accent"
                        />
                        <span>{sec}s</span>
                      </label>
                    ))}
                  </div>
                </div>
              </div>

              {!regenTarget && (
                <div>
                  <label className="block font-medium text-ink mb-1">Emotion Tags</label>
                  <div className="flex flex-wrap gap-1.5 p-2 rounded-xl border border-ink/10 bg-paper-light max-h-28 overflow-y-auto">
                    {allTags.map((tag) => {
                      const isSelected = formSelectedTags.includes(tag.id);
                      return (
                        <button
                          key={tag.id}
                          type="button"
                          onClick={() => {
                            if (isSelected) {
                              setFormSelectedTags(formSelectedTags.filter((id) => id !== tag.id));
                            } else {
                              setFormSelectedTags([...formSelectedTags, tag.id]);
                            }
                          }}
                          className={`px-2 py-0.5 rounded text-[11px] font-mono transition-colors ${
                            isSelected
                              ? "bg-accent text-paper-light font-medium"
                              : "bg-paper text-ink-soft border border-ink/10"
                          }`}
                        >
                          {tag.slug}
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}

              <div>
                <label className="block font-medium text-ink mb-1">Acoustic Prompt (MusicGen)</label>
                <textarea
                  rows={3}
                  required
                  value={formPrompt}
                  onChange={(e) => setFormPrompt(e.target.value)}
                  placeholder="e.g. soft solo piano, gentle rain mood, 65 bpm, warm reverb, sparse melody, no vocals, loopable"
                  className="w-full px-3 py-2 rounded-xl border border-ink/15 bg-paper-light text-ink focus:border-accent outline-none font-mono text-[11px]"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2 border-t border-ink/10">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 rounded-xl border border-ink/15 text-ink hover:bg-ink/5"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-4 py-2 rounded-xl bg-accent text-paper-light hover:bg-accent-hover font-medium flex items-center gap-2"
                >
                  {submitting && <RefreshCw className="w-3.5 h-3.5 animate-spin" />}
                  {submitting ? "Submitting..." : regenTarget ? "Regenerate Track" : "Enqueue Generation"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete / R12 Conflict Modal */}
      {deletingTrack && (
        <div className="fixed inset-0 z-50 bg-ink/40 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-paper border border-ink/15 shadow-2xl rounded-2xl w-full max-w-md p-6 animate-fade-in text-xs space-y-4">
            <div className="flex items-center gap-3 text-rose-500">
              <AlertCircle className="w-6 h-6" />
              <h3 className="font-serif text-base font-semibold text-ink">Delete Melody Track</h3>
            </div>

            {deleteConflictRefs ? (
              <div className="space-y-3">
                <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-600 dark:text-rose-400">
                  <strong>Cascade Deletion Blocked (Rule R12):</strong> This track is actively referenced by {deleteConflictRefs.length} template(s):
                  <ul className="list-disc pl-4 mt-1 font-mono text-[11px]">
                    {deleteConflictRefs.map((ref) => (
                      <li key={ref.id}>{ref.name} ({ref.id})</li>
                    ))}
                  </ul>
                </div>
                <p className="text-ink-soft">
                  You must reassign or remove these templates before this melody can be deleted.
                </p>
                <div className="flex justify-end">
                  <button
                    onClick={() => {
                      setDeletingTrack(null);
                      setDeleteConflictRefs(null);
                    }}
                    className="px-4 py-2 rounded-xl bg-ink text-paper font-medium"
                  >
                    Understood
                  </button>
                </div>
              </div>
            ) : (
              <>
                <p className="text-ink-soft">
                  Are you sure you wish to delete &quot;{deletingTrack.name}&quot;? All associated audio artifacts and metadata will be permanently removed.
                </p>
                <div className="flex justify-end gap-2 pt-2">
                  <button
                    onClick={() => setDeletingTrack(null)}
                    className="px-4 py-2 rounded-xl border border-ink/15 text-ink hover:bg-ink/5"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleDelete}
                    className="px-4 py-2 rounded-xl bg-rose-600 text-white hover:bg-rose-700 font-medium"
                  >
                    Confirm Delete
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
