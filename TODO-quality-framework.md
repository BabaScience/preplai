# Quality Framework — Cognitive Science Evaluation System

> **Source:** Claude's 6-dimension evaluation framework grounded in Tufte, Gestalt, Sweller, Paivio, and Goldratt.
> **Date Created:** 2026-03-23
> **Goal:** Transform our quality scorer from heuristic checks into a cognitive-science-backed evaluation system.
> **Status Legend:** `[ ]` Not started | `[~]` In progress | `[x]` Done

---

## Gap 1: Signal-to-Noise Ratio (Tufte's Data-Ink Ratio)

**Current:** `formatCompliance` (4%) — only checks JSON structure, not visual noise.
**Target:** Measure what proportion of entities carry semantic weight vs decorative noise.

**What counts as noise:**
- Entities with no label and no connections (floating unnamed boxes)
- Duplicate labels (same text on multiple entities)
- Generic labels that add no information ("Entity", "Node", "Item", "Box")
- Frames with >10 entities (cognitive overload)
- Entities with metadata but no visual purpose

**Tasks:**
- [x] Implement `scoreSignalToNoise()` dimension in quality-scorer.ts
- [x] Detect unlabeled, unconnected entities (pure noise)
- [x] Detect generic/uninformative labels
- [x] Penalize frames with >10 entities (information overload)
- [x] Add to weighted score calculation

---

## Gap 2: Visual Hierarchy (Gestalt Principles)

**Current:** `narrativeArc` checks highlight usage but not whether the highlighted entity is visually prominent.
**Target:** Verify the most important entity per frame (highlighted or narrated) is the most visually prominent.

**What to check:**
- Does the highlighted entity have `emphasis: 'high'` or `'critical'`?
- Is the highlighted entity centrally positioned (near [50,50])?
- Does the frame have exactly 1 highlight? (0 = no focus, 2+ = competing focuses)
- Are entities with `emphasis: 'low'` actually peripheral (near edges)?

**Tasks:**
- [x] Implement `scoreVisualHierarchy()` dimension in quality-scorer.ts
- [x] Check highlight + emphasis alignment
- [x] Check spatial prominence (highlighted entity near center)
- [x] Penalize frames with 0 or 2+ highlights
- [x] Add to weighted score calculation

---

## Gap 3: Modality Alignment (Paivio's Dual Coding)

**Current:** `narrationQuality` checks specific terms but not whether narration adds value beyond labels.
**Target:** Verify narration provides context/explanation, not just reads entity labels aloud.

**What to check:**
- Does narration contain words NOT present in any entity label? (good = adds context)
- Is narration just a list of label names? (bad = redundancy violation)
- Does narration length match frame complexity? (short narration on complex frame = under-explained)
- Does narration reference the highlighted entity? (alignment with visual focus)

**Tasks:**
- [x] Implement `scoreModalityAlignment()` dimension in quality-scorer.ts
- [x] Calculate label overlap ratio (% of narration words that are just label text)
- [x] Penalize high overlap (>70% = just reading labels)
- [x] Reward narration that adds context beyond what's visible
- [x] Add to weighted score calculation

---

## Gap 4: Cross-Frame Systematization (Consistency)

**Current:** `colorBudget` checks per-frame category count. No cross-frame consistency checks.
**Target:** Verify that the same entity type uses the same visual treatment across all frames.

**What to check:**
- Same entity type → same color category across frames
- Same entity ID → consistent type (or intentional morph with type change)
- Heading style consistent (all frames use H1, or none do)
- Connection types consistent (don't mix Arrow and DataFlow randomly)

**Tasks:**
- [x] Implement `scoreSystematization()` dimension in quality-scorer.ts
- [x] Check entity type → color consistency across frames
- [x] Check heading usage consistency
- [x] Check connection type consistency
- [x] Add to weighted score calculation

---

## Gap 5: Multiplicative Scoring (Goldratt's Bottleneck Theory)

**Current:** Weighted average — all dimensions add up linearly.
**Target:** Multiplicative scoring where the weakest dimension constrains the overall score.

**Formula:**
```
bottleneck = min(all dimension scores)
average = weighted average (current approach)
overall = average * (bottleneck / 100)^0.3
```

This means:
- If bottleneck = 100: overall = average (no penalty)
- If bottleneck = 50: overall = average × 0.81 (moderate penalty)
- If bottleneck = 20: overall = average × 0.60 (severe penalty)
- The exponent 0.3 prevents overly harsh penalties while still surfacing the bottleneck

**Tasks:**
- [x] Modify `scoreVisualScript()` to use multiplicative bottleneck formula
- [x] Include `bottleneckDimension` name in QualityReport
- [x] Include `bottleneckScore` in QualityReport
- [x] Update quality log format to show bottleneck
- [x] Update tests for new scoring formula

---

## Gap 6: Show Quality Score to Users (Visibility)

**Current:** Quality score only logs server-side. Users never see it.
**Target:** Surface the quality score and improvement hints in the MCP tool response.

**Tasks:**
- [x] Include quality score in `add_scene` response data
- [x] Include top 2 improvement hints (weakest dimensions)
- [x] Include bottleneck dimension name and score
- [x] Format as actionable QUALITY HINTS (already partially done)

---

## Implementation Order

1. **Signal-to-Noise** — most impactful, catches common agent mistakes
2. **Visual Hierarchy** — enforces proper focus/emphasis usage
3. **Modality Alignment** — prevents narration-label redundancy
4. **Systematization** — cross-frame consistency
5. **Multiplicative Scoring** — bottleneck-aware aggregate
6. **User Visibility** — surface scores in responses

---

## Weight Redistribution (after all dimensions added)

| Dimension | Current | New | Notes |
|-----------|---------|-----|-------|
| entityDensity | 11% | 7% | Partially covered by signalToNoise |
| layoutQuality | 11% | 8% | Keep |
| visualBalance | 9% | 6% | Partially covered by visualHierarchy |
| entityPersistence | 11% | 8% | Keep |
| narrationCoverage | 9% | 5% | Partially covered by modalityAlignment |
| formatCompliance | 4% | 3% | Keep (low weight) |
| narrationQuality | 13% | 8% | Partially covered by modalityAlignment |
| narrativeArc | 13% | 8% | Keep |
| connectionCompleteness | 11% | 7% | Keep |
| colorBudget | 8% | 6% | Keep |
| **signalToNoise** | — | **10%** | NEW |
| **visualHierarchy** | — | **10%** | NEW |
| **modalityAlignment** | — | **8%** | NEW |
| **systematization** | — | **6%** | NEW |
| Total | 100% | 100% | |
