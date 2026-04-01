/**
 * @preplai/illustrations — Database Component
 *
 * Clean cylinder shape with glowing status dots on top cap.
 * Use for: databases, data stores, persistent storage.
 *
 * Visual depth: radial halo, glowing status dots, LED connection indicators.
 */

import { SVG_NS, buildEntityGroup, applyEntranceAnimation, getSizeParam } from '../utils.js';
import { TYPOGRAPHY, STROKE, LABEL_DEFAULTS } from '../design-tokens.js';
import { resolveColorCascade, applyGlowColors } from '../color-cascade.js';
import { renderCylinderBase, getCylinderLabelY } from '../cylinder-utils.js';
import { ensureDefs, ensureGlowFilter } from '../visual-utils.js';
import type { VisualEntity } from '@preplai/shared';

export function renderDatabase(entity: VisualEntity, parentEl: SVGElement): SVGGElement {
  const { outerG, innerG } = buildEntityGroup(entity);
  const size = getSizeParam(entity);
  const cc = resolveColorCascade(entity);
  const color = cc.base;
  const entityId = (entity.id ?? Math.random().toString(36).slice(2)).replace(/[^a-zA-Z0-9]/g, '').slice(0, 8);
  const gradId = `grad-db-${cc.base.replace(/[^a-fA-F0-9]/g, '')}`;

  const rx = size / 2;
  const ry = size / 6;
  const topY = -size / 3;

  const defs = ensureDefs(parentEl);

  // ── Radial depth halo ────────────────────────────────────────────────
  const haloId = `db-halo-${entityId}`;
  if (!defs.querySelector(`#${haloId}`)) {
    const grad = document.createElementNS(SVG_NS, 'radialGradient');
    grad.setAttribute('id', haloId);
    grad.setAttribute('cx', '50%'); grad.setAttribute('cy', '50%');
    grad.setAttribute('r', '50%');
    const hs1 = document.createElementNS(SVG_NS, 'stop');
    hs1.setAttribute('offset', '0%');
    hs1.setAttribute('stop-color', color);
    hs1.setAttribute('stop-opacity', '0.13');
    const hs2 = document.createElementNS(SVG_NS, 'stop');
    hs2.setAttribute('offset', '100%');
    hs2.setAttribute('stop-color', color);
    hs2.setAttribute('stop-opacity', '0');
    grad.appendChild(hs1); grad.appendChild(hs2);
    defs.appendChild(grad);
  }
  const halo = document.createElementNS(SVG_NS, 'ellipse');
  halo.setAttribute('cx', '0');
  halo.setAttribute('cy', '0');
  halo.setAttribute('rx', String(rx * 2));
  halo.setAttribute('ry', String(rx * 1.4));
  halo.setAttribute('fill', `url(#${haloId})`);
  innerG.appendChild(halo);

  // Highlight glow (behind shape)
  if (entity.highlight) {
    const hRx = rx + 3;
    const hRy = ry + 2;
    const hTopY = topY - 3;
    const hBotY = topY + size * 0.55 + 3;
    const glowPath = document.createElementNS(SVG_NS, 'path');
    glowPath.setAttribute('d', [
      `M ${-hRx} ${hTopY}`,
      `A ${hRx} ${hRy} 0 0 1 ${hRx} ${hTopY}`,
      `L ${hRx} ${hBotY}`,
      `A ${hRx} ${hRy} 0 0 1 ${-hRx} ${hBotY}`,
      'Z',
    ].join(' '));
    glowPath.setAttribute('stroke-width', String(STROKE.default));
    glowPath.setAttribute('stroke-dasharray', '4,4');
    applyGlowColors(glowPath, cc);
    innerG.appendChild(glowPath);
  }

  // Outer color glow on cylinder body
  const glowUrl = ensureGlowFilter(parentEl, color);
  const glowBody = document.createElementNS(SVG_NS, 'rect');
  glowBody.setAttribute('x', String(-rx));
  glowBody.setAttribute('y', String(topY));
  glowBody.setAttribute('width', String(rx * 2));
  glowBody.setAttribute('height', String(size * 0.55));
  glowBody.setAttribute('fill', 'none');
  glowBody.setAttribute('stroke', color);
  glowBody.setAttribute('stroke-width', '1');
  glowBody.setAttribute('stroke-opacity', '0.4');
  glowBody.setAttribute('filter', glowUrl);
  innerG.appendChild(glowBody);

  renderCylinderBase(innerG, parentEl, {
    size,
    color: cc.base,
    gradId,
    stripeOffsets: [],
    glass: false,
  });

  // ── Glowing status dots on top cap ───────────────────────────────────
  const dotOpacities = [0.9, 0.7, 0.5];
  const dotXOffsets = [-rx * 0.4, 0, rx * 0.4];

  dotXOffsets.forEach((xOff, i) => {
    const dotGlowId = `dbDot${i}_${entityId}`;
    if (!defs.querySelector(`#${dotGlowId}`)) {
      const filter = document.createElementNS(SVG_NS, 'filter');
      filter.setAttribute('id', dotGlowId);
      filter.setAttribute('x', '-100%'); filter.setAttribute('y', '-100%');
      filter.setAttribute('width', '300%'); filter.setAttribute('height', '300%');
      const ds = document.createElementNS(SVG_NS, 'feDropShadow');
      ds.setAttribute('dx', '0'); ds.setAttribute('dy', '0');
      ds.setAttribute('stdDeviation', '3');
      ds.setAttribute('flood-color', color);
      ds.setAttribute('flood-opacity', String(dotOpacities[i]));
      filter.appendChild(ds);
      defs.appendChild(filter);
    }
    const dot = document.createElementNS(SVG_NS, 'circle');
    dot.setAttribute('cx', String(xOff));
    dot.setAttribute('cy', String(topY));
    dot.setAttribute('r', String(Math.max(2.5, rx * 0.07)));
    dot.setAttribute('fill', color);
    dot.setAttribute('opacity', String(dotOpacities[i]));
    dot.setAttribute('filter', `url(#${dotGlowId})`);
    innerG.appendChild(dot);
  });

  // Label below
  if (entity.label) {
    const text = document.createElementNS(SVG_NS, 'text');
    text.setAttribute('x', '0');
    text.setAttribute('y', String(getCylinderLabelY(size)));
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
