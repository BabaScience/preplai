/**
 * @preplai/illustrations — Volume Component
 * Cylinder (like Database) with "persistent" cue — Docker named volume
 */

import { SVG_NS, buildEntityGroup, applyEntranceAnimation, getSizeParam } from '../utils.js';
import { getCategoryColor, TYPOGRAPHY } from '../design-tokens.js';
import { renderCylinderBase, getCylinderLabelY } from '../cylinder-utils.js';
import type { VisualEntity } from '@preplai/shared';

export function renderVolume(entity: VisualEntity, parentEl: SVGElement): SVGGElement {
  const { outerG, innerG } = buildEntityGroup(entity);
  const size = getSizeParam(entity);
  const color = entity.color ?? getCategoryColor('Volume');
  const gradId = `grad-volume-${color.replace(/[^a-fA-F0-9]/g, '')}`;
  const bodyH = size * 0.5;

  renderCylinderBase(innerG, parentEl, {
    size,
    color,
    gradId,
    stripeOffsets: [0.3, 0.6],
    rx: size / 2.2,
    bodyH,
    stripeWidthScale: 0.8,
  });

  if (entity.label) {
    const text = document.createElementNS(SVG_NS, 'text');
    text.setAttribute('x', '0');
    text.setAttribute('y', String(getCylinderLabelY(size, bodyH)));
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
