"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import {
  Film,
  Plus,
  Play,
  RotateCcw,
  Trash2,
  CheckCircle,
  Clock,
  Sparkles,
  Sliders,
  AlertCircle,
  X,
  Code,
  ExternalLink,
} from "lucide-react";

interface TagItem {
  id: string;
  slug: string;
  nameEn: string;
}

interface SceneItem {
  id: string;
  name: string;
  description: string;
  prompt: string;
  sourcePath: string | null;
  bundlePath: string | null;
  model: string | null;
  status: string;
  published: boolean;
  isSeed: boolean;
  tags: TagItem[];
  _count: {
    templates: number;
  };
  createdAt: string;
}

export default function ScenesListPage() {
  const params = useParams();
  const locale = (params?.locale as string) || "en";

  const [scenes, setScenes] = useState<SceneItem[]>([]);
  const [allTags, setAllTags] = useState<TagItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Generate Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [formName, setFormName] = useState("");
  const [formDescription, setFormDescription] = useState("");
  const [formPrompt, setFormPrompt] = useState("");
  const [formModel, setFormModel] = useState("default");
  const [availableModels, setAvailableModels] = useState<Array<{ id: string; name: string }>>([
    { id: "default", name: "Qwen2.5-Coder-1.5B (Default Lightweight)" },
  ]);
  const [formSelectedTags, setFormSelectedTags] = useState<string[]>([]);
  const [submitting, setSubmitting] = useState(false);

  // Delete modal state
  const [deletingScene, setDeletingScene] = useState<SceneItem | null>(null);
  const [deleteConflictRefs, setDeleteConflictRefs] = useState<{ id: string; name: string }[] | null>(null);

  const fetchScenes = async (silent = false) => {
    if (!silent) setLoading(true);
    try {
      const [sRes, tRes, mRes] = await Promise.all([
        fetch("/api/admin/scenes"),
        fetch("/api/admin/tags"),
        fetch("/api/admin/models"),
      ]);
      if (sRes.ok) {
        const sData = await sRes.json();
        setScenes(sData.scenes || []);
      }
      if (tRes.ok) {
        const tData = await tRes.json();
        setAllTags(tData.tags || []);
      }
      if (mRes.ok) {
        const mData = await mRes.json();
        if (Array.isArray(mData.models) && mData.models.length > 0) {
          setAvailableModels(mData.models);
          // Set first model as default if formModel is still default
          if (!formModel || formModel === "Qwen3.5-4B-3D-Coder") {
            setFormModel(mData.models[0].id);
          }
        }
      }
    } catch {
      if (!silent) setError("Failed to fetch scenes.");
    } finally {
      if (!silent) setLoading(false);
    }
  };

  useEffect(() => {
    fetchScenes();
  }, []);

  // Auto-refresh every 2.5s whenever any scene is QUEUED, RUNNING, or VALIDATING
  useEffect(() => {
    const hasActiveJob = scenes.some((s) =>
      ["QUEUED", "RUNNING", "VALIDATING"].includes(s.status)
    );
    if (!hasActiveJob) return;

    const timer = setInterval(() => {
      fetchScenes(true);
    }, 2500);

    return () => clearInterval(timer);
  }, [scenes]);

  const openGenerateModal = () => {
    setFormName("");
    setFormDescription("Calm line-art animation of peaceful scenery.");
    setFormPrompt("A quiet tea house in the rain with gentle steam rising from a cup and water ripples forming slowly.");
    setFormModel(availableModels[0]?.id || "default");
    setFormSelectedTags(allTags.slice(0, 3).map((t) => t.id));
    setIsModalOpen(true);
  };

  const handleGenerate = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setError(null);

    try {
      const res = await fetch("/api/admin/scenes", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: formName,
          description: formDescription,
          prompt: formPrompt,
          model: formModel,
          tagIds: formSelectedTags,
        }),
      });

      if (!res.ok) {
        const err = await res.json();
        setError(err.error?.message || "Failed to enqueue scene generation.");
      } else {
        setIsModalOpen(false);
        fetchScenes();
      }
    } catch {
      setError("Error communicating with server.");
    } finally {
      setSubmitting(false);
    }
  };

  const togglePublish = async (scene: SceneItem) => {
    setError(null);
    try {
      const res = await fetch(`/api/admin/scenes/${scene.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ published: !scene.published }),
      });
      if (!res.ok) {
        const err = await res.json();
        setError(err.error?.message || "Failed to update publish state (Rule R11 check).");
      } else {
        fetchScenes();
      }
    } catch {
      setError("Error updating publish status.");
    }
  };

  const handleDelete = async () => {
    if (!deletingScene) return;
    try {
      const res = await fetch(`/api/admin/scenes/${deletingScene.id}`, {
        method: "DELETE",
      });
      if (res.ok) {
        setDeletingScene(null);
        setDeleteConflictRefs(null);
        fetchScenes();
      } else {
        const errJson = await res.json();
        if (errJson.error?.code === "CONFLICT_IN_USE") {
          setDeleteConflictRefs(errJson.error.references || []);
        } else {
          setError(errJson.error?.message || "Failed to delete scene");
        }
      }
    } catch {
      setError("Error deleting scene");
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-ink/10">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="font-mono text-xs px-2 py-0.5 rounded bg-accent/10 text-accent font-semibold">AD-3</span>
            <h1 className="font-serif text-2xl font-medium text-ink">Scene Studio & Generation Cockpit</h1>
          </div>
          <p className="text-xs text-ink-soft">
            omlx local LLM synthesis, live sandboxed execution, code inspection, and validation gates (R11/R12).
          </p>
        </div>

        <button
          onClick={openGenerateModal}
          className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-accent text-paper-light hover:bg-accent-hover text-sm font-medium transition-colors shadow-sm"
        >
          <Sparkles className="w-4 h-4" /> Generate Line-Art Scene
        </button>
      </div>

      {error && (
        <div className="p-4 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-600 dark:text-rose-400 text-xs font-mono flex items-center justify-between">
          <span>{error}</span>
          <button onClick={() => setError(null)}><X className="w-4 h-4" /></button>
        </div>
      )}

      {/* Scenes List */}
      <div className="p-4 rounded-2xl border border-ink/10 bg-paper-light">
        {loading ? (
          <div className="py-12 text-center text-sm text-ink-muted">Loading scene library...</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-ink/10 text-ink-muted uppercase tracking-wider font-mono">
                  <th className="py-3 px-4">Scene</th>
                  <th className="py-3 px-4">Model Engine</th>
                  <th className="py-3 px-4">Tags</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4">Published (R11)</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-ink/5">
                {scenes.map((s) => (
                  <tr key={s.id} className="hover:bg-ink/[0.02] transition-colors">
                    <td className="py-3 px-4">
                      <div className="font-medium text-ink flex items-center gap-2">
                        <Film className="w-3.5 h-3.5 text-accent" />
                        <Link
                          href={`/${locale}/admin/scenes/${s.id}`}
                          className="hover:underline font-serif text-sm font-medium text-ink"
                        >
                          {s.name}
                        </Link>
                        {s.isSeed && (
                          <span className="px-1.5 py-0.5 rounded text-[9px] bg-accent/10 text-accent font-mono">
                            Seed
                          </span>
                        )}
                      </div>
                      <div className="text-[11px] text-ink-muted truncate max-w-sm">{s.description}</div>
                    </td>
                    <td className="py-3 px-4 font-mono text-ink-soft">
                      {s.model || "default"}
                    </td>
                    <td className="py-3 px-4">
                      <div className="flex flex-wrap gap-1 max-w-xs">
                        {s.tags.map((tag) => (
                          <span
                            key={tag.id}
                            className="px-1.5 py-0.5 rounded text-[10px] bg-ink/5 text-ink-soft font-mono"
                          >
                            {tag.slug}
                          </span>
                        ))}
                      </div>
                    </td>
                    <td className="py-3 px-4 font-mono">
                      <span
                        className={`px-2 py-0.5 rounded text-[10px] font-semibold uppercase ${
                          s.status === "READY"
                            ? "bg-emerald-500/15 text-emerald-600 dark:text-emerald-400"
                            : s.status === "RUNNING"
                            ? "bg-accent/15 text-accent animate-pulse"
                            : s.status === "FAILED"
                            ? "bg-rose-500/15 text-rose-500"
                            : "bg-ink/10 text-ink-soft"
                        }`}
                      >
                        {s.status}
                      </span>
                    </td>
                    <td className="py-3 px-4">
                      <button
                        onClick={() => togglePublish(s)}
                        disabled={s.status !== "READY"}
                        className={`px-2.5 py-1 rounded-full text-[11px] font-medium transition-colors ${
                          s.published
                            ? "bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 hover:bg-emerald-500/25"
                            : "bg-ink/10 text-ink-muted hover:bg-ink/15"
                        } ${s.status !== "READY" ? "opacity-50 cursor-not-allowed" : ""}`}
                        title={s.status !== "READY" ? "Rule R11: Must be READY (validated) to publish" : "Toggle published"}
                      >
                        {s.published ? "Published" : "Draft"}
                      </button>
                    </td>
                    <td className="py-3 px-4 text-right space-x-2">
                      <Link
                        href={`/${locale}/admin/scenes/${s.id}`}
                        className="inline-flex p-1.5 rounded-lg hover:bg-ink/5 text-ink-soft hover:text-ink transition-colors"
                        title="Open Dual-Pane Studio (Code + Live Sandbox Preview)"
                      >
                        <Code className="w-3.5 h-3.5" />
                      </Link>
                      <button
                        onClick={() => {
                          setDeletingScene(s);
                          setDeleteConflictRefs(null);
                        }}
                        className="p-1.5 rounded-lg hover:bg-rose-500/10 text-rose-500 transition-colors"
                        title="Delete scene (R12 protected)"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </td>
                  </tr>
                ))}
                {scenes.length === 0 && (
                  <tr>
                    <td colSpan={6} className="py-8 text-center text-ink-muted">
                      No scenes found. Click &quot;Generate Line-Art Scene&quot; to synthesize.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Generation Prompt Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 bg-ink/40 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-paper border border-ink/15 shadow-2xl rounded-2xl w-full max-w-lg p-6 animate-fade-in text-xs space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-ink/10">
              <h3 className="font-serif text-lg font-medium text-ink">
                Synthesize Line-Art Scene (omlx LLM)
              </h3>
              <button onClick={() => setIsModalOpen(false)} className="text-ink-muted hover:text-ink">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleGenerate} className="space-y-4">
              <div>
                <label className="block font-medium text-ink mb-1">Scene Name</label>
                <input
                  type="text"
                  required
                  value={formName}
                  onChange={(e) => setFormName(e.target.value)}
                  placeholder="e.g. Quiet Tea House in Rain"
                  className="w-full px-3 py-2 rounded-xl border border-ink/15 bg-paper-light text-ink focus:border-accent outline-none"
                />
              </div>

              <div>
                <label className="block font-medium text-ink mb-1">Poetic Description</label>
                <input
                  type="text"
                  required
                  value={formDescription}
                  onChange={(e) => setFormDescription(e.target.value)}
                  placeholder="e.g. Steam rising from hot cup; diagonal rain streaks outside."
                  className="w-full px-3 py-2 rounded-xl border border-ink/15 bg-paper-light text-ink focus:border-accent outline-none"
                />
              </div>

              <div>
                <label className="block font-medium text-ink mb-1">Model Selection (TimeDrift LLM)</label>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {availableModels.map((m) => (
                    <label
                      key={m.id}
                      className={`flex items-center gap-2 p-2.5 rounded-xl border cursor-pointer font-mono text-[11px] transition-colors ${
                        formModel === m.id
                          ? "border-accent bg-accent/10 text-ink"
                          : "border-ink/15 bg-paper text-ink-muted hover:text-ink"
                      }`}
                    >
                      <input
                        type="radio"
                        name="model"
                        value={m.id}
                        checked={formModel === m.id}
                        onChange={(e) => setFormModel(e.target.value)}
                        className="accent-accent"
                      />
                      <span className="truncate">{m.name}</span>
                    </label>
                  ))}
                </div>
              </div>

              <div>
                <label className="block font-medium text-ink mb-1">Emotion Tags</label>
                <div className="flex flex-wrap gap-1.5 p-2 rounded-xl border border-ink/10 bg-paper-light max-h-24 overflow-y-auto">
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

              <div>
                <label className="block font-medium text-ink mb-1">Creative Prompt</label>
                <textarea
                  rows={3}
                  required
                  value={formPrompt}
                  onChange={(e) => setFormPrompt(e.target.value)}
                  placeholder="Describe the line-art scene, subjects, unhurried gait, and diurnal tau color transitions..."
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
                  {submitting ? "Synthesizing..." : "Queue Generation (LLM)"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete / R12 Conflict Modal */}
      {deletingScene && (
        <div className="fixed inset-0 z-50 bg-ink/40 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-paper border border-ink/15 shadow-2xl rounded-2xl w-full max-w-md p-6 animate-fade-in text-xs space-y-4">
            <div className="flex items-center gap-3 text-rose-500">
              <AlertCircle className="w-6 h-6" />
              <h3 className="font-serif text-base font-semibold text-ink">Delete Scene</h3>
            </div>

            {deleteConflictRefs ? (
              <div className="space-y-3">
                <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-600 dark:text-rose-400">
                  <strong>Cascade Deletion Blocked (Rule R12):</strong> This scene is actively referenced by {deleteConflictRefs.length} template(s):
                  <ul className="list-disc pl-4 mt-1 font-mono text-[11px]">
                    {deleteConflictRefs.map((ref) => (
                      <li key={ref.id}>{ref.name} ({ref.id})</li>
                    ))}
                  </ul>
                </div>
                <p className="text-ink-soft">
                  You must reassign or remove these templates before this scene can be deleted.
                </p>
                <div className="flex justify-end">
                  <button
                    onClick={() => {
                      setDeletingScene(null);
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
                  Are you sure you wish to delete &quot;{deletingScene.name}&quot;? All source code and bundled artifacts will be removed.
                </p>
                <div className="flex justify-end gap-2 pt-2">
                  <button
                    onClick={() => setDeletingScene(null)}
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
