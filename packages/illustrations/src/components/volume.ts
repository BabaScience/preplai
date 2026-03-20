/**
 * @preplai/illustrations — Volume Component
 *
 * Clean cylinder with no interior decorations.
 * Use for: persistent volumes, storage, Docker named volumes.
 *
 * Minimalist style matching the Composable engine aesthetic.
 */

import { SVG_NS, buildEntityGroup, applyEntranceAnimation, getSizeParam } from '../utils.js';
import { getCategoryColor, TYPOGRAPHY, STROKE, LABEL_DEFAULTS, colorWithAlpha, OPACITY } from '../design-tokens.js';
import { renderCylinderBase, getCylinderLabelY } from '../cylinder-utils.js';
import type { VisualEntity } from '@preplai/shared';

export function renderVolume(entity: VisualEntity, parentEl: SVGElement): SVGGElement {
  const { outerG, innerG } = buildEntityGroup(entity);
  const size = getSizeParam(entity);
  const color = entity.color ?? getCategoryColor('Volume');
  const gradId = `grad-volume-${color.replace(/[^a-fA-F0-9]/g, '')}`;
  const bodyH = size * 0.5;

  // Highlight glow
  if (entity.highlight) {
    const rx = size / 2.2 + 3;
    const ry = size / 6 + 2;
    const topY = -size / 3 - 3;
    const botY = topY + bodyH + 6;

    const glowPath = document.createElementNS(SVG_NS, 'path');
    glowPath.setAttribute('d', [
      `M ${-rx} ${topY}`,
      `A ${rx} ${ry} 0 0 1 ${rx} ${topY}`,
      `L ${rx} ${botY}`,
      `A ${rx} ${ry} 0 0 1 ${-rx} ${botY}`,
      'Z',
    ].join(' '));
    glowPath.setAttribute('fill', 'none');
    glowPath.setAttribute('stroke', colorWithAlpha(color, OPACITY.strokeMuted));
    glowPath.setAttribute('stroke-width', String(STROKE.default));
    glowPath.setAttribute('stroke-dasharray', '4,4');
    innerG.appendChild(glowPath);
  }

  renderCylinderBase(innerG, parentEl, {
    size,
    color,
    gradId,
    stripeOffsets: [],
    rx: size / 2.2,
    bodyH,
    glass: false,
  });

  // Label below
  if (entity.label) {
    const text = document.createElementNS(SVG_NS, 'text');
    text.setAttribute('x', '0');
    text.setAttribute('y', String(getCylinderLabelY(size, bodyH)));
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
