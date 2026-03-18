# Preplai — Claude Code Project Instructions

> **Start here.** Claude Code loads this file from `.claude/` when working on this project.

---

## Mission

**"Don't read it. Watch it."**

PreplAI is **The Visual Layer for AI**. We turn any AI answer into an animated, narrated visual presentation anyone can watch and share. Works with Claude, ChatGPT, Cursor, and any MCP-compatible tool. Not slides, not PDFs — cinema.

---

## Who We Build For

Every code decision should serve one of these four users:

1. **Engineers & SRE Teams** — Turn incident postmortems into animated walkthroughs. Visualize PR changes before code review. See what your AI coding assistant actually built — architecture diagrams, data flows, dependencies — narrated and shareable.
2. **Product Managers** — Ask AI to explain how the recommendation engine works, get 1,500 words. With PreplAI, ask your AI to explain it visually — share the animated walkthrough directly. 30 seconds instead of 30 minutes.
3. **Consultants & Strategists** — Turn AI research and analysis into client-ready visual presentations — automatically. No more converting text into slides.
4. **Financial Advisors & Legal** — Explain portfolio allocations, risk models, or contract structures to clients who don't speak your language. Visual walkthroughs they'll actually understand.

When in doubt, ask: *"Does this help someone watch and understand instead of read and forget?"*

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
