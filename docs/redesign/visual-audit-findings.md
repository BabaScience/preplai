# Player Visual Audit — Live Screenshot Findings
**Date:** March 2026
**URL Audited:** `https://player.preplai.com/player/07fa7ebe-c7aa-4d8f-8d67-3dc47cfb1428`
**Themes Tested:** `?style=light&palette=sunset` and `?style=cinema&palette=sunset`
**GIF recording:** `player-visual-audit.gif` (downloaded to browser)

> This document supplements the code-based audit in `player-redesign-proposal.md`
> with concrete visual observations from the live running player.

---

## What Was Observed (Frame by Frame)

### Frame 1 — "100 Users" Goal (Cinema Theme)

**What I see:**
- Title "Beta Sprint: 7-Day Execution Calendar" in LARGE BOLD ORANGE text — takes ~15% of vertical height
- A diamond-shaped entity ("100 Users") with a bull's-eye target icon inside, orange stroke, nearly invisible fill
- A dashed orange vertical arrow pointing DOWN from the entity
- Below that: a row of 7 small diamond/day entities at the bottom with labels "Day 2–Day 7" and "Mar 30 → Apr 5"
- Teal badge "By Apr 5" on the entity
- Ambient particles visible as tiny dots in the background
- Keyboard hint "← → navigate · Space play/pause · N narrator" in gray text at the bottom

**Issues visible:**
- ❌ **Entity fill too faint** — "100 Users" entity is barely distinguishable from background; mostly just a stroke outline
- ❌ **Vertical space imbalance** — title takes ~15% of viewport, entity takes maybe 20%, rest is empty dark space
- ❌ **Calendar timeline entities tiny** — the Day 2–7 diamonds at the bottom are very small and hard to read
- ❌ **Keyboard hint overlaps with content** — the gray text sits right where entities transition
- ✅ **Title style is clean** — text-only, no box, orange color works great
- ✅ **Badge readable** — teal "By Apr 5" pill is clear
- ✅ **Ambient particles visible** — tiny dots scattered, adds life

---

### Frame 1 — "100 Users" Goal (Light Theme)

**What I see:**
- Same layout but on warm beige `#faf7f2` background
- Title in DARK bold text (not orange)
- "100 Users" diamond entity: EVEN FAINTER fills — almost pure white outline on beige
- Connection arrow: a light GRAY dashed vertical line — barely visible against the beige
- Calendar diamonds at bottom: very faint outlines, almost invisible

**Issues visible:**
- ❌ **Entities are almost invisible** — light theme reduces entity visibility to near zero; shapes are ghost outlines on near-white background
- ❌ **Connection arrows invisible** — gray dashes on beige = 0 contrast
- ❌ **Calendar timeline unreadable** — the Day entities at the bottom are white outlines on white
- ✅ **Title still works** — dark bold text on beige, clean

---

### Frame 2 — "Day 2" Focus (Cinema Theme)

**What I see:**
- Day 2 entity HIGHLIGHTED at left: larger pentagon with play-arrow icon, bright orange border, teal badge "Mar 30", glow circle around it
- Days 3–7 visible to the right: progressively dimmer with each successive day (DoF effect)
- FLOATING TEXT at bottom-left: "Video 1 + Reddit r/MCP + Discord" — orange text with no visual container

**Issues visible:**
- ❌ **Floating disconnected text** — The task content ("Video 1 + Reddit r/MCP + Discord") floats in the lower-left with NO visual connection to the Day 2 entity above it. No arrow, no line, no container. Looks like broken/orphaned text.
- ❌ **The Day 2 entity and its text are spatially disconnected** — they're in the same column but nothing links them visually
- ✅ **DoF dimming works** — Days 3-7 progressively fade, clear temporal narrative
- ✅ **Active entity is clearly distinguishable** — orange border + glow circle is the right call
- ✅ **Teal badges are readable** — good contrast

---

### Frame 2 — "Day 3" Focus (Cinema Theme — second visit)

**What I see:**
- Same layout, but Day 3 is now the active entity (pencil/edit icon)
- Floating text now reads: "Video 1 + Reddit r/MCP + Medium Article 1 + LinkedIn + Twitter 5-tweet thread"
- Day 2 is now dimmed to the left
- Days 4-7 are dimmed to the right

**Issues visible:**
- ❌ **Text label still floating** — same disconnection issue as Day 2 frame
- ❌ **Text is multi-line but has no container** — the step list reads like an unstyled text dump

---

### Frame 3 — "Day 4 / Show HN" (Cinema Theme)

**What I see:**
- Day 4 pentagon CENTER — brush/paint icon, orange border, teal badge "Apr 1", label "Day 4"
- VERTICAL ORANGE ARROW pointing DOWN from Day 4
- "Show HN" circle below — with a brush icon, teal badge "+25 target", dashed glow circle
- Days 2-3 dimmed to left, Days 5-7 dimmed to right

**Assessment:**
- ✅ **Best-looking frame** — the vertical hierarchy (day → sub-goal) is clear and visual
- ✅ **Arrow is visible** — orange color makes it readable on dark background
- ✅ **Show HN label is below entity** — clean placement
- ✅ **Progressive reveal from prev frames** — Days 2-3 are still visible but dimmed correctly
- ⚠️ **Entity fills still faint** — Show HN circle is mostly stroke-only

---

### Frame 5 — "Product Hunt Launch" (Cinema Theme)

**What I see:**
- Days 5, 6, 7 are now at full brightness (right side)
- Days 2, 3, 4 are dimmed to the left
- Day 7 has a trophy icon (diamond shape), teal badge "Apr 4"
- "Product Hunt" entity at bottom right — shield shape with brush icon, dashed glow circle, teal badge "Apr 4 Launch"
- Diagonal orange arrow from Day 7 to Product Hunt — the angle is good
- **CENTER-LEFT: A floating vertical orange line with NO ENTITY AT EITHER END**

**Issues visible:**
- ❌ **BUG: Dangling arrow** — there is a vertical orange line segment floating in the center-left area, seemingly disconnected from any entity. This appears to be a ghost/remnant of the Day 4 → Show HN connection from Frame 3-4. The Show HN entity was removed from Frame 5 but its connection arrow is still rendering. This is a **persistence bug** in the connection cleanup logic.
- ✅ **Diagonal arrow to Product Hunt looks cinematic** — angle and color work well
- ✅ **Trophy icon on Day 7 is fitting** — clear semantic meaning for launch day
- ✅ **Progressive reveal complete** — all 7 days visible, temporal narrative complete

---

## Overall Visual Impressions

### Cinema Theme (dark)

| Aspect | Grade | Note |
|--------|-------|------|
| Title typography | A | Large, bold, palette-colored. No box. Excellent. |
| Entity visibility | C | Fills too dim; shapes are mostly stroke-only |
| Connection arrows | B | Orange on dark = visible. Good in cinema. |
| DoF / progressive reveal | A- | Works beautifully as temporal storytelling |
| Background atmosphere | B+ | Particles visible, dark vignette is cinematic |
| Frame navigation (hover) | B | Clean design when visible, but hidden by default |
| Teal badges | A | Consistent, readable, adds metadata layer |
| End screen | B+ | Clean logo + text + stats. Could be warmer. |
| Floating text bug (frame 2) | F | Task content disconnected from parent entity |
| Dangling arrow bug (frame 5) | F | Connection renders with no target entity |

### Light Theme (beige)

| Aspect | Grade | Note |
|--------|-------|------|
| Title typography | A- | Dark text on beige works |
| Entity visibility | D | Near-invisible on light background |
| Connection arrows | D | Gray dashes on near-white = invisible |
| DoF / progressive reveal | B | The concept is there but dimming too extreme |
| Background atmosphere | C | Background too plain; particles invisible |
| Overall readability | C- | Entities and connections disappear |

---

## New Bugs Found (Not in Code Audit)

### Bug 1: Floating Text (Frame 2 — confirmed visually)
- **What:** Task step content renders as unstyled floating text, not connected to parent entity
- **Where:** All daily frames (Day 2, Day 3 confirmed)
- **Visual impact:** Makes frames look broken/incomplete
- **Root cause hypothesis:** The step list content is likely a `Label` or `StepList` entity positioned in the canvas WITHOUT a connecting `Arrow` entity between it and the parent entity. The agent that generated this script didn't add an arrow connection.
- **Fix:** Either: (a) Agent adds Arrow connecting Day entity to StepList entity, OR (b) StepList renders with a subtle container box

### Bug 2: Dangling Connection Arrow (Frame 5 — confirmed visually)
- **What:** An orphaned arrow segment renders in the scene with no source or target entity
- **Where:** Frame 5, center-left area
- **Visual impact:** Looks like a broken layout artifact — confusing and unprofessional
- **Root cause hypothesis:** The Show HN entity exists in frames 3-4 but is REMOVED in frame 5. The SceneController's connection-cleanup may not correctly remove connections whose target entity is being exit-animated or has been removed from the current frame's entity list.
- **Fix:** In `scene-controller.ts`, when an entity exits, also check and remove any connections that reference it as `sourceEntityId` or `targetEntityId`

---

## Highest Priority Visual Fixes (Updated After Live Audit)

Based on what I actually SAW, ranked by visual impact:

1. **🔴 P0: Dangling arrow bug** — Frame 5 looks broken. Fix connection cleanup in `scene-controller.ts`
2. **🔴 P0: Floating text / disconnected step labels** — Frame 2-3 looks broken. Step content needs visual container or arrow connection
3. **🔴 P0: Entity fills — light theme** — Entities are nearly invisible on light theme. Needs fill opacity increase.
4. **🔴 P1: Entity fills — cinema theme** — Same issue, slightly better due to dark background but still too faint
5. **🟡 P2: Vertical space usage** — Title dominates; entities need more canvas area or title needs to be smaller
6. **🟡 P2: Frame nav discoverability** — Only visible on hover; first-time users won't know to advance
7. **🟢 P3: Light theme arrows** — Gray on beige is invisible. Need higher contrast.

---

## What Works Well (Confirmed Live)

1. **Cinema theme atmosphere** — The dark background + ambient particles + vignette is genuinely cinematic
2. **Title design** — Text-only, large, palette-colored. Already implements the "no box" design from the spec.
3. **Teal badges** — Consistent, clear, add a layer of metadata without cluttering
4. **Temporal DoF** — Past days dimming, current day highlighted, future days dim. The storytelling concept is excellent.
5. **Trophy icon for launch day** — Semantic iconography works
6. **End screen** — Logo + "Presentation complete" + stats is clean and understated
7. **Frame nav bar design** — When visible (on hover), the frosted glass bar with dots and controls looks premium

---

*Audited visually on 2026-03-31 after navigating all 5 frames in both cinema and light themes*
*Screenshots captured programmatically; GIF exported as `player-visual-audit.gif`*
