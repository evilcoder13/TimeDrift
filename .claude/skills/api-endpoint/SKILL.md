---
name: api-endpoint
description: Add or change a TimeDrift Next.js route handler with zod validation, auth/Pro/admin guards, consistent errors and tests. Use for any file under src/app/api/.
---
# API Endpoint

## Template
```ts
// src/app/api/playlists/route.ts
import { z } from 'zod';
import { handler, requireUser, ApiError } from '@/server/http';
import { isPro, assertProFeature, validatePlaylist } from '@/server/rules';

const Body = z.object({ name: z.string().min(1).max(60), items: z.array(z.object({
  templateId: z.string().optional(), musicId: z.string().optional(), sceneId: z.string().optional(),
  minutes: z.number().int() })).max(50) });

export const POST = handler(async (req) => {
  const user = await requireUser();                 // 401 UNAUTHORIZED
  assertProFeature(isPro(user));                    // R4 → 403 PRO_REQUIRED
  const body = Body.parse(await req.json());        // 400 VALIDATION
  const r = validatePlaylist(body.items); if (!r.ok) throw new ApiError(400, 'VALIDATION', r.message); // R5
  // ... prisma write
  return Response.json(created, { status: 201 });
});
```
`handler()` maps ZodError and ApiError to `{error:{code,message}}`, and anything else to 500 (logged).

## Guards
`requireUser`, `requireAdmin` (role ADMIN), owner check (`playlist.userId === user.id`, otherwise 404, so we don't reveal that it exists). Public endpoints return only published content (R8).

## Checklist
- [ ] Listed in `docs/architecture/API.md`
- [ ] zod schema, R-ID comments
- [ ] Tests for success plus every error code (`tests/api/<route>.test.ts`)
- [ ] Error messages are codes that the client translates via `errors.<CODE>`
