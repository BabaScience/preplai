/**
 * @preplai/illustrations — Cache Component
 *
 * Clean cylinder with a simple lightning bolt icon inside.
 * Use for: caches, Redis, Memcached, fast storage layers.
 *
 * Minimalist style matching the Composable engine aesthetic:
 * - Clean cylinder shape (shared cylinder-utils)
 * - Simple stroke-based lightning bolt icon (no glow filter)
 * - Thin stroke
 * - Label below
 * - Optional highlight glow
 */

import { SVG_NS, buildEntityGroup, applyEntranceAnimation, getSizeParam } from '../utils.js';
import { getCategoryColor, TYPOGRAPHY, STROKE, LABEL_DEFAULTS, colorWithAlpha, OPACITY } from '../design-tokens.js';
import { renderCylinderBase, getCylinderLabelY } from '../cylinder-utils.js';
import type { VisualEntity } from '@preplai/shared';

export function renderCache(entity: VisualEntity, parentEl: SVGElement): SVGGElement {
  const { outerG, innerG } = buildEntityGroup(entity);
  const size = getSizeParam(entity);
  const color = entity.color ?? getCategoryColor('Cache');
  const gradId = `grad-cache-${color.replace(/[^a-fA-F0-9]/g, '')}`;

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
    glass: false,
  });

  // Lightning bolt icon (stroke-based, centered in cylinder body)
  const rx = size / 2;
  const boltScale = rx * 0.35;
  const boltCY = -size / 3 + size * 0.55 * 0.45; // center of cylinder body
  const bolt = document.createElementNS(SVG_NS, 'path');
  bolt.setAttribute('d', [
    `M ${-boltScale * 0.15} ${boltCY - boltScale}`,
    `L ${boltScale * 0.4} ${boltCY - boltScale * 0.1}`,
    `L ${-boltScale * 0.1} ${boltCY - boltScale * 0.1}`,
    `L ${boltScale * 0.15} ${boltCY + boltScale}`,
    `L ${-boltScale * 0.4} ${boltCY + boltScale * 0.1}`,
    `L ${boltScale * 0.1} ${boltCY + boltScale * 0.1}`,
    'Z',
  ].join(' '));
  bolt.setAttribute('fill', 'none');
  bolt.setAttribute('stroke', color);
  bolt.setAttribute('stroke-width', String(STROKE.default));
  bolt.setAttribute('stroke-linejoin', 'round');
  innerG.appendChild(bolt);

  // Label below
  if (entity.label) {
    const text = document.createElementNS(SVG_NS, 'text');
    text.setAttribute('x', '0');
    text.setAttribute('y', String(getCylinderLabelY(size)));
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
