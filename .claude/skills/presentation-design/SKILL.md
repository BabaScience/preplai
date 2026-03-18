---
name: presentation-design
description: The Principles of Good Design — a comprehensive design philosophy for visual communication. Use when evaluating design quality, making layout decisions, choosing typography, applying color theory, creating visual hierarchy, reducing cognitive friction, or when the user asks about what makes good design. Applies to all visual work including illustrations, UI, presentations, and data visualization.
---

# The Principles of Good Design

Good design is the radical elimination of friction between intent and comprehension.

---

## Product Context

**Tagline:** "Don't read it. Watch it."

**Positioning:** The Visual Layer for AI

PreplAI turns any AI chatbot answer into an animated, narrated visual presentation. Works with Claude, ChatGPT, Cursor, and any MCP-compatible AI agent. 85+ illustration components. Free to start.

**Target Users:**

- **Engineers** — Understand what AI built by watching architecture and logic unfold step by step
- **PMs** — Communicate complex product decisions, roadmaps, and system designs visually
- **Consultants** — Transform analyses and recommendations into cinematic client-ready presentations
- **Finance/Legal professionals** — Present data, workflows, and compliance structures with clarity and precision

Every design decision should make these presentations more cinematic, clear, and immersive for these professionals.

---

## The Core Axiom

**Good design is the radical elimination of friction between intent and comprehension.**

Every word in this axiom is load-bearing.

### Intent

Intent is the designer's communicative purpose — not what was made, but what was meant to be transmitted. Intent is always a verb: guide, reassure, warn, delight, orient. If you cannot state your intent as a verb, you do not yet have a design — you have decoration.

### Comprehension

Comprehension fires in two stages:

1. **Pre-attentive processing** — within 150ms, before conscious reading begins. The brain detects color, shape, size, and position automatically.
2. **Semantic decoding** — the conscious stage where labels are read, hierarchy is parsed, meaning is extracted.

Good design wins at the pre-attentive stage. If the design requires conscious effort just to orient, the semantic layer is already fighting uphill.

### Friction

Friction is any cognitive cost imposed between stimulus and meaning — hesitation, confusion, reorientation, rereading. It manifests as:

- The half-second pause before clicking
- Rereading a label twice
- Scrolling back to find context

The most insidious friction is the kind users normalize — they never complain, but trust the product less with every occurrence.

### Radical

Radical is the most consequential word. It is a stance against compromise. "Good enough" design accepts residual friction as a reasonable cost of shipping. Radical elimination treats every unit of friction as a failure to be diagnosed and resolved.

The designer who asks "is this clear enough?" has already conceded the axiom. The correct question is: **"what is still unclear, and why?"**

### The Full Architecture

```
Intent  ──→  [Friction]  ──→  Comprehension
```

Every design decision is either a noise reduction or a noise introduction. Typography, hierarchy, color, whitespace, affordance — these are not aesthetic choices. They are transmission engineering. The goal is a lossless channel from designer mind to observer mind.

When friction reaches zero, design disappears. The observer doesn't experience an interface — they experience meaning arriving directly. That disappearance is the highest form of craft in the discipline.

---

## Pillar I — Perceptual Clarity

*How the eye reads.*

Perceptual clarity governs the first 150 milliseconds of every visual experience. It rests on three mechanisms: Visual Hierarchy, Contrast, and Gestalt.

### Visual Hierarchy

Visual hierarchy is a prioritized sequence of attention deliberately encoded into a layout — directing gaze from most critical to least critical information in a deterministic order.

The brain is pulled first to the element with the greatest mass (size and font weight), then to color and positional contrast. A designer who does not explicitly construct this sequence will have it imposed randomly by the viewer's perceptual system. Random hierarchy is the same as no hierarchy at all.

**Key principle:** The starting point of a layout must be unmistakable. If a viewer must scan the frame to find where to begin, the hierarchy has failed.

### Contrast

Contrast is the mechanism by which the eye distinguishes signal from noise. Any element that differs sufficiently from its surroundings in size, color, weight, or shape will trigger pre-attentive pop-out — it is seen before it is read.

Low-contrast layouts are not merely ugly — they are cognitively exhausting. Every unit of contrast is a unit of clarity donated to the observer.

### Pre-Attentive Processing

The visual cortex simultaneously scans the entire visual field across four parallel channels:

| Channel | What it detects |
|---------|----------------|
| **Color** | Hue and luminance differences |
| **Form** | Shape, size, curvature, orientation |
| **Spatial position** | Location and grouping |
| **Motion** | Change over time |

A bright red element among gray ones is detected instantly — not because it is read, but because it activates the color channel involuntarily. Good design speaks to these channels directly, before the user has decided to pay attention.

### Gestalt Principles

Gestalt psychology describes the heuristics the brain uses to assemble visual stimuli into coherent wholes. These are not guidelines — they are involuntary perceptual operations that fire whether or not the designer accounts for them.

**Proximity** — Elements close together are perceived as a group. Misplaced spacing destroys semantic grouping before any label is read. A form field placed 40px from its label instead of 6px reads as unrelated.

**Similarity** — Elements sharing color, shape, or size are perceived as the same category — enabling legend-free visual taxonomies.

**Closure** — The brain completes incomplete shapes — enabling minimalist UI patterns like icon outlines and partial borders.

**Continuity** — The eye follows the smoothest path — arrows, lines, and alignments guide gaze across the canvas without interruption.

**Figure / Ground** — The brain separates foreground from background instantly. Every modal overlay, card elevation, and shadow in interface design exploits this channel directly.

---

## Pillar II — Compositional Structure

*How elements relate in space.*

Compositional structure governs how elements are organized spatially. It rests on four principles: the Grid, White Space, Proximity, and Balance.

### The Grid

The grid is the invisible skeleton beneath every great layout — a system of columns, rows, and gutters that transforms arbitrary placement into principled spatial order.

The grid is the most misunderstood tool in design. Beginners perceive it as a cage. Experts perceive it as a grammar — the scaffolding that makes deliberate deviation meaningful. A grid break on a gridless canvas is invisible. A grid break on a disciplined canvas is an emphatic statement.

**Grid Anatomy:**

| Component | Function |
|-----------|----------|
| **Columns** | Vertical divisions that anchor content and create horizontal rhythm |
| **Gutters** | Fixed whitespace between columns — prevents visual collision |
| **Baseline** | Horizontal alignment of text baselines — creates vertical cadence |

### White Space

White space is not the absence of design. It is an active compositional element that isolates, elevates, and dignifies the elements it surrounds.

The instinct is to fill every pixel. But:

- Overcrowded layout communicates **anxiety**
- Generous layout communicates **confidence**

This is why luxury brands and premium software interfaces share one visual language: restraint.

**Two Scales of White Space:**

- **Micro white space** — letter-spacing, line-height, padding inside components. Controls readability and density.
- **Macro white space** — margins, section gaps, layout breathing room. Controls rhythm and pacing across the full page.

Neither should be the accidental residue of content placement. Both must be explicitly designed.

### Proximity

Physical distance between elements encodes semantic relationship — without a single label.

Elements in proximity are assumed related. Elements far apart are assumed independent. This fires at the pre-attentive level — the user feels confused by wrong spacing before they can articulate why.

**Proximity is perhaps the most underestimated principle in the entire discipline.**

### Balance

Balance is the distribution of visual weight across the canvas. It comes in three forms, each communicating a different emotional register:

| Type | Structure | Communicates |
|------|-----------|-------------|
| **Symmetrical** | Equal mass on both sides | Stability, formality, authority |
| **Asymmetrical** | Unequal weights in tension | Dynamism, modernity, movement |
| **Radial** | Radiating from a center | Focus, unity, convergence |

Each is a mood, not just a geometry.

---

## Pillar III — Communication

*How meaning is encoded into visual form.*

Communication is the moment information actually transfers. It operates through three instruments: Typography, Color Theory, and Iconography.

### Typography

Typography is simultaneously architecture and voice.

- **As architecture:** it creates a reading order through size, weight, and color hierarchy
- **As voice:** it communicates personality and brand register before a single word is semantically processed

A typeface choice is the brand's first spoken word — delivered in the 150ms before conscious reading begins.

| Typeface family | Communicates |
|----------------|-------------|
| **Serif** | Authority, tradition, trust |
| **Geometric sans** | Modernity, precision, clarity |
| **Humanist sans** | Warmth, accessibility, humanity |

**Three Typographic Dimensions:**

1. **Typeface selection** — encodes personality and brand register.
2. **Type hierarchy** — governed by size, weight, and color, creates a deterministic reading order. The eye should never have to search for where to go next.
3. **Spacing system** — line-height, letter-spacing, and line length (measure) determine reading comfort at the microscopic level. Each is a separate variable that must be deliberately set.

### Color Theory

Color communicates simultaneously on two independent axes:

**The Emotional Axis** — governs temperature and saturation.

- Warm hues (red, amber, coral) → energy, urgency, heat
- Cool hues (blue, teal) → calm, trust, precision
- High saturation → commanding, demanding attention
- Low saturation → receding, supporting

**The Semantic Axis** — encodes culturally-agreed meaning.

| Color | Semantic meaning |
|-------|-----------------|
| **Red** | Danger, error, critical |
| **Green** | Success, confirmation, safe |
| **Yellow / Amber** | Warning, caution, attention |
| **Blue** | Information, neutral, default |

A design that ignores the semantic axis will confuse users at the instinctive level — before they can consciously identify why.

**The Four Color Properties:**

| Property | Controls |
|----------|---------|
| **Hue** | Identity and semantic associations |
| **Saturation** | Visual weight without changing hue |
| **Value** | Figure-ground separation, tonal range |
| **Contrast ratio** | Legibility — WCAG minimum 4.5:1 for text |

Accessibility is not a constraint imposed on top of design — it is a design constraint from the beginning.

### Iconography

Iconography compresses complex meaning into a single glyph — bypassing linguistic processing entirely and delivering meaning at the speed of perception, not reading.

But iconography carries a crucial caveat: universality cannot be assumed. Icons are a shared language — and like all languages, they require a common cultural vocabulary to function.

**Three Conditions for Good Iconography:**

1. **Recognition** — the glyph must be immediately identifiable without a label. An icon that requires a tooltip to be understood has failed as an icon.
2. **Universality** — the meaning must be genuinely shared across the target audience, not assumed from one cultural perspective.
3. **Consistency** — the same icon must carry the same meaning on every surface it appears. Inconsistency breaks the visual vocabulary.

---

## Pillar IV — Emotional Resonance

*How design feels.*

While the first three pillars govern how a design communicates, emotional resonance governs how it feels. It rests on three principles: Consistency, Affordance, and Delight.

### Consistency

Consistency is not a creative principle — it is a cognitive one.

Every repeated visual rule becomes an implicit promise to the observer. Those micro-confirmations compound into trust. Every violation — a button that looks different on one screen, a spacing rhythm that breaks without reason — imposes a cognitive tax.

Individually invisible. Accumulated across an entire interface, they constitute the felt difference between a product that feels polished and one that feels off.

**Three Levels of Consistency:**

1. **Visual consistency** — same colors, type scales, spacing, and shape language across every surface. This is what design systems were invented to enforce.
2. **Functional consistency** — same interactions produce same results. The user builds a reliable mental model.
3. **Internal consistency** — the product keeps faith with its own rules, even when those rules deviate from conventions. A product can break convention and still feel consistent — provided it breaks that convention the same way, everywhere.

### Affordance

Affordance — coined by J.J. Gibson in 1979, introduced to design by Don Norman — describes the interaction possibilities that an object communicates through its form alone, before any label is read.

A door handle affords pulling. A flat plate affords pushing. A beveled button affords pressing. When affordances are correctly designed, the user knows what to do instinctively.

**Three Affordance States:**

| State | Description | Consequence |
|-------|------------|-------------|
| **Perceived affordance** | Form correctly signals its function | User acts without hesitation |
| **False affordance** | Form suggests an interaction that doesn't exist | User clicks something inert, loses trust |
| **Hidden affordance** | Real interaction exists but nothing reveals it | User never discovers the feature |

All three failure modes generate the same response: user confusion and eroded trust in the product's predictability.

### Delight

Delight is the rarest and most differentiating dimension of emotional resonance.

It emerges from the gap between expectation and experience — the micro-animation that feels more alive than expected, the transition that has physical weight, the empty state that makes you smile. Delight is not decoration and not frivolity. It is the visible evidence that a human being cared enough to go one deliberate step beyond functional.

**Three Vectors of Delight:**

1. **Micro-animation** — gives interactions physical weight. A button that springs back, a card that lifts on hover, a loading state that breathes. Motion as emotional signal.
2. **Voice and tone** — treats the user as an intelligent adult. Error messages that don't humiliate. Empty states that celebrate. Copy that has personality. Language as empathy.
3. **Empty states** — the most neglected surface in any interface — where delight has the highest impact, because they appear precisely when the user is most uncertain and most in need of reassurance.

---

## The Four Pillars United

The four pillars are not independent modules. They are interdependent forces that amplify each other when aligned and catastrophically undermine each other when in conflict.

### Mutual Dependencies

```
Perceptual Clarity     ↕ spatial order
Compositional Structure     ↕ layout encodes
Communication     ↕ meaning produces
Emotional Resonance     ↕ trust feeds back into clarity
```

Each pillar feeds every other. A user who trusts a product perceives it more clearly. Clear perception reinforces the compositional order. Compositional order amplifies the communicative signal. The system is closed and recursive.

### The Design Sequence

The four pillars map directly onto the observer's cognitive sequence:

| Stage | Pillar | What happens |
|-------|--------|-------------|
| **Perceive** | Perceptual Clarity | Eye catches signal in first 150ms |
| **Orient** | Compositional Structure | Brain locates itself in the layout |
| **Decode** | Communication | Meaning is extracted from visual signals |
| **Feel** | Emotional Resonance | Affective residue persists after the task |

Design all four stages, or design none.

### Pillar Alignment

When all four pillars are aligned, a compound effect emerges that cannot be achieved by optimizing any single pillar in isolation.

A button that is visually prominent (Perceptual Clarity), spatially anchored in a grid (Compositional Structure), typographically clear (Communication), and animated with physical weight (Emotional Resonance) is not four times better than a plain button — it is exponentially better.

**Craft is knowing the pillars. Mastery is making them work as one.**

### Pillar Conflict

Pillar conflict is the most common failure mode in sophisticated design. It occurs when one pillar's optimization damages another:

- A call-to-action with maximum contrast placed at the wrong point in the compositional flow — hierarchy fights the spatial narrative
- A loading animation so delightful it draws the eye away from content — delight becomes distraction
- An information-dense layout with perfect hierarchy but no white space — communication overwhelms emotional resonance

Every design decision operates inside all four pillars simultaneously. Which means every decision can create conflict as easily as alignment.

### Design Systems as Pillar Enforcement

A design system is the institutional mechanism for codifying all four pillars into reusable decisions — ensuring that alignment is structural, not accidental.

- **Design tokens** — codify perceptual and compositional decisions: spacing scales, type hierarchies, color ramps
- **Component libraries** — encode communicative and emotional decisions: button states, animation curves, tone guidelines

Without a design system, pillar alignment depends entirely on the memory and discipline of individual contributors. With one, alignment becomes architectural.

### The Invisible Ideal

When all four pillars converge at their highest expression:

- Perceptual clarity ensures the eye travels without resistance
- Compositional structure ensures the layout reasons without effort
- Communication ensures meaning arrives without ambiguity
- Emotional resonance ensures the experience leaves residue without performance

**The design disappears.**

The observer doesn't experience an interface — they experience only the outcome they came for. That disappearance is the asymptotic target of the entire discipline.

---

## Summary

| Pillar | Domain | Core Question |
|--------|--------|--------------|
| **Perceptual Clarity** | How the eye reads | Where does the gaze go first, and why? |
| **Compositional Structure** | How elements relate | Does the space itself communicate relationships? |
| **Communication** | How meaning is encoded | What does each element say before it is read? |
| **Emotional Resonance** | How design feels | Does the product feel safe, intuitive, and alive? |
| **The Four Pillars United** | How it all converges | Is the design invisible? |

**Design is not what you see. It is what you no longer have to think about.**

---

## Presentation Frame Design — The Four Pillars in Practice

Every frame in a Preplai presentation is a **single design decision** evaluated against all four pillars simultaneously. These rules govern how you compose frames when calling `add_scene`.

### Pillar I Applied: Perceptual Clarity in Frames

**One focal point per frame.** Use `highlight: true` on exactly one entity — the one the narration is about. The engine dims everything else (0.35 opacity, blur, 0.88x scale), creating instant figure/ground separation. This is depth-of-field cinematography applied to information design.

**Title as anchor.** Every frame needs an H1 at `[50, 6]` — the unmistakable starting point. The viewer's eye lands here first (greatest mass), then drops to the highlighted entity (color contrast), then traces connections (continuity).

**Reading order through position:**
```
H1 title          → [50, 6]   (first: largest mass)
Primary entities   → [20-80, 30-50] (second: color + size)
Connections/arrows → between entities (third: continuity)
Labels/annotations → [50, 70-80] (last: supporting text)
```

**Pre-attentive type recognition.** Never use generic `Entity` or `Group` types. A `Server` looks like infrastructure. A `Database` looks like storage. A `User` looks like a person. The entity type communicates its role before the label is read.

### Pillar II Applied: Compositional Structure in Frames

**Canvas grid:** The 1920×1080 canvas maps to a 0–100% coordinate system. Treat it as a 5-column implicit grid:

| Zone | X range | Use |
|------|---------|-----|
| Left anchor | 15–25 | Source/input entities |
| Left-center | 30–40 | Processing step 1 |
| Center | 45–55 | Core/hub entity |
| Right-center | 60–70 | Processing step 2 |
| Right anchor | 75–85 | Output/result entities |

**Vertical zones:**

| Zone | Y range | Use |
|------|---------|-----|
| Title bar | 4–10 | H1, H2 headings |
| Primary stage | 25–55 | Main entities and connections |
| Secondary | 60–70 | Supporting entities, details |
| Annotation | 72–82 | Labels, callouts, explanations |

**White space is structure.** Minimum 15% gap between entity positions. Entities at `[20, 40]` and `[25, 42]` overlap visually — they need at least `[20, 40]` and `[40, 40]` to read as distinct.

**Balance the composition.** Center of visual mass should be near `[50, 45]`. If you have 3 entities at `[20, 40]`, `[30, 40]`, `[40, 40]` — the layout is left-heavy. Spread to `[20, 40]`, `[50, 40]`, `[80, 40]` for symmetrical balance, or use asymmetric tension deliberately.

**Proximity encodes relationship.** Entities that are conceptually related should be positioned closer together. A `Server` and its `Database` at 15% apart read as a unit. A `Server` and an unrelated `Monitor` at 40% apart read as independent.

### Pillar III Applied: Communication in Frames

**Every entity must be connected.** An orphan entity (no Arrow or DataFlow touching it) is a label without context. Connections are the verbs of visual communication — they say "sends to", "reads from", "depends on". A frame without connections is a diagram without sentences.

**Labels are micro-copy.** Entity labels should be specific nouns ("PostgreSQL" not "DB", "Redis Cache" not "Cache", "API Gateway" not "Gateway"). Arrow labels should be specific verbs ("SQL Queries" not "Queries", "HTTP/2 Request" not "Request").

**Narration is the semantic layer.** The narration text carries the meaning that entities and connections cannot encode alone — the *why*, the *how much*, the *what happens when*. Good narration adds information the visual cannot convey:

- Good: "Redis caches 90% of reads, reducing database load from 5000 to 500 queries per second."
- Bad: "Redis is a caching layer between the server and database."

The first adds quantitative insight. The second restates what the visual already shows.

**Color as semantic signal.** Let the palette auto-assign colors by default (entity type determines hue). Override with `c` (color) only for semantic emphasis:
- Red (`#e74c3c`) → error state, failure, critical path
- Green (`#2ecc71`) → success, healthy, resolved
- Amber (`#f39c12`) → warning, degraded, attention needed

Never use color as the *only* differentiator — always pair with shape (entity type) and label.

### Pillar IV Applied: Emotional Resonance in Frames

**Entity persistence is trust.** Same entity `id` across frames = the entity stays in the DOM. The viewer builds a mental model: "that server is still there." Rebuilding all entities from scratch between frames shatters this model. Rules:
- Keep 2–3 anchor entities in every frame with the same `id`
- Add only 1–3 new entities per transition
- Never rebuild the full entity set between consecutive frames

**Transitions are narrative.** Each frame transition should feel like a camera move, not a page turn:
- **Zoom in:** Cluster entities tightly → camera zooms to detail
- **Zoom out:** Spread entities wide → camera reveals the big picture
- **Pan:** Shift the cluster between frames → camera follows the action

**Staggered entrance is choreography.** Entities don't appear simultaneously — the engine staggers them. This creates a reading order that matches the narration. Place the entity you mention first at positions that enter first (left or center).

**Delight through specificity.** Use `metadata` to give entities character:
- `metadata.kind: "PostgreSQL"` on a Database
- `metadata.items` with real data on an Array
- `metadata.code` with actual syntax on a CodeBlock

Generic entities feel like clipart. Specific entities feel like someone understood the topic.

### Frame Pacing — The Narrative Arc

Structure a multi-frame presentation like a film sequence:

| Frame | Purpose | Entity count | Highlight |
|-------|---------|-------------|-----------|
| 1. Establish | Show the core system/concept | 3–4 entities | The central entity |
| 2. Focus | Zoom into one part | 4–5 entities (2–3 persistent) | The part being explained |
| 3. Expand | Add complexity | 5–7 entities (3–4 persistent) | The new element |
| 4. Connect | Show relationships | 6–8 entities (4–5 persistent) | The key connection |
| 5. Resolve | Complete picture | 5–7 entities | The outcome or insight |

**3–5 seconds per frame** for comfortable reading. Build complexity gradually — never front-load all entities in frame 1.

### The Anti-Patterns (Pillar Conflicts to Avoid)

| Anti-pattern | Pillar conflict | Fix |
|-------------|----------------|-----|
| All entities highlighted | Clarity vs. Resonance — everything is "important" means nothing is | One highlight per frame |
| 10+ entities in one frame | Structure vs. Communication — density overwhelms the compositional grid | Split into 2 frames with persistent anchors |
| Generic labels ("Node 1", "Step A") | Communication failure — labels don't communicate before they're read | Use domain-specific names |
| No connections between entities | Communication failure — no verbs, only nouns | Every content entity needs at least one Arrow |
| Complete entity rebuild between frames | Resonance failure — trust destroyed by spatial instability | Keep anchor entities persistent |
| Narration restates the visual | Communication redundancy — wasted semantic bandwidth | Narration should add *why* and *how much*, not *what* |
| All entities on the left side | Structure failure — unbalanced composition | Spread across x: 20–80 |
| No title/heading | Clarity failure — no starting point for the eye | Always include H1 at [50, 6] |

---

## Applying These Principles at Preplai

### For Illustrations (SVG Components)

- **Intent first:** Every illustration component must have a clear communicative verb — *show* a server, *compare* two concepts, *flow* data through a pipeline
- **Pre-attentive wins:** Shape and color should communicate entity type before the label is read. A database should *look* like storage. A server should *look* like infrastructure.
- **Hierarchy through opacity:** Primary elements at full opacity, supporting elements at 40-60%, decorative elements (glass highlights, ruled lines) at 15-35%
- **Proximity as grouping:** Internal padding (8-16px) must be less than external spacing. Related sub-elements cluster tight; the entity boundary creates clear figure/ground separation.
- **Consistency through tokens:** Same stroke width, border radius, font size, and color mapping everywhere. Design tokens are the enforcement mechanism.
- **Delight through craft:** Glass effects, subtle highlights, refined folded corners, pin details — these are not decoration. They are the evidence that each component was individually cared for.

### For the Player UI

- **The frame is a stage:** Background recedes (deep, dark), entities float in the mid-ground, narration sits in the foreground. Three clear depth planes.
- **Narration as spatial contiguity:** Text appears adjacent to what it describes, not in a disconnected panel.
- **Motion as hierarchy:** Entrance animations stagger to create a reading order. First entity appears → pause → second entity → connection draws → narration fades in.

### For the Website

- **Hero section wins in 150ms:** The value proposition must be visually encoded before the headline is read.
- **White space as confidence:** Generous margins and section gaps communicate premium quality.
- **Consistency across themes:** Light and dark modes must maintain the same hierarchy, spacing, and emotional register — only the palette shifts.

### Actionable Numbers

| Parameter | Value | Source |
|-----------|-------|--------|
| Base font size | 14-16px | Typography research |
| Type scale ratio | 1.25x (Major Third) | Modular scale |
| Line height (body) | 1.4-1.6x | Readability research |
| Line height (headings) | 1.1-1.2x | Display type conventions |
| Text contrast (AA) | 4.5:1 minimum | WCAG 2.1 |
| Internal padding | 8-16px | 8px grid system |
| Gap between related entities | 24-32px | Gestalt proximity |
| Gap between groups | 48-64px | Compositional structure |
| Canvas safe margin | ~10% each side | Presentation design |
| Max elements per frame | 4-6 primary | Cognitive load (4-object rule) |
| Animation entrance | 300-500ms | Motion design research |
| Stagger between elements | 50-100ms | Cascade choreography |
| Opacity: primary | 100% | Visual hierarchy |
| Opacity: secondary | 60-80% | Visual hierarchy |
| Opacity: tertiary/decorative | 15-40% | Visual hierarchy |
