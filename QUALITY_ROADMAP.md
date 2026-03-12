# Preplai Quality & Automation Roadmap

> **Last updated:** 2026-03-12
> **Status:** Phase 1 complete, Phase 2 in progress

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

## Phase 3: Prompt Regression Testing (Week 3)

### 3.1 Golden Dataset
- [ ] Curate 30-50 prompts across 3 user types:
  - CS students: "explain binary search", "show linked list operations", etc.
  - Programmers: "show microservices architecture", "explain OAuth flow", etc.
  - Agent owners: "summarize deployment pipeline", "show CI/CD workflow", etc.
- [ ] Store in `tests/golden-dataset/` with expected quality thresholds
- [ ] For each prompt, store a known-good `add_scene` payload as reference

### 3.2 Tool Description Versioning & CI
- [ ] Extract `ADD_SCENE_DESCRIPTION` to versioned file
- [ ] CI job: on tool description changes, run golden dataset through LLM
- [ ] Score outputs with `scoreVisualScript()`
- [ ] Compare against stored baselines
- [ ] Block merge if any dimension drops >5%
- [ ] Multi-model testing (Claude, GPT-4) for compatibility

---

## Phase 4: Full Agent Loop Testing (Month 2)

### 4.1 MCP-Bench Style Evaluation
- [ ] Build test harness that sends prompts through actual MCP tool chain
- [ ] Validate tool call sequence (create_session → add_scene flow)
- [ ] AST validation of `add_scene` payloads (schema + entity reference integrity)
- [ ] Score with quality scorer + LLM-as-judge for content/design/coherence
- [ ] Nightly CI job running full eval suite

### 4.2 Agent-as-Judge (Visual Evaluation)
- [ ] Render visual scripts to PNG via Playwright
- [ ] Use LLM vision model to score rendered output
- [ ] Compare visual quality across model versions
- [ ] Track visual quality regression over time

### 4.3 PPTEval-Inspired 3-Dimension Scoring
- [ ] Content dimension: entity accuracy, narration specificity, information completeness
- [ ] Design dimension: layout quality, spacing, entity density, color usage
- [ ] Coherence dimension: narrative arc, visual consistency, highlight progression
- [ ] LLM judge rubrics for each dimension

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
