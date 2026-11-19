"use client";

import React, { useState, useEffect, useRef } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { SceneFrame } from "@/components/player/SceneFrame";
import {
  Film,
  ArrowLeft,
  Save,
  CheckCircle,
  AlertTriangle,
  Play,
  Pause,
  Sun,
  Moon,
  Smartphone,
  Gauge,
  RotateCcw,
  RefreshCw,
  Sliders,
  Check,
  X,
  ShieldCheck,
} from "lucide-react";

interface ValidationResult {
  stage1: { passed: boolean; message: string };
  stage2: { passed: boolean; message: string };
  stage3: { passed: boolean; message: string };
  stage4: { passed: boolean; message: string };
}

interface SceneData {
  id: string;
  name: string;
  description: string;
  prompt: string;
  sourcePath: string | null;
  bundlePath: string | null;
  model: string | null;
  status: string;
  published: boolean;
  tags: { id: string; slug: string; nameEn: string }[];
}

export default function SceneStudioDetailPage() {
  const params = useParams();
  const router = useRouter();
  const id = params?.id as string;
  const locale = (params?.locale as string) || "en";

  const [scene, setScene] = useState<SceneData | null>(null);
  const [sourceCode, setSourceCode] = useState<string>("");
  const [loading, setLoading] = useState(true);
  const [rebuilding, setRebuilding] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Validation report card
  const [validation, setValidation] = useState<ValidationResult | null>(null);

  // Preview Sandbox Controls
  const [tau, setTau] = useState<number>(0.5); // Diurnal tau scrubber (0.0=day to 1.0=night)
  const [speed, setSpeed] = useState<number>(1.0);
  const [isPaused, setIsPaused] = useState<boolean>(false);
  const [showSafeZone, setShowSafeZone] = useState<boolean>(true); // 9:16 safe zone overlay

  // Sandbox runtime state
  const [sandboxReady, setSandboxReady] = useState(false);
  const [sandboxError, setSandboxError] = useState<string | null>(null);

  const fetchScene = async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/admin/scenes/${id}`);
      if (res.ok) {
        const data = await res.json();
        setScene(data.scene);
        setSourceCode(data.sourceCode || "");
        if (data.scene.status === "READY") {
          setValidation({
            stage1: { passed: true, message: "Security scan passed" },
            stage2: { passed: true, message: "TypeScript interface verified" },
            stage3: { passed: true, message: "esbuild standalone bundle generated" },
            stage4: { passed: true, message: "Preview runtime verified" },
          });
        }
      } else {
        setError("Failed to load scene details");
      }
    } catch {
      setError("Error connecting to server");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchScene();
  }, [id]);

  const handleSaveAndRebuild = async () => {
    setRebuilding(true);
    setError(null);
    setSandboxError(null);

    try {
      const res = await fetch(`/api/admin/scenes/${id}/source`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ source: sourceCode }),
      });

      const data = await res.json();
      if (!res.ok) {
        setError(data.error?.message || "Validation failed");
        if (data.error?.stage) {
          setValidation({
            stage1: { passed: false, message: data.error.stage.includes("Stage 1") ? data.error.message : "Pending" },
            stage2: { passed: false, message: "Typecheck aborted" },
            stage3: { passed: false, message: data.error.stage.includes("Stage 3") ? data.error.message : "Pending" },
            stage4: { passed: false, message: "Runtime check aborted" },
          });
        }
      } else {
        setScene(data.scene);
        setValidation(data.validation);
      }
    } catch {
      setError("Rebuild network request failed");
    } finally {
      setRebuilding(false);
    }
  };

  const togglePublish = async () => {
    if (!scene) return;
    try {
      const res = await fetch(`/api/admin/scenes/${scene.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ published: !scene.published }),
      });
      if (res.ok) {
        const data = await res.json();
        setScene(data.scene);
      } else {
        const err = await res.json();
        alert(err.error?.message || "Publish failed (Rule R11)");
      }
    } catch {
      alert("Error updating publish status");
    }
  };

  // Determine bundle url for sandboxed preview
  const bundleFilename = scene?.bundlePath ? scene.bundlePath.split("/").pop() : `${id}.bundle.js`;
  const bundleUrl = scene?.status === "READY" ? `/media/scenes/${bundleFilename}` : undefined;

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-ink/10">
        <div className="flex items-center gap-3">
          <Link
            href={`/${locale}/admin/scenes`}
            className="p-2 rounded-xl border border-ink/15 text-ink-soft hover:text-ink hover:bg-ink/5"
            title="Back to Scenes"
          >
            <ArrowLeft className="w-4 h-4" />
          </Link>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-mono text-xs px-2 py-0.5 rounded bg-accent/10 text-accent font-semibold">AD-3</span>
              <h1 className="font-serif text-2xl font-medium text-ink">{scene?.name || "Loading..."}</h1>
              {scene && (
                <span
                  className={`px-2 py-0.5 rounded text-[10px] font-semibold uppercase font-mono ${
                    scene.status === "READY"
                      ? "bg-emerald-500/15 text-emerald-600 dark:text-emerald-400"
                      : "bg-rose-500/15 text-rose-500"
                  }`}
                >
                  {scene.status}
                </span>
              )}
            </div>
            <p className="text-xs text-ink-soft font-mono">
              Model: {scene?.model || "Qwen3.5-4B"} | ViewBox 1920x1080 | @timedrift/scene-api
            </p>
          </div>
        </div>

        {scene && (
          <div className="flex items-center gap-2">
            <button
              onClick={togglePublish}
              disabled={scene.status !== "READY"}
              className={`px-4 py-2 rounded-xl text-xs font-medium transition-colors ${
                scene.published
                  ? "bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30"
                  : "bg-paper-light border border-ink/15 text-ink hover:border-ink/30"
              } ${scene.status !== "READY" ? "opacity-50 cursor-not-allowed" : ""}`}
              title={scene.status !== "READY" ? "Rule R11: Scene must pass validation to publish" : ""}
            >
              {scene.published ? "Published (Live)" : "Draft (Unpublished)"}
            </button>
          </div>
        )}
      </div>

      {error && (
        <div className="p-4 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-600 dark:text-rose-400 text-xs font-mono flex items-center justify-between">
          <div className="flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 flex-shrink-0" />
            <span>{error}</span>
          </div>
          <button onClick={() => setError(null)}><X className="w-4 h-4" /></button>
        </div>
      )}

      {/* Dual Pane Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 min-h-[680px]">
        {/* Left Pane: Code Editor & Validation Diagnostic */}
        <div className="flex flex-col rounded-2xl border border-ink/10 bg-paper-light overflow-hidden shadow-sm">
          <div className="p-3.5 border-b border-ink/10 flex items-center justify-between bg-paper">
            <div className="flex items-center gap-2">
              <Film className="w-4 h-4 text-accent" />
              <span className="font-serif text-sm font-medium text-ink">Scene TypeScript Source</span>
            </div>
            <button
              onClick={handleSaveAndRebuild}
              disabled={rebuilding}
              className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-lg bg-accent text-paper-light hover:bg-accent-hover text-xs font-medium transition-colors shadow-sm"
            >
              {rebuilding ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Save className="w-3.5 h-3.5" />}
              {rebuilding ? "Rebuilding & Validating..." : "Save & Rebuild (R11)"}
            </button>
          </div>

          {/* Code Editor Textarea */}
          <div className="flex-1 p-2 bg-[#12141d] font-mono text-xs text-[#d1d5db]">
            <textarea
              value={sourceCode}
              onChange={(e) => setSourceCode(e.target.value)}
              placeholder="// Loading scene module source code..."
              spellCheck={false}
              className="w-full h-full min-h-[460px] bg-transparent outline-none resize-none font-mono text-[11px] leading-relaxed p-2 text-emerald-400/90 selection:bg-accent/40 scrollbar-thin"
            />
          </div>

          {/* Validation Report Card */}
          <div className="p-4 border-t border-ink/10 bg-paper space-y-3">
            <div className="flex items-center justify-between">
              <span className="font-serif text-xs font-semibold uppercase tracking-wider text-ink-muted">
                4-Stage Automated Validation Report (BE-6)
              </span>
              <span className="text-[11px] font-mono text-ink-soft">R11 Compliance</span>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-[11px] font-mono">
              <div className={`p-2.5 rounded-xl border flex flex-col justify-between ${
                validation?.stage1.passed
                  ? "bg-emerald-500/10 border-emerald-500/20 text-emerald-600 dark:text-emerald-400"
                  : "bg-ink/5 border-ink/10 text-ink-muted"
              }`}>
                <div className="font-semibold">Stage 1: Scan</div>
                <div className="text-[10px] mt-1 truncate">{validation?.stage1.message || "Prohibited tokens"}</div>
              </div>

              <div className={`p-2.5 rounded-xl border flex flex-col justify-between ${
                validation?.stage2.passed
                  ? "bg-emerald-500/10 border-emerald-500/20 text-emerald-600 dark:text-emerald-400"
                  : "bg-ink/5 border-ink/10 text-ink-muted"
              }`}>
                <div className="font-semibold">Stage 2: Typecheck</div>
                <div className="text-[10px] mt-1 truncate">{validation?.stage2.message || "TypeScript API"}</div>
              </div>

              <div className={`p-2.5 rounded-xl border flex flex-col justify-between ${
                validation?.stage3.passed
                  ? "bg-emerald-500/10 border-emerald-500/20 text-emerald-600 dark:text-emerald-400"
                  : "bg-ink/5 border-ink/10 text-ink-muted"
              }`}>
                <div className="font-semibold">Stage 3: Bundler</div>
                <div className="text-[10px] mt-1 truncate">{validation?.stage3.message || "esbuild ESM"}</div>
              </div>

              <div className={`p-2.5 rounded-xl border flex flex-col justify-between ${
                validation?.stage4.passed
                  ? "bg-emerald-500/10 border-emerald-500/20 text-emerald-600 dark:text-emerald-400"
                  : "bg-ink/5 border-ink/10 text-ink-muted"
              }`}>
                <div className="font-semibold">Stage 4: Headless</div>
                <div className="text-[10px] mt-1 truncate">{validation?.stage4.message || "Sandboxed run"}</div>
              </div>
            </div>
          </div>
        </div>

        {/* Right Pane: Live Sandboxed Preview & Tau Scrubber */}
        <div className="flex flex-col rounded-2xl border border-ink/10 bg-paper-light overflow-hidden shadow-sm">
          <div className="p-3.5 border-b border-ink/10 flex items-center justify-between bg-paper">
            <div className="flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-emerald-600" />
              <span className="font-serif text-sm font-medium text-ink">
                Sandboxed Host (public/scene-host.html)
              </span>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setShowSafeZone(!showSafeZone)}
                className={`p-1.5 rounded-lg border text-xs font-mono flex items-center gap-1 transition-colors ${
                  showSafeZone
                    ? "border-accent text-accent bg-accent/10"
                    : "border-ink/15 text-ink-muted bg-paper"
                }`}
                title="Toggle 9:16 Mobile Center Safe Zone Guide"
              >
                <Smartphone className="w-3.5 h-3.5" /> 9:16 Guide
              </button>
              <button
                onClick={() => setIsPaused(!isPaused)}
                className="p-1.5 rounded-lg border border-ink/15 text-ink-soft hover:text-ink bg-paper"
                title={isPaused ? "Play" : "Pause"}
              >
                {isPaused ? <Play className="w-3.5 h-3.5" /> : <Pause className="w-3.5 h-3.5" />}
              </button>
            </div>
          </div>

          {/* Sandboxed SceneFrame Canvas */}
          <div className="relative flex-1 bg-paper aspect-[16/9] flex items-center justify-center overflow-hidden">
            {bundleUrl ? (
              <SceneFrame
                bundleUrl={bundleUrl}
                sceneId={scene?.id}
                paused={isPaused}
                speed={speed}
                tau={tau}
                className="w-full h-full"
                onReady={() => setSandboxReady(true)}
                onError={(err) => setSandboxError(err.message)}
              />
            ) : (
              <div className="text-center p-8 text-xs text-ink-muted">
                {scene?.status === "READY"
                  ? "Loading sandboxed line-art bundle..."
                  : "Scene must be compiled & validated before live preview is available."}
              </div>
            )}

            {/* 9:16 Center Safe Zone Overlay */}
            {showSafeZone && (
              <div
                className="absolute inset-y-0 border-x-2 border-dashed border-accent/40 bg-accent/[0.03] pointer-events-none flex flex-col justify-between p-2"
                style={{
                  left: "34.375%", // (660 / 1920)
                  right: "34.375%",
                }}
              >
                <div className="text-[10px] font-mono text-accent bg-paper/80 px-1 rounded self-start">
                  9:16 Focus Zone
                </div>
                <div className="text-[9px] font-mono text-accent/70 bg-paper/80 px-1 rounded self-center">
                  x ∈ [660, 1260]
                </div>
              </div>
            )}

            {sandboxError && (
              <div className="absolute inset-x-4 bottom-4 p-3 rounded-xl bg-rose-500/90 text-white font-mono text-xs shadow-lg">
                Runtime Error: {sandboxError}
              </div>
            )}
          </div>

          {/* Interactive Inspection Controls */}
          <div className="p-4 border-t border-ink/10 bg-paper space-y-4">
            {/* Diurnal Tau Scrubber */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between text-xs">
                <span className="font-medium text-ink flex items-center gap-1.5">
                  <Sun className="w-3.5 h-3.5 text-amber-500" />
                  Diurnal Tau Scrubber (&tau; = {tau.toFixed(2)})
                </span>
                <span className="font-mono text-ink-muted flex items-center gap-1">
                  <Moon className="w-3.5 h-3.5 text-indigo-400" />
                  {tau < 0.25 ? "Dawn" : tau < 0.7 ? "Daylight" : tau < 0.85 ? "Dusk" : "Midnight Lanterns"}
                </span>
              </div>
              <input
                type="range"
                min="0"
                max="1"
                step="0.01"
                value={tau}
                onChange={(e) => setTau(parseFloat(e.target.value))}
                className="w-full accent-accent h-1.5 bg-ink/10 rounded-lg cursor-pointer"
              />
              <div className="flex justify-between text-[10px] font-mono text-ink-muted">
                <span>0.0 (Dawn)</span>
                <span>0.5 (Noon)</span>
                <span>0.75 (Dusk)</span>
                <span>1.0 (Midnight)</span>
              </div>
            </div>

            {/* Kinematic Speed Multiplier Buttons */}
            <div className="flex items-center justify-between pt-2 border-t border-ink/5 text-xs">
              <span className="font-medium text-ink flex items-center gap-1.5">
                <Gauge className="w-3.5 h-3.5 text-accent" />
                Kinematic Speed
              </span>
              <div className="flex items-center gap-1.5">
                {[0.25, 1.0, 2.0, 10.0].map((s) => (
                  <button
                    key={s}
                    onClick={() => setSpeed(s)}
                    className={`px-2.5 py-1 rounded-lg text-xs font-mono transition-colors ${
                      speed === s
                        ? "bg-accent text-paper-light font-bold"
                        : "bg-paper-light border border-ink/10 text-ink-soft hover:text-ink"
                    }`}
                  >
                    {s}x
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
