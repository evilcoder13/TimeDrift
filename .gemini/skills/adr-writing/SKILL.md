---
name: adr-writing
description: Record an architecture or product-technical decision as an ADR in docs/DECISIONS.md. Use when the stack, scene contract, data model shape, model choice or a security boundary changes.
---
# ADR Writing
1. Check whether an existing ADR already covers the decision. If you are reversing one, the new ADR must say `Supersedes ADR-00X`. Never edit an accepted ADR's text, only its status line.
2. Add the next number at the bottom:
```
## ADR-0NN <short title> — Proposed
- Context: <problem, constraints, what triggered this>
- Decision: <what we do, concretely>
- Alternatives: <option — why not>
- Consequences: <trade-offs, follow-up tasks>
```
3. The Tech Lead changes the status to `Accepted`. Then update AGENTS.md or the guides if they mention the old behaviour, and add backlog tasks for the follow-ups.
