/**
 * @preplai/illustrations — Vector Component
 *
 * Renders a single vector as an arrow from origin.
 * Use for: physics, linear algebra, force/velocity vectors.
 *
 * Metadata:
 *   dx, dy: number — vector components (default 3, 2)
 *   label?: string — label near arrow (e.g. "v⃗", "F")
 *   showMagnitude?: boolean — show |v| below arrow
 */

import { SVG_NS, buildEntityGroup, applyEntranceAnimation, getSizeParam } from '../utils.js';
import {
  getCategoryColor,
  getStrokeWidth,
  getLabelFontSize,
  TYPOGRAPHY,
  LABEL_DEFAULTS,
} from '../design-tokens.js';
import type { VisualEntity } from '@preplai/shared';

const UNIT_SCALE = 12;
const HEAD_LEN = 10;

export function renderVector(entity: VisualEntity, parentEl: SVGElement): SVGGElement {
  const { outerG, innerG } = buildEntityGroup(entity);

  const s = getSizeParam(entity);
  const scale = s / 50;
  const color = entity.color ?? getCategoryColor('Vector');
  const strokeWidth = getStrokeWidth('thin', scale);
  const fontSize = getLabelFontSize('value', scale);

  const meta = entity.metadata ?? {};
  let dx = Number(meta.dx);
  let dy = Number(meta.dy);
  if (Number.isNaN(dx)) dx = 3;
  if (Number.isNaN(dy)) dy = 2;
  if (dx === 0 && dy === 0) dx = 1;
  const label = (meta.label as string) ?? '';
  const showMagnitude = meta.showMagnitude === true;

  const unitScale = UNIT_SCALE * scale;
  const ox = 0;
  const oy = 0;
  const ex = dx * unitScale;
  const ey = -dy * unitScale;

  // Origin dot
  const origin = document.createElementNS(SVG_NS, 'circle');
  origin.setAttribute('cx', String(ox));
  origin.setAttribute('cy', String(oy));
  origin.setAttribute('r', String(3 * scale));
  origin.setAttribute('fill', color);
  origin.setAttribute('stroke', color);
  origin.setAttribute('stroke-width', String(strokeWidth));
  innerG.appendChild(origin);

  // Arrow line
  const line = document.createElementNS(SVG_NS, 'line');
  line.setAttribute('x1', String(ox));
  line.setAttribute('y1', String(oy));
  line.setAttribute('x2', String(ex));
  line.setAttribute('y2', String(ey));
  line.setAttribute('stroke', color);
  line.setAttribute('stroke-width', String(strokeWidth * 1.5));
  line.setAttribute('stroke-linecap', 'round');
  innerG.appendChild(line);

  // Arrowhead
  const angle = Math.atan2(ey - oy, ex - ox);
  const headScale = scale;
  const ax = ex - HEAD_LEN * headScale * Math.cos(angle);
  const ay = ey - HEAD_LEN * headScale * Math.sin(angle);
  const arrow = document.createElementNS(SVG_NS, 'polygon');
  arrow.setAttribute(
    'points',
    `${ex},${ey} ${ax + HEAD_LEN * 0.5 * headScale * Math.cos(angle - Math.PI / 2)},${ay + HEAD_LEN * 0.5 * headScale * Math.sin(angle - Math.PI / 2)} ${ax + HEAD_LEN * 0.5 * headScale * Math.cos(angle + Math.PI / 2)},${ay + HEAD_LEN * 0.5 * headScale * Math.sin(angle + Math.PI / 2)}`,
  );
  arrow.setAttribute('fill', color);
  innerG.appendChild(arrow);

  // Label (offset from arrow midpoint)
  const midX = (ox + ex) / 2;
  const midY = (oy + ey) / 2;
  const labelOffset = 8 * scale;

  if (label) {
    const tl = document.createElementNS(SVG_NS, 'text');
    tl.setAttribute('x', String(midX + labelOffset));
    tl.setAttribute('y', String(midY - labelOffset));
    tl.setAttribute('fill', color);
    tl.setAttribute('font-size', String(fontSize));
    tl.setAttribute('font-weight', String(TYPOGRAPHY.fontWeightEmphasis));
    tl.setAttribute('font-family', TYPOGRAPHY.fontLabel);
    tl.textContent = label;
    innerG.appendChild(tl);
  }

  if (showMagnitude) {
    const mag = Math.sqrt(dx * dx + dy * dy);
    const magText = document.createElementNS(SVG_NS, 'text');
    magText.setAttribute('x', String(midX - labelOffset));
    magText.setAttribute('y', String(midY + labelOffset + fontSize));
    magText.setAttribute('fill', color);
    magText.setAttribute('font-size', String(fontSize * 0.9));
    magText.setAttribute('font-family', TYPOGRAPHY.fontBadge);
    magText.textContent = `|v| = ${mag.toFixed(2)}`;
    innerG.appendChild(magText);
  }

  // Entity label below
  if (entity.label) {
    const title = document.createElementNS(SVG_NS, 'text');
    title.setAttribute('x', '0');
    title.setAttribute('y', String(Math.max(Math.abs(ey), Math.abs(oy)) + LABEL_DEFAULTS.offsetBelow));
    title.setAttribute('text-anchor', LABEL_DEFAULTS.textAnchor);
    title.setAttribute('fill', color);
    title.setAttribute('font-size', String(getLabelFontSize('label', scale)));
    title.setAttribute('font-weight', String(TYPOGRAPHY.fontWeightLabel));
    title.setAttribute('font-family', TYPOGRAPHY.fontLabel);
    title.textContent = entity.label;
    innerG.appendChild(title);
  }

  applyEntranceAnimation(innerG, entity);
  parentEl.appendChild(outerG);
  return outerG;
}
