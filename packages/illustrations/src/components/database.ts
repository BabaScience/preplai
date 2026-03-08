/**
 * @preplai/illustrations — Database Component
 * Cylinder: top ellipse + gradient body + bottom ellipse + side lines + data stripes
 */

import { SVG_NS, buildEntityGroup, applyEntranceAnimation, getSizeParam } from '../utils.js';
import { getCategoryColor, TYPOGRAPHY } from '../design-tokens.js';
import { renderCylinderBase, getCylinderLabelY } from '../cylinder-utils.js';
import type { VisualEntity } from '@preplai/shared';

export function renderDatabase(entity: VisualEntity, parentEl: SVGElement): SVGGElement {
  const { outerG, innerG } = buildEntityGroup(entity);
  const size = getSizeParam(entity);
  const color = entity.color ?? getCategoryColor('Database');
  const gradId = `grad-db-${color.replace(/[^a-fA-F0-9]/g, '')}`;

  renderCylinderBase(innerG, parentEl, {
    size,
    color,
    gradId,
    stripeOffsets: [0.2, 0.45, 0.7],
  });

  if (entity.label) {
    const text = document.createElementNS(SVG_NS, 'text');
    text.setAttribute('x', '0');
    text.setAttribute('y', String(getCylinderLabelY(size)));
    text.setAttribute('text-anchor', 'middle');
    text.setAttribute('fill', color);
    text.setAttribute('font-size', String(TYPOGRAPHY.fontSizeTitle));
    text.setAttribute('font-weight', String(TYPOGRAPHY.fontWeightLabel));
    text.setAttribute('font-family', TYPOGRAPHY.fontLabel);
    text.textContent = entity.label;
    innerG.appendChild(text);
  }

  applyEntranceAnimation(innerG, entity);
  parentEl.appendChild(outerG);
  return outerG;
}
