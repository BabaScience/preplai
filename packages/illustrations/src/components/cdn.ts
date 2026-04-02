/**
 * @preplai/illustrations — CDN Component (5-Pillar Cinematic Depth)
 *
 * Globe with edge nodes — directional lighting, ground shadow,
 * ambient occlusion, specular highlight, micro-life animations.
 * Use for: CDNs, content delivery, edge networks, global distribution.
 *
 * 5 Pillars: directional halo, ground shadow, ambient occlusion,
 * specular highlight, micro-life (float/drift + edge node twinkle).
 */

import { SVG_NS, buildEntityGroup, applyEntranceAnimation, getSizeParam } from '../utils.js';
import { TYPOGRAPHY, STROKE, LABEL_DEFAULTS, colorWithAlpha } from '../design-tokens.js';
import { resolveColorCascade, applyGlowColors } from '../color-cascade.js';
import { ensureDefs, ensureGlassFilter, ensureGlowFilter } from '../visual-utils.js';
import type { VisualEntity } from '@preplai/shared';

export function renderCDN(entity: VisualEntity, parentEl: SVGElement): SVGGElement {
  const { outerG, innerG } = buildEntityGroup(entity);
  const s = getSizeParam(entity);
  const cc = resolveColorCascade(entity);
  const color = cc.base;
  const entityId = (entity.id ?? Math.random().toString(36).slice(2)).replace(/[^a-zA-Z0-9]/g, '').slice(0, 8);

  const r = s * 0.35;
  const defs = ensureDefs(parentEl);

  // ── Filters ──────────────────────────────────────────────────────────
  const glowUrl = ensureGlowFilter(parentEl, color, 'cdn-glow');
  const glassUrl = ensureGlassFilter(parentEl);

  // ── 1. Directional Lighting — radial halo behind globe ──────────────
  const haloId = `cdn-halo-${entityId}`;
  if (!defs.querySelector(`#${haloId}`)) {
    const grad = document.createElementNS(SVG_NS, 'radialGradient');
    grad.setAttribute('id', haloId);
    grad.setAttribute('cx', '38%'); grad.setAttribute('cy', '38%');
    grad.setAttribute('r', '50%');
    const s1 = document.createElementNS(SVG_NS, 'stop');
    s1.setAttribute('offset', '0%'); s1.setAttribute('stop-color', color); s1.setAttribute('stop-opacity', '0.13');
    const s2 = document.createElementNS(SVG_NS, 'stop');
    s2.setAttribute('offset', '100%'); s2.setAttribute('stop-color', color); s2.setAttribute('stop-opacity', '0');
    grad.appendChild(s1); grad.appendChild(s2);
    defs.appendChild(grad);
  }
  const halo = document.createElementNS(SVG_NS, 'ellipse');
  halo.setAttribute('cx', String(-r * 0.15));
  halo.setAttribute('cy', String(-r * 0.1));
  halo.setAttribute('rx', String(r * 2.2));
  halo.setAttribute('ry', String(r * 1.6));
  halo.setAttribute('fill', `url(#${haloId})`);
  innerG.appendChild(halo);

  // ── 2. Ground Shadow — below the globe ──────────────────────────────
  const gsId = `cdn-gshadow-${entityId}`;
  if (!defs.querySelector(`#${gsId}`)) {
    const grad = document.createElementNS(SVG_NS, 'radialGradient');
    grad.setAttribute('id', gsId);
    grad.setAttribute('cx', '50%'); grad.setAttribute('cy', '50%'); grad.setAttribute('r', '50%');
    const s1 = document.createElementNS(SVG_NS, 'stop');
    s1.setAttribute('offset', '0%'); s1.setAttribute('stop-color', '#000000'); s1.setAttribute('stop-opacity', '0.18');
    const s2 = document.createElementNS(SVG_NS, 'stop');
    s2.setAttribute('offset', '100%'); s2.setAttribute('stop-color', '#000000'); s2.setAttribute('stop-opacity', '0');
    grad.appendChild(s1); grad.appendChild(s2);
    defs.appendChild(grad);
  }
  const groundShadow = document.createElementNS(SVG_NS, 'ellipse');
  groundShadow.setAttribute('cx', '0');
  groundShadow.setAttribute('cy', String(r + r * 0.35));
  groundShadow.setAttribute('rx', String(r * 1.1));
  groundShadow.setAttribute('ry', String(r * 0.25));
  groundShadow.setAttribute('fill', `url(#${gsId})`);
  innerG.appendChild(groundShadow);

  // ── Highlight glow ring ──────────────────────────────────────────────
  if (entity.highlight) {
    const glowRing = document.createElementNS(SVG_NS, 'circle');
    glowRing.setAttribute('cx', '0');
    glowRing.setAttribute('cy', '0');
    glowRing.setAttribute('r', String(r + 4));
    glowRing.setAttribute('stroke-width', String(STROKE.default));
    glowRing.setAttribute('stroke-dasharray', '4,4');
    applyGlowColors(glowRing, cc);
    innerG.appendChild(glowRing);
  }

  // ── Globe body ───────────────────────────────────────────────────────
  // Globe fill gradient (radial, color 0.3 center → 0.08 edge)
  const globeFillId = `cdn-globefill-${entityId}`;
  if (!defs.querySelector(`#${globeFillId}`)) {
    const grad = document.createElementNS(SVG_NS, 'radialGradient');
    grad.setAttribute('id', globeFillId);
    grad.setAttribute('cx', '50%'); grad.setAttribute('cy', '50%'); grad.setAttribute('r', '50%');
    const s1 = document.createElementNS(SVG_NS, 'stop');
    s1.setAttribute('offset', '0%'); s1.setAttribute('stop-color', color); s1.setAttribute('stop-opacity', '0.3');
    const s2 = document.createElementNS(SVG_NS, 'stop');
    s2.setAttribute('offset', '100%'); s2.setAttribute('stop-color', color); s2.setAttribute('stop-opacity', '0.08');
    grad.appendChild(s1); grad.appendChild(s2);
    defs.appendChild(grad);
  }

  // Globe stroke gradient (linear 135deg, color 0.9 → 0.3)
  const globeStrokeId = `cdn-globestroke-${entityId}`;
  if (!defs.querySelector(`#${globeStrokeId}`)) {
    const grad = document.createElementNS(SVG_NS, 'linearGradient');
    grad.setAttribute('id', globeStrokeId);
    grad.setAttribute('x1', '0%'); grad.setAttribute('y1', '0%');
    grad.setAttribute('x2', '100%'); grad.setAttribute('y2', '100%');
    const s1 = document.createElementNS(SVG_NS, 'stop');
    s1.setAttribute('offset', '0%'); s1.setAttribute('stop-color', color); s1.setAttribute('stop-opacity', '0.9');
    const s2 = document.createElementNS(SVG_NS, 'stop');
    s2.setAttribute('offset', '100%'); s2.setAttribute('stop-color', color); s2.setAttribute('stop-opacity', '0.3');
    grad.appendChild(s1); grad.appendChild(s2);
    defs.appendChild(grad);
  }

  const globe = document.createElementNS(SVG_NS, 'circle');
  globe.setAttribute('cx', '0');
  globe.setAttribute('cy', '0');
  globe.setAttribute('r', String(r));
  globe.setAttribute('fill', `url(#${globeFillId})`);
  globe.setAttribute('stroke', `url(#${globeStrokeId})`);
  globe.setAttribute('stroke-width', '2');
  globe.setAttribute('filter', `${glowUrl} ${glassUrl}`.trim());
  innerG.appendChild(globe);

  // ── Latitude line (horizontal ellipse inside globe) ──────────────────
  const lat = document.createElementNS(SVG_NS, 'ellipse');
  lat.setAttribute('cx', '0');
  lat.setAttribute('cy', '0');
  lat.setAttribute('rx', String(r * 0.75));
  lat.setAttribute('ry', String(r * 0.25));
  lat.setAttribute('fill', 'none');
  lat.setAttribute('stroke', colorWithAlpha(color, '4D'));
  lat.setAttribute('stroke-width', String(STROKE.thin));
  innerG.appendChild(lat);

  // ── Meridian (vertical line through globe center) ────────────────────
  const meridian = document.createElementNS(SVG_NS, 'line');
  meridian.setAttribute('x1', '0');
  meridian.setAttribute('y1', String(-r));
  meridian.setAttribute('x2', '0');
  meridian.setAttribute('y2', String(r));
  meridian.setAttribute('stroke', colorWithAlpha(color, '4D'));
  meridian.setAttribute('stroke-width', String(STROKE.thin));
  innerG.appendChild(meridian);

  // ── 3. Ambient Occlusion — circle overlay, lower-right bias ─────────
  const aoId = `cdn-ao-${entityId}`;
  if (!defs.querySelector(`#${aoId}`)) {
    const grad = document.createElementNS(SVG_NS, 'radialGradient');
    grad.setAttribute('id', aoId);
    grad.setAttribute('cx', '70%'); grad.setAttribute('cy', '75%'); grad.setAttribute('r', '55%');
    const s1 = document.createElementNS(SVG_NS, 'stop');
    s1.setAttribute('offset', '0%'); s1.setAttribute('stop-color', '#000000'); s1.setAttribute('stop-opacity', '0.10');
    const s2 = document.createElementNS(SVG_NS, 'stop');
    s2.setAttribute('offset', '100%'); s2.setAttribute('stop-color', '#000000'); s2.setAttribute('stop-opacity', '0');
    grad.appendChild(s1); grad.appendChild(s2);
    defs.appendChild(grad);
  }
  const ao = document.createElementNS(SVG_NS, 'circle');
  ao.setAttribute('cx', '0');
  ao.setAttribute('cy', '0');
  ao.setAttribute('r', String(r));
  ao.setAttribute('fill', `url(#${aoId})`);
  ao.setAttribute('pointer-events', 'none');
  innerG.appendChild(ao);

  // ── 4. Specular Highlight — upper-left gleam ─────────────────────────
  const specId = `cdn-spec-${entityId}`;
  if (!defs.querySelector(`#${specId}`)) {
    const grad = document.createElementNS(SVG_NS, 'radialGradient');
    grad.setAttribute('id', specId);
    grad.setAttribute('cx', '35%'); grad.setAttribute('cy', '25%'); grad.setAttribute('r', '40%');
    const s1 = document.createElementNS(SVG_NS, 'stop');
    s1.setAttribute('offset', '0%'); s1.setAttribute('stop-color', '#ffffff'); s1.setAttribute('stop-opacity', '0.18');
    const s2 = document.createElementNS(SVG_NS, 'stop');
    s2.setAttribute('offset', '100%'); s2.setAttribute('stop-color', '#ffffff'); s2.setAttribute('stop-opacity', '0');
    grad.appendChild(s1); grad.appendChild(s2);
    defs.appendChild(grad);
  }
  const specular = document.createElementNS(SVG_NS, 'ellipse');
  specular.setAttribute('cx', String(-r * 0.2));
  specular.setAttribute('cy', String(-r * 0.25));
  specular.setAttribute('rx', String(r * 0.55));
  specular.setAttribute('ry', String(r * 0.4));
  specular.setAttribute('fill', `url(#${specId})`);
  specular.setAttribute('pointer-events', 'none');
  innerG.appendChild(specular);

  // ── Edge nodes (3 nodes around globe) ────────────────────────────────
  const nodeR = s * 0.06;
  const edgeNodeGlowId = `cdn-nodeglow-${entityId}`;
  if (!defs.querySelector(`#${edgeNodeGlowId}`)) {
    const filter = document.createElementNS(SVG_NS, 'filter');
    filter.setAttribute('id', edgeNodeGlowId);
    filter.setAttribute('x', '-80%'); filter.setAttribute('y', '-80%');
    filter.setAttribute('width', '260%'); filter.setAttribute('height', '260%');
    const fds = document.createElementNS(SVG_NS, 'feDropShadow');
    fds.setAttribute('dx', '0'); fds.setAttribute('dy', '0');
    fds.setAttribute('stdDeviation', '2.5');
    fds.setAttribute('flood-color', color);
    fds.setAttribute('flood-opacity', '0.6');
    filter.appendChild(fds);
    defs.appendChild(filter);
  }

  // Positions: left, right, bottom (outside globe circle)
  const edgePositions = [
    { cx: -(r + nodeR * 2.5), cy: 0 },           // left
    { cx: r + nodeR * 2.5, cy: 0 },               // right
    { cx: 0, cy: r + nodeR * 2.5 },               // bottom
  ];

  const edgeNodeEls: SVGCircleElement[] = [];
  edgePositions.forEach((pos) => {
    const node = document.createElementNS(SVG_NS, 'circle');
    node.setAttribute('cx', String(pos.cx));
    node.setAttribute('cy', String(pos.cy));
    node.setAttribute('r', String(nodeR));
    node.setAttribute('fill', colorWithAlpha(color, '80'));
    node.setAttribute('stroke', colorWithAlpha(color, 'B3'));
    node.setAttribute('stroke-width', '1.5');
    node.setAttribute('filter', `url(#${edgeNodeGlowId})`);
    innerG.appendChild(node);
    edgeNodeEls.push(node);
  });

  // ── 5. Micro-Life — float/drift + edge node twinkle ─────────────────
  const styleId = `cdn-style-${entityId}`;
  const svg = parentEl.ownerSVGElement ?? (parentEl as SVGSVGElement);
  if (!svg.querySelector(`#${styleId}`)) {
    const style = document.createElementNS(SVG_NS, 'style');
    style.setAttribute('id', styleId);
    style.textContent = `
      @keyframes cdnFloat_${entityId} {
        0%, 100% { transform: translateY(0) scale(1); }
        50% { transform: translateY(-3px) scale(1.015); }
      }
      @keyframes cdnTwinkle_${entityId} {
        0%, 100% { transform: scale(1); opacity: 0.8; }
        50% { transform: scale(1.4); opacity: 1; }
      }
      .cdn-float-${entityId} {
        animation: cdnFloat_${entityId} 3.5s ease-in-out infinite;
      }
      .cdn-twinkle-${entityId} {
        animation: cdnTwinkle_${entityId} 2.5s ease-in-out infinite;
        transform-origin: center;
        transform-box: fill-box;
      }
    `;
    svg.insertBefore(style, svg.firstChild);
  }

  innerG.classList.add(`cdn-float-${entityId}`);
  edgeNodeEls.forEach((node, i) => {
    node.classList.add(`cdn-twinkle-${entityId}`);
    node.style.animationDelay = `${i * 0.7}s`;
  });

  // ── Label below ──────────────────────────────────────────────────────
  if (entity.label) {
    const labelY = r + nodeR * 2.5 + LABEL_DEFAULTS.offsetBelow;
    const text = document.createElementNS(SVG_NS, 'text');
    text.setAttribute('x', '0');
    text.setAttribute('y', String(labelY));
    text.setAttribute('text-anchor', LABEL_DEFAULTS.textAnchor);
    text.setAttribute('fill', cc.textPrimary);
    text.setAttribute('font-size', String(TYPOGRAPHY.fontSizeLabel));
    text.setAttribute('font-weight', String(TYPOGRAPHY.fontWeightTitle));
    text.setAttribute('font-family', TYPOGRAPHY.fontLabel);
    text.textContent = entity.label;
    innerG.appendChild(text);
  }

  applyEntranceAnimation(innerG, entity);
  parentEl.appendChild(outerG);
  return outerG;
}
