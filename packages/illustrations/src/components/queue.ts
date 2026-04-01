/**
 * @preplai/illustrations — Queue Component
 *
 * Clean horizontal cells with values. No directional arrows.
 * Use for: message queues, task queues, FIFO buffers.
 *
 * Minimalist style matching the Composable engine aesthetic:
 * - Horizontal row of clean rounded cells
 * - Subtle gradient fill
 * - Thin stroke
 * - Label below
 * - Optional highlight glow
 */

import { SVG_NS, buildEntityGroup, applyEntranceAnimation, getSizeParam } from '../utils.js';
import { TYPOGRAPHY, STROKE, LABEL_DEFAULTS, getLabelFontSize, getStrokeWidth } from '../design-tokens.js';
import { resolveColorCascade, applyGlowColors } from '../color-cascade.js';
import { ensureDefs, ensureGlowFilter } from '../visual-utils.js';
import type { VisualEntity } from '@preplai/shared';

export function renderQueue(entity: VisualEntity, parentEl: SVGElement): SVGGElement {
  const { outerG, innerG } = buildEntityGroup(entity);

  const s = getSizeParam(entity);
  const scale = s / 50;
  const cc = resolveColorCascade(entity);
  const color = cc.base;
  const entityId = (entity.id ?? Math.random().toString(36).slice(2)).replace(/[^a-zA-Z0-9]/g, '').slice(0, 8);

  const meta = entity.metadata ?? {};
  const values = (meta.values as (string | number)[]) ?? [1, 2, 3];
  const visibleValues = values.slice(0, 5);

  const cellW = 26;
  const cellH = 22;
  const gap = 6;
  const totalW = visibleValues.length * cellW + (visibleValues.length - 1) * gap;
  const startX = -totalW / 2 + cellW / 2;

  const defs = ensureDefs(parentEl);

  // ── Radial depth halo ────────────────────────────────────────────────
  const haloId = `queue-halo-${entityId}`;
  if (!defs.querySelector(`#${haloId}`)) {
    const haloGrad = document.createElementNS(SVG_NS, 'radialGradient');
    haloGrad.setAttribute('id', haloId);
    haloGrad.setAttribute('cx', '50%'); haloGrad.setAttribute('cy', '50%');
    haloGrad.setAttribute('r', '50%');
    const hhs1 = document.createElementNS(SVG_NS, 'stop');
    hhs1.setAttribute('offset', '0%');
    hhs1.setAttribute('stop-color', color);
    hhs1.setAttribute('stop-opacity', '0.13');
    const hhs2 = document.createElementNS(SVG_NS, 'stop');
    hhs2.setAttribute('offset', '100%');
    hhs2.setAttribute('stop-color', color);
    hhs2.setAttribute('stop-opacity', '0');
    haloGrad.appendChild(hhs1); haloGrad.appendChild(hhs2);
    defs.appendChild(haloGrad);
  }
  const halo = document.createElementNS(SVG_NS, 'ellipse');
  halo.setAttribute('cx', '0');
  halo.setAttribute('cy', '0');
  halo.setAttribute('rx', String(totalW * 0.7));
  halo.setAttribute('ry', String(cellH * 1.5));
  halo.setAttribute('fill', `url(#${haloId})`);
  innerG.appendChild(halo);

  // ── Cell gradient (per-color, shared across cells) ───────────────────
  const cellGradId = `queue-cell-${entityId}`;
  if (!defs.querySelector(`#${cellGradId}`)) {
    const cellGrad = document.createElementNS(SVG_NS, 'linearGradient');
    cellGrad.setAttribute('id', cellGradId);
    cellGrad.setAttribute('x1', '0%'); cellGrad.setAttribute('y1', '0%');
    cellGrad.setAttribute('x2', '0%'); cellGrad.setAttribute('y2', '100%');
    const cgs1 = document.createElementNS(SVG_NS, 'stop');
    cgs1.setAttribute('offset', '0%');
    cgs1.setAttribute('stop-color', color);
    cgs1.setAttribute('stop-opacity', '0.45');
    const cgs2 = document.createElementNS(SVG_NS, 'stop');
    cgs2.setAttribute('offset', '100%');
    cgs2.setAttribute('stop-color', color);
    cgs2.setAttribute('stop-opacity', '0.22');
    cellGrad.appendChild(cgs1); cellGrad.appendChild(cgs2);
    defs.appendChild(cellGrad);
  }

  // Highlight glow (behind cells)
  if (entity.highlight) {
    const glow = document.createElementNS(SVG_NS, 'rect');
    glow.setAttribute('x', String(-totalW / 2 - 5));
    glow.setAttribute('y', String(-cellH / 2 - 5));
    glow.setAttribute('width', String(totalW + 10));
    glow.setAttribute('height', String(cellH + 10));
    glow.setAttribute('rx', '6');
    glow.setAttribute('stroke-width', String(STROKE.default));
    glow.setAttribute('stroke-dasharray', '4,4');
    applyGlowColors(glow, cc);
    innerG.appendChild(glow);
  }

  const glowUrl = ensureGlowFilter(parentEl, color);

  visibleValues.forEach((val, i) => {
    const x = startX + i * (cellW + gap);

    const cell = document.createElementNS(SVG_NS, 'rect');
    cell.setAttribute('x', String(x - cellW / 2));
    cell.setAttribute('y', String(-cellH / 2));
    cell.setAttribute('width', String(cellW));
    cell.setAttribute('height', String(cellH));
    cell.setAttribute('rx', '4');
    cell.setAttribute('fill', `url(#${cellGradId})`);
    cell.setAttribute('stroke', cc.stroke);
    cell.setAttribute('stroke-width', String(getStrokeWidth('thin', scale)));
    if (i === 0) cell.setAttribute('filter', glowUrl);
    innerG.appendChild(cell);

    const valueText = document.createElementNS(SVG_NS, 'text');
    valueText.setAttribute('x', String(x));
    valueText.setAttribute('y', String(4));
    valueText.setAttribute('text-anchor', 'middle');
    valueText.setAttribute('fill', cc.textPrimary);
    valueText.setAttribute('font-size', String(getLabelFontSize('value', scale)));
    valueText.setAttribute('font-weight', String(TYPOGRAPHY.fontWeightLabel));
    valueText.setAttribute('font-family', TYPOGRAPHY.fontBadge);
    valueText.textContent = String(val);
    innerG.appendChild(valueText);
  });

  // Label below
  if (entity.label) {
    const text = document.createElementNS(SVG_NS, 'text');
    text.setAttribute('x', '0');
    text.setAttribute('y', String(cellH / 2 + LABEL_DEFAULTS.offsetBelow));
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
