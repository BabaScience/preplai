# Preplai — Claude Code Project Instructions

> **Start here.** Claude Code loads this file from `.claude/` when working on this project.

---

## Mission

**"The agent understands. The engine shows. The user learns."**

Preplai is the most advanced cinematic illustration engine for AI agents. Any AI — ChatGPT, Claude, Cursor, autonomous agents — can present anything visually via MCP. Not slides, not PDFs — cinema.

---

## Who We Build For (MVP)

Every code decision should serve one of these three users:

1. **CS students** — Use LLMs to learn CS. Today they get text walls. Preplai gives them cinematic visual walkthroughs (arrays animate, trees grow, data flows through pipelines).
2. **Programmers** — Use AI coding tools (Cursor, Copilot, Claude Code). They don't understand what the AI built. Preplai lets the AI *show* the architecture and logic step by step.
3. **AI agent owners** — Run autonomous agents (OpenClaw, custom agents). They can't see what the agent did. Preplai lets agents present visual reports of their actions and decisions.

When in doubt, ask: *"Does this help a student understand, a programmer see what AI built, or an agent owner see what their agent did?"*

---

## Key Docs (Read First)

| Doc | Purpose |
|-----|---------|
| [AGENTS.md](../AGENTS.md) | Full onboarding: architecture, paths, invariants |
| [Claude.md](../Claude.md) | Design & illustration focus |
| [MISSION.md](../MISSION.md) | Mission statement, target users, use cases |

---

## Skills (Invoke with `/skill-name`)

- **frontend-design** — React, CSS, accessibility, design tokens, responsive layout
- **illustration-design** — Programmatic SVG components, double-`<g>` pattern, registry

Skills in `.claude/skills/` are loaded automatically when relevant, or invoke directly.

---

## Critical for Illustrations

1. **Double-`<g>` pattern:** outerG = position, innerG = shapes + animation. Never animate outerG.
2. **GPU-only animation:** `opacity`, `transform` only. Never `x`, `y`, `width`, `height`, `fill`, `stroke`.
3. **Design tokens:** Import from `design-tokens.ts`. No hardcoded values.
4. **After edits:** `pnpm --filter @preplai/illustrations run build`

---

## Build & Test

```bash
pnpm install && pnpm run build
pnpm --filter @preplai/illustrations run build   # after illustration edits
pnpm --filter website run dev                     # Illustration Debug at /dev/illustrations
```
