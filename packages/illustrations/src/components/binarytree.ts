/**
 * @preplai/illustrations — BinaryTree Component
 * Tree layout: root + children with connecting lines
 */

import { SVG_NS, buildEntityGroup, applyEntranceAnimation, getSizeParam } from '../utils.js';
import { createRadialGradient, ensureDefs } from '../visual-utils.js';
import { getCategoryColor, TYPOGRAPHY } from '../design-tokens.js';
import { treeLayout, type BinaryTreeNode } from '../layouts/index.js';
import type { VisualEntity } from '@preplai/shared';

export function renderBinaryTree(entity: VisualEntity, parentEl: SVGElement): SVGGElement {
  const { outerG, innerG } = buildEntityGroup(entity);

  const s = getSizeParam(entity, 1.5);
  const color = entity.color ?? getCategoryColor('BinaryTree');
  const defs = ensureDefs(parentEl);
  const gradId = `grad-bt-${color.replace(/[^a-fA-F0-9]/g, '')}`;
  createRadialGradient(gradId, color, defs);

  const meta = entity.metadata ?? {};
  const treeData = meta.tree as BinaryTreeNode | undefined;
  const tree: BinaryTreeNode = treeData ?? {
    value: 5,
    left: { value: 3, left: { value: 1 }, right: { value: 4 } },
    right: { value: 8, left: { value: 6 }, right: { value: 9 } },
  };

  const dx = s * 0.5;
  const dy = s * 0.35;
  const { nodes, edges } = treeLayout(tree, 0, -s / 3, dx, dy);

  edges.forEach(({ x1, y1, x2, y2 }) => {
    const line = document.createElementNS(SVG_NS, 'line');
    line.setAttribute('x1', String(x1));
    line.setAttribute('y1', String(y1));
    line.setAttribute('x2', String(x2));
    line.setAttribute('y2', String(y2));
    line.setAttribute('stroke', color);
    line.setAttribute('stroke-width', '2');
    line.setAttribute('opacity', '0.7');
    innerG.appendChild(line);
  });

  nodes.forEach(({ x, y, value }) => {
    const circle = document.createElementNS(SVG_NS, 'circle');
    circle.setAttribute('cx', String(x));
    circle.setAttribute('cy', String(y));
    circle.setAttribute('r', '12');
    circle.setAttribute('fill', `url(#${gradId})`);
    circle.setAttribute('stroke', color);
    circle.setAttribute('stroke-width', '2');
    innerG.appendChild(circle);

    const text = document.createElementNS(SVG_NS, 'text');
    text.setAttribute('x', String(x));
    text.setAttribute('y', String(y + 4));
    text.setAttribute('text-anchor', 'middle');
    text.setAttribute('fill', color);
    text.setAttribute('font-size', '10');
    text.setAttribute('font-weight', '600');
    text.setAttribute('font-family', TYPOGRAPHY.fontBadge);
    text.textContent = String(value);
    innerG.appendChild(text);
  });

  if (entity.label) {
    const text = document.createElementNS(SVG_NS, 'text');
    text.setAttribute('x', '0');
    text.setAttribute('y', String(s / 2 + 18));
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
