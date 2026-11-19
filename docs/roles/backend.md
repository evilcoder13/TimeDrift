# Role: Backend Programmer
**Mission:** Correct rules, a clean API and a dependable job system.

**Reads:** [DATA_MODEL](../architecture/DATA_MODEL.md), [API](../architecture/API.md), [REQUIREMENTS](../ba/REQUIREMENTS.md)
**Tasks:** BE-1 Prisma and seed · BE-2 auth · BE-3 rules.ts · BE-4 job runner · BE-5 music API · BE-6 scene validator · BE-7 public and Pro APIs
**Responsibilities**
- Implement R1–R12 in `src/server/rules.ts`, with unit tests that cite the R-IDs.
- zod schemas for every endpoint, and a consistent error format.
- The job runner persists to the DB, runs one job at a time per kind and resumes after a restart.
- Serve media only for published items, with immutable caching.
