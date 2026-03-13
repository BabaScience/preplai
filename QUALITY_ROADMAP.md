# Preplai Quality & Automation Roadmap

> **Last updated:** 2026-03-13
> **Status:** Phase 1 complete, Phase 1b complete, Phase 2 partial, Phase 3 complete, Phase 4 in progress

---

## Phase 1: Foundation (Week 1) ✅ COMPLETE

### 1.1 Visual Script Quality Scorer `scoreVisualScript()` ✅ DONE
- [x] Create `packages/mcp-server/src/quality-scorer.ts`
- [x] Entity density scoring (peaks at 5-7 per frame, drops for <3 or >10)
- [x] Layout overlap detection (pairwise distance check)
- [x] Spacing variance (coefficient of variation of entity distances)
- [x] Visual balance (center-of-mass deviation from canvas center 50,50)
- [x] Entity persistence ratio (Jaccard similarity across consecutive frames)
- [x] Narration presence check (every frame should have narration)
- [x] Format compliance (valid positions, entity ids/types, connection src/tgt)
- [x] Aggregate score (0-100) with per-dimension weighted breakdown
- [x] 34 unit tests in `quality-scorer.test.ts`
- [x] Wire into `add_scene` handler (async, fire-and-forget)
- [x] Prometheus histograms: `quality_score_overall`, `quality_score_dimension`, `quality_frame_count`, `quality_entity_count`

### 1b. Advanced Heuristic Scoring ✅ COMPLETE

> Three new dimensions that close the gap between "well-formed JSON" and "good presentation".
> All heuristic (no API calls), cheap to compute, high signal. 54 total tests (up from 34).

#### 1b.1 Narration Quality (content depth without LLM) ✅ DONE
- [x] **Word count scoring** — 20-60 words per frame = ideal. <10 = too thin, >100 = wall of text
- [x] **Specificity scoring** — ratio of technical/proper terms vs generic words. "PostgreSQL" > "database", "O(log n)" > "fast"
- [x] **Label specificity** — entity labels that use proper names vs generic ("Redis Cache" > "Cache", "API Gateway" > "Service")
- [x] **Narration-highlight alignment** — if a frame has `highlight: true` on entity X, the narration should mention X's label
- [x] Unit tests for narrationQuality dimension (6 tests)

#### 1b.2 Narrative Arc (storytelling structure) ✅ DONE
- [x] **Complexity growth** — entity count should generally increase across frames (establish → build → resolve)
- [x] **Highlight progression** — the highlighted entity should change across frames, not stay on the same one
- [x] **Introduction rate** — new entities per frame. >5 new entities at once = overwhelming. 0 new for 3+ frames = stagnant
- [x] **Frame count adequacy** — penalise <3 frames (too simple) and >8 frames (too long for most topics)
- [x] Unit tests for narrativeArc dimension (6 tests)

#### 1b.3 Connection Completeness (diagram quality) ✅ DONE
- [x] **Orphan entity ratio** — % of content entities not connected by any Arrow/DataFlow. High orphan % = disconnected diagram
- [x] **Connection reference integrity** — do all Arrow src/tgt IDs actually exist as entities in the same frame?
- [x] Unit tests for connectionCompleteness dimension (5 tests)

#### 1b.4 Integration ✅ DONE
- [x] Add all 3 new dimensions to `scoreVisualScript()` aggregate
- [x] Rebalance weights: 9 dimensions (narrationQuality 16%, narrativeArc 14%, connectionCompleteness 12%, entityDensity/layoutQuality/entityPersistence 12% each, narrationCoverage 10%, visualBalance/formatCompliance 6% each)
- [x] Update `QualityReport` type with new dimension fields
- [x] Prometheus metrics auto-track new dimensions via `qualityScoreDimension` label iteration — no code changes needed
- [ ] Update golden dataset baselines after scorer changes (run `pnpm run eval:golden -- --update`)
- [x] All 54 tests pass (34 existing + 20 new), full suite 769/769 green

### 1.2 Visual Regression Testing (SVG Snapshots) ✅ DONE
- [x] SVG structural snapshot testing via Vitest (no heavy Playwright dep needed)
- [x] `visual-regression.test.ts` renders all 131+ entity types with metadata defaults
- [x] Fingerprint captures: element counts by tag, text labels, defs count, structure
- [x] 137 snapshot tests — any SVG structure change shows in PR diff
- [x] Connection types verified as registered in registry
- [x] Runs in existing CI (Vitest + jsdom, no extra browser install)

---

## Phase 2: Analytics & Tracking (Week 2) — IN PROGRESS

### 2.1 Product Analytics Events (MCP Server) ✅ DONE
- [x] `session_created_total` Prometheus counter on `create_session`
- [x] `scene_added_total` Prometheus counter (labeled by mode: append/replace)
- [x] `player_url_opened_total` counter (ready for SSE hook)
- [x] `session_completion_rate` gauge (ready for periodic computation)
- [ ] Track "Full Player" link clicks (GA4 event from MCP App)
- [ ] Activation metric: time from first `create_session` to first `add_scene`
- [ ] 7-day return rate tracking
- [ ] Agent diversity tracking (user-agent / client identification)

### 2.2 Quality Score Dashboard ✅ DONE
- [x] Prometheus histogram for overall quality scores (buckets: 10-100)
- [x] Prometheus histogram per dimension (entityDensity, layoutQuality, etc.)
- [x] Frame count and entity count histograms
- [ ] Grafana dashboard template for quality trends
- [ ] Per-API-key quality breakdown (which users/agents produce best output)
- [ ] Alert when average quality drops below threshold (Prometheus alerting rules)

---

## Phase 3: Prompt Regression Testing (Week 3) ✅ COMPLETE

### 3.1 Golden Dataset ✅ DONE
- [x] Curate 30 prompts across 3 user types (10 each):
  - CS students: binary search, linked list, stack/queue, BFS/DFS, sorting, hash tables, recursion, big-O, BST insertion, memory layout
  - Programmers: microservices, OAuth, CI/CD, REST API, caching, event-driven, DB schema, Kubernetes, load balancing, monitoring
  - Agent owners: deploy pipeline, error analysis, API perf, cost optimization, security audit, data pipeline, infra topology, incident timeline, release changelog, capacity planning
- [x] Store in `tests/golden-dataset/prompts.json` with expected quality thresholds
- [x] 5 hand-crafted reference payloads in `tests/golden-dataset/references/`
- [x] Eval runner (`tests/golden-dataset/eval-runner.ts`) with CLI flags
- [x] Baseline storage in `tests/golden-dataset/baselines/` (auto-generated on `--update`)
- [x] README documenting dataset format and usage

### 3.2 Tool Description Versioning & CI ✅ DONE
- [x] Extract `ADD_SCENE_DESCRIPTION` to `packages/mcp-server/src/tool-descriptions/add-scene.v1.md`
- [x] Extract `CREATE_SESSION_DESCRIPTION` to `packages/mcp-server/src/tool-descriptions/create-session.v1.md`
- [x] `mcp-tools.ts` loads descriptions from versioned files at module load
- [x] Build script copies `tool-descriptions/` to `dist/`
- [x] CI job (`.github/workflows/eval-golden.yml`): on tool description changes, run golden dataset through LLM
- [x] Score outputs with `scoreVisualScript()`
- [x] Compare against stored baselines (5% regression threshold)
- [x] Block merge if any dimension drops >5%
- [ ] Multi-model testing (Claude, GPT-4) for compatibility (future)

---

## Phase 4: Full Agent Loop Testing (Month 2) — IN PROGRESS

### 4.1 LLM-as-Judge Module ✅ DONE
- [x] `packages/mcp-server/src/llm-judge.ts` — 3-dimension LLM evaluation
  - Content Accuracy (45% weight): Does presentation correctly explain the topic?
  - Coherence (30% weight): Does narrative flow logically across frames?
  - Entity Appropriateness (25% weight): Are the right entity types used?
- [x] Detailed rubric with 1-10 scale per dimension (inspired by PPTEval + Agent-as-Judge)
- [x] `serialiseForJudge()` — extracts id, type, label, highlight, narration per frame
- [x] `parseJudgeResponse()` — handles JSON, markdown fences, partial extraction
- [x] `combineScores(heuristic, judge)` — unified 0-100 score (heuristic 40% + judge 60%)
- [x] 11 unit tests in `llm-judge.test.ts` (all passing)

### 4.2 Eval Runner Integration ✅ DONE
- [x] `--judge` flag enables LLM-as-judge scoring during golden dataset eval
- [x] `--judge-model` flag to select judge model (default: claude-sonnet)
- [x] Judge scores shown per-prompt in eval output
- [x] Judge dimension breakdown (Content Accuracy, Coherence, Entity Appropriateness)
- [x] Combined score (heuristic + judge) in model comparison table
- [x] Category breakdown includes judge averages

### 4.3 MCP-Bench Style Evaluation
- [ ] Build test harness that sends prompts through actual MCP tool chain
- [ ] Validate tool call sequence (create_session → add_scene flow)
- [ ] AST validation of `add_scene` payloads (schema + entity reference integrity)
- [x] Score with quality scorer + LLM-as-judge for content/design/coherence
- [ ] Nightly CI job running full eval suite

### 4.4 Agent-as-Judge (Visual Evaluation)
- [ ] Render visual scripts to PNG via Playwright
- [ ] Use LLM vision model to score rendered output
- [ ] Compare visual quality across model versions
- [ ] Track visual quality regression over time

### 4.5 PPTEval-Inspired 3-Dimension Scoring ✅ DONE (via LLM Judge + Heuristics)
- [x] Content dimension: LLM judge contentAccuracy + heuristic narrationQuality
- [x] Design dimension: heuristic entityDensity, layoutQuality, visualBalance, connectionCompleteness
- [x] Coherence dimension: LLM judge coherence + heuristic narrativeArc, entityPersistence
- [x] LLM judge rubrics for each dimension

---

## Phase 5: Growth Flywheel (Month 2-3)

### 5.1 Activation Funnel Optimization
- [ ] Define activation event: "first complete presentation viewed"
- [ ] Track time-to-activation per user
- [ ] Identify drop-off points in funnel
- [ ] A/B test onboarding improvements

### 5.2 Viral Loop Instrumentation
- [ ] Track share rate (player_url opens by non-creator)
- [ ] Track viewer-to-creator conversion
- [ ] Calculate viral coefficient (k-factor)
- [ ] "Made with Preplai" attribution in shared presentations

### 5.3 Feedback Loops
- [ ] Quality score improvements feed back to tool description optimization
- [ ] Most common entity types inform illustration priority
- [ ] Error patterns inform better error messages and guidance

---

## Research References

| Source | Relevance |
|--------|-----------|
| PPTEval (EMNLP 2025) | 3-dimension presentation scoring framework |
| MCP-Bench (Accenture) | MCP-specific benchmark pattern |
| GitHub MCP Server Eval (Oct 2025) | Tool selection + argument quality testing |
| Agent-as-Judge (arXiv 2508.02994) | Visual output evaluation by judge agent |
| G-Eval | LLM judge with CoT + probability-weighted scoring |
| Braintrust AutoEvals | Open-source LLM judge library |
| Supabase growth model | Single activation event drives retention |
| Figma PLG analysis | Output sharing as viral mechanism |
