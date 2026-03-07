/**
 * @preplai/illustrations — LinkedList Component
 * Chain of node boxes (value + next pointer) with arrow connectors
 *
 * Layout in design units; uniform scale transform so size changes scale the whole illustration.
 */

import { SVG_NS, buildEntityGroup, applyEntranceAnimation, getSizeParam } from '../utils.js';
import { createLinearGradient, ensureDefs } from '../visual-utils.js';
import { getCategoryColor, TYPOGRAPHY, SHAPES } from '../design-tokens.js';
import type { VisualEntity } from '@preplai/shared';

const DESIGN_NODE_W = 48;
const DESIGN_NODE_H = 28;
const DESIGN_GAP = 24;

/** Truncate node value to fit within node width (approx 6px per char). */
function truncateNodeValue(text: string, maxWidth: number): string {
  const maxChars = Math.max(1, Math.floor((maxWidth - 16) / 6));
  const s = String(text);
  if (s.length <= maxChars) return s;
  return s.slice(0, maxChars - 1) + '…';
}

export function renderLinkedList(entity: VisualEntity, parentEl: SVGElement): SVGGElement {
  const { outerG, innerG } = buildEntityGroup(entity);

  const s = getSizeParam(entity);
  const color = entity.color ?? getCategoryColor('LinkedList');
  const defs = ensureDefs(parentEl);
  const gradId = `grad-ll-${color.replace(/[^a-fA-F0-9]/g, '')}`;
  createLinearGradient(gradId, color, 'vertical', defs);

  const meta = entity.metadata ?? {};
  const values = (meta.values as (string | number)[]) ?? [1, 2, 3];
  const visibleValues = values.slice(0, 6);

  const nodeW = DESIGN_NODE_W;
  const nodeH = DESIGN_NODE_H;
  const gap = DESIGN_GAP;
  const totalW = visibleValues.length * (nodeW + gap) - gap;
  const startX = -totalW / 2 + (nodeW + gap) / 2;

  const scale = s / 50;
  const scaleGroup = document.createElementNS(SVG_NS, 'g');
  scaleGroup.setAttribute('transform', `scale(${scale})`);

  visibleValues.forEach((val, i) => {
    const x = startX + i * (nodeW + gap);

    const node = document.createElementNS(SVG_NS, 'rect');
    node.setAttribute('x', String(x - nodeW / 2));
    node.setAttribute('y', String(-nodeH / 2));
    node.setAttribute('width', String(nodeW));
    node.setAttribute('height', String(nodeH));
    node.setAttribute('rx', String(SHAPES.borderRadius));
    node.setAttribute('fill', `url(#${gradId})`);
    node.setAttribute('stroke', color);
    node.setAttribute('stroke-width', String(SHAPES.strokeWidth));
    scaleGroup.appendChild(node);

    const displayVal = truncateNodeValue(String(val), nodeW);
    const valueText = document.createElementNS(SVG_NS, 'text');
    valueText.setAttribute('x', String(x));
    valueText.setAttribute('y', String(4));
    valueText.setAttribute('text-anchor', 'middle');
    valueText.setAttribute('fill', color);
    valueText.setAttribute('font-size', '12');
    valueText.setAttribute('font-weight', '600');
    valueText.setAttribute('font-family', TYPOGRAPHY.fontBadge);
    valueText.textContent = displayVal;
    scaleGroup.appendChild(valueText);

    if (i < visibleValues.length - 1) {
      const line = document.createElementNS(SVG_NS, 'line');
      line.setAttribute('x1', String(x + nodeW / 2));
      line.setAttribute('y1', '0');
      line.setAttribute('x2', String(x + nodeW / 2 + gap));
      line.setAttribute('y2', '0');
      line.setAttribute('stroke', color);
      line.setAttribute('stroke-width', String(SHAPES.strokeWidth));
      line.setAttribute('opacity', '0.8');
      scaleGroup.appendChild(line);
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
    scaleGroup.appendChild(text);
  }

  innerG.appendChild(scaleGroup);

  applyEntranceAnimation(innerG, entity);
  parentEl.appendChild(outerG);
  return outerG;
}
