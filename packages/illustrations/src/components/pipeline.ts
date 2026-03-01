/**
 * @pre/illustrations — Pipeline Component
 * CI/CD pipeline: 4 chevron segments in sequence
 */

import { SVG_NS, buildEntityGroup, applyEntranceAnimation, getSizeParam } from '../utils.js';
import { createLinearGradient, ensureDefs } from '../visual-utils.js';
import { getCategoryColor, TYPOGRAPHY } from '../design-tokens.js';
import type { VisualEntity } from '@pre/shared';

export function renderPipeline(entity: VisualEntity, parentEl: SVGElement): SVGGElement {
  const { outerG, innerG } = buildEntityGroup(entity);

  const s = getSizeParam(entity);
  const color = entity.color ?? getCategoryColor('Pipeline');
  const defs = ensureDefs(parentEl);
  const gradId = `grad-pipeline-${color.replace(/[^a-fA-F0-9]/g, '')}`;
  createLinearGradient(gradId, color, 'vertical', defs);

  const segW = s * 0.35;
  const segH = s * 0.5;
  const gap = s * 0.08;
  const totalW = segW * 4 + gap * 3;

  for (let i = 0; i < 4; i++) {
    const x = -totalW / 2 + i * (segW + gap) + segW / 2 + gap / 2;
    // Chevron shape (simplified as a path)
    const chevronPath = [
      `M ${x - segW / 2} 0`,
      `L ${x} ${-segH / 2}`,
      `L ${x + segW / 2} 0`,
      `L ${x} ${segH / 2}`,
      'Z',
    ].join(' ');
    const seg = document.createElementNS(SVG_NS, 'path');
    seg.setAttribute('d', chevronPath);
    seg.setAttribute('fill', `url(#${gradId})`);
    seg.setAttribute('stroke', color);
    seg.setAttribute('stroke-width', '2');
    seg.setAttribute('opacity', String(1 - i * 0.08));
    innerG.appendChild(seg);

    if (i < 3) {
      const conn = document.createElementNS(SVG_NS, 'line');
      conn.setAttribute('x1', String(x + segW / 2));
      conn.setAttribute('y1', '0');
      conn.setAttribute('x2', String(x + segW / 2 + gap));
      conn.setAttribute('y2', '0');
      conn.setAttribute('stroke', color);
      conn.setAttribute('stroke-width', '1.5');
      conn.setAttribute('opacity', '0.6');
      innerG.appendChild(conn);
    }
  }

  if (entity.label) {
    const text = document.createElementNS(SVG_NS, 'text');
    text.setAttribute('x', '0');
    text.setAttribute('y', String(s / 2 + 20));
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
