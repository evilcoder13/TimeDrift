"use client";

import React, { useState, useEffect } from "react";
import { Tag, Plus, Edit2, Trash2, Search, X, AlertTriangle } from "lucide-react";

interface TagItem {
  id: string;
  slug: string;
  nameEn: string;
  nameVi: string;
  _count: {
    music: number;
    scenes: number;
    templates: number;
  };
}

export default function TagsManagerPage() {
  const [tags, setTags] = useState<TagItem[]>([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Drawer / Modal state
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingTag, setEditingTag] = useState<TagItem | null>(null);
  const [formSlug, setFormSlug] = useState("");
  const [formNameEn, setFormNameEn] = useState("");
  const [formNameVi, setFormNameVi] = useState("");
  const [submitting, setSubmitting] = useState(false);

  // Delete modal state
  const [deletingTag, setDeletingTag] = useState<TagItem | null>(null);

  const fetchTags = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/admin/tags");
      if (res.ok) {
        const data = await res.json();
        setTags(data.tags || []);
      } else {
        setError("Failed to fetch tags.");
      }
    } catch {
      setError("Network error fetching tags.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTags();
  }, []);

  const openCreateModal = () => {
    setEditingTag(null);
    setFormSlug("");
    setFormNameEn("");
    setFormNameVi("");
    setIsModalOpen(true);
  };

  const openEditModal = (t: TagItem) => {
    setEditingTag(t);
    setFormSlug(t.slug);
    setFormNameEn(t.nameEn);
    setFormNameVi(t.nameVi);
    setIsModalOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setError(null);

    try {
      const url = editingTag ? `/api/admin/tags/${editingTag.id}` : "/api/admin/tags";
      const method = editingTag ? "PATCH" : "POST";
      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          slug: formSlug.trim().toLowerCase(),
          nameEn: formNameEn.trim(),
          nameVi: formNameVi.trim(),
        }),
      });

      if (!res.ok) {
        const errJson = await res.json();
        setError(errJson.error?.message || "Failed to save tag.");
      } else {
        setIsModalOpen(false);
        fetchTags();
      }
    } catch {
      setError("An unexpected error occurred.");
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async () => {
    if (!deletingTag) return;
    try {
      const res = await fetch(`/api/admin/tags/${deletingTag.id}`, {
        method: "DELETE",
      });
      if (res.ok) {
        setDeletingTag(null);
        fetchTags();
      } else {
        const errJson = await res.json();
        alert(errJson.error?.message || "Failed to delete tag");
      }
    } catch {
      alert("Error deleting tag");
    }
  };

  const filteredTags = tags.filter((t) => {
    const q = search.toLowerCase();
    return (
      t.slug.toLowerCase().includes(q) ||
      t.nameEn.toLowerCase().includes(q) ||
      t.nameVi.toLowerCase().includes(q)
    );
  });

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-ink/10">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="font-mono text-xs px-2 py-0.5 rounded bg-accent/10 text-accent font-semibold">AD-1</span>
            <h1 className="font-serif text-2xl font-medium text-ink">Emotion Tags Manager</h1>
          </div>
          <p className="text-xs text-ink-soft">
            Manage bilingual tags used for Jaccard similarity pairing (R7) and filtering.
          </p>
        </div>

        <button
          onClick={openCreateModal}
          className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-accent text-paper-light hover:bg-accent-hover text-sm font-medium transition-colors shadow-sm"
        >
          <Plus className="w-4 h-4" /> Add Tag
        </button>
      </div>

      {error && (
        <div className="p-4 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-600 dark:text-rose-400 text-xs font-mono">
          {error}
        </div>
      )}

      {/* Search and Table */}
      <div className="p-4 rounded-2xl border border-ink/10 bg-paper-light space-y-4">
        <div className="flex items-center gap-3 px-3 py-2 rounded-xl border border-ink/10 bg-paper focus-within:border-accent">
          <Search className="w-4 h-4 text-ink-muted" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search tags by slug, English, or Vietnamese name..."
            className="w-full bg-transparent text-sm text-ink outline-none placeholder:text-ink-muted"
          />
          {search && (
            <button onClick={() => setSearch("")} className="text-ink-muted hover:text-ink">
              <X className="w-4 h-4" />
            </button>
          )}
        </div>

        {loading ? (
          <div className="py-12 text-center text-sm text-ink-muted">Loading emotion tags...</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-ink/10 text-ink-muted uppercase tracking-wider font-mono">
                  <th className="py-3 px-4">Slug</th>
                  <th className="py-3 px-4">English Name</th>
                  <th className="py-3 px-4">Vietnamese Name</th>
                  <th className="py-3 px-4 text-center">Music Usage</th>
                  <th className="py-3 px-4 text-center">Scene Usage</th>
                  <th className="py-3 px-4 text-center">Template Usage</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-ink/5">
                {filteredTags.map((t) => (
                  <tr key={t.id} className="hover:bg-ink/[0.02] transition-colors">
                    <td className="py-3 px-4 font-mono font-medium text-ink flex items-center gap-2">
                      <Tag className="w-3.5 h-3.5 text-accent" />
                      {t.slug}
                    </td>
                    <td className="py-3 px-4 text-ink font-medium">{t.nameEn}</td>
                    <td className="py-3 px-4 text-ink-soft">{t.nameVi}</td>
                    <td className="py-3 px-4 text-center font-mono">
                      <span className="px-2 py-0.5 rounded bg-ink/5 text-ink-soft">
                        {t._count.music}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-center font-mono">
                      <span className="px-2 py-0.5 rounded bg-ink/5 text-ink-soft">
                        {t._count.scenes}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-center font-mono">
                      <span className="px-2 py-0.5 rounded bg-ink/5 text-ink-soft">
                        {t._count.templates}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-right space-x-2">
                      <button
                        onClick={() => openEditModal(t)}
                        className="p-1.5 rounded-lg hover:bg-ink/5 text-ink-soft hover:text-ink transition-colors"
                        title="Edit tag"
                      >
                        <Edit2 className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => setDeletingTag(t)}
                        className="p-1.5 rounded-lg hover:bg-rose-500/10 text-rose-500 transition-colors"
                        title="Delete tag"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </td>
                  </tr>
                ))}
                {filteredTags.length === 0 && (
                  <tr>
                    <td colSpan={7} className="py-8 text-center text-ink-muted">
                      No emotion tags match your search.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Create / Edit Drawer Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 bg-ink/40 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-paper border border-ink/15 shadow-2xl rounded-2xl w-full max-w-md p-6 animate-fade-in">
            <div className="flex items-center justify-between pb-4 border-b border-ink/10 mb-4">
              <h3 className="font-serif text-lg font-medium text-ink">
                {editingTag ? "Edit Emotion Tag" : "Create Emotion Tag"}
              </h3>
              <button
                onClick={() => setIsModalOpen(false)}
                className="text-ink-muted hover:text-ink"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4 text-xs">
              <div>
                <label className="block font-medium text-ink mb-1">
                  Tag Slug (lowercase-kebab-case)
                </label>
                <input
                  type="text"
                  required
                  value={formSlug}
                  onChange={(e) => setFormSlug(e.target.value)}
                  placeholder="e.g. cozy, misty-dawn, rainy"
                  pattern="^[a-z0-9]+(-[a-z0-9]+)*$"
                  className="w-full px-3 py-2 rounded-xl border border-ink/15 bg-paper-light text-ink font-mono focus:border-accent outline-none"
                />
              </div>

              <div>
                <label className="block font-medium text-ink mb-1">English Name</label>
                <input
                  type="text"
                  required
                  value={formNameEn}
                  onChange={(e) => setFormNameEn(e.target.value)}
                  placeholder="e.g. Cozy"
                  className="w-full px-3 py-2 rounded-xl border border-ink/15 bg-paper-light text-ink focus:border-accent outline-none"
                />
              </div>

              <div>
                <label className="block font-medium text-ink mb-1">Vietnamese Name</label>
                <input
                  type="text"
                  required
                  value={formNameVi}
                  onChange={(e) => setFormNameVi(e.target.value)}
                  placeholder="e.g. Ấm cúng"
                  className="w-full px-3 py-2 rounded-xl border border-ink/15 bg-paper-light text-ink focus:border-accent outline-none"
                />
              </div>

              <div className="flex justify-end gap-2 pt-4 border-t border-ink/10">
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
                  className="px-4 py-2 rounded-xl bg-accent text-paper-light hover:bg-accent-hover font-medium"
                >
                  {submitting ? "Saving..." : editingTag ? "Update Tag" : "Create Tag"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {deletingTag && (
        <div className="fixed inset-0 z-50 bg-ink/40 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-paper border border-ink/15 shadow-2xl rounded-2xl w-full max-w-md p-6 animate-fade-in text-xs space-y-4">
            <div className="flex items-center gap-3 text-rose-500">
              <AlertTriangle className="w-6 h-6" />
              <h3 className="font-serif text-base font-semibold text-ink">Delete Tag: {deletingTag.slug}?</h3>
            </div>

            {deletingTag._count.music + deletingTag._count.scenes + deletingTag._count.templates > 0 ? (
              <div className="p-3 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-700 dark:text-amber-400">
                Warning: This tag is currently attached to {deletingTag._count.music} music tracks, {deletingTag._count.scenes} scenes, and {deletingTag._count.templates} templates. Deleting it will detach it from all items.
              </div>
            ) : (
              <p className="text-ink-soft">
                This tag is not currently in use. Are you sure you wish to delete it?
              </p>
            )}

            <div className="flex justify-end gap-2 pt-2">
              <button
                onClick={() => setDeletingTag(null)}
                className="px-4 py-2 rounded-xl border border-ink/15 text-ink hover:bg-ink/5"
              >
                Cancel
              </button>
              <button
                onClick={handleDelete}
                className="px-4 py-2 rounded-xl bg-rose-600 text-white hover:bg-rose-700 font-medium"
              >
                Delete and Detach
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
