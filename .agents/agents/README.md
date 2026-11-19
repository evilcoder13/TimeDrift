# TimeDrift Agents

One agent per project role (see docs/roles/). Each file has YAML frontmatter (`name`, `description`, `skills`, `write_access`, `tasks`) and a body you can use as the agent's system prompt.
Skills live in `.agents/skills/<name>/SKILL.md`, where Antigravity picks them up automatically.

| Agent | Role | Skills |
|---|---|---|
| timedrift-director | Director | content-review |
| timedrift-pm | PM | — |
| timedrift-ba | BA | business-rules, i18n-copy |
| timedrift-tech-lead | Tech Lead | adr-writing, code-review |
| timedrift-designer | Designer | design-handoff |
| timedrift-audio-maker | Audio Maker | music-generation |
| timedrift-scene-artist | Scene Artist | scene-authoring, scene-prompt-engineering |
| timedrift-ml-engineer | ML Engineer | music-generation, scene-prompt-engineering, omlx-llm |
| timedrift-frontend | Frontend | player-runtime, i18n-copy, design-handoff |
| timedrift-backend | Backend | business-rules, api-endpoint |
| timedrift-qa | QA | qa-testing |
| timedrift-devops | DevOps | ops-setup, omlx-llm |

Every agent also uses `timedrift-context` and `timedrift-task-workflow`.

## Cross-tool Symlinks (Claude Code, OpenCode, Gemini / Antigravity)
All tools share a single source of truth (`AGENTS.md`, `.agents/agents/`, `.agents/skills/`) via relative symlinks in the project root:
- **Root instructions**: `CLAUDE.md -> AGENTS.md`, `GEMINI.md -> AGENTS.md` (OpenCode reads `AGENTS.md` directly).
- **Claude Code**: `.claude/agents -> ../.agents/agents`, `.claude/skills -> ../.agents/skills`
- **OpenCode**: `.opencode/agent -> ../.agents/agents`, `.opencode/agents -> ../.agents/agents`, `.opencode/skills -> ../.agents/skills`
- **Gemini / Antigravity**: `.gemini/agents -> ../.agents/agents`, `.gemini/skills -> ../.agents/skills` (in addition to `.agents/`)
- **Handoffs**: content goes Audio Maker / Scene Artist → Director. Code goes FE/BE/ML → Tech Lead → QA. Rules go BA → PM.
