# Roles & Responsibilities

| Role | File | Owns | Task prefix |
|---|---|---|---|
| Director | [director.md](director.md) | Creative vision, content approval | DIR |
| Product Manager | [pm.md](pm.md) | Scope, priorities, backlog, release | PM |
| Business Analyst | [ba.md](ba.md) | Rules, stories, acceptance criteria, i18n copy | BA |
| Tech Lead / Architect | [tech-lead.md](tech-lead.md) | Architecture, ADRs, code review, AGENTS.md | TL |
| Designer (UI/UX) | [designer.md](designer.md) | Flows, design system, assets | DES |
| Audio Maker | [audio-maker.md](audio-maker.md) | Music prompts, curation, loop quality | AUD |
| Scene Artist | [scene-artist.md](scene-artist.md) | Line-art scenes, scene prompts | SCN |
| ML Engineer | [ml-engineer.md](ml-engineer.md) | MusicGen worker, LLM scene pipeline | ML |
| Frontend Programmer | [frontend.md](frontend.md) | UI, player, PWA | FE |
| Backend Programmer | [backend.md](backend.md) | DB, API, rules, jobs, auth | BE |
| QA Engineer | [qa.md](qa.md) | Test plan, automation, sign-off | QA |
| DevOps | [devops.md](devops.md) | Env, deploy, backups | OPS |

## RACI (key deliverables)
| Deliverable | R | A | C | I |
|---|---|---|---|---|
| PRD / scope | PM | PM | Director, BA | All |
| Business rules | BA | PM | TL, QA | All |
| Architecture / ADRs | TL | TL | BE, FE, ML | PM |
| Creative brief, tags | Director | Director | Designer, Audio, Scene | PM |
| UI design | Designer | Director | FE, BA | PM |
| Music content | Audio Maker | Director | ML | PM |
| Scene content | Scene Artist | Director | ML, FE | PM |
| Pipelines | ML Eng | TL | BE, Audio, Scene | PM |
| App code | FE / BE | TL | Designer, BA | QA |
| Testing & sign-off | QA | PM | BA, TL | All |
| Deploy | DevOps | TL | BE | PM |

## Workflow
Task READY (PM) → DOING (owner) → REVIEW (TL for code, Director for content, BA for rules/copy) → QA verify → DONE. Content follows: generate → self-QA checklist → Director approve → publish.
