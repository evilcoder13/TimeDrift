---
name: omlx-llm
description: Call and benchmark the local omlx OpenAI-compatible LLM server (http://10.1.123.123:8000/v1) for TimeDrift, choosing the smallest model that works. Use when wiring the LLM client, checking model availability, or selecting default/fallback models.
---
# omlx LLM

## Endpoint
`LLM_BASE_URL=http://10.1.123.123:8000/v1` (OpenAI-compatible, no key needed; send `LLM_API_KEY=not-needed`).
```bash
curl -s $LLM_BASE_URL/models | jq -r '.data[].id'
curl -s $LLM_BASE_URL/chat/completions -H 'content-type: application/json' \
  -d '{"model":"Qwen3.5-4B-3D-Coder","temperature":0.3,"max_tokens":6000,"messages":[{"role":"system","content":"..."},{"role":"user","content":"..."}]}'
```

## Model policy (smallest first)
| Order | Model | Use |
|---|---|---|
| 1 | `Qwen3.5-4B-3D-Coder` | default scene codegen (attempts 1–2) |
| 2 | `gemma-4-12b-4bit` | fallback (attempt 3) |
| — | `Qwen3.5-4B-MLX-4bit`, `gemma-3-4b-it-qat-4bit` | benchmark candidates |
| — | `Jev-Style-Qwen3.5-2B-…` | only for tiny text tasks (e.g. tag suggestions) if it passes |
| ✗ | `DeepSeek-V4-Pro-…-UNCENSORED-heretic` | never use |
Make a model the default only if it reaches ≥ 70% pass within 3 attempts on the bench (see `scene-prompt-engineering`).

## Client (`src/server/llm.ts`)
- Use `fetch` directly, so there's no SDK dependency. Set a timeout of 180s, because responses on CPU/MLX can be slow.
- If a response contains `<think>…</think>` (Qwen3.x thinking), strip it before extracting the code block.
- Log the model, latency and token usage into GenJob.log.
- Health check: if `GET /models` responds within 3s and lists the configured model, the server is up. Show the result in `/api/admin/health`.
