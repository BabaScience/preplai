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

## Metadata Conventions

The `metadata` field is optional and extensible. Documented conventions:

| Key | Type | Description |
|-----|------|-------------|
| `metadata.tooltip` | string | Hover tooltip text (player integration future) |
| `metadata.expandable` | boolean | Indicates drill-down capability (player integration future) |
| `metadata.visualStyle` | 'default' \| 'minimal' \| 'emphasized' | Used by generic renderer |

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
