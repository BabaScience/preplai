# Layout Templates — Implementation Tracker

> **Goal:** Implement 16 position templates mapped to 4 client avatars, with tier-based grid alignment and agent instructions.
> **Date Created:** 2026-03-23
> **Status Legend:** `[ ]` Not started | `[~]` In progress | `[x]` Done

---

## Phase 1: Agent Instructions — Position Templates in Tool Description

Add all 16 templates with exact coordinates to `add-scene.v1.md` so agents can use them immediately without any code changes.

### Engineers & SRE Templates (5)

- [x] **1. Hub-Spoke** — Central entity + radial satellites
  - Positions: center=[50,42], satellites=[20,25],[80,25],[20,62],[80,62]
  - Use: "How does X work?", "Explain the architecture"
  - Entities: Server/Service as hub, surrounding services/databases

- [x] **2. Pipeline** — Left-to-right sequential chain
  - Positions: 4-step=[15,45],[38,45],[62,45],[85,45] | 5-step=[12,45],[30,45],[50,45],[70,45],[88,45]
  - Use: "Show the CI/CD flow", "Walk through the pipeline"
  - Entities: GitCommit→Build→Container→Deployment→Monitor

- [x] **3. Incident Timeline** — Multi-frame temporal with status morphing
  - Frame 1: All entities status:"healthy" at pipeline positions
  - Frame 2: Failing entity morphs to status:"error" + badge with error code
  - Frame 3: Recovery with status:"loading" + progress ring
  - Use: "Walk through the outage", "Show the incident"

- [x] **4. Before/After** — Side-by-side comparison
  - Positions: left-cluster=[20,30],[20,50],[20,70], right-cluster=[80,30],[80,50],[80,70], center-label=[50,50]
  - Use: "Compare before and after", "Show the migration"
  - Entities: Mirrored types, DottedArrow for comparison links

- [x] **5. Layered Stack** — Horizontal bands top-to-bottom
  - Positions: tier1=[25,20],[50,20],[75,20], tier2=[25,45],[50,45],[75,45], tier3=[25,70],[50,70],[75,70]
  - Use: "Show the architecture layers", "Explain the tech stack"
  - Entities: Frontend tier → Backend tier → Data tier

### Product Manager Templates (4)

- [x] **6. User Flow** — Horizontal journey with metrics
  - Positions: steps=[12,45],[30,45],[50,45],[70,45],[88,45] (same as pipeline)
  - Use: "Show the user journey", "Walk through the funnel"
  - Entities: User→UserJourneyStep→...→Metric, with conversion badges

- [x] **7. Metric Dashboard** — 2x2 or 3x2 grid
  - Positions: 2x2=[30,30],[70,30],[30,65],[70,65] | 3x2=[20,30],[50,30],[80,30],[20,65],[50,65],[80,65]
  - Header: Dashboard at [50,10]
  - Use: "Show the KPIs", "Display our metrics"
  - Entities: Dashboard + Metric entities with badge values

- [x] **8. Feature Tree** — Root concept branching to components
  - Positions: root=[50,18], L2=[25,45],[50,45],[75,45], L3=[15,72],[35,72],[55,72],[75,72]
  - Use: "Break down the feature", "Show product components"
  - Entities: Concept→ComponentNode→Task

- [x] **9. Roadmap Timeline** — Horizontal timeline with milestones
  - Positions: timeline=[50,25], milestones=[15,55],[35,55],[55,55],[75,55],[88,55]
  - Use: "Show the roadmap", "Walk through the plan"
  - Entities: Timeline + Concept/Task milestones with date badges

### Consultant & Strategy Templates (4)

- [x] **10. Org Chart** — Wide tree with deep branching (1→3→6+)
  - Positions: root=[50,15], L2=[22,38],[50,38],[78,38], L3=[12,62],[28,62],[42,62],[58,62],[72,62],[88,62]
  - Use: "Show the org structure", "Map the team"
  - Entities: Composable with users icon, Arrow connections

- [x] **11. Quadrant / Matrix** — 4-quadrant layout with axis labels
  - Positions: TL=[28,30], TR=[72,30], BL=[28,65], BR=[72,65], center=[50,48]
  - Axis labels at [50,15] (top), [50,82] (bottom), [10,48] (left), [90,48] (right)
  - Use: "Map the competitive landscape", "Show the SWOT"
  - Entities: Concept/Composable in each quadrant, Label for axes

- [x] **12. Strategy Tree** — OKR/goal hierarchy (Vision→Objectives→Key Results)
  - Positions: Same as Feature Tree — root=[50,18], L2=[25,45],[50,45],[75,45], L3 spread
  - Use: "Present the OKR framework", "Show strategic goals"
  - Entities: Concept as vision, Composable as objectives, StepList as key results

- [x] **13. Process Flow** — Sequential with decision gates
  - Positions: steps=[15,45],[32,45],[50,45],[68,45],[85,45] with Decision diamond at [50,45]
  - Branch: Decision→yes=[68,30], Decision→no=[68,60]
  - Use: "Walk through the process", "Show the approval flow"
  - Entities: Composable steps + Decision diamond + branching arrows

### Finance & Legal Templates (3)

- [x] **14. Fund Hierarchy** — Deep tree (1→3→5+)
  - Positions: root=[50,18], L2=[22,42],[50,42],[78,42], L3=[12,65],[30,65],[50,65],[68,65],[86,65]
  - Use: "Show the fund structure", "Explain the portfolio"
  - Entities: Composable with shield/landmark icons, DataFlow arrows

- [x] **15. Decision Flow** — Sequential with compliance gates
  - Positions: start=[12,45], gate1=[30,35],[30,55], decision=[50,45], pass=[70,35], fail=[70,60], end=[88,45]
  - Use: "Walk through compliance", "Show the approval process"
  - Entities: Composable + Decision + Alert(fail) + DataFlow

- [x] **16. Waterfall / Cascade** — Top-to-bottom capital flow
  - Positions: tiers at y=[15,30,45,60,75] centered at x=50, spreading wider each tier
  - Use: "Show the capital cascade", "Explain fund flow"
  - Entities: Composable with finance icons, DataFlow downward

---

## Phase 2: Compiler Snap-to-Grid (Post-Processing)

Auto-correct agent positions to the nearest grid point and align tiers.

- [x] **17. Add snap-to-grid in compiler stage 3**
  - Quantize all positions to nearest 5-unit increment
  - x: 17→15, x: 18→20, y: 43→45
  - Preserve explicit positions that are already on-grid

- [x] **18. Add tier alignment**
  - If 2+ entities have Y within 5 units of each other, align them to the median Y
  - Only apply to non-connection entities
  - Don't align entities that are clearly on different tiers (>10 units apart)

- [x] **19. Enforce minimum gap**
  - Minimum 12-unit gap between entity centers
  - If two entities overlap, nudge the second one away

- [x] **20. Enforce safe margins**
  - Clamp all positions to x: 10-90, y: 8-85
  - Ensures entities don't clip canvas edges

---

## Phase 3: Quality Scorer — Layout Alignment Dimension

- [x] **21. Add scoreTierAlignment() dimension**
  - Check if entities on the same conceptual tier share the exact same Y
  - Penalize Y variance within tiers (stddev > 2 = alignment issue)
  - Reward perfectly aligned tiers

---

## Phase 4: Scene Composer Presets

Add template presets to the Scene Composer debug page for visual testing.

- [x] **22. Add Engineer presets** — Hub-Spoke already exists, add Pipeline, Incident Timeline
- [x] **23. Add PM presets** — User Journey exists, add Metric Dashboard, Feature Tree
- [x] **24. Add Consultant presets** — Add Org Chart, Strategy Framework
- [x] **25. Add Finance presets** — Fund Structure exists, add Decision Flow, Waterfall

---

## Implementation Priority

1. **Phase 1 first** (templates in tool description) — immediate impact, no code changes
2. **Phase 2 second** (compiler snap) — auto-corrects sloppy positioning
3. **Phase 3 third** (scorer) — measures alignment quality
4. **Phase 4 last** (presets) — visual testing in debug page
