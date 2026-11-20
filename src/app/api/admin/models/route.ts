import { NextResponse } from "next/server";
import { requireAdmin } from "@/server/guards";

export async function GET() {
  try {
    await requireAdmin();

    const llmUrl = process.env.LLM_BASE_URL || "http://100.100.91.61:8000/v1";

    let models: Array<{ id: string; name: string }> = [];

    try {
      const ctrl = new AbortController();
      const tid = setTimeout(() => ctrl.abort(), 3000);
      const res = await fetch(`${llmUrl}/models`, { signal: ctrl.signal });
      clearTimeout(tid);

      if (res.ok) {
        const json = await res.json();
        if (Array.isArray(json.data)) {
          models = json.data.map((m: { id: string }) => ({
            id: m.id,
            name: m.id === "default"
              ? "Qwen2.5-Coder-1.5B (Default Lightweight)"
              : m.id.replace(/\.gguf$/i, ""),
          }));
        }
      }
    } catch {
      // LLM service temporarily unreachable
    }

    // Fallback if no models returned or service down
    if (models.length === 0) {
      models = [
        {
          id: process.env.LLM_MODEL || "default",
          name: "Qwen2.5-Coder-1.5B (Default Lightweight)",
        },
      ];
    }

    return NextResponse.json({ models });
  } catch (err: unknown) {
    const error = err as { statusCode?: number; code?: string; message?: string };
    return NextResponse.json(
      { error: { code: error.code || "INTERNAL_ERROR", message: error.message || "Failed to load models" } },
      { status: error.statusCode || 500 }
    );
  }
}
