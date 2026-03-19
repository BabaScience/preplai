# Claude — Preplai Design & Illustration Guide

> **For Claude Code:** Use this when working on design, UI, or illustration components. It complements [AGENTS.md](./AGENTS.md) with design-specific context.

---

## Product Context

**"Don't read it. Watch it."** Preplai is **The Visual Layer for AI** — turning any AI answer into animated, narrated visuals anyone can watch and share. We serve four target users:

1. **Engineers & SRE Teams** — AI connects our MCP to *show* incident timelines, architecture changes, and system designs instead of unreadable postmortem docs
2. **Product Managers** — AI connects our MCP to *show* technical concepts to stakeholders cinematically, bridging the technical-business gap
3. **Consultants & Strategists** — AI connects our MCP to turn analysis into client-ready visual deliverables that clients actually watch and remember
4. **Financial Advisors & Legal** — AI connects our MCP to *show* complex fund flows, legal hierarchies, and regulatory processes to clients visually

Every design decision should make these presentations more cinematic, clear, and shareable.

---

## Your Focus Areas

1. **Illustration components** — Programmatic SVG in `packages/illustrations/`
2. **Design system** — Tokens, colors, typography, layout
3. **Player UI** — Narrator panel, frame nav, background, transitions
4. **Website** — Marketing site, dashboard, Illustration Debug page

---

## Illustration System: How It Works

```
Agent emits VisualEntity JSON
    → Component Registry (type → render function)
    → buildEntityGroup() → outerG + innerG
    → Shapes appended to innerG
    → applyEntranceAnimation(innerG, entity)
    → parentEl.appendChild(outerG)
```

**Canvas:** `viewBox="0 0 1920 1080"`, positions in 0–100% (agent API).

**Reference component:** `packages/illustrations/src/components/cache.ts` — minimal, follows all patterns.

---

## Adding a New Illustration Component

1. Create `packages/illustrations/src/components/<name>.ts`
2. Implement: `export function render<Name>(entity: VisualEntity, parentEl: SVGElement): SVGGElement`
3. Use `buildEntityGroup`, `applyEntranceAnimation`, design tokens
4. Add `ENTITY_COLORS` entry in `design-tokens.ts` if needed
5. Register in `registry.ts`
6. Export from `index.ts`
7. Add metadata defaults in `apps/website/src/pages/dev/entity-defaults.ts` (for debug UI)
8. Run: `pnpm --filter @preplai/illustrations run build`

---

## Design Tokens (Single Source of Truth)

**File:** `packages/illustrations/src/design-tokens.ts`

| Category | Use |
|----------|-----|
| `COLORS` | Accent palette (cyan, violet, gold, pink, green, orange, red, teal, blue) |
| `getCategoryColor(type)` | Default color per entity type |
| `ENTITY_COLORS` | Override map for specific types |
| `STROKE`, `getStrokeWidth()` | Line weights (default, thin, emphasized, selected, minimal) |
| `TYPOGRAPHY`, `getLabelFontSize(role, scale?)` | Font sizes and weights |
| `LABEL_DEFAULTS` | offsetBelow, textAnchor, lineHeight |
| `SHAPES` | borderRadius, borderRadiusLarge |

**Never hardcode** stroke width, font size, or colors. Import from design-tokens.

---

## Illustration Style Rules

- **Label placement:** Interior only when shape is large enough (w>120, h>80). Exterior below with 12px gap. Never double-label.
- **Concept circles:** Label inside if ≤12 chars, else below.
- **Gradients:** Use `createLinearGradient` (vertical surfaces) or `createRadialGradient` (spheres, circles).
- **Highlight:** When `entity.highlight`, add outer stroke or subtle glow.

---

## Cinema Design System (docs/design-system-v4.md)

**Background layers:** `bg-deep` → `bg-base` → `bg-elevated` → `bg-surface` → `bg-hover`

**Entity palette:** Saturated, distinct colors per type (server=teal, database=emerald, user=gold, etc.)

**Typography:** Inter (display/UI), JetBrains Mono (code). Scale: title-hero 48px → entity-name 16px → narrator 17px.

**Motion:** CSS @keyframes for entrance; GSAP for slide transitions. Easing: `cubic-bezier(0.16, 1, 0.3, 1)` for enter.

---

## Illustration Debug Page

**Path:** `apps/website/src/pages/dev/IllustrationDebugPage.jsx`

**URL:** `http://localhost:5173/dev/illustrations` (when website dev server runs)

Use this to:
- Preview every illustration type
- Tweak entity params (position, label, metadata)
- Test metadata shapes
- Copy entity JSON for MCP/add_scene

**Entity defaults:** `entity-defaults.ts` — provides sensible defaults per type for the debug UI.

---

## Deeper Illustration Tasks

When doing **deeper** work (new component, visual refinement, metadata schema, layout logic):

1. Read `packages/illustrations/CLAUDE_ILLUSTRATION_DEEP_DIVE.md` for component anatomy and checklist
2. Read `packages/illustrations/ILLUSTRATION_STYLE_GUIDE.md`
3. Read `packages/illustrations/METADATA_SCHEMAS.md` for the type you’re editing
4. Read `architecture/05-illustration-system.md` (sections 5–9) for double-`<g>`, registry, and examples
5. Use `cache.ts` or `server.ts` as reference implementations
6. Test in Illustration Debug page after build

---

## Common Pitfalls

| Pitfall | Fix |
|---------|-----|
| Shapes in outerG | All shapes go in innerG |
| Animating position | Only animate innerG (opacity, transform) |
| Hardcoded stroke/font | Use design tokens |
| Missing registry entry | Add to `registry.ts` and `index.ts` |
| Debug UI shows wrong defaults | Update `entity-defaults.ts` and `METADATA_DEFAULTS` |
| Build not run after edit | `pnpm --filter @preplai/illustrations run build` |

---

## Agent Skills

- **frontend-design** — React, CSS, accessibility, design tokens, responsive layout. Invoke with `/frontend-design` or it applies when relevant.
- **illustration-design** — Programmatic SVG components, registry, double-`<g>` pattern. Invoke with `/illustration-design` or it applies when relevant.

## Files to Read First

1. `AGENTS.md` — project overview
2. `packages/illustrations/ILLUSTRATION_STYLE_GUIDE.md` — design system
3. `packages/illustrations/src/components/cache.ts` — reference component
4. `packages/illustrations/src/design-tokens.ts` — tokens
5. `packages/illustrations/src/registry.ts` — registration pattern
