# Illustration Upgrade Guide — 5 Cinematic Pillars

> Step-by-step workflow for upgrading any SVG entity to the cinema design standard.

---

## The 5 Cinematic Pillars

Every entity MUST have all 5:

| # | Pillar | What It Does | Key Values |
|---|--------|-------------|------------|
| 1 | **Directional Lighting** | Offset radial halo behind entity | `cx=38%, cy=38%, r=50%`, color at 13% opacity → 0% |
| 2 | **Ground Contact Shadow** | Ellipse shadow below entity | Black radial gradient, 18% → 0% opacity |
| 3 | **Ambient Occlusion** | Darkening at bottom-right edges | `cx=70%, cy=75%, r=55-60%`, black 10-12% → 0% |
| 4 | **Material Texture** | Specular highlight + glass overlay | Specular: white 15-22% at `cx=35%, cy=25%`. Glass: `ensureGlassFilter()` |
| 5 | **Micro-Life** | CSS @keyframes animation | Transform-based: scale, translate, rotate. NOT just opacity. |

---

## Workflow (Per Batch of 5-8 Entities)

### Phase 1: Design in Pencil

1. Open the `.pen` design file (or create new)
2. For each entity, create a visual mockup showing:
   - Shape, proportions, internal details
   - Color treatment (gradient fills, strokes, glows)
   - What animates (annotate with arrows/labels)
3. Create **two frames**: Cinema (dark) and Light theme
4. Take screenshots of both frames

### Phase 2: Founder Approval

5. Present screenshots to Founder (Bamba)
6. Iterate on design feedback
7. Get explicit "approved" before coding

### Phase 3: Implement in TypeScript

8. Open the entity's `.ts` file in `packages/illustrations/src/components/`
9. Apply the 5 pillars following the template below
10. Ensure proper `buildEntityGroup` + `applyEntranceAnimation` pattern

### Phase 4: Build & Verify

11. Build: `pnpm --filter @preplai/illustrations run build`
12. Build downstream: `pnpm --filter @preplai/player run build && pnpm --filter @preplai/mcp-server run build`
13. Verify at `http://localhost:5173/dev/illustrations`
14. Test both Cinema and Light themes
15. Confirm animations are visually perceptible (watch for 5 seconds)

---

## TypeScript Implementation Template

```typescript
export function renderMyEntity(entity: VisualEntity, parentEl: SVGElement): SVGGElement {
  const { outerG, innerG } = buildEntityGroup(entity);
  const cc = resolveColorCascade(entity);
  const color = cc.base;
  const entityId = (entity.id ?? Math.random().toString(36).slice(2))
    .replace(/[^a-zA-Z0-9]/g, '').slice(0, 8);
  const defs = ensureDefs(parentEl);

  // ── 1. DIRECTIONAL LIGHTING — Offset radial halo ─────────────────
  const haloId = `myent-halo-${entityId}`;
  if (!defs.querySelector(`#${haloId}`)) {
    // radialGradient: cx=38%, cy=38%, r=50%
    // stop 0%: color, opacity 0.13
    // stop 100%: color, opacity 0
  }
  // Ellipse: rx=width*0.8, ry=height*0.6, fill=url(#haloId)

  // ── 2. GROUND CONTACT SHADOW ─────────────────────────────────────
  const gsId = `myent-gshadow-${entityId}`;
  if (!defs.querySelector(`#${gsId}`)) {
    // radialGradient: cx=50%, cy=50%, r=50%
    // stop 0%: black, opacity 0.18
    // stop 100%: black, opacity 0
  }
  // Ellipse: below entity bottom, rx=shape_width*0.55, ry=small

  // ── HIGHLIGHT GLOW (conditional) ──────────────────────────────────
  if (entity.highlight) {
    // Slightly larger shape outline, dashed stroke
    // applyGlowColors(el, cc)
  }

  // ── MAIN SHAPE ────────────────────────────────────────────────────
  const glowUrl = ensureGlowFilter(parentEl, color);
  const glassUrl = ensureGlassFilter(parentEl);
  // Create shape, apply: fill=cc.fill, stroke=cc.stroke, filter=glowUrl
  // Glass overlay: same shape, fill='none', filter=glassUrl

  // ── 3. AMBIENT OCCLUSION ──────────────────────────────────────────
  const aoId = `myent-ao-${entityId}`;
  if (!defs.querySelector(`#${aoId}`)) {
    // radialGradient: cx=70%, cy=75%, r=55%
    // stop 0%: black, opacity 0.10
    // stop 100%: black, opacity 0
  }
  // Rect/ellipse matching shape, fill=url(#aoId), clip to shape, pointer-events=none

  // ── INTERNAL DETAILS ──────────────────────────────────────────────
  // Entity-specific icon, lines, dots, etc.
  // Use cc.stroke for lines, cc.strokeMuted for subtle details
  // Use gradient fills for bars/strips (linearGradient with color at 0.9→0.2 opacity)

  // ── 4. MATERIAL TEXTURE — Specular highlight ──────────────────────
  const specId = `myent-spec-${entityId}`;
  if (!defs.querySelector(`#${specId}`)) {
    // radialGradient: cx=35%, cy=25%, r=40%
    // stop 0%: white, opacity 0.15-0.22
    // stop 100%: white, opacity 0
  }
  // Ellipse: upper-left area of shape, fill=url(#specId)

  // ── 5. MICRO-LIFE — CSS animations ────────────────────────────────
  const svg = parentEl.ownerSVGElement ?? (parentEl as unknown as SVGSVGElement);
  const styleId = `myent-style-${entityId}`;
  if (!svg.querySelector(`#${styleId}`)) {
    const style = document.createElementNS(SVG_NS, 'style');
    style.setAttribute('id', styleId);
    style.textContent = `
      @keyframes myentFloat_${entityId} {
        0%, 100% { transform: translateY(0); }
        50% { transform: translateY(-2.5px); }
      }
      @keyframes myentPulse_${entityId} {
        0%, 100% { opacity: 1; transform: scale(1); }
        50% { opacity: 0.5; transform: scale(1.4); }
      }
      .myent-float-${entityId} {
        animation: myentFloat_${entityId} 3.5s ease-in-out infinite;
      }
      #myentAccent_${entityId} {
        animation: myentPulse_${entityId} 2s ease-in-out infinite;
      }
    `;
    svg.prepend(style);
  }
  innerG.classList.add(`myent-float-${entityId}`);
  // Assign IDs to animated elements for CSS targeting

  // ── LABEL ─────────────────────────────────────────────────────────
  if (entity.label) {
    // text element below shape, fill=cc.textPrimary, TYPOGRAPHY tokens
  }

  applyEntranceAnimation(innerG, entity);
  parentEl.appendChild(outerG);
  return outerG;
}
```

---

## Micro-Life Animation Recipes

| Entity Type | Animation 1 | Animation 2 | Animation 3 |
|-------------|------------|------------|------------|
| **Rect-based** (server, container) | Body float 2-3px, 4s | LED/dot scale pulse 1→1.5, 2s | Border stroke-width breathe, 3s |
| **Circle-based** (service, process) | Whole entity float 2px, 3.5s | Gear/icon rotate 360°, 6-8s | Glow opacity pulse, 3s |
| **Cylinder** (database, cache) | Body float 2px, 3.5s | Cap dots scale pulse 1→1.5, 2s | Bolt/icon scale breathe, 2.5s |
| **Diamond/hex** (loadbalancer, decision) | Pulse ring expand 2x, 2.5s | Center dot scale glow, 2s | Entry dot breathe, 2s |
| **Card-based** (user, badge) | Card float 3px, 4s | Status dot scale 1→1.6, 2s | Accent strip shimmer, 3s |
| **Cloud/organic** | Drift translateY 4-5%, 3.5s | Data nodes scale twinkle, 2.5s | Sparkle dots fade, 3s |
| **Flow/pipeline** | Flow shimmer translateX ±4px, 2.5s | Node pulse, 2s | Arrow opacity cycle, 3s |
| **Data structure** (array, list) | Container float 2px, 4s | Cell highlight shimmer, 3s | Index dot pulse, 2.5s |
| **Chart** (bar, pie, scatter) | Chart float 2px, 4s | Data points scale pulse, 2.5s | Grid line shimmer, 3s |

---

## Animation Rules

- **GPU-only properties:** Only animate `transform` and `opacity`. Never `x`, `y`, `width`, `fill`.
- **Minimum 1 transform:** Every entity must have at least one `scale` or `translate` animation.
- **Stagger delays:** When multiple elements animate, stagger with `animationDelay: ${i * 0.3-0.6}s`.
- **Duration range:** 2-4s for detail elements, 3.5-4s for whole-entity float.
- **Unique IDs:** All keyframe names and element IDs must include `${entityId}` to avoid conflicts.
- **Style injection:** Use `svg.prepend(style)` to add `<style>` once, guard with `querySelector('#${styleId}')`.

---

## Reference Components (Gold Standard)

These 10 components have the complete 5-pillar treatment — use them as reference:

| Component | File | Shape | Notable Features |
|-----------|------|-------|-----------------|
| Cache | `cache.ts` | Cylinder | Bolt icon, cap breathe + float |
| Database | `database.ts` | Cylinder | Staggered dot pulse + float |
| Server | `server.ts` | Rounded rect | LED staggered blink + body float |
| Container | `container.ts` | Dashed rect | Border breathe + float |
| Queue | `queue.ts` | Multi-cell rect | Flow shimmer translateX + float |
| Service | `service.ts` | Rounded hex | Gear spin 6s + body glow |
| Cloud | `cloud.ts` | Multi-bump organic | Drift translateY + node twinkle scale |
| LoadBalancer | `loadbalancer.ts` | Rotated diamond | Pulse ring expand + center glow + entry breathe |
| User | `user.ts` | Badge card | Float + status dot scale pulse + accent shimmer |
| APIEndpoint | `api-endpoint.ts` | Wide rect | Cursor blink + float |

---

## Imports Checklist

```typescript
// Always needed:
import { SVG_NS, buildEntityGroup, applyEntranceAnimation } from '../utils.js';
import { TYPOGRAPHY, STROKE, LABEL_DEFAULTS } from '../design-tokens.js';
import { resolveColorCascade, applyGlowColors } from '../color-cascade.js';
import { ensureDefs, ensureGlowFilter, ensureGlassFilter } from '../visual-utils.js';
import type { VisualEntity } from '@preplai/shared';

// Use getSizeParam for circle/organic shapes:
import { getSizeParam } from '../utils.js';

// Use getEntityDimensions for rect shapes:
import { getEntityDimensions } from '../utils.js';

// Use colorWithAlpha for one-off opacity colors:
import { colorWithAlpha } from '../design-tokens.js';
```
