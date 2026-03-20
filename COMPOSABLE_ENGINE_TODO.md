# Composable Illustration Engine — Implementation TODO

> **Goal:** Go from 153 fixed illustration types to effectively infinite visual coverage.
> Every client avatar (Engineers, PMs, Consultants, Financial Advisors) gets cinematic presentations — not colored squares.

---

## Phase 1: Composable Renderer Core

The single new renderer that combines Shape + Icon + Color into unique visuals.

- [ ] **1.1 Define shape primitives** (`packages/illustrations/src/components/composable-shapes.ts`)
  - [ ] Rect (rounded), Circle, Hexagon, Diamond, Shield, Cylinder, Document, Stadium, Pill, Parallelogram, Cloud-shape, Pentagon, Octagon, Triangle, Trapezoid
  - [ ] Each shape: returns SVG element, supports gradient fill, stroke from design tokens
  - [ ] Each shape: configurable width/height ratio, supports highlight glow

- [ ] **1.2 Build icon path library** (`packages/illustrations/src/components/icon-paths.ts`)
  - [ ] Curate ~100 initial icons as SVG `d` path strings (from Lucide or hand-picked)
  - [ ] Finance pack: landmark, banknote, wallet, trending-up, trending-down, scale, gavel, briefcase, shield-check, building, piggy-bank, receipt, credit-card, coins, percent, calculator, handshake, stamp, scroll, vault, crown (~20 icons)
  - [ ] Business pack: target, users, user-check, globe, megaphone, lightbulb, puzzle, compass, map, flag, trophy, rocket, gauge, funnel, kanban, milestone, network, workflow, share, zap (~20 icons)
  - [ ] Product/UX pack: smartphone, monitor, mouse-pointer, eye, heart, star, thumbs-up, message-circle, bell, search, palette, brush, type, image, play (~15 icons)
  - [ ] General pack: check, x, alert-triangle, info, clock, calendar, lock, unlock, link, layers, grid, hash, tag, bookmark, archive, folder, download, upload (~20 icons)
  - [ ] Tech supplement: code, terminal, git-branch, database, server, cpu, wifi, cloud, shield, key (~10 icons)
  - [ ] Export: `ICON_PATHS: Record<string, string>` and `ICON_CATEGORIES: Record<string, string[]>`

- [ ] **1.3 Build the composable renderer** (`packages/illustrations/src/components/composable.ts`)
  - [ ] `renderComposable(entity: VisualEntity, parentEl: SVGElement): SVGGElement`
  - [ ] Read `metadata.shape` (default: "rect") and `metadata.icon` (optional)
  - [ ] Use `buildEntityGroup` / `applyEntranceAnimation` (double-`<g>` pattern)
  - [ ] Render shape from composable-shapes.ts with gradient from design tokens
  - [ ] Render icon centered inside shape (scaled to ~40% of shape size)
  - [ ] Render label below (existing label placement logic)
  - [ ] Support `highlight`, `visualStyle`, `entity.color` override
  - [ ] Support metadata: `shape`, `icon`, `iconColor`, `style` (default/minimal/emphasized/outlined)

- [ ] **1.4 Register in registry** (`packages/illustrations/src/registry.ts`)
  - [ ] Add `Composable: renderComposable` to the registry map
  - [ ] Export from `index.ts`

- [ ] **1.5 Add debug defaults** (`apps/website/src/pages/dev/entity-defaults.ts`)
  - [ ] Add `Composable` entry with example metadata (shape: "shield", icon: "landmark")

- [ ] **1.6 Build & visual test**
  - [ ] `pnpm --filter @preplai/illustrations run build`
  - [ ] Test on Illustration Debug page at `/dev/illustrations`
  - [ ] Verify: gradient renders, icon renders inside shape, label placement, highlight glow, entrance animation

---

## Phase 2: Registry Fallback Chain

Make the registry try Composable before giving up on unknown types.

- [ ] **2.1 Add fallback logic to registry** (`packages/illustrations/src/registry.ts`)
  - [ ] Current: `registry[type]` → miss → return `null`
  - [ ] New chain: `registry[type]` → miss → check `metadata.shape || metadata.icon` → render via `renderComposable` → else return `null`
  - [ ] Log suggestion when fallback is used (for future dedicated renderer consideration)

- [ ] **2.2 Add semantic type resolver** (`packages/illustrations/src/components/semantic-resolver.ts`)
  - [ ] Map common domain terms to shape+icon combos:
    - Finance: "fund" → shield+landmark, "portfolio" → hexagon+briefcase, "asset" → circle+coins
    - Legal: "contract" → document+scroll, "compliance" → shield+shield-check, "regulation" → octagon+gavel
    - Business: "strategy" → diamond+target, "market" → hexagon+globe, "team" → stadium+users
    - General: "process" → rect+workflow, "goal" → circle+target, "risk" → diamond+alert-triangle
  - [ ] Fuzzy matching on entity type name (lowercase, substring match)
  - [ ] Integrate into fallback chain as Tier 3

- [ ] **2.3 Update compiler validation** (`packages/compiler/src/types.ts`)
  - [ ] Add `Composable` to `KNOWN_ENTITY_TYPES`
  - [ ] Downgrade unknown type warning when semantic resolver can handle it

- [ ] **2.4 Build & test fallback chain**
  - [ ] Test: known type → dedicated renderer (unchanged)
  - [ ] Test: `Composable` with shape+icon metadata → composable renderer
  - [ ] Test: unknown type with no metadata → semantic resolver → composable
  - [ ] Test: completely unknown type → still returns null (no regression)

---

## Phase 3: Agent Integration

Teach the AI agent about Composable entities so it uses them intelligently.

- [ ] **3.1 Update MCP instructions** (`packages/mcp-server/src/mcp-instructions.ts`)
  - [ ] Add Consultants & Financial Advisors to the WHO YOU'RE PRESENTING TO section
  - [ ] Add guidance: "When no dedicated type exists, use Composable with shape + icon metadata"
  - [ ] Add examples for non-engineering domains

- [ ] **3.2 Update illustrations reference** (`packages/mcp-server/src/illustrations-reference.ts`)
  - [ ] Add `Composable` to entity types list
  - [ ] Add composable metadata hints: `shape`, `icon`, `iconColor`, `style`
  - [ ] Add `availableShapes` list to the illustrations reference response
  - [ ] Add `availableIcons` categorized list to the illustrations reference response
  - [ ] Add domain-specific topic hints:
    - `"fund flow, capital structure, PE, VC"` → `["Composable"]` with shape/icon suggestions
    - `"legal hierarchy, contract, compliance"` → `["Composable"]` with suggestions
    - `"competitive analysis, SWOT, Porter"` → `["Composable"]` with suggestions
    - `"org chart, team structure"` → `["Composable"]` with suggestions

- [ ] **3.3 Update `create_session` response** (`packages/mcp-server/src/illustrations-reference.ts`)
  - [ ] Include `shapes` array in the illustrations object
  - [ ] Include `icons` object (categorized) in the illustrations object
  - [ ] Include `composableExamples` with domain-specific shape+icon combos

- [ ] **3.4 Test end-to-end with MCP**
  - [ ] Create a presentation about "private equity fund structure" — verify Composable entities render
  - [ ] Create a presentation about "competitive analysis framework" — verify visual variety
  - [ ] Create a standard engineering presentation — verify no regression

---

## Phase 4: Icon Pack Expansion & Polish

Expand icon coverage and refine the visual quality.

- [ ] **4.1 Expand to ~300 icons**
  - [ ] Healthcare pack: heart-pulse, stethoscope, pill, syringe, microscope, dna, atom, beaker, brain, activity
  - [ ] Education pack: book, graduation-cap, pencil, school, library, chalkboard
  - [ ] Manufacturing pack: factory, wrench, cog, truck, package, warehouse
  - [ ] Additional finance: chart-candlestick, bar-chart-3, split, merge, pie-chart

- [ ] **4.2 Visual polish**
  - [ ] Ensure icon strokes match design token stroke widths
  - [ ] Test all shape+icon combos look balanced (icon not too big/small)
  - [ ] Add subtle inner shadow or depth to shapes (matching existing component quality)
  - [ ] Test across both `cinema` and `light` themes

- [ ] **4.3 Performance validation**
  - [ ] Verify bundle size increase is < 50KB
  - [ ] Verify no rendering performance regression with 20+ composable entities on screen
  - [ ] Verify entrance animations work correctly

---

## Phase 5: Semantic Resolver Expansion

Make the auto-resolution smarter and broader.

- [ ] **5.1 Expand semantic mappings**
  - [ ] Add 50+ domain term → shape+icon mappings
  - [ ] Cover: finance, legal, healthcare, education, manufacturing, marketing, HR, real estate
  - [ ] Test fuzzy matching accuracy

- [ ] **5.2 Analytics / logging**
  - [ ] Log when semantic resolver is used (which types trigger it)
  - [ ] Track most common resolved types → candidates for future dedicated renderers

- [ ] **5.3 Documentation**
  - [ ] Update CLAUDE.md with Composable entity guidance
  - [ ] Update AGENTS.md with new architecture description
  - [ ] Update architecture/05-illustration-system.md with Tier 2/3 docs

---

## Success Criteria

| Metric | Before | After |
|--------|--------|-------|
| Engineer coverage | 85% | 95% |
| PM coverage | 65% | 95% |
| Consultant coverage | 40% | 90% |
| Financial/Legal coverage | 25% | 90% |
| Total illustration types | 153 fixed | 153 + 4,500+ composable |
| Bundle size increase | — | < 50KB |
| New renderer code | — | ~300 lines (composable.ts) |

---

## Current Status

**Phase 1** — ✅ Complete (composable-shapes.ts, icon-paths.ts, composable.ts, registry, debug page)
**Phase 2** — ✅ Complete (fallback chain, semantic-resolver.ts, compiler types)
**Phase 3** — ✅ Complete (MCP instructions, illustrations-reference.ts, create_session, E2E test)
**Phase 4** — ✅ Complete (200 icons, 16 categories, 20KB bundle increase, 348 tests pass)
**Phase 5** — ✅ Complete (114 keyword mappings, docs updated: CLAUDE.md, AGENTS.md, architecture/05, METADATA_SCHEMAS.md)
