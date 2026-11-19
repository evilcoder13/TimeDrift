---
name: timedrift-task-workflow
description: Pick up, execute, hand off and close a TimeDrift backlog task. Use whenever starting or finishing a task ID like FE-5, AUD-2 or DIR-3.
---
# Task Workflow

## Start
1. Find the task row in `docs/BACKLOG.md`. Check that every task in `Deps` is DONE.
2. Change its status to `DOING` and add your agent name, e.g. `DOING (timedrift-frontend)`.
3. List the acceptance criteria you'll satisfy (from REQUIREMENTS.md or the role doc).

## Execute
- Stay within your agent's `write_access` paths.
- If something is ambiguous, write a question under `## Open questions` at the bottom of BACKLOG.md and tag the owner role (BA for rules, Director for creative, TL for tech). Don't guess.

## Hand off → `REVIEW`
| Output | Reviewer |
|---|---|
| Code | Tech Lead (`code-review`) then QA |
| Music / scene / template | Director (`content-review`) |
| Rules / copy | BA → PM |
| Design | Director |
Write a handoff note: what changed, how to verify it, known gaps.

## Close → `DONE`
Only the reviewer or QA moves a task to DONE. Then update the docs that changed, and add an ADR if a decision changed. After code changes, run `graphify update .`.
