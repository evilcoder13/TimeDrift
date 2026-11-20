"use client";

import React, { useState, useEffect } from "react";
import {
  Users as UsersIcon,
  Crown,
  Shield,
  Search,
  CheckCircle,
  X,
  Edit2,
  Calendar,
  Sparkles,
} from "lucide-react";

interface UserItem {
  id: string;
  name: string | null;
  email: string | null;
  role: string;
  isPro: boolean;
  proUntil: string | null;
  proTransferCode?: string | null;
  locale: string;
  createdAt: string;
}

export default function UsersManagementPage() {
  const [users, setUsers] = useState<UserItem[]>([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Edit Pro Modal
  const [editingUser, setEditingUser] = useState<UserItem | null>(null);
  const [proActive, setProActive] = useState(false);
  const [proDate, setProDate] = useState<string>("");
  const [isLifetime, setIsLifetime] = useState(false);
  const [userRole, setUserRole] = useState<"USER" | "ADMIN">("USER");
  const [saving, setSaving] = useState(false);

  const fetchUsers = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/admin/users");
      if (res.ok) {
        const data = await res.json();
        setUsers(data.users || []);
      } else {
        setError("Failed to load users list");
      }
    } catch {
      setError("Network error fetching users");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  const openEditModal = (u: UserItem) => {
    setEditingUser(u);
    setProActive(u.isPro);
    setUserRole(u.role as "USER" | "ADMIN");
    if (u.proUntil) {
      setProDate(u.proUntil.split("T")[0]);
      setIsLifetime(false);
    } else if (u.isPro) {
      setIsLifetime(true);
      setProDate("");
    } else {
      setIsLifetime(false);
      setProDate("");
    }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingUser) return;
    setSaving(true);
    setError(null);

    try {
      const finalProUntil = proActive ? (isLifetime ? null : proDate ? new Date(proDate).toISOString() : null) : null;

      const res = await fetch(`/api/admin/users?id=${editingUser.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          role: userRole,
          isPro: proActive,
          proUntil: finalProUntil,
        }),
      });

      if (!res.ok) {
        const err = await res.json();
        setError(err.error?.message || "Failed to update user");
      } else {
        setEditingUser(null);
        fetchUsers();
      }
    } catch {
      setError("Error saving user permissions");
    } finally {
      setSaving(false);
    }
  };

  const filteredUsers = users.filter((u) => {
    const q = search.toLowerCase();
    return (
      (u.name && u.name.toLowerCase().includes(q)) ||
      (u.email && u.email.toLowerCase().includes(q)) ||
      (u.proTransferCode && u.proTransferCode.toLowerCase().includes(q)) ||
      u.role.toLowerCase().includes(q)
    );
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-ink/10">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="font-mono text-xs px-2 py-0.5 rounded bg-accent/10 text-accent font-semibold">AD-5</span>
            <h1 className="font-serif text-2xl font-medium text-ink">User Management & Pro Access</h1>
          </div>
          <p className="text-xs text-ink-soft">
            Manage membership tiers, grant/revoke Pro Sanctuary status (Rule R9), inspect transfer codes, and administer role access.
          </p>
        </div>
      </div>

      {error && (
        <div className="p-4 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-600 dark:text-rose-400 text-xs font-mono flex items-center justify-between">
          <span>{error}</span>
          <button onClick={() => setError(null)}><X className="w-4 h-4" /></button>
        </div>
      )}

      {/* Table Container */}
      <div className="p-4 rounded-2xl border border-ink/10 bg-paper-light space-y-4">
        <div className="flex items-center gap-3 px-3 py-2 rounded-xl border border-ink/10 bg-paper focus-within:border-accent">
          <Search className="w-4 h-4 text-ink-muted" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by name, email, transfer code (TDPRO...), or role..."
            className="w-full bg-transparent text-sm text-ink outline-none placeholder:text-ink-muted"
          />
          {search && (
            <button onClick={() => setSearch("")} className="text-ink-muted hover:text-ink">
              <X className="w-4 h-4" />
            </button>
          )}
        </div>

        {loading ? (
          <div className="py-12 text-center text-sm text-ink-muted">Loading user accounts...</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-ink/10 text-ink-muted uppercase tracking-wider font-mono">
                  <th className="py-3 px-4">User</th>
                  <th className="py-3 px-4">Role</th>
                  <th className="py-3 px-4">Transfer Code</th>
                  <th className="py-3 px-4">Pro Status (R9)</th>
                  <th className="py-3 px-4">Pro Expiration</th>
                  <th className="py-3 px-4">Locale</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-ink/5">
                {filteredUsers.map((u) => {
                  const isProExpired = u.proUntil && new Date(u.proUntil) < new Date();
                  const proActive = u.isPro && !isProExpired;

                  return (
                    <tr key={u.id} className="hover:bg-ink/[0.02] transition-colors">
                      <td className="py-3 px-4">
                        <div className="font-medium text-ink flex items-center gap-2">
                          <UsersIcon className="w-3.5 h-3.5 text-accent" />
                          {u.name || "Nameless User"}
                        </div>
                        <div className="text-[11px] text-ink-muted font-mono">{u.email || "No email"}</div>
                      </td>
                      <td className="py-3 px-4">
                        <span className={`px-2 py-0.5 rounded text-[10px] font-mono font-semibold uppercase ${
                          u.role === "ADMIN"
                            ? "bg-accent/15 text-accent border border-accent/20"
                            : "bg-ink/5 text-ink-soft"
                        }`}>
                          {u.role}
                        </span>
                      </td>
                      <td className="py-3 px-4 font-mono">
                        {u.proTransferCode ? (
                          <span className="px-2 py-0.5 rounded bg-ink/5 text-ink font-semibold">
                            {u.proTransferCode}
                          </span>
                        ) : (
                          <span className="text-ink-muted">—</span>
                        )}
                      </td>
                      <td className="py-3 px-4 font-mono">
                        {proActive ? (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 font-semibold">
                            <Crown className="w-3 h-3" /> PRO ACTIVE
                          </span>
                        ) : (
                          <span className="px-2 py-0.5 rounded-full text-[10px] bg-ink/10 text-ink-muted font-mono">
                            FREE DRIFT
                          </span>
                        )}
                      </td>
                      <td className="py-3 px-4 font-mono text-ink-soft">
                        {u.isPro ? (u.proUntil ? new Date(u.proUntil).toLocaleDateString() : "Indefinite / Lifetime") : "—"}
                      </td>
                      <td className="py-3 px-4 font-mono uppercase text-ink-muted">{u.locale}</td>
                      <td className="py-3 px-4 text-right">
                        <button
                          onClick={() => openEditModal(u)}
                          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-ink/15 hover:border-ink/30 bg-paper text-ink transition-colors"
                        >
                          <Edit2 className="w-3 h-3" /> Edit Access
                        </button>
                      </td>
                    </tr>
                  );
                })}
                {filteredUsers.length === 0 && (
                  <tr>
                    <td colSpan={6} className="py-8 text-center text-ink-muted">
                      No users found.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Edit Access Dialog */}
      {editingUser && (
        <div className="fixed inset-0 z-50 bg-ink/40 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-paper border border-ink/15 shadow-2xl rounded-2xl w-full max-w-md p-6 animate-fade-in text-xs space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-ink/10">
              <h3 className="font-serif text-lg font-medium text-ink">
                Edit Access: {editingUser.name || editingUser.email}
              </h3>
              <button onClick={() => setEditingUser(null)} className="text-ink-muted hover:text-ink">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSave} className="space-y-4">
              {/* Role Toggle */}
              <div>
                <label className="block font-medium text-ink mb-1">User Role</label>
                <div className="grid grid-cols-2 gap-2">
                  <label className="flex items-center gap-2 p-2.5 rounded-xl border border-ink/15 bg-paper cursor-pointer font-mono">
                    <input
                      type="radio"
                      name="role"
                      value="USER"
                      checked={userRole === "USER"}
                      onChange={() => setUserRole("USER")}
                      className="accent-accent"
                    />
                    <span>Standard (USER)</span>
                  </label>
                  <label className="flex items-center gap-2 p-2.5 rounded-xl border border-ink/15 bg-paper cursor-pointer font-mono">
                    <input
                      type="radio"
                      name="role"
                      value="ADMIN"
                      checked={userRole === "ADMIN"}
                      onChange={() => setUserRole("ADMIN")}
                      className="accent-accent"
                    />
                    <span>Admin (ADMIN)</span>
                  </label>
                </div>
              </div>

              {/* Pro Sanctuary Toggle */}
              <div className="p-3.5 rounded-xl border border-ink/15 bg-paper-light space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Crown className="w-4 h-4 text-accent" />
                    <span className="font-medium text-ink">Pro Sanctuary Status (Rule R9)</span>
                  </div>
                  <input
                    type="checkbox"
                    checked={proActive}
                    onChange={(e) => setProActive(e.target.checked)}
                    className="accent-accent w-4 h-4 cursor-pointer"
                  />
                </div>

                {proActive && (
                  <div className="space-y-2.5 pt-2 border-t border-ink/10">
                    <label className="flex items-center gap-2 cursor-pointer font-mono text-[11px]">
                      <input
                        type="checkbox"
                        checked={isLifetime}
                        onChange={(e) => {
                          setIsLifetime(e.target.checked);
                          if (e.target.checked) setProDate("");
                        }}
                        className="accent-accent"
                      />
                      <span>Indefinite Lifetime Access (proUntil = null)</span>
                    </label>

                    {!isLifetime && (
                      <div>
                        <label className="block text-ink-muted mb-1 font-mono text-[11px]">
                          Expiration Date
                        </label>
                        <input
                          type="date"
                          value={proDate}
                          onChange={(e) => setProDate(e.target.value)}
                          className="w-full px-3 py-2 rounded-xl border border-ink/15 bg-paper text-ink font-mono focus:border-accent outline-none"
                        />
                      </div>
                    )}
                  </div>
                )}
              </div>

              <div className="flex justify-end gap-2 pt-2 border-t border-ink/10">
                <button
                  type="button"
                  onClick={() => setEditingUser(null)}
                  className="px-4 py-2 rounded-xl border border-ink/15 text-ink hover:bg-ink/5"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="px-4 py-2 rounded-xl bg-accent text-paper-light hover:bg-accent-hover font-medium"
                >
                  {saving ? "Saving..." : "Save Changes"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
