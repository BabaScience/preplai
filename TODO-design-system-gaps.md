# Preplai Design System Gaps — Implementation Tracker

> **Source:** Analysis comparing Claude's SVG design system principles against Preplai's current implementation.
> **Date Created:** 2026-03-22
> **Status Legend:** `[ ]` Not started | `[~]` In progress | `[x]` Done | `[—]` Decided against

---

## HIGH PRIORITY

### 1. Color Cascade System
**Gap:** Each of 152 components manually calls `colorWithAlpha(color, OPACITY.fillLight)` for fill, `color` for stroke, `color` for text. No single-class application. Inconsistent color handling across components.

**Target:** A single function `applyColorClass(innerG, color, theme)` that sets all descendant fills, strokes, and text colors in one call — resolving correctly for both light and cinema themes.

**Inspired by:** Claude's `.c-blue` class that cascades fill (Blue-50), stroke (Blue-600), title text (Blue-800), subtitle text (Blue-600) from a single parent declaration.

**Key files:**
- `packages/illustrations/src/design-tokens.ts` — add color ramp generation
- `packages/illustrations/src/utils.ts` or new `color-cascade.ts` — cascade function
- All 152 components — refactor to use cascade (can be incremental)

**Tasks:**
- [x] Design color ramp structure (fill-light, fill-medium, stroke, text-primary, text-secondary per color)
- [x] Implement `applyColorClass()` utility
- [x] Refactor reference components (server.ts, database.ts, cache.ts) to use it
- [x] Gradually migrate remaining components
- [x] Verify both themes render correctly with cascade

---

### 2. Arrow Collision Detection
**Gap:** Arrows can freely cross unrelated entities. No collision checking. No auto-routing.

**Target:** At minimum, detect when an arrow path crosses through an unrelated entity's bounding box and offset it. At best, auto-route arrows around obstacles.

**Inspired by:** Claude's mandatory collision checking — "no arrow may cross an unrelated box."

**Key files:**
- `packages/illustrations/src/components/arrow.ts` — routing logic
- `packages/player/src/scene-controller.ts` — has entity position data for collision rects
- `packages/compiler/src/` — could do collision detection at compile time

**Tasks:**
- [x] Implement bounding box collision detection (arrow path vs entity rects)
- [x] Add curved offset when collision detected (perpendicular displacement)
- [x] Test with dense scenes (Microservices preset has many crossing arrows)
- [x] Decide: compile-time (compiler) vs render-time (arrow.ts) detection

---

## MEDIUM PRIORITY

### 3. Typographic Constraint Enforcement
**Gap:** 8 font sizes (9px–18px), 4 weights (400–700) — too many choices, inconsistency risk.

**Target:** Reduce to 3–4 font sizes and 2 weights with clear semantic roles. Enforce via named tokens only (no raw px values in components).

**Inspired by:** Claude's brutal simplicity — 2 sizes (14px, 12px), 2 weights (400, 500).

**Key files:**
- `packages/illustrations/src/design-tokens.ts` — `TYPOGRAPHY` object

**Tasks:**
- [x] Audit which font sizes are actually used across components
- [x] Propose reduced typographic scale (e.g., 15px label, 11px detail, 18px metric)
- [x] Enforce: components must import from `TYPOGRAPHY`, no hardcoded px
- [x] Lint or grep to catch violations

---

### 4. Box-Sizing Formulas (Auto-Size to Fit Label)
**Gap:** Entity sizes are fixed by `getSizeParam()` based on the agent's `size` field. Long labels overflow or get truncated. No mathematical relationship between label length and entity dimensions.

**Target:** Entities auto-size their width/height to fit their label text, with min/max constraints.

**Inspired by:** Claude's formula: `rect_width = max(title_chars × 8, subtitle_chars × 7) + 24`

**Key files:**
- `packages/illustrations/src/utils.ts` — `getSizeParam()`
- Individual components — rect dimensions

**Tasks:**
- [x] Design auto-sizing formula (char count × char width + padding, clamped)
- [x] Implement in `getSizeParam()` or new `getEntityDimensions()` utility
- [x] Refactor key components to use auto-sizing
- [x] Test with very long and very short labels
- [x] Ensure backwards compatibility (explicit `size` still overrides)

---

## LOW PRIORITY

### 5. Subtractive Design Rules (Formal Constraints)
**Gap:** No formal documentation of what visual treatments are allowed vs prohibited. Components freely mix gradients, shadows, flat fills — no enforced consistency.

**Target:** A written design constraint document that future component authors follow. Decide: are gradients OK? Shadows? Glow effects? Or should we go flat like Claude's system?

**Inspired by:** Claude's explicit prohibitions — no gradients, no shadows, no blur, no decorative elements.

**Tasks:**
- [x] Audit current visual treatments across components (gradients, shadows, glows)
- [x] Decide which treatments to keep vs prohibit
- [x] Document in `ILLUSTRATION_STYLE_GUIDE.md`
- [x] Add to component creation checklist in `CLAUDE.md`

---

### 6. Streaming-Safe Rendering
**Gap:** Not a current issue (we render from compiled JSON, not streaming DOM). But if we ever add real-time entity streaming, gradients/shadows would cause visual flashing during incremental DOM updates.

**Target:** Document which CSS/SVG properties are streaming-safe vs problematic, as reference for future architecture decisions.

**Inspired by:** Claude's flat-fill constraint driven by token-by-token DOM streaming.

**Tasks:**
- [x] Document streaming-safe vs unsafe SVG properties
- [x] Flag components that would need refactoring for streaming mode
- [x] Defer implementation until streaming is needed

---

## DECIDED / NOTES

_Record decisions here as we discuss them:_

- **Constraint strictness:** TBD — Preplai's richer visual style (gradients, 3D cylinders) is part of our identity. We may keep some "prohibited" elements from Claude's system if they serve our cinematic quality. The key is consistency, not austerity.
- **Incremental migration:** Color cascade and typography constraints can be applied incrementally — new components use the system, old components migrate over time.
