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
import type { VisualEntity } from '@preplai/shared';

export function renderQueue(entity: VisualEntity, parentEl: SVGElement): SVGGElement {
  const { outerG, innerG } = buildEntityGroup(entity);

  const s = getSizeParam(entity);
  const scale = s / 50;
  const cc = resolveColorCascade(entity);

  const meta = entity.metadata ?? {};
  const values = (meta.values as (string | number)[]) ?? [1, 2, 3];
  const visibleValues = values.slice(0, 5);

  const cellW = 26;
  const cellH = 22;
  const gap = 6;
  const totalW = visibleValues.length * cellW + (visibleValues.length - 1) * gap;
  const startX = -totalW / 2 + cellW / 2;

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

  visibleValues.forEach((val, i) => {
    const x = startX + i * (cellW + gap);

    const cell = document.createElementNS(SVG_NS, 'rect');
    cell.setAttribute('x', String(x - cellW / 2));
    cell.setAttribute('y', String(-cellH / 2));
    cell.setAttribute('width', String(cellW));
    cell.setAttribute('height', String(cellH));
    cell.setAttribute('rx', '4');
    cell.setAttribute('fill', cc.fill);
    cell.setAttribute('stroke', cc.stroke);
    cell.setAttribute('stroke-width', String(getStrokeWidth('thin', scale)));
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
    text.setAttribute('font-weight', String(TYPOGRAPHY.fontWeightLabel));
    text.setAttribute('font-family', TYPOGRAPHY.fontLabel);
    text.textContent = entity.label;
    innerG.appendChild(text);
  }

  applyEntranceAnimation(innerG, entity);
  parentEl.appendChild(outerG);
  return outerG;
}
