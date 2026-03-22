# Preplai Cutting-Edge Roadmap: Three Strategic Moves

> **Goal:** Extend Preplai's existing hybrid architecture (validated by CVPR research, 10x cheaper than AI-generated SVG) with three high-impact enhancements that no competitor offers.
>
> **Date Created:** 2026-03-22
> **Status Legend:** `[ ]` Not started | `[~]` In progress | `[x]` Done

---

## Move 1: Inter-Frame Entity Morphing (GSAP MorphSVG)

**Why:** Currently, when an entity persists across frames but changes shape (e.g., a Server becomes a Container), the old entity exits and the new one enters. With morphing, the shape smoothly transforms — making presentations feel truly cinematic. GSAP MorphSVG plugin is now **100% free** after Webflow's acquisition of GreenSock (fall 2024).

**Current State:**
- Entity persistence already works — same `id` across frames keeps the DOM node alive
- Position changes already animate smoothly (CSS transition on outerG, 0.5s, cubic-bezier)
- Exit = scale(0.85) + opacity(0) over 300ms; Enter = motivated entrance animation
- GSAP 3.13.0 already loaded from CDN in `player-bootstrap.ts`
- No MorphSVG plugin currently loaded

**Key Files:**
- `packages/player/src/scene-controller.ts` — entity diffing (lines 197-276), `_updateEntityPosition()`
- `packages/mcp-server/src/player-js.ts` — GSAP loading, idle animations
- `packages/mcp-server/src/player-html.ts` — CDN script tags
- `packages/mcp-server/src/player-css.ts` — entrance/exit CSS animations
- `packages/illustrations/src/registry.ts` — render function dispatch
- `packages/illustrations/src/utils.ts` — `buildEntityGroup()`, `applyEntranceAnimation()`

### Tasks

- [x] **1.1 Load MorphSVG plugin from CDN**
  - Add GSAP MorphSVG plugin script tag alongside existing GSAP CDN in `player-html.ts`
  - URL: `https://cdnjs.cloudflare.com/ajax/libs/gsap/3.13.0/MorphSVGPlugin.min.js`
  - Register plugin: `gsap.registerPlugin(MorphSVGPlugin)` in `player-js.ts`
  - Verify it loads before any morph calls (use same dynamic loading pattern as base GSAP)

- [x] **1.2 Detect morphable transitions in scene-controller**
  - In the entity diff logic (scene-controller.ts ~line 197), add a new category: `morphed`
  - A `morphed` entity = same `id` exists in both frames, but `type` has changed
  - Currently `kept` entities only update position — extend to detect type changes
  - Data structure: `{ id, fromType, toType, fromEntity, toEntity }`

- [x] **1.3 Extract primary shape path from entities**
  - Each render function produces SVG with a "primary shape" (the main rect/circle/path)
  - Add `data-morph-target` attribute to the primary shape element in key components
  - Start with: Server, Database, Cache, Container, Cloud, Lambda, Service, Concept, Pod
  - The morph target is the element GSAP will animate between shapes

- [x] **1.4 Implement morph transition in scene-controller**
  - When a `morphed` entity is detected:
    1. Keep the outerG in DOM (don't exit/enter)
    2. Find `[data-morph-target]` in the existing innerG
    3. Render the new entity type off-screen to get its target shape path
    4. Use `gsap.to(existingShape, { morphSVG: targetShape, duration: 0.6, ease: 'power2.inOut' })`
    5. Simultaneously update label, color, and other properties with GSAP
    6. Clean up: after morph completes, replace innerG contents with properly rendered new entity
  - Fallback: if morph target not found, fall back to exit/enter (current behavior)

- [x] **1.5 Handle property morphing alongside shape morphing**
  - When entity persists but properties change (color, label, size) without type change:
    - Animate fill color transition: `gsap.to(shape, { fill: newColor, duration: 0.4 })`
    - Animate label text crossfade (opacity out old → update text → opacity in new)
    - Animate size changes via transform scale
  - This makes even same-type entities feel alive when their data changes

- [x] **1.6 Test morph transitions**
  - Create test presentation with morphing scenarios:
    - Server → Container (shape morph)
    - Database → Cache (similar shapes, subtle morph)
    - Concept → Server (circle → rect morph)
    - Same type, different color/label (property morph)
  - Test in Illustration Debug page and player
  - Verify no memory leaks (off-screen render cleanup)
  - Verify fallback works when morph target missing

---

## Move 2: Richer AI Control Knobs (Enhanced Metadata)

**Why:** Give agents more expressiveness through metadata without generating raw SVG. Currently agents control type, position, label, highlight (boolean), and type-specific metadata. Adding status indicators, progress visualization, emphasis scaling, and state-dependent colors makes every frame more informative — at JSON-spec cost (~$0.01/frame).

**Current State:**
- `metadata` is fully open `Record<string, unknown>` — extensible without schema changes
- Highlight is binary (boolean flag → dashed outer glow)
- No global status/state token system — each component defines its own
- Composable system: 15 shapes × 216 icons × 4 styles = 12,960 combos
- Design tokens have opacity scales but no error/success/warning semantic colors
- Agent metadata hints in `illustrations-reference.ts` guide agent usage

### Tasks

- [x] **2.1 Add universal status overlay system**
  - New metadata field: `metadata.status: 'healthy' | 'warning' | 'error' | 'inactive' | 'loading'`
  - Implement in `packages/illustrations/src/utils.ts` (applied after component render, before entrance animation)
  - Visual treatment per status:
    - `healthy`: subtle green ring pulse (CSS idle animation)
    - `warning`: amber pulsing dot (top-right corner badge)
    - `error`: red glow ring + subtle shake idle animation
    - `inactive`: 50% opacity + grayscale filter
    - `loading`: animated dashed stroke rotation around entity
  - Applied universally to ALL entity types (not per-component)
  - Add status colors to `design-tokens.ts`: `STATUS_COLORS = { healthy, warning, error, inactive, loading }`

- [x] **2.2 Add progress ring indicator**
  - New metadata field: `metadata.progress: 0.0–1.0` (float)
  - Renders a circular arc around the entity showing completion percentage
  - Implementation: SVG `<circle>` with `stroke-dasharray` and `stroke-dashoffset`
  - Color: follows entity color or status color if status is also set
  - Applied in `utils.ts` after component render (wraps outerG)
  - Animate on enter: dashoffset transition from 0% to target (0.8s, ease-out)

- [x] **2.3 Add emphasis/importance scaling**
  - New metadata field: `metadata.emphasis: 'low' | 'normal' | 'high' | 'critical'`
  - Visual treatment:
    - `low`: 0.85× scale, 70% opacity
    - `normal`: 1.0× scale, 100% opacity (default, no change)
    - `high`: 1.1× scale, slightly thicker stroke (emphasized token)
    - `critical`: 1.15× scale, pulsing glow ring, emphasized stroke
  - Applied via CSS classes on outerG (GPU-safe transform + opacity)
  - Interacts with depth-of-field: emphasis adjusts the base, DOF adjusts on top

- [x] **2.4 Add badge/annotation system**
  - New metadata field: `metadata.badge: { text: string, color?: string, position?: 'top-right' | 'top-left' | 'bottom-right' }`
  - Renders a small pill-shaped badge on the entity corner
  - Use cases: version numbers ("v2.1"), counts ("3x"), status text ("NEW"), metrics ("99.9%")
  - Implementation: SVG `<rect>` + `<text>` positioned relative to entity bounds
  - Already exists in composable system (`badgeLabel`) — generalize to all entity types

- [x] **2.5 Add connection style metadata**
  - Enhance Arrow/DataFlow with: `metadata.thickness: 'thin' | 'normal' | 'thick'`
  - Add: `metadata.animated: boolean` (flowing dashes animation)
  - Add: `metadata.color: string` (override connection color)
  - Add: `metadata.bidirectional: boolean` (arrowheads on both ends)
  - This gives agents control over relationship emphasis without using different connection types

- [x] **2.6 Update design tokens with semantic state colors**
  - Add to `design-tokens.ts`:
    ```
    STATUS_COLORS = {
      healthy: '#10b981',   // emerald-500
      warning: '#f59e0b',   // amber-500
      error: '#ef4444',     // red-500
      inactive: '#6b7280',  // gray-500
      loading: '#3b82f6',   // blue-500
    }
    ```
  - Add opacity variants for each (ring, glow, badge background)

- [x] **2.7 Update MCP tool hints for agents**
  - Update `illustrations-reference.ts` with new universal metadata fields
  - Update `add_scene` tool description to document new control knobs
  - Add examples showing status, progress, emphasis, badge usage
  - Update `metadataHints` for each entity type to include universal fields

- [x] **2.8 Update compiler validation**
  - Add Zod schemas for new metadata fields in `packages/compiler/`
  - Validate status enum, progress range (0-1), emphasis enum
  - Strip invalid values with sensible defaults (don't break existing presentations)

- [x] **2.9 Test enhanced metadata system**
  - Create test presentation exercising all new metadata:
    - Server with status: 'error' + badge: { text: '503' }
    - Pipeline with progress: 0.7
    - Database with emphasis: 'critical'
    - Arrow with thickness: 'thick' + animated: true
  - Verify visual consistency across all entity types
  - Verify backwards compatibility (existing presentations unchanged)
  - Test in Illustration Debug page

---

## Move 3: Animated Micro-Assets (OmniLottie/Lottie Integration)

**Why:** Currently entities have CSS idle animations (breathing, shimmer, pulse). Lottie animations would give entities **living, domain-specific animations** — spinning gears for pipelines, flowing data for streams, pulsing heartbeats for health monitors. OmniLottie (CVPR 2026) can generate these from text prompts with 88-93% success rate.

**Current State:**
- Rich idle animation system already exists (9 types + per-entity child animations)
- Zero Lottie references in codebase
- GSAP loaded dynamically from CDN (same pattern would work for lottie-web)
- Audio files already served from server (pattern for serving animation assets exists)
- SVG `<foreignObject>` not currently used but supported by all modern browsers
- CSP `resourceDomains` whitelist in `mcp-tools.ts` can be extended

**Important Note:** OmniLottie is cutting-edge research (March 2026). This move should be implemented in phases — first integrate Lottie playback infrastructure, then add curated animations, then evaluate OmniLottie for generation when it stabilizes.

### Tasks

- [x] **3.1 Phase 1: Lottie playback infrastructure**
  - Load `lottie-web` (lightweight SVG renderer) from CDN dynamically
  - URL: `https://cdnjs.cloudflare.com/ajax/libs/lottie-web/5.12.2/lottie.min.js`
  - Same dynamic loading pattern as GSAP in `player-bootstrap.ts`
  - Add to CSP resourceDomains whitelist
  - Verify library loads and basic playback works

- [x] **3.2 Extend entity metadata for Lottie animations**
  - New metadata field: `metadata.lottieAnimation: { src: string, loop?: boolean, speed?: number, trigger?: 'idle' | 'entrance' | 'focus' }`
  - `src` can be a URL to a hosted .json Lottie file or a built-in animation name
  - `trigger`: when to play — on idle (continuous), on entrance (once), or on focus (when narration highlights)
  - Add type definition to `packages/shared/src/types.ts`

- [x] **3.3 Create Lottie overlay renderer**
  - New utility in `packages/illustrations/src/lottie-overlay.ts`
  - Takes an entity's outerG element + Lottie config
  - Creates SVG `<foreignObject>` sized to entity bounds
  - Embeds a `<div>` inside foreignObject for lottie-web to render into
  - Positions overlay relative to entity (centered, or configurable offset)
  - Handles lifecycle: play on trigger, pause when not visible, destroy on entity exit

- [x] **3.4 Curate initial Lottie animation library**
  - Create `packages/illustrations/assets/lottie/` directory
  - Source or create 10-15 domain-appropriate Lottie animations:
    - `gear-spin.json` — for Pipeline, Build, Process
    - `data-flow.json` — for Stream, DataFlow, Queue
    - `heartbeat.json` — for Monitor, Alert, HealthCheck
    - `loading-spinner.json` — for any entity with status: 'loading'
    - `check-success.json` — for Deployment (success), Build (passed)
    - `warning-pulse.json` — for Alert (warning), CircuitBreaker (open)
    - `network-pulse.json` — for Network, Subnet, LoadBalancer
    - `code-typing.json` — for CodeBlock, Terminal
    - `cloud-drift.json` — for Cloud, CDN
    - `lock-unlock.json` — for AuthFlow, Certificate, Secret
  - Keep file sizes small (<50KB each) for fast loading
  - Host in `public/assets/lottie/` or serve from MCP server

- [x] **3.5 Integrate with idle animation system**
  - In `player-js.ts` `applyIdleAnimations()`:
    - Check if entity has `metadata.lottieAnimation`
    - If yes and trigger is 'idle': initialize Lottie player instead of CSS idle class
    - If no: fall back to existing CSS idle animation (backwards compatible)
  - Lottie animations should coexist with CSS entrance animations
  - Sequence: entrance CSS animation → wait for completion → start Lottie idle

- [x] **3.6 Integrate with focus/depth-of-field system**
  - When entity receives focus (`dof-focus` class):
    - If Lottie animation has `trigger: 'focus'`: play animation
    - Speed up idle Lottie animations slightly (1.2× speed) for focused entity
  - When entity loses focus:
    - If `trigger: 'focus'`: pause/reset animation
    - Slow idle animations back to normal speed
  - Respect `dof-bg` class: reduce Lottie animation opacity to match dimmed state

- [x] **3.7 Update MCP tool hints for Lottie**
  - Add `lottieAnimation` to metadata hints in `illustrations-reference.ts`
  - Document available built-in animations by name
  - Add examples: `"lottieAnimation": { "src": "gear-spin", "loop": true, "trigger": "idle" }`

- [x] **3.8 Phase 2: Evaluate OmniLottie for generation (future)**
  - Monitor OmniLottie GitHub repo for stable release
  - Test: Can it generate domain-appropriate animations from text prompts?
  - Test: Are generated animations small enough for web (<100KB)?
  - Test: Quality consistency across multiple generations
  - If viable: integrate as optional generation pipeline (agent requests animation → OmniLottie generates → cache → serve)
  - This is a future phase — do not block Moves 1-2 on this

- [x] **3.9 Test Lottie integration**
  - Create test presentation with Lottie-enhanced entities
  - Verify Lottie plays correctly in SVG foreignObject
  - Verify no performance regression (Lottie + CSS idle + GSAP focus all coexisting)
  - Verify cleanup on entity exit (no orphaned Lottie instances)
  - Test on mobile Safari (foreignObject has known quirks)
  - Fallback test: entities without Lottie still work perfectly

---

## Implementation Order

**Recommended sequence:**

1. **Move 2 first** (Enhanced Metadata) — lowest risk, highest immediate impact, no new dependencies
2. **Move 1 second** (Frame Morphing) — medium complexity, dramatic visual improvement
3. **Move 3 last** (Lottie Integration) — highest complexity, external dependency, can be phased

Each move is independent — completing one doesn't block the others.

---

## Success Criteria

- [x] All existing presentations render identically (zero regression)
- [x] New features are opt-in via metadata (backward compatible)
- [x] No new runtime dependencies that block initial render
- [x] Player performance: 60fps maintained with all features active
- [x] Agent documentation updated for all new control knobs
- [x] Illustration Debug page updated to showcase new features
