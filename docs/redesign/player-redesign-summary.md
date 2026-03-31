# Player UI/UX Redesign — Executive Summary
**For:** Bamba (Founder) via CEO Agent Review
**From:** Designer Agent
**Date:** March 2026
**Full Proposal:** [player-redesign-proposal.md](./player-redesign-proposal.md)

---

## What This Is

A comprehensive audit and redesign proposal for the Preplai Player — the primary surface users see, interact with, and share. The player is how the world judges Preplai's quality.

The player URL audited: `https://player.preplai.com/player/07fa7ebe-c7aa-4d8f-8d67-3dc47cfb1428?style=light&palette=sunset`

---

## The Bottom Line

The player's **architecture is excellent** (persistence, depth-of-field, audio sync, 154 entity types). But the **visual output undersells it**. Five specific issues are making the product look less premium than it is:

1. **Entity colors are too dim** — fills at 8-12% opacity make everything look like a faded sketch
2. **Labels break entity shapes** — text overlaps inside and outside simultaneously (double-render bug)
3. **Frame navigation hides itself** — users get confused, think the player is frozen
4. **Scene titles look like PowerPoint** — box-style title cards reduce perceived quality
5. **Background feels empty** — dot grid and particles are below perceptual threshold (invisible)

---

## What We're Proposing

### 3 Phases of Work

**Phase 1 — Critical Fixes** (~3 days)
Fix the 7 most visible bugs: label collision, narrator clipping, entity color saturation, frame nav behavior, reduced-motion support.

**Phase 2 — Visual Redesign** (~5 days)
The "wow" upgrades: cinematic title cards, arrow glow, deeper atmosphere, arrow label pills, shape upgrades for Database/Cloud/Queue.

**Phase 3 — Delight Layer** (~4 days)
Scene transition choreography, end screen ("That's a wrap."), keyboard shortcuts overlay, loading state enhancement.

---

## Key Design Decisions That Need Founder Sign-Off

### 1. Scene Title Style
- **Current:** Gray rounded rectangle box (like PowerPoint)
- **Proposed:** Text-only with subtle gold glow, no box
- **Why it matters:** This is the first thing users see on every frame. It sets the tone.
- **Risk:** Low — changes H1 component rendering only

### 2. Entity Fill Opacity
- **Current:** 8-12% fill (entities look like ghost outlines)
- **Proposed:** 22-28% fill (visible, structured, not distracting)
- **Why it matters:** Determines whether the player reads as "premium data viz" or "barely visible shapes"
- **Risk:** Low — CSS/token value change

### 3. Frame Navigation Behavior
- **Current:** Auto-hides to 0% opacity after ~3 seconds
- **Proposed:** Always visible at minimum 0.4 opacity
- **Why it matters:** Most critical UX issue — new users don't know how to advance frames
- **Risk:** Low — CSS change

### 4. Connection Arrow Glow
- **Current:** No glow on connection lines
- **Proposed:** Parallel blurred path behind each arrow for depth
- **Why it matters:** Complex architecture diagrams become readable instead of overwhelming
- **Risk:** Low — additive rendering, no API changes

---

## Trust & Safety Signals

The redesign directly addresses Preplai's positioning for **professional audiences** (engineers, PMs, consultants, financial advisors). These users need to trust what they see:

| Signal | Current State | After Redesign |
|--------|--------------|----------------|
| Visual precision | Overlapping labels reduce trust | Single-label rule, clean hierarchy |
| Information density | Washed-out colors lose hierarchy | Saturated fills establish structure |
| Playback control | Hidden nav creates uncertainty | Persistent controls communicate reliability |
| First impression | PowerPoint-style title boxes | Cinematic gold-glow headlines |
| Completeness feel | Auto-hide nav feels "half-done" | Confident, always-present chrome |

---

## Files Changed (Summary)

| Package | Files | Phase |
|---------|-------|-------|
| `@preplai/player` | `mcp-app-styles.css` | P1 |
| `@preplai/mcp-server` | `player-html.ts` | P1 |
| `@preplai/illustrations` | `design-tokens.ts`, `color-cascade.ts` | P1 |
| `@preplai/player` | `player-bootstrap.ts` | P2 |
| `@preplai/illustrations` | `h1.ts`, `database.ts`, `arrow.ts`, `dataflow.ts`, `cloud.ts`, `queue.ts` | P2 |
| `@preplai/player` | `scene-controller.ts` | P3 |

**No API changes. No schema changes. No breaking changes.**

---

## What We're NOT Changing

- Audio engine (ElevenLabs integration is excellent)
- Focus/depth-of-field system (progressive reveal is best-in-class)
- 154 entity type system (comprehensive, well-organized)
- The composable entity system (Tier 2/3 are very strong)
- Session management and SSE streaming
- The 404 page (already excellent)

---

## Requested Action from Founder

1. **Review this summary** and the full proposal at `docs/redesign/player-redesign-proposal.md`
2. **Approve or adjust** the 4 key design decisions above
3. **Indicate priority** — which phase to start with, or any specific fixes to prioritize
4. **Sign off** to begin Phase 1 implementation

The team is ready to start immediately upon approval. Phase 1 alone (the critical fixes) will make a visible, significant improvement to every player view.

---

*Designer Agent | PREA-2 | March 2026*
