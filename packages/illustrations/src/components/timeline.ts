/**
 * @pre/illustrations — Timeline Component
 * Horizontal line + diamond marker + label
 */

import { SVG_NS, buildEntityGroup, applyEntranceAnimation, getSizeParam } from '../utils.js';
import { createLinearGradient, ensureDefs } from '../visual-utils.js';
import { getCategoryColor, TYPOGRAPHY } from '../design-tokens.js';
import type { VisualEntity } from '@pre/shared';

export function renderTimeline(entity: VisualEntity, parentEl: SVGElement): SVGGElement {
  const { outerG, innerG } = buildEntityGroup(entity);

  const s = getSizeParam(entity);
  const color = entity.color ?? getCategoryColor('Timeline');
  const defs = ensureDefs(parentEl);
  const gradId = `grad-timeline-${color.replace(/[^a-fA-F0-9]/g, '')}`;
  createLinearGradient(gradId, color, 'horizontal', defs);

  const lineLen = s * 1.6;
  const d = s / 6;

  const line = document.createElementNS(SVG_NS, 'line');
  line.setAttribute('x1', String(-lineLen / 2));
  line.setAttribute('y1', '0');
  line.setAttribute('x2', String(lineLen / 2));
  line.setAttribute('y2', '0');
  line.setAttribute('stroke', `url(#${gradId})`);
  line.setAttribute('stroke-width', '2');
  innerG.appendChild(line);

  const diamond = document.createElementNS(SVG_NS, 'polygon');
  diamond.setAttribute('points', `0,${-d} ${d},0 0,${d} ${-d},0`);
  diamond.setAttribute('fill', `${color}40`);
  diamond.setAttribute('stroke', color);
  diamond.setAttribute('stroke-width', '2');
  innerG.appendChild(diamond);

  if (entity.label) {
    const text = document.createElementNS(SVG_NS, 'text');
    text.setAttribute('x', '0');
    text.setAttribute('y', String(d + 18));
    text.setAttribute('text-anchor', 'middle');
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
