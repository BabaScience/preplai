/**
 * @preplai/illustrations — Database Component
 *
 * Clean cylinder shape with no interior decorations.
 * Use for: databases, data stores, persistent storage.
 *
 * Minimalist style matching the Composable engine aesthetic:
 * - Clean cylinder (top ellipse + body + bottom ellipse)
 * - Subtle gradient fill
 * - Thin stroke
 * - Label below
 * - Optional highlight glow
 */

import { SVG_NS, buildEntityGroup, applyEntranceAnimation, getSizeParam } from '../utils.js';
import { TYPOGRAPHY, STROKE, LABEL_DEFAULTS } from '../design-tokens.js';
import { resolveColorCascade, applyGlowColors } from '../color-cascade.js';
import { renderCylinderBase, getCylinderLabelY } from '../cylinder-utils.js';
import type { VisualEntity } from '@preplai/shared';

export function renderDatabase(entity: VisualEntity, parentEl: SVGElement): SVGGElement {
  const { outerG, innerG } = buildEntityGroup(entity);
  const size = getSizeParam(entity);
  const cc = resolveColorCascade(entity);
  const gradId = `grad-db-${cc.base.replace(/[^a-fA-F0-9]/g, '')}`;

  // Highlight glow (behind shape)
  if (entity.highlight) {
    const rx = size / 2 + 3;
    const ry = size / 6 + 2;
    const topY = -size / 3 - 3;
    const bodyH = size * 0.55 + 6;
    const botY = topY + bodyH;

    const glowPath = document.createElementNS(SVG_NS, 'path');
    glowPath.setAttribute('d', [
      `M ${-rx} ${topY}`,
      `A ${rx} ${ry} 0 0 1 ${rx} ${topY}`,
      `L ${rx} ${botY}`,
      `A ${rx} ${ry} 0 0 1 ${-rx} ${botY}`,
      'Z',
    ].join(' '));
    glowPath.setAttribute('stroke-width', String(STROKE.default));
    glowPath.setAttribute('stroke-dasharray', '4,4');
    applyGlowColors(glowPath, cc);
    innerG.appendChild(glowPath);
  }

  renderCylinderBase(innerG, parentEl, {
    size,
    color: cc.base,
    gradId,
    stripeOffsets: [],
    glass: false,
  });

  // Label below
  if (entity.label) {
    const text = document.createElementNS(SVG_NS, 'text');
    text.setAttribute('x', '0');
    text.setAttribute('y', String(getCylinderLabelY(size)));
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
