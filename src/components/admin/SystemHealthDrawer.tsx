"use client";

import React, { useState, useEffect } from "react";
import { Activity, Server, Cpu, RefreshCw, X, CheckCircle, AlertCircle } from "lucide-react";

interface HealthData {
  omlx: { url: string; reachable: boolean; latencyMs: number };
  worker: { url: string; reachable: boolean; latencyMs: number };
  queue: { running: number; queued: number };
}

interface JobData {
  id: string;
  kind: string;
  targetId: string;
  status: string;
  attempts: number;
  model: string | null;
  log: string | null;
  createdAt: string;
}

export function SystemHealthDrawer() {
  const [isOpen, setIsOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [health, setHealth] = useState<HealthData | null>(null);
  const [jobs, setJobs] = useState<JobData[]>([]);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [hRes, jRes] = await Promise.all([
        fetch("/api/admin/health"),
        fetch("/api/admin/jobs"),
      ]);
      if (hRes.ok) {
        const hJson = await hRes.json();
        setHealth(hJson.health);
      }
      if (jRes.ok) {
        const jJson = await jRes.json();
        setJobs(jJson.jobs || []);
      }
    } catch (e) {
      console.error("Health fetch error", e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
    const interval = setInterval(fetchData, 10000);
    return () => clearInterval(interval);
  }, []);

  return (
    <>
      {/* Floating or Navigation Trigger */}
      <button
        onClick={() => setIsOpen(true)}
        className="flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-mono border border-ink/15 hover:border-ink/30 bg-paper-light text-ink transition-colors"
        title="Open System Health & Generation Queue"
      >
        <span
          className={`w-2 h-2 rounded-full ${
            health?.omlx.reachable && health?.worker.reachable
              ? "bg-emerald-500"
              : health?.omlx.reachable || health?.worker.reachable
              ? "bg-amber-500"
              : "bg-red-500"
          }`}
        />
        <span>System Health</span>
        {((health?.queue.running || 0) + (health?.queue.queued || 0) > 0) && (
          <span className="px-1.5 py-0.5 rounded-full bg-accent/15 text-accent text-[10px] font-bold">
            {(health?.queue.running || 0) + (health?.queue.queued || 0)} jobs
          </span>
        )}
      </button>

      {/* Slide-over Drawer Backdrop */}
      {isOpen && (
        <div className="fixed inset-0 z-50 overflow-hidden bg-ink/40 backdrop-blur-sm animate-fade-in flex justify-end">
          <div className="w-full max-w-md bg-paper border-l border-ink/15 shadow-2xl h-full flex flex-col p-6 overflow-y-auto">
            <div className="flex items-center justify-between pb-4 border-b border-ink/10">
              <div className="flex items-center gap-2">
                <Activity className="w-5 h-5 text-accent" />
                <h3 className="font-serif font-medium text-lg text-ink">System Health & Queue</h3>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={fetchData}
                  disabled={loading}
                  className="p-1.5 rounded-lg hover:bg-ink/5 text-ink-soft hover:text-ink transition-colors"
                  title="Refresh"
                >
                  <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} />
                </button>
                <button
                  onClick={() => setIsOpen(false)}
                  className="p-1.5 rounded-lg hover:bg-ink/5 text-ink-soft hover:text-ink transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Service Status */}
            <div className="mt-6 space-y-3">
              <h4 className="text-xs font-semibold uppercase tracking-wider text-ink-muted">Microservices</h4>
              
              {/* TimeDrift LLM */}
              <div className="p-3.5 rounded-xl border border-ink/10 bg-paper-light flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <Server className="w-5 h-5 text-ink-soft" />
                  <div>
                    <div className="font-medium text-sm text-ink">TimeDrift LLM Worker (llama.cpp)</div>
                    <div className="text-xs text-ink-muted font-mono">{health?.omlx.url || "http://100.100.91.61:8000/v1"}</div>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  {health?.omlx.reachable ? (
                    <span className="flex items-center gap-1 text-xs text-emerald-600 dark:text-emerald-400 font-mono">
                      <CheckCircle className="w-3.5 h-3.5" /> {health.omlx.latencyMs}ms
                    </span>
                  ) : (
                    <span className="flex items-center gap-1 text-xs text-rose-500 font-mono">
                      <AlertCircle className="w-3.5 h-3.5" /> Offline
                    </span>
                  )}
                </div>
              </div>

              {/* Music Worker */}
              <div className="p-3.5 rounded-xl border border-ink/10 bg-paper-light flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <Cpu className="w-5 h-5 text-ink-soft" />
                  <div>
                    <div className="font-medium text-sm text-ink">Music Worker (MusicGen)</div>
                    <div className="text-xs text-ink-muted font-mono">{health?.worker.url || "http://127.0.0.1:8100"}</div>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  {health?.worker.reachable ? (
                    <span className="flex items-center gap-1 text-xs text-emerald-600 dark:text-emerald-400 font-mono">
                      <CheckCircle className="w-3.5 h-3.5" /> {health.worker.latencyMs}ms
                    </span>
                  ) : (
                    <span className="flex items-center gap-1 text-xs text-rose-500 font-mono">
                      <AlertCircle className="w-3.5 h-3.5" /> Offline
                    </span>
                  )}
                </div>
              </div>
            </div>

            {/* Generation Queue */}
            <div className="mt-8 flex-1">
              <div className="flex items-center justify-between mb-3">
                <h4 className="text-xs font-semibold uppercase tracking-wider text-ink-muted">
                  Generation Jobs ({jobs.length})
                </h4>
                <div className="flex items-center gap-2 text-xs font-mono text-ink-soft">
                  <span className="px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
                    Running: {health?.queue.running || 0}
                  </span>
                  <span className="px-2 py-0.5 rounded bg-amber-500/10 text-amber-600 dark:text-amber-400">
                    Queued: {health?.queue.queued || 0}
                  </span>
                </div>
              </div>

              {jobs.length === 0 ? (
                <div className="p-6 text-center text-sm text-ink-muted border border-dashed border-ink/15 rounded-xl">
                  No active or past generation jobs in queue.
                </div>
              ) : (
                <div className="space-y-2.5 max-h-[400px] overflow-y-auto pr-1">
                  {jobs.map((job) => (
                    <div
                      key={job.id}
                      className="p-3 rounded-lg border border-ink/10 bg-paper-light text-xs space-y-1.5"
                    >
                      <div className="flex items-center justify-between font-mono">
                        <span className="font-medium text-ink uppercase tracking-wide">
                          {job.kind} · {job.id.slice(0, 8)}
                        </span>
                        <span
                          className={`px-2 py-0.5 rounded text-[10px] font-semibold uppercase ${
                            job.status === "READY"
                              ? "bg-emerald-500/15 text-emerald-600 dark:text-emerald-400"
                              : job.status === "RUNNING"
                              ? "bg-accent/15 text-accent animate-pulse"
                              : job.status === "FAILED"
                              ? "bg-rose-500/15 text-rose-500"
                              : "bg-ink/10 text-ink-soft"
                          }`}
                        >
                          {job.status}
                        </span>
                      </div>
                      <div className="text-ink-soft text-[11px] truncate">
                        Model: {job.model || "default"} | Attempts: {job.attempts}
                      </div>
                      {job.log && (
                        <div className="text-[11px] font-mono text-ink-muted bg-paper p-1.5 rounded border border-ink/5 break-all">
                          {job.log}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
}
