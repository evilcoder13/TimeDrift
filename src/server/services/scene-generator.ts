import fs from 'node:fs/promises';
import path from 'node:path';

export interface SceneGenParams {
  name: string;
  description: string;
  tags: string[];
  prompt?: string;
}

export interface SceneGenAttemptResult {
  model: string;
  attempt: number;
  code: string;
  rawResponse: string;
  durationMs: number;
}

export interface SceneGenResult {
  code: string;
  model: string;
  attempts: number;
  history: Array<{
    attempt: number;
    model: string;
    durationMs: number;
    error?: string;
  }>;
}

const DEFAULT_BASE_URL = 'http://10.1.123.123:8000/v1';
const DEFAULT_MODEL = 'Qwen3.5-4B-3D-Coder';
const FALLBACK_MODEL = 'gemma-4-12b-4bit';

/**
 * Extracts TypeScript code block from LLM markdown response.
 * Handles thought tags (`<think>...</think>`), markdown fences (```ts or ```typescript),
 * or falls back to raw response if no fences found.
 */
export function extractTypeScriptBlock(rawText: string): string {
  // Strip <think>...</think> tags if present
  let cleaned = rawText.replace(/<think>[\s\S]*?<\/think>/gi, '').trim();

  // Match ```typescript or ```ts or plain ```
  const fenceRegex = /```(?:typescript|ts)?\s*([\s\S]*?)```/i;
  const match = cleaned.match(fenceRegex);

  if (match && match[1]) {
    return match[1].trim();
  }

  return cleaned;
}

/**
 * Reads system prompt from src/server/prompts/scene.system.md
 */
export async function loadSceneSystemPrompt(): Promise<string> {
  const promptPath = path.resolve(process.cwd(), 'src/server/prompts/scene.system.md');
  return await fs.readFile(promptPath, 'utf-8');
}

/**
 * Builds user prompt from scene parameters.
 */
export function buildUserPrompt(params: SceneGenParams): string {
  return [
    `Scene name: ${params.name}`,
    `Description: ${params.description}`,
    `Feeling tags: ${params.tags.join(', ')}`,
    params.prompt ? `Admin notes: ${params.prompt}` : null,
    'Return ONLY one TypeScript code block implementing the contract.'
  ]
    .filter(Boolean)
    .join('\n');
}

/**
 * Builds retry prompt for LLM self-correction feedback loop.
 */
export function buildRetryPrompt(previousCode: string, stage: string, errorMessage: string): string {
  return [
    `Your previous TypeScript scene code failed validation with the following error:`,
    `${stage}: ${errorMessage}`,
    ``,
    `Previous code:`,
    '```ts',
    previousCode,
    '```',
    ``,
    `Fix the issue, adhering strictly to the @timedrift/scene-api contract and library signatures.`,
    `Return ONLY the complete updated TypeScript code block.`
  ].join('\n');
}

export interface ChatMessage {
  role: 'system' | 'user' | 'assistant';
  content: string;
}

/**
 * Calls OpenAI-compatible chat completion endpoint.
 */
export async function callOmlxChat(
  messages: ChatMessage[],
  options: {
    model?: string;
    temperature?: number;
    maxTokens?: number;
    timeoutMs?: number;
    baseUrl?: string;
  } = {}
): Promise<{ content: string; durationMs: number; model: string }> {
  const baseUrl = options.baseUrl || process.env.LLM_BASE_URL || DEFAULT_BASE_URL;
  const model = options.model || process.env.LLM_MODEL || DEFAULT_MODEL;
  const temperature = options.temperature ?? 0.4;
  const maxTokens = options.maxTokens ?? 6000;
  const timeoutMs = options.timeoutMs ?? 180000; // 180s timeout

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);

  const startTime = Date.now();
  try {
    const res = await fetch(`${baseUrl}/chat/completions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${process.env.LLM_API_KEY || 'not-needed'}`
      },
      body: JSON.stringify({
        model,
        temperature,
        max_tokens: maxTokens,
        stream: false,
        messages
      }),
      signal: controller.signal
    });

    if (!res.ok) {
      const errText = await res.text();
      throw new Error(`omlx LLM error (${res.status}): ${errText}`);
    }

    const data = (await res.json()) as {
      choices?: Array<{ message?: { content?: string } }>;
      model?: string;
    };

    const content = data.choices?.[0]?.message?.content || '';
    const durationMs = Date.now() - startTime;
    return {
      content,
      durationMs,
      model: data.model || model
    };
  } finally {
    clearTimeout(timer);
  }
}

export type SceneValidatorFn = (
  code: string
) => Promise<{ ok: true } | { ok: false; stage: string; error: string }>;

/**
 * Orchestrates Scene Generation with 2-retry feedback loop and model fallback.
 * Attempt 1: Default Model (Qwen3.5-4B-3D-Coder)
 * Attempt 2: Default Model with validation feedback
 * Attempt 3: Fallback Model (gemma-4-12b-4bit) with validation feedback
 */
export async function generateSceneWithRetries(
  params: SceneGenParams,
  validator?: SceneValidatorFn
): Promise<SceneGenResult> {
  const defaultModel = process.env.LLM_MODEL || DEFAULT_MODEL;
  const fallbackModel = process.env.LLM_FALLBACK_MODEL || FALLBACK_MODEL;
  const systemPrompt = await loadSceneSystemPrompt();

  const messages: ChatMessage[] = [
    { role: 'system', content: systemPrompt },
    { role: 'user', content: buildUserPrompt(params) }
  ];

  const history: SceneGenResult['history'] = [];
  let currentCode = '';
  let finalModel = defaultModel;

  const maxAttempts = 3;

  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    // Attempt 1 & 2 use defaultModel; Attempt 3 uses fallbackModel
    const modelToUse = attempt === 3 ? fallbackModel : defaultModel;
    finalModel = modelToUse;

    const response = await callOmlxChat(messages, { model: modelToUse });
    currentCode = extractTypeScriptBlock(response.content);

    if (!validator) {
      // If no validator passed, return immediate first generation
      history.push({
        attempt,
        model: modelToUse,
        durationMs: response.durationMs
      });
      return {
        code: currentCode,
        model: modelToUse,
        attempts: attempt,
        history
      };
    }

    // Run validator
    const validationResult = await validator(currentCode);
    if (validationResult.ok) {
      history.push({
        attempt,
        model: modelToUse,
        durationMs: response.durationMs
      });
      return {
        code: currentCode,
        model: modelToUse,
        attempts: attempt,
        history
      };
    }

    // Record failure in history
    history.push({
      attempt,
      model: modelToUse,
      durationMs: response.durationMs,
      error: `${validationResult.stage}: ${validationResult.error}`
    });

    if (attempt < maxAttempts) {
      // Append assistant's answer and retry prompt for next attempt
      messages.push({ role: 'assistant', content: response.content });
      messages.push({
        role: 'user',
        content: buildRetryPrompt(currentCode, validationResult.stage, validationResult.error)
      });
    }
  }

  // If reached here, failed after max attempts
  throw new Error(
    `Scene generation failed validation after ${maxAttempts} attempts: ${history[history.length - 1]?.error || 'Unknown validation failure'}`
  );
}
