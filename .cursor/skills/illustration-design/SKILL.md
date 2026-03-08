---
name: illustration-design
description: Builds and refines programmatic SVG illustration components in @preplai/illustrations. Use when adding or modifying illustration types, design tokens, metadata schemas, or when working with packages/illustrations, IllustrationDebugPage, or entity rendering.
---

# Illustration Design

Guidance for the preplai programmatic SVG illustration system. Every visual type is a JavaScript render function—no static SVG files.

---

## Core Patterns

**Double-`<g>` pattern (required):**
- `outerG`: `translate(cx, cy)` for position. Never animated.
- `innerG`: All shapes and animation. Append children here only.

```ts
const { outerG, innerG } = buildEntityGroup(entity);
// ... append to innerG ...
applyEntranceAnimation(innerG, entity);
parentEl.appendChild(outerG);
return outerG;
```

**GPU-only animation:** Animate `opacity`, `transform` (translate, scale, rotate). Never animate `x`, `y`, `width`, `height`, `fill`, `stroke`, `cx`, `cy`, `r`.

**Design tokens:** Import from `design-tokens.ts`. No hardcoded stroke, font-size, or colors. Use `getCategoryColor`, `TYPOGRAPHY`, `STROKE`, `LABEL_DEFAULTS`.

---

## Adding a New Component

1. Create `packages/illustrations/src/components/<name>.ts`
2. Implement `render<Name>(entity, parentEl)` using `buildEntityGroup`, `applyEntranceAnimation`
3. Add `ENTITY_COLORS` in design-tokens.ts if new type
4. Register in `registry.ts` and export from `index.ts`
5. Add defaults in `apps/website/src/pages/dev/entity-defaults.ts`
6. Document metadata in `METADATA_SCHEMAS.md` if applicable
7. Run: `pnpm --filter @preplai/illustrations run build`
8. Test at `http://localhost:5173/dev/illustrations`

---

## Style Rules

- **Label placement:** Interior only when shape is large (w>120, h>80). Exterior below with 12px gap. Never double-label.
- **Concept circles:** Label inside if ≤12 chars, else below.
- **Gradients:** `createLinearGradient` (vertical surfaces), `createRadialGradient` (spheres, circles).
- **Highlight:** When `entity.highlight`, add outer stroke or subtle glow.

---

## Reference Components

| Complexity | Component | Use for |
|------------|-----------|---------|
| Simple | concept.ts, cycle.ts | Basic shapes |
| Medium | cache.ts, server.ts | Cylinder, rect, gradients |
| Complex | array.ts, binarytree.ts | Metadata-driven layout |

---

## Additional Resources

- [packages/illustrations/CLAUDE_ILLUSTRATION_DEEP_DIVE.md](../../packages/illustrations/CLAUDE_ILLUSTRATION_DEEP_DIVE.md) — Component anatomy, checklist
- [packages/illustrations/ILLUSTRATION_STYLE_GUIDE.md](../../packages/illustrations/ILLUSTRATION_STYLE_GUIDE.md) — Design tokens, typography
- [Claude.md](../../Claude.md) — Design & illustration focus
