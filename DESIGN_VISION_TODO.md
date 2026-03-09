# Preplai Design Vision — Implementation Todo

> **North Star:** After using Preplai, reading a textbook should feel wrong.
> After watching an agent through Preplai, terminal logs should feel primitive.

---

## Guiding Principles

- **Alive, not static** — every pixel should feel like it could change
- **Spatial, not sequential** — the viewer moves through a world, not through slides
- **The product IS the marketing** — the website should be a Preplai presentation
- **Cinema, not slides** — every transition has a purpose, every composition tells a story

---

## Implementation Roadmap

### Phase 1: Entity Life (Quick Win, Massive Feel Change)
- [x] P1.1 — Entity idle micro-animations system
  - Add subtle CSS @keyframes to entities after render (GPU-only: opacity, transform)
  - Server: data lines shimmer. Database: rows flicker. CPU: registers pulse.
  - Queue: items gently bob. Cache: slots breathe. Network: signals travel.
  - Must not conflict with entrance animations. Activate after entrance completes.
- [x] P1.2 — Connection draw-on animation
  - Arrows/DataFlow: stroke-dashoffset draw-on (0.6s cubic-bezier transition)
  - Staggered connection delays in SceneController (after entity render + 150ms buffer)
  - Arrival pulse at target endpoint (SMIL r + opacity animation)
  - DataFlow: draw-on first, then transitions to flowing dash pattern + SMIL
  - Both illustrations player (arrow.ts) and inline player (player-js.ts) updated
- [x] P1.3 — Entity materiality pass
  - `ensureGlassFilter()` in visual-utils.ts: inner shadow (inverted alpha → blur → offset → clip) + top highlight
  - Rect-based entities (Server body, CPU die, Container border): filter applied directly to body rect
  - Cylinder entities (Database, Cache, Volume): body shapes wrapped in filtered `<g>` sub-group via `glass: true` in CylinderConfig
  - 12 SVG filter primitives, single shared filter definition in `<defs>`
  - Subtle, not skeuomorphic — visionOS-style depth

### Phase 2: Cinematic Player
- [x] P2.1 — Camera/viewport system
  - Complete rewrite of `scene-controller.ts` for cinematic persistent scene
  - Entity diffing: compares entity IDs between frames (added/removed/kept sets)
  - Exit animation: removed entities fade out + scale(0.85) over 300ms, then DOM removal
  - Position animation: kept entities with position changes get CSS transition (0.5s cubic-bezier)
  - ViewBox camera: calculates bounding box of entities, 12% padding, maintains 16:9 aspect, animates via requestAnimationFrame with easeInOutQuad (600ms)
  - Connections always cleared + re-rendered (depend on entity positions)
  - Smart connection delay: shorter base when no new entities entering
  - `_fullClear()` resets viewBox to full canvas on loadScript/clear
  - Exposed `loadScript` on `window.__PRE` + added `/player/_test` route for testing
  - This is the single biggest leap from "slides" to "cinema"
- [x] P2.2 — Depth of field
  - Uses existing `highlight: true` on entities as focus indicator — no schema changes
  - Focused entities: full opacity, no blur (`dof-focus` class)
  - Background entities: opacity 0.35, blur(1.5px), desaturated (`dof-bg` class)
  - When no entity has highlight, all entities at full clarity (no DoF)
  - CSS transitions on `#entity-layer > g` for smooth 0.5s focus shifts
  - DoF classes cleaned up during entity exit animation
  - `_applyDepthOfField()` method in SceneController runs after each frame render
- [x] P2.3 — Spatial narrator
  - Narrator text repositions near the highlighted entity (above it)
  - Uses `onFocusChange` callback from SceneController → bootstrap positions overlay
  - CSS custom properties `--spatial-top`/`--spatial-left` + `narrator-spatial` class
  - Smooth 0.5s CSS transition between positions (cubic-bezier easing)
  - Fallback: returns to centered bottom bar when no entity has `highlight`
  - Compact style when spatial: max-width 480px, font-size 16px, left-aligned
  - `FocusInfo` type exported from @preplai/player (entityId, screenX, screenY)
- [x] P2.4 — Motivated transitions
  - `_motivatedEntrance()` in SceneController: calculates direction from entity position
  - Edge entities (< 22% from edge): `flyInFromLeft/Right/Top/Bottom` CSS keyframes with 120/80px travel + scale(0.92)
  - Entities near existing ones (< 12% distance): `growFromPoint` with scale(0.15) → overshoot 1.06 → 1.0
  - Center entities: default `fadeInUp`
  - Directional exit: `_exitEntity()` now translates toward nearest edge (80px horizontal, 50px vertical) instead of uniform scale(0.85)
  - Agent-specified `animation.entrance` always respected (motivated is fallback only)
  - 5 new CSS @keyframes + 5 entrance classes in player-css.ts

### Phase 3: Website as Product Demo
- [x] P3.1 — Hero = live embedded player
  - `HeroPlayer.jsx` React component using SceneController + @preplai/illustrations directly
  - 5-frame auto-playing demo (5.5s per frame = ~27s loop): User → Server+DB → +Cache → LoadBalancer architecture → final overview
  - Seamless loop via `setInterval` with modular frame index
  - No user controls — purely cinematic auto-play
  - SVG narrator bar with gold accent, frame progress dots updated per frame
  - Full depth-of-field + motivated transitions working in hero embed
  - Replaced 100-line static SVG mockup with live 3-line `<HeroPlayer />`
  - Player animation CSS (keyframes, entrance classes, DoF, idle) added to website `components.css`
- [x] P3.2 — Use-case showcase embeds
  - `ShowcasePlayer.jsx` reusable component: accepts script prop, auto-plays with 5s per frame interval
  - Three live player embeds in "See it in action" section between hero and features:
    1. **Computer Science** — Binary search: unsorted array → BST construction → O(log n) search with BigO entity
    2. **System Architecture** — Event-driven: tightly coupled services → message queue decoupling → full event flow with Event Store
    3. **Agent Reasoning** — AI pipeline: user prompt → reasoning Pipeline + Decision → Metric confidence + verified answer
  - Demo scripts in `showcase-scripts.js` (3 frames each × 5s = 15s loop)
  - Responsive grid: 3-column on desktop, 2-column on tablet, 1-column on mobile
  - Each card: dark SVG canvas + narrator bar + label + description below
  - All cinematic features active: motivated transitions, DoF, entrance animations, idle animations
- [x] P3.3 — Remove feature grid, let product speak
  - Replaced verbose 6-card bento grid with minimal capabilities strip
  - Single centered row of 6 icon+label items (MCP API, Cinema Quality, Voice Narration, 85+ Entity Types, Shareable URLs, Instant Setup)
  - Gold icons from lucide-react, muted text labels, compact padding
  - Sits between showcases and setup as a lightweight visual bridge
  - Setup/code section preserved (essential for developer onboarding)
  - Landing page flow: Hero → Showcases → Capabilities → Setup → Footer

### Phase 4: Semantic Design System
- [x] P4.1 — Semantic color mapping
  - `ENTITY_COLORS` in `design-tokens.ts` reorganized by semantic spectrum (90+ types)
  - Blue (`#4488ff`) = data/information: Database, Cache, Volume, MemoryBlock, HashTable, BTree, Dict, Set, Heap, etc.
  - Green (`#00e676`) = computation/processing: Server, CPU, Service, Lambda, Pipeline, Thread, CodeBlock, CallStack, SymbolTable
  - Gold (`#C9A84C`) = human/agent: User, Concept, Decision, Metric, BigO, Analogy, Quote, Definition, Proof
  - Red (`#ff6b6b`) = state/control: Mutex, Semaphore, Firewall, FSM, ProcessState, DeadlockGraph, Badge
  - Violet (`#9B59B6`) = structure/organization: Container, Pod, Network, Subnet, Cluster, Stack, BinaryTree, LinkedList, NeuralNetwork
  - Cyan, Orange, Teal, Pink for remaining categories; White for connectors
  - Player palettes (`palettes.ts`) aligned with semantic keys: `compute`, `data`, `environment`, `human`, `structure`, `state`, `annotation`
  - Inline player (`player-js.ts`) PALETTES + `getEntityColor()` updated to match
- [x] P4.2 — Scale hierarchy in compositions
  - Driven by existing `highlight: true` entity flag (same as depth-of-field)
  - Focused entities (`.dof-focus`): `scale(1.15)` — subtle enlargement + full opacity
  - Background entities (`.dof-bg`): `scale(0.88)` — slight shrink + opacity 0.35 + blur
  - No focus state: all entities at `scale(1.0)` (unchanged)
  - CSS `transform` transition added (0.5s cubic-bezier, matches opacity/filter timing)
  - Updated in `player-css.ts` (MCP player), `components.css` (hero + showcase embeds)

---

## Completed Work (Previous Session)

- [x] Progress bar color: purple → gold (#C9A84C) cinema, slate minimal
- [x] Gradient fill opacity boost (25%/15% → 40%/25% via design tokens)
- [x] Arrow stroke weight increase (2→2.5 player, 2.5→3 illustration)
- [x] Landing hero redesign (dark cinematic, dot grid, glow orbs, gold typography)
- [x] Bento feature grid (6 cards replacing 3-card grid)
- [x] Scene transition choreography (GSAP timeline: narrator exit → entity fade → rebuild → fade in)
- [x] Nav dark frosted glass (consistent across themes)
- [x] 3 new illustration types (LogicGate, Mutex, SymbolTable)

---

*Last updated: 2026-03-08*
*Phase 4 completed: 2026-03-08*
