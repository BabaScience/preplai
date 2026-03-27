# Preplai — AI Agent Onboarding

> **Purpose:** This document orients AI coding agents (Claude Code, Cursor, etc.) so they can productively work on the preplai codebase from day one.

---

## Mission

**"Don't read it. Watch it."**

Preplai is **The Visual Layer for AI**. We turn any AI answer into animated, narrated visuals anyone can watch and share. Any AI — ChatGPT, Claude, Cursor, autonomous agents — can present anything visually via MCP. Not slides, not PDFs — cinema.

- **AI** = director (emits structured JSON)
- **Engine** = stage (renders programmatic SVG with voice narration)
- **User** = audience (watches in browser, shares via link)

### Who We Build For

| User | Problem | How Preplai Helps |
|------|---------|-------------------|
| **Engineers & SRE Teams** | Incident postmortems are unreadable docs, PR reviews lack visual context, architecture decisions get lost in text | AI connects MCP → animated incident timelines, architecture walkthroughs, system design visualizations |
| **Product Managers** | Need to explain technical concepts to stakeholders but lack visual tools | AI connects MCP → cinematic explanations of architecture, pipelines, and features that stakeholders watch and understand |
| **Consultants & Strategists** | AI-powered analysis delivered as dense reports that clients skim | AI connects MCP → client-ready visual deliverables with animated walkthroughs clients actually watch |
| **Financial Advisors & Legal** | Complex structures and regulatory flows are impossible to explain in text | AI connects MCP → animated, narrated visual explanations of fund flows, legal hierarchies, and compliance processes |

Every feature decision should serve at least one of these users. When in doubt, ask: "Does this help someone *watch and understand* instead of *read and forget*?"

### Core Principle: Code Over Content

The illustration system is a **component registry**, not an asset library. Every visual type is a JavaScript function. No SVG files are read from disk.

**3-Tier Architecture:**
- **Tier 1** — 153 dedicated renderers (Server, Database, BinaryTree, etc.)
- **Tier 2** — Composable engine: `type: "Composable"` with `metadata: { shape, icon }` → 15 shapes × 200+ icons = 3,000+ combos
- **Tier 3** — Semantic resolver: unknown type names auto-mapped to shape+icon by keyword matching (e.g. "FundVehicle" → shield+landmark)

This ensures every domain (finance, legal, healthcare, education) gets cinematic visuals — not generic squares.

---

## Monorepo Layout

```
preplai/
├── packages/
│   ├── shared/         @preplai/shared — types, schemas, utilities
│   ├── illustrations/  @preplai/illustrations — 153 dedicated + composable SVG components
│   ├── compiler/       @preplai/compiler — PML scene compiler
│   ├── player/         @preplai/player — cinema viewer/renderer
│   ├── db/             @preplai/db — MongoDB models
│   └── mcp-server/     @preplai/mcp-server — Fastify API + MCP bridge
├── apps/
│   ├── api/            preplai-api — REST API
│   └── website/        preplai.com — marketing + dashboard + dev tools
├── architecture/       design docs (01–08 + FLOW)
└── docs/               setup, deployment, design system
```

---

## Key Paths for Common Tasks

| Task | Path |
|------|------|
| Add/modify illustration component | `packages/illustrations/src/components/<name>.ts` |
| Composable shapes (Tier 2) | `packages/illustrations/src/components/composable-shapes.ts` |
| Composable icons (Tier 2) | `packages/illustrations/src/components/icon-paths.ts` |
| Composable renderer | `packages/illustrations/src/components/composable.ts` |
| Semantic resolver (Tier 3) | `packages/illustrations/src/components/semantic-resolver.ts` |
| Illustration registry | `packages/illustrations/src/registry.ts` |
| Design tokens (colors, typography, stroke) | `packages/illustrations/src/design-tokens.ts` |
| Color cascade system | `packages/illustrations/src/color-cascade.ts` |
| Entity overlays (status/progress/badge) | `packages/illustrations/src/entity-overlays.ts` |
| Lottie overlay animations | `packages/illustrations/src/lottie-overlay.ts` |
| Player scene controller | `packages/player/src/scene-controller.ts` |
| Quality scorer (14 dimensions) | `packages/mcp-server/src/quality-scorer.ts` |
| Semantic focus generation | `packages/mcp-server/src/semantic-focus.ts` |
| MCP tools | `packages/mcp-server/src/mcp-tools.ts` |
| Agent tool descriptions | `packages/mcp-server/src/tool-descriptions/add-scene.v1.md` |
| Illustration debug UI | `apps/website/src/pages/dev/IllustrationDebugPage.jsx` |
| Entity defaults for debug | `apps/website/src/pages/dev/entity-defaults.ts` |

---

## Critical Invariants (Do Not Violate)

### 1. Double-`<g>` Pattern

Every illustration component MUST use:

- **outerG**: `translate(cx, cy)` for position — set once, never animated
- **innerG**: animation target — all shape children go here

```ts
const { outerG, innerG } = buildEntityGroup(entity);
// append shapes to innerG only
applyEntranceAnimation(innerG, entity);
parentEl.appendChild(outerG);
return outerG;
```

### 2. GPU-Accelerated Animation Only

Animate only: `opacity`, `transform: translate()`, `transform: scale()`, `transform: rotate()`.

Never animate: `x`, `y`, `width`, `height`, `fill`, `stroke`, `cx`, `cy`, `r`.

### 3. Flat JSON, Never Nested Trees

Agent emits flat `entities[]` with ID references (`sourceEntityId`, `targetEntityId`, `parentEntityId`). No nested children.

### 4. Use Design Tokens

Import from `design-tokens.ts`: `STROKE`, `TYPOGRAPHY`, `COLORS`, `getCategoryColor`, `getLabelFontSize`, `LABEL_DEFAULTS`. Avoid hardcoded values.

### 5. Color Cascade System

Use `resolveColorCascade(color)` from `color-cascade.ts` for consistent fill/stroke/text across themes. Returns `{ base, fill, fillMedium, stroke, strokeSoft, glow, textPrimary, textSecondary }`. Use `applyShapeColors(el, cc)` and `applyGlowColors(el, cc)` helpers. Never use raw `colorWithAlpha()` for standard patterns.

### 6. Perceptual Color Ramps

`design-tokens.ts` provides `COLOR_RAMPS` — 7-stop perceptual ramps per color (50→900). Stop 50 = fill, 600 = stroke, 800-900 = text. Use `getColorRamp(color)` for consistent color relationships.

---

## Design System Features

### Entity Overlays (Universal Metadata)
All entity types support these metadata fields:
- `status`: `"healthy"` | `"warning"` | `"error"` | `"inactive"` | `"loading"` — visual status indicator
- `progress`: `0.0–1.0` — circular progress arc
- `emphasis`: `"low"` | `"normal"` | `"high"` | `"critical"` — scales entity presence
- `badge`: `{ text, color?, position? }` — pill badge overlay
- `lottieAnimation`: `{ src, loop?, speed?, trigger? }` — animated micro-asset

### Layout Templates (16 templates)
Agent instructions include 16 diagram templates organized by client avatar:
- **Engineers:** hub-spoke, pipeline, incident-timeline, before-after, layered-stack
- **PMs:** user-flow, metric-dashboard, feature-tree, roadmap
- **Consultants:** org-chart, quadrant, strategy-tree, process-flow
- **Finance/Legal:** fund-hierarchy, decision-flow, waterfall

### Quality Scorer (14 dimensions)
Every `add_scene` call is scored 0-100 across 14 dimensions including cognitive science metrics (signal-to-noise, visual hierarchy, cognitive load, modality alignment, temporal coherence, systematization). Uses multiplicative bottleneck scoring — weakest dimension constrains overall score.

### Focus System — Progressive Reveal (Cinematic Depth-of-Field)
Narration-synced focus with three-tier generation (LLM semantic → string matching → agent hints). Features:
- **Progressive reveal:** Once narration focuses an entity, it stays visible (secondary focus) permanently within the frame. The scene builds up incrementally — previously introduced entities never blur back out. Only not-yet-mentioned entities are dimmed.
- **Cue coalescing:** Rapid successive cues (within 800ms) merge into multi-entity focus
- **Focus decay:** After 4s with no cues, active zoom/highlight clears but revealed entities remain visible
- **Always-visible types:** H1, H2, H3, Label, StepList, Badge, Quote, Definition, Callout, Annotation, Table never get background blur
- **Three DoF levels:** Primary (1.15×, full opacity), Secondary (1.05×, 85% opacity), Background (0.88×, 35% opacity)
- **Frame reset:** The revealed set clears on frame change — each new frame starts fresh

---

## Build & Test

```bash
pnpm install
pnpm run build

# After editing illustrations:
pnpm --filter @preplai/illustrations run build

# Run website (includes Illustration Debug page):
pnpm --filter website run dev
# → http://localhost:5173/dev/illustrations
```

---

## Documentation Map

| Doc | Purpose |
|-----|---------|
| [MISSION.md](./MISSION.md) | Mission statement, core principles |
| [README.md](./README.md) | Project overview, quick start |
| [architecture/01-system-overview.md](./architecture/01-system-overview.md) | Full architecture, mission, laws |
| [architecture/05-illustration-system.md](./architecture/05-illustration-system.md) | Illustration system deep dive |
| [docs/design-system-v4.md](./docs/design-system-v4.md) | Cinema-grade design system |
| [packages/illustrations/ILLUSTRATION_STYLE_GUIDE.md](./packages/illustrations/ILLUSTRATION_STYLE_GUIDE.md) | Colors, typography, component structure |
| [packages/illustrations/ILLUSTRATIONS_AGENT_GUIDE.md](./packages/illustrations/ILLUSTRATIONS_AGENT_GUIDE.md) | When to use each entity type |
| [packages/illustrations/METADATA_SCHEMAS.md](./packages/illustrations/METADATA_SCHEMAS.md) | Metadata shapes per type |
| [packages/illustrations/COMPACT_REFERENCE.md](./packages/illustrations/COMPACT_REFERENCE.md) | Short keys for agents |
| [Claude.md](./Claude.md) | Claude-specific: design & illustration focus |
| [packages/illustrations/CLAUDE_ILLUSTRATION_DEEP_DIVE.md](./packages/illustrations/CLAUDE_ILLUSTRATION_DEEP_DIVE.md) | Deep dive: new components, metadata, layout |

---

## Cursor Rules

- `.cursor/rules/illustrations-build.mdc` — Run illustrations build after edits
- `.cursor/rules/preplai-design-illustration.mdc` — Design and illustration conventions

## Agent Skills

Skills exist in both Cursor and Claude Code directories for compatibility:

| Location | Cursor | Claude Code |
|----------|--------|-------------|
| `.cursor/skills/` | ✓ | — |
| `.claude/skills/` | ✓ (compat) | ✓ |

- **frontend-design** — React, CSS, accessibility, design tokens, responsive layout
- **illustration-design** — Programmatic SVG components, registry, design tokens

---

## MCP Integration

The project exposes an MCP server (`user-preplai`) for creating presentations. Tools: `get_preferences`, `get_illustrations`, `create_session`, `add_scene`, `get_session_url`. See MCP server instructions for usage.
