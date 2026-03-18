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

The illustration system is a **component registry**, not an asset library. Every visual type is a JavaScript function. No SVG files are read from disk. Adding a new entity type = one render function + one registry entry.

---

## Monorepo Layout

```
preplai/
├── packages/
│   ├── shared/         @preplai/shared — types, schemas, utilities
│   ├── illustrations/  @preplai/illustrations — 88+ programmatic SVG components
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
| Illustration registry | `packages/illustrations/src/registry.ts` |
| Design tokens (colors, typography, stroke) | `packages/illustrations/src/design-tokens.ts` |
| Player scene controller | `packages/player/src/scene-controller.js` |
| MCP tools | `packages/mcp-server/src/tools.ts` |
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
