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
4. **Color cascade:** Use `resolveColorCascade(color)` from `color-cascade.ts` for consistent fill/stroke/text. Use `applyShapeColors()` and `applyGlowColors()` helpers.
5. **After edits:** `pnpm --filter @preplai/illustrations run build`

---

## Recent Architecture Additions

### Color Cascade (`color-cascade.ts`)
Single-call color resolution: `resolveColorCascade(color)` → `{ base, fill, fillMedium, stroke, strokeSoft, glow, textPrimary, textSecondary }`. All 21+ components migrated.

### Entity Overlays (`entity-overlays.ts`)
Universal metadata: `status`, `progress`, `emphasis`, `badge`, `lottieAnimation`. Applied automatically by `renderEntity()`.

### Perceptual Color Ramps (`design-tokens.ts`)
7-stop ramps per color (50→900). `getColorRamp(color)` returns stops calibrated for fill/stroke/text roles.

### Quality Scorer (`quality-scorer.ts`)
14-dimension cognitive science framework. Multiplicative bottleneck scoring. Includes signal-to-noise, visual hierarchy, cognitive load, modality alignment, temporal coherence, systematization.

### Layout Templates (16 templates)
In `add-scene.v1.md` tool description. Hub-spoke, pipeline, incident-timeline, before-after, layered-stack, user-flow, metric-dashboard, feature-tree, roadmap, org-chart, quadrant, strategy-tree, process-flow, fund-hierarchy, decision-flow, waterfall.

### Focus System — Progressive Reveal (`scene-controller.ts`)
- **Progressive reveal:** Once an entity is focused by narration, it stays visible (secondary focus) even when active focus moves elsewhere. Entities are discovered incrementally — the scene builds up as the narration introduces them. Only entities not yet mentioned are dimmed/blurred.
- **Cue coalescing:** Cues within 800ms merge into multi-entity focus (no rapid blinking)
- **Focus decay:** After 4s without cues, active focus (zoom/highlight) clears, but previously revealed entities remain visible
- **Always-visible types:** H1, H2, H3, Label, StepList, Badge, Quote, Definition, Callout, Annotation, Table never blur
- **Frame reset:** Revealed set clears on frame change — each frame starts fresh

---

## Build & Test

```bash
pnpm install && pnpm run build
pnpm --filter @preplai/illustrations run build   # after illustration edits
pnpm --filter @preplai/player run build          # after player/scene-controller edits
pnpm --filter @preplai/mcp-server run build      # after MCP server edits
pnpm --filter website run dev                     # Illustration Debug at /dev/illustrations
```
