/**
 * @preplai/illustrations — BTree Component
 *
 * Clean multi-way tree with circles and edges.
 * Use for: B-trees, B+ trees, multi-way search trees.
 *
 * Metadata: { tree: { value, children? } }
 *
 * Minimalist style matching the Composable engine aesthetic.
 */

import { SVG_NS, buildEntityGroup, applyEntranceAnimation, getSizeParam } from '../utils.js';
import { getCategoryColor, TYPOGRAPHY, getStrokeWidth, getLabelFontSize, LABEL_DEFAULTS, colorWithAlpha, OPACITY } from '../design-tokens.js';
import { treeLayout, type MultiChildTreeNode } from '../layouts/index.js';
import type { VisualEntity } from '@preplai/shared';

export function renderBTree(entity: VisualEntity, parentEl: SVGElement): SVGGElement {
  const { outerG, innerG } = buildEntityGroup(entity);

  const s = getSizeParam(entity);
  const scale = s / 50;
  const color = entity.color ?? getCategoryColor('BTree');

  const meta = entity.metadata ?? {};
  const tree: MultiChildTreeNode = (meta.tree as MultiChildTreeNode) ?? {
    value: '[10,20]',
    children: [
      { value: '[3,6]', children: [{ value: '1' }, { value: '4' }, { value: '7' }] },
      { value: '[15]', children: [{ value: '12' }, { value: '18' }] },
      { value: '[25,30]', children: [{ value: '22' }, { value: '27' }, { value: '35' }] },
    ],
  };

  const nodeR = 12 * scale;
  const dx = s * 2.2;
  const dy = s * 1.0;
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
    circle.setAttribute('fill', colorWithAlpha(color, OPACITY.fillLight));
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
    text.textContent = String(value).slice(0, 12);
    innerG.appendChild(text);
  });

  // Label below
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
