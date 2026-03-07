/**
 * @preplai/illustrations — BinaryTree Component
 *
 * BST, heaps, binary search. Renders circles with white text, thin stroke, spread layout.
 *
 * Metadata (agent: see METADATA_SCHEMAS.md):
 *   tree: { value, left?, right? } — nested format
 *   nodes: (value | { value, enabled?, selected?, highlight? })[] — flat level-order (index i → left 2i+1, right 2i+2)
 *   disabledIndexes: number[] — 0-based level-order indexes to dim (dashed, muted)
 *   selectedIndexes: number[] — 0-based level-order indexes to highlight (glow)
 *   Per-node: enabled, selected, highlight ('compare'|'insert'|'visited'|'active')
 *
 * Binary search: selectedIndexes=[mid] for current; disabledIndexes for eliminated range.
 */

import { SVG_NS, buildEntityGroup, applyEntranceAnimation, getSizeParam } from '../utils.js';
import { createRadialGradient, ensureDefs } from '../visual-utils.js';
import { getCategoryColor, TYPOGRAPHY } from '../design-tokens.js';
import { treeLayout, treeFromFlatNodes, type BinaryTreeNode, type FlatNodeSpec } from '../layouts/index.js';
import type { VisualEntity } from '@preplai/shared';

function parseTree(meta: Record<string, unknown>): BinaryTreeNode {
  const nodesArr = meta.nodes as Array<string | number | { value: string | number; enabled?: boolean; selected?: boolean; highlight?: string }> | undefined;
  if (Array.isArray(nodesArr) && nodesArr.length > 0) {
    const disabledSet = new Set((meta.disabledIndexes as number[]) ?? []);
    const selectedSet = new Set((meta.selectedIndexes as number[]) ?? []);
    const enriched = nodesArr.map((raw, i) => {
      if (raw == null) return null;
      const opts = (typeof raw === 'object' && raw !== null ? raw : {}) as {
        value?: string | number;
        enabled?: boolean;
        selected?: boolean;
        highlight?: string;
      };
      const val: string | number = typeof opts.value !== 'undefined' ? opts.value : (raw as string | number);
      return {
        value: val,
        enabled: disabledSet.has(i) ? false : opts.enabled !== false,
        selected: selectedSet.has(i) ? true : opts.selected === true,
        highlight: opts.highlight,
      };
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
  const color = entity.color ?? getCategoryColor('BinaryTree');
  const defs = ensureDefs(parentEl);
  const gradId = `grad-bt-${color.replace(/[^a-fA-F0-9]/g, '')}`;
  createRadialGradient(gradId, color, defs);

  const meta = entity.metadata ?? {};
  const tree = parseTree(meta);

  const scale = s / 50;
  const nodeR = 9 * scale;
  const dx = s * 0.85;
  const dy = s * 0.55;
  const layoutResult = treeLayout(tree, 0, -s / 3, dx, dy, { nodeRadius: nodeR });
  let nodes = layoutResult.nodes;
  const edges = layoutResult.edges;

  // Apply disabledIndexes/selectedIndexes (level-order) when using tree format
  const disabledSet = new Set((meta.disabledIndexes as number[]) ?? []);
  const selectedSet = new Set((meta.selectedIndexes as number[]) ?? []);
  if (disabledSet.size > 0 || selectedSet.size > 0) {
    nodes = nodes.map((n) => ({
      ...n,
      enabled: n.levelOrderIndex != null && disabledSet.has(n.levelOrderIndex) ? false : n.enabled,
      selected: n.levelOrderIndex != null && selectedSet.has(n.levelOrderIndex) ? true : n.selected,
    }));
  }

  const dimFilterId = `bt-dim-${entity.id}`;
  if (nodes.some((n) => n.enabled === false)) {
    let filterEl = defs.querySelector(`#${dimFilterId}`) as SVGFilterElement | null;
    if (!filterEl) {
      filterEl = document.createElementNS(SVG_NS, 'filter');
      filterEl.setAttribute('id', dimFilterId);
      filterEl.setAttribute('x', '-20%');
      filterEl.setAttribute('y', '-20%');
      filterEl.setAttribute('width', '140%');
      filterEl.setAttribute('height', '140%');
      const feColorMatrix = document.createElementNS(SVG_NS, 'feColorMatrix');
      feColorMatrix.setAttribute('type', 'matrix');
      feColorMatrix.setAttribute('values', '0.4 0 0 0 0  0 0.4 0 0 0  0 0 0.4 0 0  0 0 0 1 0');
      filterEl.appendChild(feColorMatrix);
      defs.appendChild(filterEl);
    }
  }

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

  nodes.forEach(({ x, y, value, enabled, selected, highlight }) => {
    const isDisabled = enabled === false;
    const isHighlighted = selected === true || (highlight && highlight !== 'none');

    const circle = document.createElementNS(SVG_NS, 'circle');
    circle.setAttribute('cx', String(x));
    circle.setAttribute('cy', String(y));
    circle.setAttribute('r', String(nodeR));
    circle.setAttribute('fill', `url(#${gradId})`);
    circle.setAttribute('stroke', color);
    circle.setAttribute('stroke-width', String(isHighlighted ? 2 : Math.max(1, 1.2 * scale)));
    if (isDisabled) {
      circle.setAttribute('filter', `url(#${dimFilterId})`);
      circle.setAttribute('stroke-dasharray', '3,3');
    } else if (isHighlighted) {
      circle.setAttribute('filter', `drop-shadow(0 0 ${4 * scale}px ${color})`);
    }
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
    if (isDisabled) {
      text.setAttribute('filter', `url(#${dimFilterId})`);
    }
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
