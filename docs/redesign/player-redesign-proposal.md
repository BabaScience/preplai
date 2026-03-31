# Preplai Player UI/UX Redesign Proposal
**Version:** 1.0 — March 2026
**Author:** Designer Agent (PREA-2)
**Status:** Ready for Founder Review

---

## Executive Overview

The Preplai Player is the product's most visible surface — it's what users see, share, and judge the company by. The current implementation has a solid architectural foundation with cinematic dark canvas, SVG entity rendering, depth-of-field focus, and narration sync. However, the **visual polish and trust signals fall short of the premium positioning** Preplai occupies.

This proposal documents the current state, identifies 22 specific issues (7 critical, 8 major, 7 polish), and provides concrete redesign recommendations that will transform the player from "impressive technical demo" to "the player that makes you pause and say *wow*."

**Design North Star:** Bloomberg Terminal meets Apple Keynote meets Linear — premium, data-rich, yet cinematic.

---

## Part 1: Current State Audit

### 1.1 Architecture (What's Working)

The player architecture is genuinely impressive:

| Component | Current State | Assessment |
|-----------|--------------|-----------|
| **SVG Canvas** | 1920×1080 coordinate space, responsive via `preserveAspectRatio` | ✅ Solid |
| **Entity System** | 154 dedicated renderers + composable system | ✅ Excellent |
| **Cinematic Mode** | Persistent entities across frames, diff-based re-render | ✅ Best-in-class |
| **Focus/DoF** | Progressive reveal, 3-tier blur/scale depth | ✅ Strong concept |
| **Background** | Radial vignette, dot grid, ambient particles, noise texture | ✅ Good foundation |
| **Audio** | ElevenLabs HD + Web Speech fallback, playback speed control | ✅ Complete |
| **Controls** | Play/pause, prev/next, TTS toggle, speed, theme, palette, fullscreen | ✅ Feature-rich |
| **Narrator Panel** | Frosted glass overlay, spatial positioning, custom scrollbar | ✅ Good |
| **Loading State** | Animated logo pulse with loading dots | ✅ Clean |
| **End Screen** | Replay + Share actions with stats | ✅ Functional |
| **404 Page** | Custom animated film reel, on-brand | ✅ Excellent |

### 1.2 Issues Catalog

#### Critical (Break Comprehension)

**Issue 1 — Label/Entity Double Rendering**
`design-system-v4.md:18` — Entity labels render both *on top of* the shape AND below it simultaneously. A Load Balancer hexagon shows "Load Balancer" both inside the shape boundary and as an exterior label below. Users experience visual collision and confusion.
- **Root Cause:** Some component renderers create both interior SVG text AND exterior labels without checking which mode is active.
- **Fix Required:** Enforce single-label rule: if interior label fits (shape w>120, h>80), suppress exterior label entirely.

**Issue 2 — Interior Text Overflows Shape Bounds**
Labels like "Redis Cache", "RabbitMQ Broker", and "API Gateway" overflow their container shapes — text extends outside the stroke boundary, making entities look broken.
- **Root Cause:** Text wrapping logic doesn't account for shape padding (needs `width - 24px padding`).
- **Fix Required:** Implement `text-overflow: clip` with `textLength` attribute enforcement.

**Issue 3 — Narrator Scrollbar Visibility**
The narrator panel shows a native browser scrollbar that breaks the frosted glass aesthetic. While a custom 4px scrollbar is defined in CSS, it only applies in some configurations.
- **Fix Required:** Ensure `scrollbar-width: thin` + webkit scrollbar override is consistently applied.

**Issue 4 — Narrator Text Clipping**
Long narration text gets cut off at the `max-height: calc(5.5em + 48px)` boundary without visible indication. Users miss narration content.
- **Fix Required:** Increase max-height to ~8em for longer narration, or implement smooth fade-out at bottom edge.

**Issue 5 — Entity Color Saturation**
In the cinema theme, entity fill colors are reduced to very low opacity (~10-15% of base color), making all entities appear as similarly-dim shapes. Users can't distinguish entity types at a glance.
- **Root Cause:** `color-cascade.ts` applies `fillMedium` at very low opacity for dark backgrounds.
- **Fix Required:** Increase fill opacity to 25-35% for cinema theme; ensure stroke remains at full saturation.

**Issue 6 — Connection Arrow Readability**
Arrow labels (e.g., "GET /api/data") use 11px monospace at 60% opacity, making them barely readable on the dark canvas. Arrow strokes at 1.5px are too thin to track across complex scenes.
- **Fix Required:** Increase stroke to 2px, boost label opacity to 90%, add subtle glow behind labels.

**Issue 7 — Frame Navigation Discoverability**
The frame navigation bar auto-hides within seconds of inactivity (`auto-hidden` class adds `opacity: 0`). First-time users often don't know how to advance frames and think the presentation is frozen.
- **Fix Required:** Never auto-hide below 0.4 opacity; show a pulsing hint arrow on the first frame for new viewers.

#### Major (Reduce Polish)

**Issue 8 — Scene Title Design**
Scene titles render as large gray rounded rectangles (the H1 entity type), which feels like a PowerPoint artifact rather than a cinematic title card. The v4 design system describes the correct approach (no box, large text with glow) but it isn't implemented.
- **Current:** `bg-elevated` filled rect with border-radius and text inside
- **Proposed:** Text-only, centered, with `text-shadow: 0 0 40px rgba(201,168,76,0.15)` gold glow, 48px weight-700, no box

**Issue 9 — Generic Entity Shapes**
Many entity types still render as identical rounded rectangles differentiated only by color. This visual homogeneity reduces the "this feels like a real diagram" perception.
- **High-impact specific fixes:**
  - Database: Must be cylinder (currently rectangle with DB icon)
  - LoadBalancer: Must be hexagon with inner ring (currently just hexagon)
  - Cloud: Must be organic blob (currently rectangle with cloud icon)
  - Queue: Must have horizontal lines pattern (currently solid fill)

**Issue 10 — Flat Visual Hierarchy**
All entities, titles, and labels render at similar visual weight. There's no clear Z-depth signal separating primary from secondary content.
- **Fix Required:** Implement `soft-shadow` filter on all primary entities, no shadow on labels; add drop-shadow depth differentiation.

**Issue 11 — Dot Grid Too Subtle**
The background dot grid is at `opacity: 0.04` (4%), effectively invisible. It was designed to provide spatial reference but has no perceptible effect.
- **Fix Required:** Increase to `opacity: 0.06-0.08` with slightly smaller radius (r=1.0) for a crisp grid.

**Issue 12 — Ambient Particles Invisible**
12 ambient particles are generated at `opacity: 0.03–0.07` (below perceptual threshold). Combined with the dark background, they have zero visible effect.
- **Fix Required:** Increase base opacity to 0.08-0.12, increase max size to 6-8px, ensure palette colors are used (not just white).

**Issue 13 — No Scene Transition Choreography**
Frame transitions are a simple crossfade. There's no cinematic quality to how frames flow into each other — entities just appear/disappear instantly.
- **Fix Required:** Implement the v4 choreography sequence: title enters first (100ms delay, scale 0.97→1.0), entities stagger in (50ms apart), connections draw last.

**Issue 14 — Theme/Palette Controls Buried**
Theme and palette controls are `hover-pill` elements at the far right of the nav bar that only reveal options on hover. Mobile users and first-time users never find them.
- **Fix Required:** Show a subtle indicator dot when non-default settings are active; add visual affordance.

#### Polish (Good to World-Class)

**Issue 15 — Loading State Could Be More Cinematic**
Current loading state is: Preplai logo + "Preparing your presentation…" + 3 dots. Works fine but doesn't build anticipation.
- **Enhancement:** Add subtle animated background grid during load, show preview of palette colors, fade in tagline.

**Issue 16 — End Screen Needs More Warmth**
The end screen is functional (logo + "Presentation complete" + Replay/Share) but emotionally flat.
- **Enhancement:** Add gentle confetti animation, show frame count and duration stats, include a "Create your own with AI" CTA.

**Issue 17 — Keyboard Hint Stays Too Long**
The keyboard hint (← → navigate · Space play/pause · N narrator) is a static footer text that doesn't auto-dismiss. It occupies visual space for the entire session.
- **Fix:** Auto-fade after 4 seconds, re-show briefly when a key is pressed.

**Issue 18 — Connection Arrow Glow Missing**
DataFlow connections use animated dashes for async flows (good), but no glow effect behind the main path. Compare to Linear's graph view — glowing edges give depth.
- **Enhancement:** Add parallel blurred path (stdDeviation=4, opacity=0.3) behind each connection for glow effect.

**Issue 19 — No Progress Bar for Long Presentations**
There's a `#progress-bar` element in the HTML but it appears to only be used for "algorithm-viz style" rendering. There's no persistent timeline showing overall presentation progress.
- **Enhancement:** Show a thin 2px progress line at the top edge of the viewport.

**Issue 20 — Entity Tooltip Design**
The `#entity-tooltip` element exists but has minimal styling. Entity hover tooltips could show rich metadata (status, description, progress).
- **Enhancement:** Style as frosted glass with entity color accent, show name + metadata on hover.

**Issue 21 — Feedback Button Too Prominent**
The `#feedback-btn` (question mark circle) is fixed bottom-right at full opacity. For shareable player links sent to clients, this creates confusion ("Is this a bug report button?").
- **Fix:** Reduce to 0.3 opacity, increase to full on hover, or move into the nav bar overflow menu.

**Issue 22 — No Reduced Motion Support**
No `@prefers-reduced-motion` media query exists in the CSS. Users with vestibular disorders or motion sensitivity see full animations at all times.
- **Fix Required:** Add `@media (prefers-reduced-motion: reduce)` to disable entrance animations, keep static transitions only.

---

## Part 2: Redesign Proposal

### 2.1 Design Direction Summary

**"Cinema Grade"** — The player should feel like the output of a company that deeply understands both filmmaking and software. Reference points:

| Reference | What We Take |
|-----------|-------------|
| **Bloomberg Terminal** | Dense, information-rich, every pixel earns its place |
| **Apple Keynote** | Effortless motion, confidence through simplicity |
| **Linear** | Color system, typography hierarchy, spatial clarity |
| **IMAX** | Cinematic immersion, aspect ratio, sound-to-image sync |
| **Vercel Dashboard** | Trust signals, typography choices, developer confidence |

### 2.2 Color System Redesign

#### Cinema Theme (Primary)

Current issues: fills too transparent, backgrounds too similar in value, no depth gradient.

```
CURRENT BACKGROUND LAYERS:
  bg:           #0c0d14  (single flat color)

PROPOSED BACKGROUND LAYERS:
  bg-void:      #05060c  (edge darkening — vignette target)
  bg-deep:      #08090e  (ambient layer base)
  bg-canvas:    #0c0d14  (primary rendering surface)
  bg-elevated:  #12131c  (title cards, info panels)
  bg-surface:   #1a1b26  (narrator box, tooltips)
  bg-hover:     #22232e  (interactive hover states)
```

```
ENTITY FILL OPACITY (Cinema Theme):
  CURRENT:   8-12% of base color (imperceptible)
  PROPOSED:  22-28% of base color (visible, not distracting)

ENTITY STROKE OPACITY:
  CURRENT:   60-70% of base color
  PROPOSED:  85-95% of base color (crisp, visible)

ENTITY GLOW (new for highlighted entities):
  filter: entity-glow (already defined in SVG defs)
  opacity: 0.6 on blur layer
  Applied when: entity has highlight=true or emphasis=critical
```

#### Light Theme (Secondary)

The light theme uses `#faf7f2` background (warm beige) which is excellent. Key issues:
- Entity fills need higher contrast on light backgrounds
- Connection arrows need darker stroke
- Narrator panel background needs opacity increase

```
LIGHT THEME NARRATOR:
  CURRENT:   rgba(245,240,232,0.6) — too transparent
  PROPOSED:  rgba(238,232,224,0.85) — readable at all times
```

#### Color-Blind Accessibility

Current mono palette provides grayscale fallback. Recommend adding shape differentiation (pattern fills, different stroke weights) so entity type is readable without color.

### 2.3 Typography Redesign

#### Font Loading (No Change Needed)
Both Inter (UI) and JetBrains Mono (code) are already loaded via Google Fonts. Inter weight 400/500/600/700 available.

#### Scale Refinement

```
CURRENT (from design-tokens.ts):
  fontSizeLabel:  15px  — entity labels (too large for dense scenes)
  fontSizeTitle:  16px  — section headings
  fontSizeMetric: 18px  — large values

PROPOSED:
  xs:     9px  / weight 500  — indices, badges, array positions
  sm:     11px / weight 500  — inline values, table cells, metadata
  body:   14px / weight 500  — entity labels (reduce from 15px)
  title:  16px / weight 600  — section headings (no change)
  h2:     28px / weight 600  — scene subtitles
  h1:     44px / weight 700  — hero titles, letter-spacing: -0.03em
```

#### Scene Title Card (Critical Redesign)

Current: H1 renders as a `bg-elevated` filled rectangle with centered text — identical to a PowerPoint title box.

Proposed:
```css
.scene-title {
  /* No box, no border, no background */
  font-size: 44px;
  font-weight: 700;
  letter-spacing: -0.03em;
  fill: #e8e8f0;
  text-shadow: none; /* SVG text */
  filter: url(#title-glow);  /* New SVG filter */
}

/* New SVG filter (add to player-html.ts defs) */
<filter id="title-glow">
  <feGaussianBlur in="SourceGraphic" stdDeviation="20" result="blur"/>
  <feColorMatrix in="blur" values="1 0 0 0 0.79  0 0.66 0 0 0.30  0 0 0 0 0.17  0 0 0 0.12 0"/>
  <!-- Gold glow: R=0.79, G=0.66, B=0.17, A=0.12 -->
  <feMerge>
    <feMergeNode/>
    <feMergeNode in="SourceGraphic"/>
  </feMerge>
</filter>
```

### 2.4 Entity Rendering Improvements

#### Label Placement Algorithm

Implement strict single-label rule in each entity renderer:

```typescript
// In buildEntityGroup() or per-component
function shouldRenderInteriorLabel(entity: VisualEntity): boolean {
  const w = entity.w ?? DEFAULT_W;
  const h = entity.h ?? DEFAULT_H;
  const labelLen = (entity.label ?? '').length;
  // Interior only if shape is large enough AND label fits
  return w > 120 && h > 80 && labelLen <= 20;
}

// Rule: if interior label rendered, DO NOT render exterior label
// If exterior label rendered, position at entityBottom + 14px gap (never overlap)
```

#### High-Priority Shape Upgrades

**Database (current: rect with icon → proposed: cylinder)**
```typescript
// Current: rect with database icon overlay
// Proposed: proper SVG cylinder
const topEllipse = createEllipse(cx, cy - h/2, rX, rY * 0.25);  // top cap
const body = createRect(cx - rX, cy - h/2, rX*2, h);            // side walls
const bottomEllipse = createEllipse(cx, cy + h/2, rX, rY * 0.25); // bottom
// Apply gradient: top ellipse at +20% lighter fill
```

**LoadBalancer (current: hexagon → proposed: hexagon with inner ring)**
```typescript
// Add inner decorative ring
const innerRing = createPolygon(cx, cy, rInner, 6, rotation);
innerRing.setAttribute('fill', 'none');
innerRing.setAttribute('stroke', colorWithAlpha(color, 0.4));
innerRing.setAttribute('stroke-width', '1');
```

**Queue/Broker (current: solid fill → proposed: horizontal lines pattern)**
```typescript
// Add pattern fill showing message queue visual
const pattern = createPattern('queue-lines', 20, 8);
pattern.appendChild(createLine(0, 4, 20, 4, rgba(255,255,255,0.15), 1));
// Apply pattern as entity fill
```

**Concept/Decision (current: plain circle → proposed: circle with radial glow)**
```typescript
// Apply accent-glow filter to concept entities
group.setAttribute('filter', 'url(#accent-glow)');
```

### 2.5 Frame Navigation Redesign

#### Current Layout
```
[‹] [● ● ● ○ ○] [›] [▶/⏸] [🔊] [1x] [1/6] [💬] [⛶] [🌙] [🎨]
```
All crammed into one horizontal bar. Palette and theme controls are hidden in hover-pill dropdowns.

#### Proposed Layout (Two Zones)

**Zone 1 — Playback Bar (center bottom)**
```
[‹ prev] [● ● ● ○ ○] [next ›] [▶/⏸] [🔊] [1x] [1/6]
```
- Position: `bottom: 24px, left: 50%, translateX(-50%)`
- Never auto-hides; always at 0.7 opacity, 1.0 on hover
- Current dot: gold pulse animation
- Prev/Next buttons: 32×32 frosted glass rounded

**Zone 2 — Settings Bar (bottom right)**
```
[💬] [⛶] [🌙/☀️] [🎨]
```
- Position: `bottom: 24px, right: 24px`
- Auto-hides to 0.15 opacity after 4s of no interaction
- Separates settings from navigation — reduces cognitive load

#### First-Time User Experience
- On load, show a `keyboard-hint` pill for 5 seconds: `← → navigate · Space play · N narrator`
- On first `›` press: brief celebration micro-animation on current dot
- Accessibility: all buttons have `aria-label`, `tabindex`, keyboard shortcuts

### 2.6 Narrator Panel Redesign

The existing narrator panel CSS is well-designed (frosted glass, gold left accent, custom scrollbar). Key improvements:

#### Spatial Positioning Enhancement
The narrator currently has two modes: `default` (bottom bar) and `narrator-spatial` (near focused entity). The spatial positioning is excellent but underutilized.

```css
/* Proposed: Add smooth transition between spatial positions */
#narrator-overlay {
  transition: top 0.5s cubic-bezier(0.16, 1, 0.3, 1),
              left 0.5s cubic-bezier(0.16, 1, 0.3, 1),
              opacity 0.4s ease,
              transform 0.4s ease;
}
```

#### Narrator Text Fade Mask
For overflowing text, show a gradient fade instead of hard clip:
```css
#narrator-text::after {
  content: '';
  position: absolute;
  bottom: 0; left: 0; right: 0;
  height: 40px;
  background: linear-gradient(transparent, rgba(12,13,20,0.88));
  pointer-events: none;
}
```

#### Max Height Increase
```css
/* CURRENT */
max-height: calc(5.5em + 48px);  /* ~155px */

/* PROPOSED */
max-height: calc(8em + 48px);    /* ~224px — fits 8 lines comfortably */
```

### 2.7 Background Atmosphere Enhancement

#### Current Dot Grid
- Spacing: 80px, radius: 1.2px, opacity: 0.04 (barely visible)

#### Proposed Dot Grid
```javascript
// Tighter grid near center, looser at edges — depth perspective
const spacing = 80;
const cx = CW / 2, cy = CH / 2;
for (let x = spacing; x < CW; x += spacing) {
  for (let y = spacing; y < CH; y += spacing) {
    const distFromCenter = Math.sqrt((x-cx)**2 + (y-cy)**2);
    const maxDist = Math.sqrt(cx**2 + cy**2);
    const opacity = 0.04 + (0.04 * (1 - distFromCenter/maxDist));
    // Center dots brighter, edge dots dimmer
    dot.setAttribute('opacity', String(opacity));
    dot.setAttribute('r', '1.0');  // Slightly smaller for crispness
  }
}
```

#### Ambient Particles (Increase Visibility)
```javascript
// CURRENT: opacity 0.03–0.07, r 2-6px
// PROPOSED: opacity 0.08–0.14, r 3-8px, palette-based colors
const colors = getParticleColors();  // Already uses palette
for (let i = 0; i < 15; i++) {      // Increase from 12 to 15
  c.setAttribute('r', String(3 + Math.random() * 5));
  c.setAttribute('opacity', String(0.08 + Math.random() * 0.06));
  c.style.animationDuration = (8 + Math.random() * 12) + 's';
}
```

### 2.8 Connection Arrow Enhancement

#### Current State
- Stroke: 1.5px (thin)
- Label: 11px monospace, 60% opacity
- No glow effect

#### Proposed

**Glow Layer (add parallel path behind each arrow):**
```typescript
// In arrow/connection renderer
const glowPath = cloneArrowPath(path);
glowPath.setAttribute('stroke-width', '4');
glowPath.setAttribute('stroke-opacity', '0.25');
glowPath.setAttribute('filter', 'url(#arrow-blur)');  // New filter: stdDeviation=3
connectionGroup.insertBefore(glowPath, arrowPath);  // Behind main path
```

**Label Pills (improve readability):**
```typescript
const labelBg = createRect(labelX - padX, labelY - padY, labelW + padX*2, labelH + padY*2);
labelBg.setAttribute('fill', 'rgba(18,20,28,0.85)');
labelBg.setAttribute('stroke', 'rgba(255,255,255,0.1)');
labelBg.setAttribute('rx', '5');
labelText.setAttribute('fill', '#d0d0e0');      // CURRENT: ~60% opacity
labelText.setAttribute('font-size', '12');      // CURRENT: 11px
labelText.setAttribute('font-weight', '500');
labelText.setAttribute('letter-spacing', '0.04em');
```

### 2.9 Loading & End Screen Redesign

#### Loading State Enhancement
```html
<!-- Add subtitle during load -->
<p class="loading-tagline">Don't read it. Watch it.</p>

<!-- Animated gold progress line at bottom -->
<div class="loading-progress-track">
  <div class="loading-progress-bar"></div>
</div>
```

```css
.loading-tagline {
  font-size: 13px;
  color: rgba(201, 168, 76, 0.5);
  letter-spacing: 0.12em;
  text-transform: uppercase;
  margin-top: 8px;
  animation: fadeIn 1s ease 0.5s both;
}

.loading-progress-track {
  position: fixed;
  bottom: 0; left: 0; right: 0;
  height: 2px;
  background: rgba(255,255,255,0.04);
}

.loading-progress-bar {
  height: 100%;
  background: #C9A84C;
  width: 0%;
  animation: loadingProgress 3s cubic-bezier(0.16, 1, 0.3, 1) forwards;
}

@keyframes loadingProgress {
  to { width: 85%; }  /* Never hits 100% — SSE arrival completes it */
}
```

#### End Screen Enhancement
```html
<div id="end-screen" class="end-screen">
  <div class="end-content">
    <div class="end-logo"><!-- Preplai logo SVG --></div>
    <p class="end-title">That's a wrap.</p>  <!-- Changed from "Presentation complete" -->
    <p class="end-stats" id="end-stats"></p>  <!-- "6 frames · ~2 min" -->
    <div class="end-actions">
      <button id="end-replay">↺ Replay</button>
      <button id="end-share">⧉ Share</button>
    </div>
    <!-- New: subtle CTA for non-Preplai users -->
    <p class="end-cta">
      <a href="https://preplai.com">Create your own with AI →</a>
    </p>
  </div>
</div>
```

### 2.10 Accessibility Enhancements

#### Reduced Motion
```css
@media (prefers-reduced-motion: reduce) {
  /* Disable entrance animations — show entities immediately */
  .entity-enter, .entity-exit {
    animation: none !important;
    transition: none !important;
  }

  /* Disable ambient particles */
  .ambient-particle {
    display: none;
  }

  /* Disable narrator slide animation */
  #narrator-text {
    transition: opacity 0.2s ease !important;
    transform: none !important;
  }

  /* Disable dot pulse, glow animations */
  .frame-dot.active {
    animation: none;
  }
}
```

#### Keyboard Navigation
Current shortcuts: `← →` navigate, `Space` play/pause, `N` toggle narrator, `F` fullscreen, `S` speed.

Add:
- `Home` → first frame
- `End` → last frame
- `Shift+C` → copy share link
- `?` → show keyboard shortcuts overlay

#### Screen Reader Support
```html
<!-- Add live region for frame announcements -->
<div id="frame-announcement"
     role="status"
     aria-live="polite"
     aria-atomic="true"
     class="sr-only">
  Frame 1 of 6: System Overview
</div>
```

---

## Part 3: Implementation Roadmap

### Phase 1 — Critical Fixes (Sprint 1, ~3 days)

| Fix | File(s) | Effort |
|-----|---------|--------|
| Label double-render fix | `packages/illustrations/src/components/*.ts` | Medium |
| Interior text overflow | Each affected component | Medium |
| Narrator scrollbar | `packages/player/src/mcp-app-styles.css` | Small |
| Narrator max-height increase | `mcp-app-styles.css` | Small |
| Entity color saturation | `packages/illustrations/src/color-cascade.ts` | Small |
| Frame nav never full-hide | `mcp-app-styles.css` + `player-bootstrap.ts` | Small |
| Reduced-motion media query | `mcp-app-styles.css` | Small |

**Impact:** These alone make the player feel significantly more polished. Fixes 7 critical issues.

### Phase 2 — Visual Redesign (Sprint 2, ~5 days)

| Enhancement | File(s) | Effort |
|------------|---------|--------|
| Scene title card (no-box design) | `packages/illustrations/src/components/h1.ts` | Medium |
| Title glow SVG filter | `packages/mcp-server/src/player-html.ts` | Small |
| Database → cylinder shape | `packages/illustrations/src/components/database.ts` | Medium |
| Dot grid opacity/gradient | `packages/player/src/player-bootstrap.ts` | Small |
| Ambient particle visibility | `packages/player/src/player-bootstrap.ts` | Small |
| Arrow glow layer | `packages/illustrations/src/components/arrow.ts`, `dataflow.ts` | Medium |
| Arrow label pill redesign | Same files | Small |
| Background atmosphere deepening | `mcp-app-styles.css` | Small |
| Feedback button opacity | `mcp-app-styles.css` | Small |

**Impact:** Transforms "impressive demo" to "premium product."

### Phase 3 — Delight Layer (Sprint 3, ~4 days)

| Enhancement | File(s) | Effort |
|------------|---------|--------|
| Scene transition choreography | `packages/player/src/scene-controller.ts` | Large |
| End screen "That's a wrap" | `mcp-app-styles.css` + `player-html.ts` | Small |
| Loading state tagline + progress | `mcp-app-styles.css` + `player-html.ts` | Small |
| Keyboard shortcuts overlay | `player-bootstrap.ts` + CSS | Medium |
| Narrator fade mask | `mcp-app-styles.css` | Small |
| Entity tooltip styling | `mcp-app-styles.css` | Small |
| Top edge progress bar | `mcp-app-styles.css` + `player-bootstrap.ts` | Small |

---

## Part 4: CSS/Design Token Recommendations

### Token Changes Required in `design-tokens.ts`

```typescript
// Current LABEL_DEFAULTS
export const LABEL_DEFAULTS = {
  fontSize: 15,     // ← Change to 14
  fontWeight: 500,  // ← Keep
  maxWidth: 120,    // ← Change to 140 (wider labels)
  lineHeight: 1.3,  // ← Keep
};

// New: Entity fill opacity thresholds
export const FILL_OPACITY = {
  cinema: {
    base: 0.25,     // Was: 0.10-0.12
    medium: 0.18,   // Was: 0.07-0.08
    soft: 0.10,     // Was: 0.04-0.05
  },
  light: {
    base: 0.35,     // Was: 0.25
    medium: 0.25,   // Was: 0.18
    soft: 0.15,     // Was: 0.10
  },
};
```

### CSS Variable System (Proposed Addition to mcp-app-styles.css)

```css
:root {
  /* Background scale */
  --bg-void:      #05060c;
  --bg-deep:      #08090e;
  --bg-canvas:    #0c0d14;
  --bg-elevated:  #12131c;
  --bg-surface:   #1a1b26;
  --bg-hover:     #22232e;

  /* Text scale */
  --text-primary:    #e8e8f0;
  --text-secondary:  #a0a0b8;
  --text-tertiary:   #6b6b80;
  --text-accent:     #C9A84C;

  /* Gold accent */
  --accent:          #C9A84C;
  --accent-dim:      rgba(201, 168, 76, 0.4);
  --accent-glow:     rgba(201, 168, 76, 0.15);

  /* Animation */
  --ease-enter:   cubic-bezier(0.16, 1, 0.3, 1);
  --ease-exit:    cubic-bezier(0.4, 0, 1, 1);
  --ease-spring:  cubic-bezier(0.34, 1.56, 0.64, 1);

  --duration-fast:   200ms;
  --duration-normal: 400ms;
  --duration-slow:   600ms;
}

[data-theme="light"] {
  --bg-void:      #f5f0e8;
  --bg-deep:      #f8f4ee;
  --bg-canvas:    #faf7f2;
  --bg-elevated:  #ffffff;
  --bg-surface:   rgba(255, 255, 255, 0.85);
  --text-primary:    #1a1a2e;
  --text-secondary:  #5a5a6e;
  --text-tertiary:   #8a8a9e;
}
```

---

## Part 5: Component-Level Codebase Map

### Files That Need Changes

| File | Change Type | Priority |
|------|------------|----------|
| `packages/player/src/mcp-app-styles.css` | Critical + Major CSS fixes | P1 |
| `packages/mcp-server/src/player-html.ts` | Add SVG filters, HTML tweaks | P1 |
| `packages/illustrations/src/design-tokens.ts` | Fill opacity thresholds | P1 |
| `packages/illustrations/src/color-cascade.ts` | Increase cinema fill opacity | P1 |
| `packages/player/src/player-bootstrap.ts` | Dot grid, particles, nav behavior | P2 |
| `packages/player/src/scene-controller.ts` | Transition choreography | P3 |
| `packages/illustrations/src/components/h1.ts` | Remove box, use text-only title | P2 |
| `packages/illustrations/src/components/database.ts` | Cylinder shape | P2 |
| `packages/illustrations/src/components/arrow.ts` | Glow layer, label pills | P2 |
| `packages/illustrations/src/components/dataflow.ts` | Glow layer | P2 |
| `packages/illustrations/src/components/loadbalancer.ts` | Inner ring | P2 |
| `packages/illustrations/src/components/cloud.ts` | Organic blob path | P2 |
| `packages/illustrations/src/components/queue.ts` | Horizontal lines pattern | P2 |

### Files That Are Already Good (No Touch)
- `packages/player/src/audio-engine.ts` — Audio system is solid
- `packages/player/src/narrator.ts` — Simple and correct
- `packages/player/src/scene-controller.ts` (focus/DoF logic) — Well-implemented
- `packages/illustrations/src/entity-overlays.ts` — Status/progress overlays work well
- The 404 page (`PLAYER_NOT_FOUND_HTML`) — Already excellent design

---

## Part 6: Risk & Trade-off Assessment

### Low-Risk Changes (Ship Immediately)
- CSS opacity tweaks (fill, dot grid, particles)
- Narrator max-height and scrollbar
- Feedback button opacity
- Keyboard hint auto-dismiss
- CSS variable system addition
- Reduced-motion support

### Medium-Risk Changes (Test in Staging)
- Scene title card (removing the box from H1 renderer changes all presentations)
- Entity fill opacity (affects all 154 renderers — verify readability across all types)
- Arrow glow layer (ensure no performance impact on complex scenes)
- Label placement algorithm (high impact, needs regression testing on 50+ scene types)

### High-Risk Changes (Careful Rollout)
- Scene transition choreography in `scene-controller.ts` — complex state management
- Database cylinder shape — requires testing across all database entity use cases
- Dot grid perspective gradient — visual math must be verified not to cause artifacts

### Backwards Compatibility
All proposed changes are purely additive (CSS/CSS variables) or change existing visual values (opacity, sizes). No breaking API changes. All `VisualScript` JSON schemas remain unchanged.

---

## Summary: Impact vs. Effort Matrix

```
HIGH IMPACT, LOW EFFORT (do first):
  ✅ Entity fill opacity increase        → Most visual improvement per line of code
  ✅ Narrator max-height + fade mask     → Fixes critical content clipping
  ✅ Frame nav always-visible            → Biggest UX improvement for new users
  ✅ Reduced-motion support              → Accessibility win, small effort
  ✅ Dot grid + particle visibility      → Immediate atmosphere improvement
  ✅ Feedback button opacity             → Reduces confusion for shared players

HIGH IMPACT, MEDIUM EFFORT (do second):
  ⚡ Scene title card redesign           → "Wow moment" improvement
  ⚡ Label double-render fix             → Fixes most common visual bug
  ⚡ Arrow glow + label pills            → Makes complex diagrams readable

HIGH IMPACT, HIGH EFFORT (plan carefully):
  🔮 Scene transition choreography       → Cinematic quality transformation
  🔮 Database cylinder + shape upgrades  → Entity distinctiveness
  🔮 Label placement algorithm           → Requires significant QA
```

---

*Prepared by: Designer Agent (PREA-2)*
*Date: March 2026*
*Reviewed by: Pending Founder Approval*
*Next Steps: See [player-redesign-summary.md](./player-redesign-summary.md) for CEO handoff*
