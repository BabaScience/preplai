/**
 * @preplai/illustrations — BTree Component
 *
 * B-tree, B+ tree, multi-way trees. Use when nodes have 3+ children (not BinaryTree).
 *
 * Metadata (agent: see METADATA_SCHEMAS.md):
 *   tree: { value, children? } — value = node label (e.g. "[10,20]" key range)
 *   branchingFactor?: number — default 3
 */

import { SVG_NS, buildEntityGroup, applyEntranceAnimation, getSizeParam } from '../utils.js';
import { createRadialGradient, ensureDefs } from '../visual-utils.js';
import { getCategoryColor, TYPOGRAPHY } from '../design-tokens.js';
import { treeLayout, type MultiChildTreeNode } from '../layouts/index.js';
import type { VisualEntity } from '@preplai/shared';

export function renderBTree(entity: VisualEntity, parentEl: SVGElement): SVGGElement {
  const { outerG, innerG } = buildEntityGroup(entity);

  const s = getSizeParam(entity);
  const color = entity.color ?? getCategoryColor('BTree');
  const defs = ensureDefs(parentEl);
  const gradId = `grad-btree-${color.replace(/[^a-fA-F0-9]/g, '')}`;
  createRadialGradient(gradId, color, defs);

  const meta = entity.metadata ?? {};
  const treeData = meta.tree as MultiChildTreeNode | undefined;
  const tree: MultiChildTreeNode = treeData ?? {
    value: '[10,20]',
    children: [
      { value: '[3,6]', children: [
        { value: '1' },
        { value: '4' },
        { value: '7' },
      ]},
      { value: '[15]', children: [
        { value: '12' },
        { value: '18' },
      ]},
      { value: '[25,30]', children: [
        { value: '22' },
        { value: '27' },
        { value: '35' },
      ]},
    ],
  };

  const scale = s / 50;
  const nodeR = 14 * scale;
  // Large dx/dy to spread nodes and create long edges (B-tree needs room for many children)
  const dx = s * 2.5;
  const dy = s * 1.2;

  const { nodes, edges } = treeLayout(tree, 0, -s / 3, dx, dy, { nodeRadius: nodeR });

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
    circle.setAttribute('r', String(nodeR));
    circle.setAttribute('fill', `url(#${gradId})`);
    circle.setAttribute('stroke', color);
    circle.setAttribute('stroke-width', String(Math.max(1, 1.2 * scale)));
    innerG.appendChild(circle);

    const text = document.createElementNS(SVG_NS, 'text');
    text.setAttribute('x', String(x));
    text.setAttribute('y', String(y));
    text.setAttribute('text-anchor', 'middle');
    text.setAttribute('dominant-baseline', 'middle');
    text.setAttribute('fill', '#ffffff');
    text.setAttribute('font-size', String(Math.round(11 * scale)));
    text.setAttribute('font-weight', '600');
    text.setAttribute('font-family', TYPOGRAPHY.fontBadge);
    text.textContent = String(value).slice(0, 12);
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
