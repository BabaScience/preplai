/**
 * @preplai/illustrations — BinaryTree Component
 *
 * Clean binary tree with circles and edges.
 * Use for: BST, heaps, binary search, tree traversals.
 *
 * Metadata:
 *   tree: { value, left?, right? } — nested format
 *   nodes: (value | { value })[] — flat level-order
 *
 * Minimalist style matching the Composable engine aesthetic.
 */

import { SVG_NS, buildEntityGroup, applyEntranceAnimation, getSizeParam } from '../utils.js';
import { createRadialGradient, ensureDefs } from '../visual-utils.js';
import { getCategoryColor, TYPOGRAPHY, LABEL_DEFAULTS, getLabelFontSize, getStrokeWidth } from '../design-tokens.js';
import { treeLayout, treeFromFlatNodes, type BinaryTreeNode, type FlatNodeSpec } from '../layouts/index.js';
import type { VisualEntity } from '@preplai/shared';

function parseTree(meta: Record<string, unknown>): BinaryTreeNode {
  const nodesArr = meta.nodes as Array<string | number | { value: string | number }> | undefined;
  if (Array.isArray(nodesArr) && nodesArr.length > 0) {
    const enriched = nodesArr.map((raw) => {
      if (raw == null) return null;
      if (typeof raw === 'object' && raw !== null && 'value' in raw) {
        return { value: (raw as { value: string | number }).value };
      }
      return raw as string | number;
    });
    const tree = treeFromFlatNodes(enriched as (string | number | FlatNodeSpec | null)[]);
    if (tree) return tree;
  }

  const treeData = meta.tree as BinaryTreeNode | undefined;
  return (
    treeData ?? {
      value: 5,
      left: { value: 3, left: { value: 1 }, right: { value: 4 } },
      right: { value: 8, left: { value: 6 }, right: { value: 9 } },
    }
  );
}

export function renderBinaryTree(entity: VisualEntity, parentEl: SVGElement): SVGGElement {
  const { outerG, innerG } = buildEntityGroup(entity);

  const s = getSizeParam(entity);
  const scale = s / 50;
  const color = entity.color ?? getCategoryColor('BinaryTree');
  const defs = ensureDefs(parentEl);
  const gradId = `grad-bt-${color.replace(/[^a-fA-F0-9]/g, '')}`;
  createRadialGradient(gradId, color, defs);

  const meta = entity.metadata ?? {};
  const tree = parseTree(meta);

  const nodeR = 9 * scale;
  const dx = s * 0.85;
  const dy = s * 0.55;
  const { nodes, edges } = treeLayout(tree, 0, -s / 3, dx, dy, { nodeRadius: nodeR });
  const bottomY = nodes.length > 0 ? Math.max(...nodes.map((n) => n.y)) : s / 2;

  // Edges
  edges.forEach(({ x1, y1, x2, y2 }) => {
    const line = document.createElementNS(SVG_NS, 'line');
    line.setAttribute('x1', String(x1));
    line.setAttribute('y1', String(y1));
    line.setAttribute('x2', String(x2));
    line.setAttribute('y2', String(y2));
    line.setAttribute('stroke', color);
    line.setAttribute('stroke-width', String(getStrokeWidth('minimal', scale)));
    line.setAttribute('opacity', '0.7');
    innerG.appendChild(line);
  });

  // Nodes
  nodes.forEach(({ x, y, value }) => {
    const circle = document.createElementNS(SVG_NS, 'circle');
    circle.setAttribute('cx', String(x));
    circle.setAttribute('cy', String(y));
    circle.setAttribute('r', String(nodeR));
    circle.setAttribute('fill', `url(#${gradId})`);
    circle.setAttribute('stroke', color);
    circle.setAttribute('stroke-width', String(getStrokeWidth('thin', scale)));
    innerG.appendChild(circle);

    const text = document.createElementNS(SVG_NS, 'text');
    text.setAttribute('x', String(x));
    text.setAttribute('y', String(y));
    text.setAttribute('text-anchor', 'middle');
    text.setAttribute('dominant-baseline', 'middle');
    text.setAttribute('fill', '#ffffff');
    text.setAttribute('font-size', String(getLabelFontSize('value', scale)));
    text.setAttribute('font-weight', String(TYPOGRAPHY.fontWeightEmphasis));
    text.setAttribute('font-family', TYPOGRAPHY.fontBadge);
    text.textContent = String(value);
    innerG.appendChild(text);
  });

  // Label below
  if (entity.label) {
    const label = document.createElementNS(SVG_NS, 'text');
    label.setAttribute('x', '0');
    label.setAttribute('y', String(bottomY + nodeR + LABEL_DEFAULTS.offsetBelow));
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
