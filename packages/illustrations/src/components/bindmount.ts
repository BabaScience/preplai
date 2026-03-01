/**
 * @pre/illustrations — Bind Mount Component
 * Folder icon with bidirectional arrow (host ↔ container)
 */

import { SVG_NS, buildEntityGroup, applyEntranceAnimation, getSizeParam } from '../utils.js';
import { createLinearGradient, ensureDefs } from '../visual-utils.js';
import { getCategoryColor, TYPOGRAPHY, SHAPES } from '../design-tokens.js';
import type { VisualEntity } from '@pre/shared';

export function renderBindMount(entity: VisualEntity, parentEl: SVGElement): SVGGElement {
  const { outerG, innerG } = buildEntityGroup(entity);

  const s = getSizeParam(entity);
  const color = entity.color ?? getCategoryColor('BindMount');
  const defs = ensureDefs(parentEl);
  const gradId = `grad-bindmount-${color.replace(/[^a-fA-F0-9]/g, '')}`;
  createLinearGradient(gradId, color, 'vertical', defs);

  const w = s * 1.2;
  const h = s * 0.9;

  // ── Folder shape (rounded rect with tab)
  const folderPath = [
    `M ${-w / 2 + 6} ${-h / 2 + 4}`,
    `L ${-w / 4} ${-h / 2 + 4}`,
    `L ${-w / 4 + 4} ${-h / 2}`,
    `L ${w / 2 - 4} ${-h / 2}`,
    `Q ${w / 2} ${-h / 2} ${w / 2} ${-h / 2 + 4}`,
    `L ${w / 2} ${h / 2 - 4}`,
    `Q ${w / 2} ${h / 2} ${w / 2 - 4} ${h / 2}`,
    `L ${-w / 2 + 4} ${h / 2}`,
    `Q ${-w / 2} ${h / 2} ${-w / 2} ${h / 2 - 4}`,
    `L ${-w / 2} ${-h / 2 + 4}`,
    'Z',
  ].join(' ');
  const folder = document.createElementNS(SVG_NS, 'path');
  folder.setAttribute('d', folderPath);
  folder.setAttribute('fill', `url(#${gradId})`);
  folder.setAttribute('stroke', color);
  folder.setAttribute('stroke-width', String(SHAPES.strokeWidthThin));
  innerG.appendChild(folder);

  // ── Bidirectional arrow (horizontal, center)
  const arrowY = 0;
  const arrowLen = w * 0.5;
  const leftArrow = document.createElementNS(SVG_NS, 'line');
  leftArrow.setAttribute('x1', String(-arrowLen / 2));
  leftArrow.setAttribute('y1', String(arrowY));
  leftArrow.setAttribute('x2', String(arrowLen / 2));
  leftArrow.setAttribute('y2', String(arrowY));
  leftArrow.setAttribute('stroke', color);
  leftArrow.setAttribute('stroke-width', String(SHAPES.strokeWidthThin));
  leftArrow.setAttribute('opacity', '0.9');
  innerG.appendChild(leftArrow);

  // Arrowheads (small triangles)
  const ah = 4;
  const leftHead = document.createElementNS(SVG_NS, 'polygon');
  leftHead.setAttribute('points', `${-arrowLen / 2},${arrowY - ah} ${-arrowLen / 2 - 6},${arrowY} ${-arrowLen / 2},${arrowY + ah}`);
  leftHead.setAttribute('fill', color);
  innerG.appendChild(leftHead);
  const rightHead = document.createElementNS(SVG_NS, 'polygon');
  rightHead.setAttribute('points', `${arrowLen / 2},${arrowY - ah} ${arrowLen / 2 + 6},${arrowY} ${arrowLen / 2},${arrowY + ah}`);
  rightHead.setAttribute('fill', color);
  innerG.appendChild(rightHead);

  if (entity.label) {
    const text = document.createElementNS(SVG_NS, 'text');
    text.setAttribute('x', '0');
    text.setAttribute('y', String(h / 2 + 18));
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
