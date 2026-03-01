# Preplai Illustration Style Guide

This document defines the design system for all programmatic SVG illustrations in `@pre/illustrations`. Follow these guidelines to ensure visual consistency and build a distinctive brand identity.

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

## Line Weight

| Token | Value | Usage |
|-------|-------|-------|
| SHAPES.strokeWidth | 2px | Default stroke for shapes |
| SHAPES.strokeWidthThin | 1.5px | Secondary lines, connectors |
| SHAPES.strokeWidthHeavy | 2.5px | Emphasized elements |

---

## Corner Radius

| Token | Value | Usage |
|-------|-------|-------|
| SHAPES.borderRadius | 6px | Standard rects, buttons |
| SHAPES.borderRadiusLarge | 8px | Groups, containers |

---

## Typography

| Token | Usage |
|-------|-------|
| TYPOGRAPHY.fontLabel | Entity labels, titles |
| TYPOGRAPHY.fontBadge | Small badges, type indicators |
| TYPOGRAPHY.fontCode | Code snippets |
| TYPOGRAPHY.fontSizeLabel | 13px |
| TYPOGRAPHY.fontSizeTitle | 14px |
| TYPOGRAPHY.fontSizeBadge | 9px |

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

**Docker Flow**: Use DockerImage, DockerRegistry, Container, Volume, BindMount, Tmpfs as building blocks. Connect with Arrow/DataFlow.

---

## Adding New Components

1. Create `src/components/<name>.ts` following the pattern in [cache.ts](src/components/cache.ts)
2. Add `ENTITY_COLORS` entry in [design-tokens.ts](src/design-tokens.ts)
3. Register in [registry.ts](src/registry.ts)
4. Export from [index.ts](src/index.ts)
