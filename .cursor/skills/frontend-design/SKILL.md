---
name: frontend-design
description: Applies cutting-edge front-end and product design for React, CSS, accessibility, and design systems. Use when building or refining UI components, pages, design tokens, motion choreography, responsive layouts, or when the user mentions design, styling, accessibility, UX, or cinematic UI.
---

# Front-End Design — Edge of Product Design

Guidance for building high-quality, accessible, cinema-grade front-end code. Preplai's mission: **agent→human visual communication**. Every pixel serves the story.

---

## 0. Product Design Philosophy

**Preplai is a cinematic visualization engine.** The UI is a *stage* for agent-generated content. Design decisions must optimize for:

- **Clarity over decoration** — Every element aids comprehension. Remove what doesn't serve the story.
- **Visual hierarchy for comprehension** — Title → primary entities → connections → labels. The eye should flow naturally.
- **Agent-native context** — Content is dynamic, agent-authored. Layout and typography must handle variable length, density, and emphasis without breaking.
- **Emotional resonance** — Depth, atmosphere, motion create immersion. Flat = dead. Layered = alive.

**Inspired by:** Linear (color, hierarchy), Apple Keynote (motion choreography), Stripe (clarity), Bloomberg Terminal (data density in dark), IMAX (immersion).

---

## 1. Motion Design — Purposeful, Not Decorative

Motion is **UX essential**: guide attention, clarify state changes, reduce cognitive load, express hierarchy.

**Principles:**
- **GPU-only:** Animate `opacity` and `transform` (translate, scale, rotate). Never `x`, `y`, `width`, `height`, `fill`, `stroke`.
- **Purposeful:** Each animation answers "why?" — entrance (reveal), transition (context shift), feedback (confirmation).
- **Choreography:** Stagger entrances (50–80ms apart). Title first → entities → connections → labels. Exit before enter on scene change.
- **Duration:** 150–320ms for micro-interactions; 400–500ms for entrances. Use motion tokens for consistency.

**Accessibility:** Always respect `prefers-reduced-motion: reduce`. Provide instant state changes when reduced; skip or shorten animations.

```css
@media (prefers-reduced-motion: reduce) {
  *, *::before, *::after { animation-duration: 0.01ms !important; transition-duration: 0.01ms !important; }
}
```

**Easing:** `cubic-bezier(0.16, 1, 0.3, 1)` for enter; `cubic-bezier(0.4, 0, 1, 1)` for exit; `cubic-bezier(0.34, 1.56, 0.64, 1)` for playful overshoot.

---

## 2. Cinematic & Immersive Design

**Depth layers:** Use background hierarchy (bg-deep → bg-base → bg-elevated → bg-surface → bg-hover) to create spatial depth. Elevated surfaces feel closer.

**Atmosphere:** Subtle dot grids, gradients, vignette, or noise texture add life. Avoid flat solid fills for large areas.

**Kinetic typography:** Motion on text (fade, scale, slide) adds energy. Use sparingly for titles and key moments. Keep body text static for readability.

**Spatial hierarchy:** Larger = more important. Saturated = active. Muted = secondary. Glow = focus.

---

## 3. Semantic HTML & Accessibility

**Prefer native elements over generic divs.** Use `<button>`, `<a>`, `<header>`, `<nav>`, `<main>`, `<article>`, and heading hierarchy (`<h1>`–`<h6>`).

**ARIA rule:** Add ARIA only when semantic HTML is insufficient.

**Keyboard patterns:** Tab/Shift+Tab, Enter/Space, Escape, Arrow keys for composite widgets.

**Focus:** Use `:focus-visible`. Never remove focus styles. Return focus to triggers when closing modals.

**Target:** WCAG 2.2 AA. Test keyboard-only, screen readers, high zoom (200–400%), reduced motion.

---

## 4. React Component Design

- **TypeScript:** Typed props, avoid `any`.
- **Single responsibility:** One concern per component.
- **Composition over configuration:** `children` and slots over long prop lists.
- **Accessibility from the start:** Use headless UI (Radix, shadcn/ui) when available.

---

## 5. Design Tokens & CSS

**Token layers:** Base (raw values) → Semantic (purpose-driven) → Component (overrides).

**Motion tokens:** Define `--duration-fast`, `--duration-normal`, `--duration-slow`, `--ease-enter`, `--ease-exit` for consistency.

**CSS variables:** `:root` for global; `[data-theme="dark"]` for theming.

**Emerging 2025:** Use `text-wrap: balance` for headings; `:user-valid`/`:user-invalid` for form feedback; View Transitions API for page/section changes where supported. Consider Bento-style grids for modular layouts.

---

## 6. Responsive Design

- **Mobile-first:** Base styles for small screens; `min-width` media queries for enhancement.
- **Fluid typography:** `clamp()` or responsive tokens.
- **Touch targets:** Minimum 24×24px (44×44px preferred).
- **Viewport units:** `vw`/`vh`/`vmin` where appropriate.

---

## 7. Performance

- **Core Web Vitals:** INP ≤200ms, LCP ≤2.5s, CLS ≤0.1.
- **Animations:** GPU-only. No layout thrashing.
- **Images:** Lazy load, WebP/AVIF, explicit `width`/`height`.

---

## 8. Preplai-Specific

**Design system:** [docs/design-system-v4.md](../../docs/design-system-v4.md). Background layers, text hierarchy, entity palette (saturated, distinct).

**Illustrations:** `packages/illustrations/src/design-tokens.ts`. Double-`<g>` pattern, GPU-only animation. [CLAUDE_ILLUSTRATION_DEEP_DIVE.md](../../packages/illustrations/CLAUDE_ILLUSTRATION_DEEP_DIVE.md).

**Typography:** Inter (display/UI), JetBrains Mono (code). Scale: title-hero 48px → entity-name 16px → narrator 17px.

**Motion choreography:** Title fade-in → entities stagger (50ms) → connections draw → labels fade → narrator slide. Exit: narrator first, then content.

---

## 9. Quick Checklist

- [ ] Every pixel serves the story; clarity over decoration
- [ ] Motion purposeful; `prefers-reduced-motion` respected
- [ ] Semantic HTML; correct heading hierarchy
- [ ] Keyboard navigable; visible focus states
- [ ] Design tokens used (including motion tokens)
- [ ] Responsive; touch targets ≥24px
- [ ] TypeScript types for props

---

## Additional Resources

- [docs/design-system-v4.md](../../docs/design-system-v4.md) — Cinema design system
- [packages/illustrations/ILLUSTRATION_STYLE_GUIDE.md](../../packages/illustrations/ILLUSTRATION_STYLE_GUIDE.md) — Illustration tokens
- [Claude.md](../../Claude.md) — Design & illustration focus
