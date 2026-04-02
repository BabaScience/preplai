# Cinematic 5 Pillars -- Entity Renderer Upgrade Checklist

This document defines the 5 cinematic visual depth pillars applied to all core SVG entity renderers. Use this as a checklist when creating or upgrading any entity illustration.

---

## The 5 Pillars

### Pillar 1: Directional Lighting

Every entity has an **offset radial halo** that shifts the glow toward the top-left light source, creating a sense that light is coming from a single direction (like a key light in cinema).

**Implementation:**

- Radial gradient with `cx="38%" cy="38%"` (not centered 50/50)
- Halo ellipse positioned at `(-hw * 0.1, -hh * 0.1)` offset from center
- Halo radius ~1.6x the entity dimensions
- Inner stop: entity color at 0.18 opacity
- Outer stop: entity color at 0 opacity

---

### Pillar 2: Ground Contact Shadow

A dark ellipse positioned below the entity to "ground" it on the scene surface, preventing the floating-in-space look.

**Implementation:**

- Radial gradient: `#000000` at 0.22 opacity (center) -> 0 opacity (edge)
- Gradient center shifted up: `cy="40%"` to create natural shadow falloff
- Ellipse positioned at `(hw * 0.05, hh + 2)` -- just below entity bottom
- Horizontal radius: ~0.9x entity half-width
- Vertical radius: ~0.18x entity half-height (flat, not round)

---

### Pillar 3: Ambient Occlusion

A subtle dark gradient at the bottom-right of the entity to simulate the shadowed side opposite the light source.

**Implementation:**

- Radial gradient: `#000000` at 0.18 opacity (center) -> 0 opacity (edge)
- Gradient center offset: `cx="60%" cy="40%"` (toward bottom-right)
- Ellipse positioned at `(hw * 0.15, hh * 0.3)`
- Covers ~85% width, ~50% height of entity

---

### Pillar 4: Material Identity

Each entity type has a **unique visual texture** that communicates what it is at a glance, even without labels.

**Entity-specific materials:**

| Entity | Material | Implementation |
|--------|----------|---------------|
| Server | Brushed metal | 6 horizontal scan-line rects with alternating opacity (`'0F'`/`'0A'`) |
| Database | Metallic sheen | 3 horizontal lines on cylinder body |
| Cloud | Volumetric vapor | Inner glow radial gradient on main bump |
| Cache | Electric glass | 4 subtle horizontal capacitor-plate lines |
| User | Soft organic glow | Inner radial gradient (warm white center) |
| Service | Brushed metal hex | 4 horizontal scan lines across hexagon |
| LoadBalancer | Crystalline facets | 3 diagonal lines at 30/-30/60 degree angles |
| Queue | Data shimmer | Horizontal gradient overlay (left-bright to right-dim) |
| Container | Frosted glass | 4 faint horizontal lines at varied positions |
| APIEndpoint | Terminal sheen | 3 scan lines below header bar |

**Rules:**

- Use `colorWithAlpha(color, 'HEX_STRING')` for opacity -- alpha is a STRING, not a number
- Keep material textures very subtle (opacity 0.04-0.10 range)
- Material should enhance, not distract

---

### Pillar 5: Micro-Life (Breathing Animations)

CSS `@keyframes` animations injected as SVG `<style>` elements give each entity type a subtle "alive" quality.

**Entity-specific animations:**

| Entity | Animation | Keyframes | Duration |
|--------|-----------|-----------|----------|
| Server | Breathing LEDs | opacity 1->0.35->1 | 2.4s, staggered delays |
| Database | Pulsing dots | opacity 1->0.3->1 | 2.4s, staggered 0.5s |
| Cloud | Drifting bumps | translateY 0->2px->0 | 6-8s, staggered |
| Cache | Electric bolt pulse | opacity 1->0.4->1 + cap breathe | 2s / 3s |
| User | Pulse ring | opacity 0.6->1->0.6 | 3s |
| Service | Gear rotation | rotate 0->360deg | 12s linear |
| LoadBalancer | Traffic flow | opacity 1->0.3->1 | 2.5s, staggered |
| Queue | Flow shimmer | translateX sweep | 4s |
| Container | Breathing border | opacity 0.6->1->0.6 | 4s |
| APIEndpoint | Cursor blink | opacity 0->1->0 | 1s step-end |

**Implementation pattern:**

```typescript
// 1. Create unique style ID
const styleId = 'entity-anim-css';
const svg = parentEl.ownerSVGElement ?? (parentEl as SVGSVGElement);

// 2. Inject CSS only once
if (!svg.querySelector(`#${styleId}`)) {
  const style = document.createElementNS(SVG_NS, 'style');
  style.setAttribute('id', styleId);
  style.textContent = `
    @keyframes entity-breathe {
      0%, 100% { opacity: 1; }
      50% { opacity: 0.35; }
    }
    .entity-anim { animation: entity-breathe 2.4s ease-in-out infinite; }
    .entity-anim-d1 { animation-delay: 0.4s; }
  `;
  svg.insertBefore(style, svg.firstChild);
}

// 3. Apply classes to elements
element.classList.add('entity-anim');
```

---

## Bonus Layer: Specular Highlight

A white radial gradient ellipse positioned at the top-left of the entity body, simulating a "catch-light" reflection from the directional light source.

**Implementation:**

- Radial gradient: `#ffffff` at 0.14 opacity (center) -> 0 opacity (edge)
- Gradient center: `cx="35%" cy="30%"`
- Ellipse positioned at `(-hw * 0.35, -hh * 0.4)`
- Size: ~55% width, ~35% height of entity

---

## Additional Requirements

- **Glass filter**: Apply `ensureGlassFilter(parentEl)` on the primary shape for visionOS-style depth
- **Both themes must work**: Cinema (dark) and Light theme -- use `resolveColorCascade(entity)` for theme-aware colors
- **Imports needed**: `colorWithAlpha` from `'../design-tokens.js'`, `ensureGlassFilter` from `'../visual-utils.js'`
- **Layer order matters**: halo -> ground shadow -> AO -> [highlight glow] -> body -> material -> animations -> specular -> label

---

## Visual Layer Stack (back to front)

1. Offset radial halo (Pillar 1)
2. Ground contact shadow (Pillar 2)
3. Ambient occlusion (Pillar 3)
4. Highlight glow (if `entity.highlight`)
5. Entity body (with glass filter)
6. Material texture (Pillar 4)
7. Interactive elements + micro-animations (Pillar 5)
8. Specular highlight
9. Label
