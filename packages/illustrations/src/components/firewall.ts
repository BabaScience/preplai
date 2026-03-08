/**
 * @preplai/illustrations — Firewall Component
 *
 * Vertical brick wall — a barrier between networks. Use for: security boundaries, network firewalls.
 *
 * @see METADATA_SCHEMAS.md#firewall
 */

import { SVG_NS, buildEntityGroup, applyEntranceAnimation, getSizeParam } from '../utils.js';
import { createLinearGradient, ensureDefs } from '../visual-utils.js';
import {
  getCategoryColor,
  getStrokeWidth,
  getLabelFontSize,
  TYPOGRAPHY,
  STROKE,
  LABEL_DEFAULTS,
  colorWithAlpha,
  OPACITY,
} from '../design-tokens.js';
import type { VisualEntity } from '@preplai/shared';

export function renderFirewall(entity: VisualEntity, parentEl: SVGElement): SVGGElement {
  const { outerG, innerG } = buildEntityGroup(entity);

  const s = getSizeParam(entity);
  const scale = s / 50;
  const color = entity.color ?? getCategoryColor('Firewall');
  const defs = ensureDefs(parentEl);
  const gradId = `grad-fw-${color.replace(/[^a-fA-F0-9]/g, '')}`;
  createLinearGradient(gradId, color, 'horizontal', defs);

  const scaleGroup = document.createElementNS(SVG_NS, 'g');
  scaleGroup.setAttribute('transform', `scale(${scale})`);

  const strokeWidth = getStrokeWidth('default', 1);
  const wallW = s * 0.22;
  const wallH = s * 0.75;

  const outerRect = document.createElementNS(SVG_NS, 'rect');
  outerRect.setAttribute('x', String(-wallW / 2));
  outerRect.setAttribute('y', String(-wallH / 2));
  outerRect.setAttribute('width', String(wallW));
  outerRect.setAttribute('height', String(wallH));
  outerRect.setAttribute('rx', '2');
  outerRect.setAttribute('fill', `url(#${gradId})`);
  outerRect.setAttribute('stroke', color);
  outerRect.setAttribute('stroke-width', String(strokeWidth));
  scaleGroup.appendChild(outerRect);

  const brickH = wallH / 3;
  const mortar = colorWithAlpha(color, OPACITY.strokeMuted);
  for (let row = 1; row < 3; row++) {
    const y = -wallH / 2 + row * brickH;
    const line = document.createElementNS(SVG_NS, 'line');
    line.setAttribute('x1', String(-wallW / 2));
    line.setAttribute('y1', String(y));
    line.setAttribute('x2', String(wallW / 2));
    line.setAttribute('y2', String(y));
    line.setAttribute('stroke', mortar);
    line.setAttribute('stroke-width', String(STROKE.minimal));
    scaleGroup.appendChild(line);
  }

  innerG.appendChild(scaleGroup);

  if (entity.label) {
    const label = document.createElementNS(SVG_NS, 'text');
    label.setAttribute('x', '0');
    label.setAttribute('y', String(wallH / 2 * scale + LABEL_DEFAULTS.offsetBelow));
    label.setAttribute('text-anchor', LABEL_DEFAULTS.textAnchor);
    label.setAttribute('fill', color);
    label.setAttribute('font-size', String(getLabelFontSize('label', scale)));
    label.setAttribute('font-weight', String(TYPOGRAPHY.fontWeightLabel));
    label.setAttribute('font-family', TYPOGRAPHY.fontLabel);
    label.textContent = entity.label;
    innerG.appendChild(label);
  }

  applyEntranceAnimation(innerG, entity);
  parentEl.appendChild(outerG);
  return outerG;
}
