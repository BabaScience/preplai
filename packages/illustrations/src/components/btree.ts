/**
 * @preplai/illustrations — BTree Component
 *
 * B-tree, B+ tree, multi-way trees. Use when nodes have 3+ children (not BinaryTree).
 *
 * Metadata (agent: see METADATA_SCHEMAS.md):
 *   tree: { value, children? } — value = node label (e.g. "[10,20]" key range)
 *   branchingFactor?: number — default 3
 *   Per-node: enabled?, selected? — dim disabled, glow selected
 */

import { SVG_NS, buildEntityGroup, applyEntranceAnimation, getSizeParam } from '../utils.js';
import { createRadialGradient, ensureDefs } from '../visual-utils.js';
import { getCategoryColor, TYPOGRAPHY, getStrokeWidth, getLabelFontSize, LABEL_DEFAULTS } from '../design-tokens.js';
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
  const nodeR = 12 * scale;
  const dx = s * 2.2;
  const dy = s * 1.0;

  const { nodes, edges } = treeLayout(tree, 0, -s / 3, dx, dy, { nodeRadius: nodeR });

  const bottomY = nodes.length > 0 ? Math.max(...nodes.map((n) => n.y)) : s / 2;

  const dimFilterId = `btree-dim-${entity.id}`;
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
    line.setAttribute('stroke-width', String(getStrokeWidth('minimal', scale)));
    line.setAttribute('opacity', '0.7');
    innerG.appendChild(line);
  });

  nodes.forEach(({ x, y, value, enabled, selected }) => {
    const isDisabled = enabled === false;
    const isHighlighted = selected === true;

    const circle = document.createElementNS(SVG_NS, 'circle');
    circle.setAttribute('cx', String(x));
    circle.setAttribute('cy', String(y));
    circle.setAttribute('r', String(nodeR));
    circle.setAttribute('fill', `url(#${gradId})`);
    circle.setAttribute('stroke', color);
    circle.setAttribute('stroke-width', String(getStrokeWidth(isHighlighted ? 'emphasized' : 'thin', scale)));
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
    text.setAttribute('font-size', String(getLabelFontSize('value', scale)));
    text.setAttribute('font-weight', String(TYPOGRAPHY.fontWeightEmphasis));
    text.setAttribute('font-family', TYPOGRAPHY.fontBadge);
    if (isDisabled) {
      text.setAttribute('filter', `url(#${dimFilterId})`);
    }
    text.textContent = String(value).slice(0, 12);
    innerG.appendChild(text);
  });

  if (entity.label) {
    const label = document.createElementNS(SVG_NS, 'text');
    label.setAttribute('x', '0');
    label.setAttribute('y', String(bottomY + nodeR + LABEL_DEFAULTS.offsetBelow));
    label.setAttribute('text-anchor', LABEL_DEFAULTS.textAnchor);
    label.setAttribute('fill', color);
    label.setAttribute('font-size', String(TYPOGRAPHY.fontSizeDefault));
    label.setAttribute('font-weight', String(TYPOGRAPHY.fontWeightLabel));
    label.setAttribute('font-family', TYPOGRAPHY.fontLabel);
    label.textContent = entity.label;
    innerG.appendChild(label);
  }

  applyEntranceAnimation(innerG, entity);
  parentEl.appendChild(outerG);
  return outerG;
}
