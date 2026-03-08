# Illustration Deep Dive — For Claude Code

> **When to use:** Deeper illustration tasks — new components, visual refinements, metadata schemas, layout logic, or fixing rendering bugs.

---

## 1. Component Anatomy

Every illustration component follows this structure:

```ts
import { SVG_NS, buildEntityGroup, applyEntranceAnimation, getSizeParam } from '../utils.js';
import { getCategoryColor, TYPOGRAPHY } from '../design-tokens.js';
import type { VisualEntity } from '@preplai/shared';

export function renderMyComponent(entity: VisualEntity, parentEl: SVGElement): SVGGElement {
  const { outerG, innerG } = buildEntityGroup(entity);
  const size = getSizeParam(entity);
  const color = entity.color ?? getCategoryColor('MyType');

  // 1. Create shapes (rect, circle, path, text) — append to innerG
  const rect = document.createElementNS(SVG_NS, 'rect');
  rect.setAttribute('x', String(-size / 2));
  rect.setAttribute('y', String(-size / 2));
  rect.setAttribute('width', String(size));
  rect.setAttribute('height', String(size));
  rect.setAttribute('fill', color);
  innerG.appendChild(rect);

  // 2. Label (if entity.label)
  if (entity.label) {
    const text = document.createElementNS(SVG_NS, 'text');
    text.setAttribute('y', String(size / 2 + 18));
    text.setAttribute('text-anchor', 'middle');
    text.setAttribute('fill', color);
    text.setAttribute('font-size', String(TYPOGRAPHY.fontSizeLabel));
    text.setAttribute('font-family', TYPOGRAPHY.fontLabel);
    text.textContent = entity.label;
    innerG.appendChild(text);
  }

  // 3. Entrance animation
  applyEntranceAnimation(innerG, entity);
  parentEl.appendChild(outerG);
  return outerG;
}
```

---

## 2. Utils You Need

| Util | Purpose |
|------|---------|
| `buildEntityGroup(entity)` | Returns `{ outerG, innerG }` with correct transforms |
| `applyEntranceAnimation(innerG, entity)` | Applies CSS entrance class + delay |
| `getSizeParam(entity)` | Returns `entity.size ?? ENTITY_DEFAULTS.size` scaled |
| `createLinearGradient(id, color, dir, defs)` | Linear gradient for defs |
| `createRadialGradient(id, color, defs)` | Radial gradient for defs |

---

## 3. Metadata Handling

For types that accept `metadata`:

```ts
const meta = entity.metadata ?? {};
const values = meta.values ?? meta.cells?.map(c => c.value) ?? [];
const selectedIndexes = meta.selectedIndexes ?? [];
```

Document the schema in `METADATA_SCHEMAS.md` and add defaults in `apps/website/src/pages/dev/entity-defaults.ts` (`METADATA_DEFAULTS`).

---

## 4. Connection Types (Arrow, DataFlow)

These need `sourceEntityId` and `targetEntityId`. They are rendered **after** non-connection entities so IDs can be resolved. The player's scene controller handles this order.

---

## 5. Layout Helpers

For complex layouts (trees, stacks, grids):

- `layouts/tree-layout.ts` — tree positioning
- `layouts/stack-layout.ts` — vertical stack
- `layouts/grid-layout.ts` — grid
- `layouts/timeline-layout.ts` — timeline

---

## 6. Cylinder Pattern (Database, Cache, Volume)

Use `cylinder-utils.ts`:

```ts
import { renderCylinderBase, getCylinderLabelY } from '../cylinder-utils.js';
renderCylinderBase(innerG, parentEl, { size, color, gradId, stripeOffsets });
```

---

## 7. Registration

In `registry.ts`:

```ts
import { renderMyComponent } from './components/my-component.js';
registry['MyComponent'] = renderMyComponent;
```

In `index.ts`:

```ts
export { renderMyComponent } from './components/my-component.js';
```

---

## 8. Debug UI Integration

Add to `ENTITY_FIELD_DEFAULTS` and `METADATA_DEFAULTS` in `apps/website/src/pages/dev/entity-defaults.ts` so the Illustration Debug page shows sensible defaults.

---

## 9. Reference Components by Complexity

| Complexity | Component | Use for |
|------------|-----------|---------|
| Simple | `concept.ts`, `cycle.ts` | Basic shapes, labels |
| Medium | `cache.ts`, `server.ts` | Cylinder, rect, gradients |
| Complex | `array.ts`, `binarytree.ts` | Metadata-driven layout |
| Connection | `arrow.ts` | sourceEntityId/targetEntityId |

---

## 10. Checklist for New Component

- [ ] `buildEntityGroup` + `applyEntranceAnimation`
- [ ] All shapes in `innerG`
- [ ] Design tokens (no hardcoded values)
- [ ] `ENTITY_COLORS` in design-tokens if new type
- [ ] Registered in `registry.ts` and `index.ts`
- [ ] Metadata schema in `METADATA_SCHEMAS.md` if applicable
- [ ] Debug defaults in `entity-defaults.ts`
- [ ] Build: `pnpm --filter @preplai/illustrations run build`
- [ ] Test in Illustration Debug page
