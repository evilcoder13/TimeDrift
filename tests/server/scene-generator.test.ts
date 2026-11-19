import { describe, it, expect, vi } from 'vitest';
import {
  extractTypeScriptBlock,
  buildUserPrompt,
  buildRetryPrompt,
  generateSceneWithRetries
} from '../../src/server/services/scene-generator';

describe('Scene Generator Service', () => {
  it('extracts typescript code block cleanly', () => {
    const raw = `
Here is the code:
\`\`\`typescript
import mount from './scene';
export default function mount() {}
\`\`\`
Hope this helps!`;
    const extracted = extractTypeScriptBlock(raw);
    expect(extracted).toBe(`import mount from './scene';\nexport default function mount() {}`);
  });

  it('strips <think> tags from reasoning models', () => {
    const raw = `
<think>
Need to implement porch lantern scene.
Contract viewBox 0 0 1920 1080.
</think>
\`\`\`ts
export default function mount(svg, opts) {
  return { pause() {}, resume() {}, setSpeed() {}, destroy() {} };
}
\`\`\``;
    const extracted = extractTypeScriptBlock(raw);
    expect(extracted).toContain('export default function mount');
    expect(extracted).not.toContain('<think>');
  });

  it('builds user prompt adhering to template format', () => {
    const prompt = buildUserPrompt({
      name: 'Autumn Leaves',
      description: 'Falling leaves in a quiet park',
      tags: ['peaceful', 'autumn', 'nature'],
      prompt: 'Keep animation gentle'
    });

    expect(prompt).toContain('Scene name: Autumn Leaves');
    expect(prompt).toContain('Description: Falling leaves in a quiet park');
    expect(prompt).toContain('Feeling tags: peaceful, autumn, nature');
    expect(prompt).toContain('Admin notes: Keep animation gentle');
    expect(prompt).toContain('Return ONLY one TypeScript code block implementing the contract.');
  });

  it('builds retry prompt adhering to self-correction loop format', () => {
    const retry = buildRetryPrompt('const x = 1;', 'Stage 2: Typecheck', 'Variable x is unused');
    expect(retry).toContain('Your previous TypeScript scene code failed validation');
    expect(retry).toContain('Stage 2: Typecheck: Variable x is unused');
    expect(retry).toContain('const x = 1;');
    expect(retry).toContain('Return ONLY the complete updated TypeScript code block.');
  });

  it('handles retry and fallback progression in generateSceneWithRetries', async () => {
    // Mock fetch for omlx LLM endpoint
    const mockResponses = [
      {
        choices: [{ message: { content: '```ts\n// attempt 1 code\n```' } }],
        model: 'Qwen3.5-4B-3D-Coder'
      },
      {
        choices: [{ message: { content: '```ts\n// attempt 2 code\n```' } }],
        model: 'Qwen3.5-4B-3D-Coder'
      },
      {
        choices: [{ message: { content: '```ts\n// attempt 3 code\n```' } }],
        model: 'gemma-4-12b-4bit'
      }
    ];

    let callCount = 0;
    global.fetch = vi.fn().mockImplementation(async () => {
      const resp = mockResponses[callCount++];
      return {
        ok: true,
        json: async () => resp
      } as any;
    });

    // Validator fails attempt 1 & 2, succeeds attempt 3
    let validateCount = 0;
    const validator = vi.fn().mockImplementation(async (code: string) => {
      validateCount++;
      if (validateCount < 3) {
        return { ok: false, stage: 'Stage 2: Typecheck', error: `Error on attempt ${validateCount}` };
      }
      return { ok: true };
    });

    const result = await generateSceneWithRetries(
      {
        name: 'Test Scene',
        description: 'Testing retries',
        tags: ['calm']
      },
      validator
    );

    expect(result.attempts).toBe(3);
    expect(result.model).toBe('gemma-4-12b-4bit');
    expect(result.code).toBe('// attempt 3 code');
    expect(result.history.length).toBe(3);
    expect(result.history[0].error).toContain('Error on attempt 1');
    expect(result.history[1].error).toContain('Error on attempt 2');
    expect(result.history[2].error).toBeUndefined();
  });
});
