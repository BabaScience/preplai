/**
 * @pre/illustrations — BinaryTree Component
 * Tree layout: root + children with connecting lines
 */

import { SVG_NS, buildEntityGroup, applyEntranceAnimation, getSizeParam } from '../utils.js';
import { createRadialGradient, ensureDefs } from '../visual-utils.js';
import { getCategoryColor, TYPOGRAPHY } from '../design-tokens.js';
import type { VisualEntity } from '@pre/shared';

interface TreeNode {
  value: string | number;
  left?: TreeNode;
  right?: TreeNode;
}

function layoutTree(
  node: TreeNode,
  x: number,
  y: number,
  dx: number,
  dy: number,
): Array<{ x: number; y: number; value: string | number }> {
  const result: Array<{ x: number; y: number; value: string | number }> = [];
  result.push({ x, y, value: node.value });
  if (node.left) {
    result.push(...layoutTree(node.left, x - dx, y + dy, dx / 2, dy));
  }
  if (node.right) {
    result.push(...layoutTree(node.right, x + dx, y + dy, dx / 2, dy));
  }
  return result;
}

function edgesTree(
  node: TreeNode,
  x: number,
  y: number,
  dx: number,
  dy: number,
): Array<{ x1: number; y1: number; x2: number; y2: number }> {
  const result: Array<{ x1: number; y1: number; x2: number; y2: number }> = [];
  const r = 12;
  if (node.left) {
    const lx = x - dx;
    const ly = y + dy;
    result.push({ x1: x - r * 0.7, y1: y + r * 0.7, x2: lx + r * 0.7, y2: ly - r * 0.7 });
    result.push(...edgesTree(node.left, lx, ly, dx / 2, dy));
  }
  if (node.right) {
    const rx = x + dx;
    const ry = y + dy;
    result.push({ x1: x + r * 0.7, y1: y + r * 0.7, x2: rx - r * 0.7, y2: ry - r * 0.7 });
    result.push(...edgesTree(node.right, rx, ry, dx / 2, dy));
  }
  return result;
}

export function renderBinaryTree(entity: VisualEntity, parentEl: SVGElement): SVGGElement {
  const { outerG, innerG } = buildEntityGroup(entity);

  const s = getSizeParam(entity, 1.5);
  const color = entity.color ?? getCategoryColor('BinaryTree');
  const defs = ensureDefs(parentEl);
  const gradId = `grad-bt-${color.replace(/[^a-fA-F0-9]/g, '')}`;
  createRadialGradient(gradId, color, defs);

  const meta = entity.metadata ?? {};
  const treeData = meta.tree as TreeNode | undefined;
  const tree: TreeNode = treeData ?? {
    value: 5,
    left: { value: 3, left: { value: 1 }, right: { value: 4 } },
    right: { value: 8, left: { value: 6 }, right: { value: 9 } },
  };

  const dx = s * 0.5;
  const dy = s * 0.35;
  const nodes = layoutTree(tree, 0, -s / 3, dx, dy);
  const edges = edgesTree(tree, 0, -s / 3, dx, dy);

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
