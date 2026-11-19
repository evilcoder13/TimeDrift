---
name: business-rules
description: Define, change or implement TimeDrift business rules R1–R12 (timer limits, Pro gating, playlist 720-min cap, random selection, template matching, publish/delete constraints). Use when writing rules.ts, its tests, or editing REQUIREMENTS.md.
---
# Business Rules

## Source of truth
`docs/ba/REQUIREMENTS.md` §1. Never change what an existing R-ID means. Add a new R-ID that supersedes it.

## Implementation (Backend)
Everything goes in `src/server/rules.ts`, as pure functions with no DB access, so they are easy to test:
```ts
export const LIMITS = { freeMin: 3, freeMax: 15, freeDefault: 15, proMax: 720, playlistMax: 720, playlistItems: 50 } as const;
export function isPro(u: { isPro: boolean; proUntil: Date | null } | null, now = new Date()): boolean; // R9
export function validateRunMinutes(min: number, pro: boolean): Result;                                   // R1, R3
export function assertProFeature(pro: boolean): void;  // throws PRO_REQUIRED                             R4
export function validatePlaylist(items: { minutes: number; templateId?: string; musicId?: string; sceneId?: string }[]): Result; // R5
export function jaccard(a: string[], b: string[]): number;                                                 // R7
export function pickRandom(templates, scenes, music, lastId?: string, rng = Math.random);                  // R6
export function canPublishTemplate(t): Result;                                                             // R8
```
- Route handlers call these. The client may import `LIMITS` only for display.
- Mark each rule in a comment: `// R5: total ≤ 720`.

## Tests
`tests/rules.test.ts`. For each R-ID, test the boundaries: R1 with 2/3/15/16, R3 with 720/721, R5 with a total of 720/721 and 50/51 items, plus the XOR case. For R6, check there are no repeats over 100 runs with a seeded RNG.

## Changing a rule (BA)
Update REQUIREMENTS.md, add a note on the affected tasks in BACKLOG, and tell QA to update TEST_PLAN.
