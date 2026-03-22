# Preplai Illustration Style Guide

This document defines the design system for all programmatic SVG illustrations in `@preplai/illustrations`. Follow these guidelines to ensure visual consistency and build a distinctive brand identity.

---

## Color Palette

All colors are defined in [design-tokens.ts](src/design-tokens.ts).

### Accent Colors (COLORS)

| Token | Hex | Usage |
|-------|-----|-------|
| cyan | `#4ECDC4` | Primary accent, networks, services |
| violet | `#9B59B6` | Databases, stacks, code blocks |
| gold | `#C9A84C` | Highlights, metrics |
| pink | `#ff2d7b` | User, metrics |
| green | `#00e676` | Containers, cache, success states |
| orange | `#ffab00` | Queues, devices, decisions |
| red | `#ff6b6b` | Firewall, badges, errors |
| teal | `#00bcd4` | Cloud, processes |
| blue | `#4488ff` | Subnets, clusters |

### Entity-Specific Colors

Use `getCategoryColor(type)` or `ENTITY_COLORS[type]` for default colors. Override with `entity.color` when needed.

---

## Line Weight (Single Source of Truth)

Use `STROKE` and `getStrokeWidth()` from design-tokens. Avoid hardcoded values.

| Token | Value | Usage |
|-------|-------|-------|
| STROKE.default | 2px | Main shape outlines |
| STROKE.thin | 1.5px | Secondary lines, connectors, inner elements |
| STROKE.emphasized | 2.5px | Selected, highlighted, important |
| STROKE.selected | 3px | Active/current state (e.g. array pointer, active step) |
| STROKE.minimal | 1px | Fine details, icons |

```ts
import { STROKE, getStrokeWidth } from '../design-tokens.js';

// Fixed: rect.setAttribute('stroke-width', String(STROKE.default));
// Scaled: rect.setAttribute('stroke-width', String(getStrokeWidth('selected', scale)));
```

---

## Corner Radius

| Token | Value | Usage |
|-------|-------|-------|
| SHAPES.borderRadius | 6px | Standard rects, buttons |
| SHAPES.borderRadiusLarge | 8px | Groups, containers |

---

## Typography (Single Source of Truth for Labels)

Use `TYPOGRAPHY` and `getLabelFontSize(role, scale?)` for consistent label sizing.

| Token | Value | Usage |
|-------|-------|-------|
| TYPOGRAPHY.fontLabel | Inter, sans-serif | Entity labels, titles |
| TYPOGRAPHY.fontBadge | JetBrains Mono | Cell values, badges, indices |
| TYPOGRAPHY.fontCode | JetBrains Mono | Code snippets |
| TYPOGRAPHY.fontSizeDefault | 15px | **Default** — entity labels (e.g. Service) |
| TYPOGRAPHY.fontSizeIndex | 9px | Indices above cells |
| TYPOGRAPHY.fontSizeValue | 11px | Cell values, inline content |
| TYPOGRAPHY.fontSizeInline | 10px | Pointer labels, captions |
| TYPOGRAPHY.fontSizeLabel | 15px | Main entity label below (= fontSizeDefault) |
| TYPOGRAPHY.fontSizeTitle | 16px | Section/title |
| TYPOGRAPHY.fontWeightEmphasis | 600 | Emphasized values |
| TYPOGRAPHY.fontWeightBold | 700 | Strong accent (e.g. ~ symbol) |

```ts
import { getLabelFontSize, TYPOGRAPHY, LABEL_DEFAULTS } from '../design-tokens.js';

// Scaled: text.setAttribute('font-size', String(getLabelFontSize('value', scale)));
// Fixed: text.setAttribute('font-weight', String(TYPOGRAPHY.fontWeightEmphasis));
// Label below: y = s/2 + LABEL_DEFAULTS.offsetBelow, text-anchor = LABEL_DEFAULTS.textAnchor
```

### Label defaults (LABEL_DEFAULTS)

| Token | Value | Usage |
|-------|-------|-------|
| offsetBelow | 18px | Vertical offset below shape center |
| lineHeight | 1.2 | Multi-line label line height |
| textAnchor | 'middle' | Horizontal alignment |
| hubOffsetY | 4 | Hub/param text inside shape: Y offset |
| hubScaleFactor | 0.32 | Hub font size: min(fontSizeValue, s * factor) |

---

## Component Structure

Every illustration uses the **double-`<g>` pattern**:

1. **outerG**: Carries `translate(cx, cy)` for positioning. Never animated. Never receives CSS transforms.
2. **innerG**: Carries animation class. All shape children go here.

```ts
const { outerG, innerG } = buildEntityGroup(entity);
// ... append shapes to innerG ...
applyEntranceAnimation(innerG, entity);
parentEl.appendChild(outerG);
return outerG;
```

---

## Gradient Usage

- **Linear gradient**: Vertical surfaces (rects, cylinders, server bodies). Use `createLinearGradient(id, color, 'vertical', defs)`.
- **Radial gradient**: Spheres, circles, clouds. Use `createRadialGradient(id, color, defs)`.

---

## Glow and Highlight

When `entity.highlight` is true:

- Add an outer stroke with `stroke-dasharray: 4,4` and reduced opacity
- Or use a subtle glow circle/rect behind the main shape

---

## Visual Treatment Rules (Constraint Layer)

**Allowed treatments** — used across components for our cinematic identity:
- Flat fills with transparency (`colorWithAlpha(color, OPACITY.fillLight)`)
- Solid strokes at token widths (`STROKE.default`, `.thin`, `.emphasized`)
- Dashed strokes for highlight glows and containment boundaries
- Cylinder 3D effect (top/bottom ellipses) for Database/Cache/Volume
- Simple stroke-based icons inside shapes (rack lines, lightning bolt, etc.)

**Use sparingly** — justified in specific components only:
- Gradients: allowed for cylinder bodies, charts, and composable shapes (20 components)
- SVG filters (`soft-shadow`): allowed for cylinder bodies and specialized components (5 components)
- Drop shadows: only via `ensureDropShadowFilter()`, never inline CSS shadows

**Prohibited** — never use in illustration components:
- CSS `box-shadow` or `text-shadow`
- CSS `backdrop-filter` or `blur()` on entities (only player UI uses these)
- Decorative elements that don't carry semantic meaning
- Rotated text (always horizontal for readability)
- Emoji or Unicode symbols as primary visuals (λ in Lambda is an exception)
- Hardcoded hex colors — always use design tokens or color cascade

---

## Color Cascade System

**File:** `src/color-cascade.ts`

Instead of manually calling `colorWithAlpha()` throughout a component, use the color cascade:

```typescript
import { resolveColorCascade, applyShapeColors, applyGlowColors } from '../color-cascade.js';

const cc = resolveColorCascade(entity);

// Shape: fill + stroke in one call
applyShapeColors(rect, cc);

// Glow: fill=none + stroke=glow
applyGlowColors(glowRect, cc);

// Text
text.setAttribute('fill', cc.textPrimary);     // labels
text.setAttribute('fill', cc.textSecondary);    // subtitles
text.setAttribute('fill', cc.textTertiary);     // captions

// Manual access
cc.base        // raw color hex
cc.fill        // 15% opacity fill
cc.fillMedium  // 25% opacity fill
cc.stroke      // full color stroke
cc.strokeSoft  // 60% opacity stroke
cc.glow        // 40% opacity (for highlight rings)
```

New components MUST use the color cascade. Existing components are being migrated incrementally.

---

## Typography Tiers

Three semantic tiers, 2 weights. Components MUST use `TYPOGRAPHY` tokens — no hardcoded px.

| Tier | Role | Size | Token |
|------|------|------|-------|
| Detail | Indices, captions, badges | 9–11px | `fontSizeIndex`, `fontSizeInline`, `fontSizeValue`, `fontSizeBadge` |
| Body | Entity labels, definitions | 14–15px | `fontSizeBodyMax`, `fontSizeDefault`, `fontSizeLabel` |
| Display | Titles, metrics, headings | 16–18px | `fontSizeTitle`, `fontSizeMetric`, `fontSizeSymbol` |

| Weight | Role | Token |
|--------|------|-------|
| 500 | Regular labels | `fontWeightLabel` |
| 600–700 | Titles, emphasis | `fontWeightTitle`, `fontWeightEmphasis`, `fontWeightBold` |

---

## Entity Auto-Sizing

Use `getEntityDimensions(entity)` for components that should auto-size to fit their label:

```typescript
import { getEntityDimensions } from '../utils.js';

const { width, height, halfW, halfH } = getEntityDimensions(entity);
```

Formula: `width = max(baseWidth, charCount × 8 + 24)`, clamped to `maxWidth: 250`.
Agent's `size` param controls the base scale. Auto-sizing only expands, never shrinks below base.

---

## Universal Metadata (Enhanced Visual Control)

Applied automatically by `entity-overlays.ts` after component rendering:

| Field | Type | Visual |
|-------|------|--------|
| `status` | `'healthy'\|'warning'\|'error'\|'inactive'\|'loading'` | Status ring/dot/glow |
| `progress` | `0.0–1.0` | Circular progress arc |
| `emphasis` | `'low'\|'normal'\|'high'\|'critical'` | Scale/opacity adjustment |
| `badge` | `{ text, color?, position? }` | Pill badge overlay |
| `lottieAnimation` | `{ src, loop?, speed?, trigger? }` | Animated micro-asset |

These stack: an entity can have status + progress + badge simultaneously.

---

## Arrow Collision Detection

Arrows automatically curve when their straight-line path would cross an unrelated entity's bounding box. This is handled in `arrow.ts` at render time — no agent or compiler configuration needed.

---

## Streaming-Safe SVG Properties

For future reference if we add real-time entity streaming:

**Safe (GPU-composited, no visual flashing):**
- `opacity`, `transform` (translate, scale, rotate)
- `stroke-dashoffset` (for draw-on animations)
- CSS `animation` and `transition` on these properties

**Unsafe (cause DOM reflow or visual artifacts during streaming):**
- `fill`, `stroke` (color changes cause repaint)
- `x`, `y`, `width`, `height` (trigger layout recalculation)
- SVG `filter` (expensive to recalculate during streaming)
- `gradientTransform`, `patternTransform` (recompute on every change)
- `d` attribute on `<path>` (full re-render of shape geometry)

Current architecture renders from compiled JSON (not streaming), so all treatments are safe today.

---

## Metadata Conventions

The `metadata` field is optional and extensible. Documented conventions:

| Key | Type | Description |
|-----|------|-------------|
| `metadata.status` | EntityStatus | Universal status indicator (healthy/warning/error/inactive/loading) |
| `metadata.progress` | number (0–1) | Circular progress arc |
| `metadata.emphasis` | EntityEmphasis | Visual hierarchy scaling |
| `metadata.badge` | BadgeConfig | Pill badge overlay |
| `metadata.lottieAnimation` | LottieAnimationConfig | Animated micro-asset |
| `metadata.tooltip` | string | Hover tooltip text (player integration future) |
| `metadata.expandable` | boolean | Indicates drill-down capability (future) |

---

## Building Domain Diagrams

**VM vs Container diagrams**: Compose with Group + Server, Container, and other entities. No single "VMArchitecture" component — authors place entities in frames.

**Docker Flow**: Use DockerImage, DockerRegistry, Container, Volume, Tmpfs as building blocks. Connect with Arrow/DataFlow.

---

## Adding New Components

1. Create `src/components/<name>.ts` following the pattern in [cache.ts](src/components/cache.ts)
2. Add `ENTITY_COLORS` entry in [design-tokens.ts](src/design-tokens.ts)
3. Register in [registry.ts](src/registry.ts)
4. Export from [index.ts](src/index.ts)
