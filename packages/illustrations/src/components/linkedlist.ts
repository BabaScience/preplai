/**
 * @preplai/illustrations — LinkedList Component
 * Chain of node boxes (value + next pointer) with arrow connectors
 */

import { SVG_NS, buildEntityGroup, applyEntranceAnimation, getSizeParam } from '../utils.js';
import { createLinearGradient, ensureDefs } from '../visual-utils.js';
import { getCategoryColor, TYPOGRAPHY } from '../design-tokens.js';
import type { VisualEntity } from '@preplai/shared';

export function renderLinkedList(entity: VisualEntity, parentEl: SVGElement): SVGGElement {
  const { outerG, innerG } = buildEntityGroup(entity);

  const s = getSizeParam(entity, 1.5);
  const color = entity.color ?? getCategoryColor('LinkedList');
  const defs = ensureDefs(parentEl);
  const gradId = `grad-ll-${color.replace(/[^a-fA-F0-9]/g, '')}`;
  createLinearGradient(gradId, color, 'vertical', defs);

  const meta = entity.metadata ?? {};
  const values = (meta.values as (string | number)[]) ?? [1, 2, 3];
  const visibleValues = values.slice(0, 4);

  const nodeW = 36;
  const nodeH = 28;
  const gap = 20;
  const totalW = visibleValues.length * (nodeW + gap) - gap;
  const startX = -totalW / 2 + (nodeW + gap) / 2;

  visibleValues.forEach((val, i) => {
    const x = startX + i * (nodeW + gap);

    const node = document.createElementNS(SVG_NS, 'rect');
    node.setAttribute('x', String(x - nodeW / 2));
    node.setAttribute('y', String(-nodeH / 2));
    node.setAttribute('width', String(nodeW));
    node.setAttribute('height', String(nodeH));
    node.setAttribute('rx', '4');
    node.setAttribute('fill', `url(#${gradId})`);
    node.setAttribute('stroke', color);
    node.setAttribute('stroke-width', '2');
    innerG.appendChild(node);

    const valueText = document.createElementNS(SVG_NS, 'text');
    valueText.setAttribute('x', String(x - 6));
    valueText.setAttribute('y', String(4));
    valueText.setAttribute('text-anchor', 'middle');
    valueText.setAttribute('fill', color);
    valueText.setAttribute('font-size', '12');
    valueText.setAttribute('font-weight', '600');
    valueText.setAttribute('font-family', TYPOGRAPHY.fontBadge);
    valueText.textContent = String(val);
    innerG.appendChild(valueText);

    if (i < visibleValues.length - 1) {
      const line = document.createElementNS(SVG_NS, 'line');
      line.setAttribute('x1', String(x + nodeW / 2));
      line.setAttribute('y1', '0');
      line.setAttribute('x2', String(x + nodeW / 2 + gap));
      line.setAttribute('y2', '0');
      line.setAttribute('stroke', color);
      line.setAttribute('stroke-width', '2');
      line.setAttribute('opacity', '0.8');
      innerG.appendChild(line);
    }
  });

  if (entity.label) {
    const text = document.createElementNS(SVG_NS, 'text');
    text.setAttribute('x', '0');
    text.setAttribute('y', String(nodeH / 2 + 18));
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
