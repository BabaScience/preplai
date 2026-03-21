/**
 * @preplai/illustrations — CPU Component
 *
 * Clean square chip with simple grid icon inside.
 * Use for: processor diagrams, CPU vs GPU, instruction pipelines.
 *
 * Minimalist style matching the Composable engine aesthetic.
 */

import { SVG_NS, buildEntityGroup, applyEntranceAnimation, getSizeParam } from '../utils.js';
import { getCategoryColor, TYPOGRAPHY, SHAPES, STROKE, LABEL_DEFAULTS, colorWithAlpha, OPACITY } from '../design-tokens.js';
import type { VisualEntity } from '@preplai/shared';

export function renderCPU(entity: VisualEntity, parentEl: SVGElement): SVGGElement {
  const { outerG, innerG } = buildEntityGroup(entity);

  const s = getSizeParam(entity);
  const color = entity.color ?? getCategoryColor('CPU');

  const size = s * 0.7;
  const half = size / 2;

  // Highlight glow
  if (entity.highlight) {
    const glow = document.createElementNS(SVG_NS, 'rect');
    glow.setAttribute('x', String(-half - 3));
    glow.setAttribute('y', String(-half - 3));
    glow.setAttribute('width', String(size + 6));
    glow.setAttribute('height', String(size + 6));
    glow.setAttribute('rx', String(SHAPES.borderRadius + 2));
    glow.setAttribute('fill', 'none');
    glow.setAttribute('stroke', colorWithAlpha(color, OPACITY.strokeMuted));
    glow.setAttribute('stroke-width', String(STROKE.default));
    glow.setAttribute('stroke-dasharray', '4,4');
    innerG.appendChild(glow);
  }

  // Chip body (square)
  const die = document.createElementNS(SVG_NS, 'rect');
  die.setAttribute('x', String(-half));
  die.setAttribute('y', String(-half));
  die.setAttribute('width', String(size));
  die.setAttribute('height', String(size));
  die.setAttribute('rx', String(SHAPES.borderRadius));
  die.setAttribute('fill', colorWithAlpha(color, OPACITY.fillLight));
  die.setAttribute('stroke', color);
  die.setAttribute('stroke-width', String(STROKE.default));
  innerG.appendChild(die);

  // Grid icon (2x2 squares) inside
  const cellSize = size * 0.15;
  const gap = size * 0.06;
  const offsets = [-(cellSize + gap / 2), gap / 2];
  for (const ox of offsets) {
    for (const oy of offsets) {
      const cell = document.createElementNS(SVG_NS, 'rect');
      cell.setAttribute('x', String(ox));
      cell.setAttribute('y', String(oy));
      cell.setAttribute('width', String(cellSize));
      cell.setAttribute('height', String(cellSize));
      cell.setAttribute('rx', '1');
      cell.setAttribute('fill', 'none');
      cell.setAttribute('stroke', color);
      cell.setAttribute('stroke-width', String(STROKE.default));
      innerG.appendChild(cell);
    }
  }

  // Label below
  if (entity.label) {
    const text = document.createElementNS(SVG_NS, 'text');
    text.setAttribute('x', '0');
    text.setAttribute('y', String(half + LABEL_DEFAULTS.offsetBelow));
    text.setAttribute('text-anchor', LABEL_DEFAULTS.textAnchor);
    text.setAttribute('fill', color);
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
