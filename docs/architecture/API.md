# API (Owner: Backend)

All JSON. Validation with zod. Errors: `{ error: { code, message } }`. Codes: `UNAUTHORIZED`, `FORBIDDEN`, `PRO_REQUIRED`, `VALIDATION`, `NOT_FOUND`, `CONFLICT_IN_USE`.

## Public
| Method | Path | Notes |
|---|---|---|
| GET | `/api/tags` | All tags |
| GET | `/api/templates?tag=` | Published templates (with music + scene refs) |
| GET | `/api/random` | R6 → `{ musicId, sceneId, templateId? }` |
| POST | `/api/sessions` | `{ templateId? , musicId?, sceneId?, minutes }` → validates R1/R3/R4, returns `{ endsAt, music:{url}, scene:{bundleUrl} }` |
| GET | `/media/audio/:id.ogg` | Published only, `Cache-Control: public, max-age=31536000, immutable` |
| GET | `/media/scenes/:id.js` | Published only |

## Pro (auth + R9)
| Method | Path | Notes |
|---|---|---|
| GET | `/api/library/music?tag=` / `/api/library/scenes?tag=` | For custom pair |
| GET/POST | `/api/playlists` | List / create |
| GET/PUT/DELETE | `/api/playlists/:id` | Owner only; PUT replaces items, validates R5 |

## Admin (role ADMIN)
| Method | Path | Notes |
|---|---|---|
| CRUD | `/api/admin/tags` | AD-1 |
| POST | `/api/admin/music` | `{name,type,tagIds,prompt,seconds}` → queues job |
| POST | `/api/admin/music/:id/regenerate` | optional new prompt |
| PATCH/DELETE | `/api/admin/music/:id` | publish, edit meta; R12 |
| POST | `/api/admin/scenes` | `{name,description,tagIds,prompt}` → queues job |
| PUT | `/api/admin/scenes/:id/source` | edited source → revalidate (R11) |
| PATCH/DELETE | `/api/admin/scenes/:id` | |
| GET | `/api/admin/jobs/:id` | status, attempts, model, log |
| GET | `/api/admin/templates/suggest?sceneId=` | R7 scores |
| CRUD | `/api/admin/templates` | R8 |
| GET/PATCH | `/api/admin/users` | AD-5 Pro toggle |
| GET | `/api/admin/health` | omlx + worker reachability |

## Music worker (internal, :8100)
`POST /generate { prompt, seconds, out_path } → { out_path, duration_sec }` · `GET /health`
