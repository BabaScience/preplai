# Preplai — Claude Code Project Instructions

> **Start here.** Claude Code loads this file from `.claude/` when working on this project.

---

## Mission

**"The agent understands. The engine shows. The user learns."**

Preplai is a cinema-quality visual presentation engine exposed as an agent-native API. AI agents create live, animated, voice-synced visual experiences—not slides, cinema.

---

## Key Docs (Read First)

| Doc | Purpose |
|-----|---------|
| [AGENTS.md](../AGENTS.md) | Full onboarding: architecture, paths, invariants |
| [Claude.md](../Claude.md) | Design & illustration focus |
| [MISSION.md](../MISSION.md) | Mission statement |

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
