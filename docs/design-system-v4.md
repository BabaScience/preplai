# PRE Design System v4 — "Cinema Grade"

> The GOAL: Best-in-class interface for AGENT→HUMAN visual communication

## Design Philosophy

PRE is not a slide deck tool — it's a **cinematic visualization engine** where an AI agent
communicates complex ideas through programmatic SVG scenes. Every pixel must serve the story.

Inspired by: Linear (color system, hierarchy), Apple Keynote (motion choreography),
Stripe docs (clarity), Bloomberg Terminal (data density in dark), IMAX (cinematic immersion).

---

## 1. Current Issues Catalog (from 22 screenshots)

### Critical (Break comprehension)
1. **Label/entity overlap**: "Load Balancer" text renders ON TOP of hexagon shape AND below it (double label)
2. **"Redis Cache" text ON the circle**: Label text collides with entity interior text
3. **"RabbitMQ Broker" text overlaps entity**: Interior label crashes into boundary
4. **"Topic Exchange orders..." truncation**: Concept circle text gets cut off
5. **"API Gateway" text overlaps hexagon**: Label sits behind the shape
6. **Narrator scrollbar**: Ugly browser scrollbar visible inside frosted glass panel
7. **Narrator text clipping**: Long narrator text gets cut off at bottom

### Major (Reduce polish)
8. **Generic entity shapes**: All servers look identical — cyan rectangles with a chevron
9. **Flat visual hierarchy**: Title card, entities, and labels all compete equally
10. **No scene title refinement**: Scene titles are oversized gray boxes, not elegant
11. **Dot grid too subtle**: Background feels empty/dead — not cinematic
12. **Color saturation**: Entity colors are washed out / too transparent
13. **Connection arrows hard to read**: Bezier curves with tiny labels are barely visible
14. **Frame nav too small/hidden**: Bottom-right pills at 40% opacity — almost invisible

### Polish (Separate good from world-class)
15. **No progress indicator**: No visual timeline/progress bar for scene position
16. **No scene transition choreography**: Simple crossfade between frames
17. **Typography hierarchy**: Single font weight for everything
18. **Entity label placement**: Below-entity labels collide with connection paths
19. **No ambient atmosphere**: No particle effects, no subtle motion, no life
20. **Narrator panel lacks personality**: Generic frosted box, no agent identity
21. **No keyboard shortcuts overlay**: User has no discoverability
22. **No responsive scaling**: Fixed 1920x1080 with no adaptation

---

## 2. Color System

### Background Layers (Cinematic depth)
```
bg-deep:      #08090e    // Deepest — the void
bg-base:      #0c0d14    // Primary canvas background  
bg-elevated:  #12131c    // Elevated surfaces (title cards, panels)
bg-surface:   #1a1b26    // Containers, narrator box
bg-hover:     #22232e    // Hover states
```

### Text Hierarchy
```
text-primary:    #e8e8f0    // Headlines, entity names — high contrast
text-secondary:  #a0a0b8    // Narrator text, descriptions
text-tertiary:   #6b6b80    // Metadata, frame counter
text-accent:     #C9A84C    // Gold highlights (user preference)
```

### Entity Palette (Saturated, distinct, accessible)
Each entity type gets a signature color that's SATURATED enough to read at a glance:

```
server:      #4ECDC4    // Teal-cyan (server racks, services)
database:    #2ECC71    // Emerald green (databases, storage)
user:        #F1C40F    // Gold-amber (users, clients)
cloud:       #9B59B6    // Purple (cloud, external services)
cache:       #E67E22    // Orange (caching layers)
gateway:     #3498DB    // Blue (API gateways, load balancers)
queue:       #E74C3C    // Red-coral (message queues, brokers)
concept:     #1ABC9C    // Mint (abstract concepts)
label:       #BDC3C7    // Silver (annotation labels)
codeblock:   #2C3E50    // Charcoal with bright text
```

### Connection Palette (Glow-capable)
```
arrow-default:    rgba(255,255,255,0.6)
arrow-data:       #4ECDC4    // Data flow — teal
arrow-request:    #F39C12    // Request — amber
arrow-response:   #2ECC71    // Response — green
arrow-event:      #E74C3C    // Events — red
arrow-glow:       0 0 8px {color}50   // Subtle glow per arrow type
```

---

## 3. Typography

### Font Stack
- **Display**: 'Inter Display' or 'Inter' weight 700 — scene titles
- **UI**: 'Inter' weights 400/500/600 — entity labels, narrator
- **Code**: 'JetBrains Mono' weight 400/500 — code blocks, technical data

### Scale (SVG pixel values at 1920x1080)
```
title-hero:     48px / weight 700 / letter-spacing -0.02em
title-scene:    36px / weight 600 / letter-spacing -0.01em
entity-name:    16px / weight 600 / letter-spacing 0.02em  
entity-detail:  13px / weight 400 / letter-spacing 0.01em
arrow-label:    12px / weight 500 / letter-spacing 0.03em (monospace)
narrator:       17px / weight 400 / line-height 1.7
frame-counter:  13px / weight 500 / monospace
```

---

## 4. Entity Rendering (Fixes #1, #2, #3, #5, #8, #12)

### Label Placement Rules
1. **Interior labels**: ONLY when entity shape is large enough (w>120, h>80)
2. **Exterior labels**: ALWAYS below entity, with 12px gap minimum
3. **NEVER double-label**: If interior label exists, suppress exterior
4. **Text overflow**: Multi-line wrap at shape width - 24px padding
5. **Concept circles**: Label INSIDE only if ≤12 chars, otherwise below

### Entity Shape Refinements
- **Server/Service**: Rounded rectangle with subtle 3D depth line at top (like a server rack LED)
- **Database**: Classic cylinder with gradient — top ellipse lighter
- **User**: Simplified avatar circle with initials or icon
- **Cloud**: Organic blob path with soft fill
- **LoadBalancer**: Hexagon with inner ring pattern
- **Cache**: Rounded square with diagonal slash pattern
- **Queue/Broker**: Rectangle with horizontal lines (message queue visual)
- **Concept**: Perfect circle with radial gradient glow

### Visual Weight Hierarchy
1. TITLE (largest, centered, highest z-order)
2. Primary entities (full opacity, drop shadow)
3. Secondary entities (90% opacity)
4. Connections (below entities, glow on hover)
5. Labels (smallest, anchored to parent)

---

## 5. Scene Title Card (Fix #10)

Replace the current gray rounded rectangle with:

```
- No visible box/border
- Text only: large, centered, bold
- Subtle text-shadow glow: 0 0 40px rgba(200,168,76,0.15)
- Subtitle (if any) in text-secondary, lighter weight
- Entrance: letter-by-letter fade or smooth scale from 0.95→1.0
- Tags/keywords: small pills below subtitle, text-accent colored border
```

---

## 6. Narrator Panel (Fix #6, #7, #20)

### New Design
```css
- Position: bottom center, 48px from bottom
- Max width: 800px  
- Padding: 24px 32px
- Background: rgba(12, 13, 20, 0.88)
- Backdrop: blur(24px) saturate(1.3)
- Border: 1px solid rgba(255,255,255,0.04)
- Border-radius: 14px
- Shadow: 0 12px 40px rgba(0,0,0,0.5), inset 0 1px 0 rgba(255,255,255,0.03)
- Custom scrollbar: 4px width, rounded, semi-transparent
- Text: Inter 17px, #a0a0b8, line-height 1.7, text-align center
- Max-height: 100px with smooth overflow
- Entrance: translateY(16px) → 0, opacity 0 → 1, duration 500ms
```

### Custom Scrollbar
```css
#narrator-text::-webkit-scrollbar { width: 4px; }
#narrator-text::-webkit-scrollbar-track { background: transparent; }
#narrator-text::-webkit-scrollbar-thumb { 
  background: rgba(255,255,255,0.12); 
  border-radius: 4px; 
}
```

---

## 7. Frame Navigation (Fix #14, #15)

### New Design: Bottom-center progress bar + nav
```
Layout: centered bottom bar, 24px from bottom edge
Components:
  [‹ prev] [● ● ● ○ ○ ○] [next ›]  [1/6]

- Dot indicators: 8px circles, filled = visited, ring = current, dim = future
- Current dot: accent color (#C9A84C) with subtle pulse
- Buttons: 32x32, rounded-full, frosted glass background
- Always visible at 0.7 opacity, 1.0 on hover
- Keyboard hint: tiny "←→" label on first load, fades after 3s
```

---

## 8. Background Atmosphere (Fix #11, #19)

### Layers (bottom to top)
1. **Deep gradient**: radial from #0f1018 center to #060610 edges
2. **Dot grid**: spacing 80px, r=1.2, opacity 0.05 (subtle, not distracting)
3. **Ambient particles**: 12-15 floating dots, very slow drift (0.02px/frame), 
   opacity 0.04-0.08, various sizes 2-6px, colors from entity palette at 10% opacity
4. **Vignette**: SVG radial gradient overlay, darkening edges
5. **Noise texture**: feTurbulence at 0.02 opacity (film grain)

---

## 9. Connection/Arrow Improvements (Fix #13, #18)

### Arrow Rendering
- **Stroke width**: 2px base, 2.5px for primary connections
- **Glow**: Parallel path with blur(6px) at 0.3 opacity behind main path
- **Arrowhead**: Larger (16x10), filled, with slight glow
- **Label pills**: 
  - Background: bg-surface with 0.85 opacity
  - Border: 1px solid rgba(255,255,255,0.08)
  - Padding: 4px 10px
  - Font: JetBrains Mono 11px, weight 500
  - Border-radius: 6px
- **Animated dash**: For DataFlow type, dash-offset animation at 30px/s

### Label Collision Avoidance
- Arrow labels placed at bezier midpoint with vertical offset (+20px or -20px)
- Check for entity overlap and shift if needed
- Prefer placing labels on the less-crowded side

---

## 10. Motion Choreography (Fix #16)

### Scene Entrance Sequence
```
Frame 0ms:    Background visible, all entities/connections invisible
Frame 100ms:  Title fades in (scale 0.97→1.0, opacity 0→1, duration 400ms)
Frame 400ms:  Entities stagger in (50ms apart, type-specific animation)
Frame +200ms: Connections draw in (path animation, stroke-dashoffset)
Frame +150ms: Labels fade in (opacity, 200ms each)
Frame +100ms: Narrator slides up
```

### Exit Sequence
```
Narrator fades out first (200ms)
Then all content fades (opacity → 0, 250ms)
Brief pause (100ms)
New frame enters
```

### Easing
```
enter:    cubic-bezier(0.16, 1, 0.3, 1)    // Fast start, gentle settle
exit:     cubic-bezier(0.4, 0, 1, 1)        // Quick departure
spring:   cubic-bezier(0.34, 1.56, 0.64, 1) // Slight overshoot for playful elements
```

---

## 11. Implementation Priority

### Phase 1 — Critical Fixes (ship immediately)
- Fix label overlap / double-label bug
- Fix narrator scrollbar + text clipping
- Fix entity color saturation
- Fix title card design

### Phase 2 — Polish (same PR)
- New frame navigation with progress dots
- Background atmosphere layers
- Connection arrow glow + larger labels
- Typography hierarchy enforcement

### Phase 3 — Delight (follow-up)
- Scene transition choreography
- Ambient floating particles
- Keyboard shortcuts overlay
- Custom entity shape refinements
