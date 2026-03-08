/**
 * @preplai/illustrations — Heap Component
 * Binary heap (min/max) as complete binary tree in level-order
 *
 * Metadata: { nodes: number[] } — level-order values
 */

import { SVG_NS, buildEntityGroup, applyEntranceAnimation, getSizeParam } from '../utils.js';
import { createRadialGradient, ensureDefs } from '../visual-utils.js';
import {
  getCategoryColor,
  TYPOGRAPHY,
  LABEL_DEFAULTS,
  getLabelFontSize,
  getStrokeWidth,
} from '../design-tokens.js';
import { treeLayout, treeFromFlatNodes, type FlatNodeSpec } from '../layouts/index.js';
import type { VisualEntity } from '@preplai/shared';

function parseNodes(meta: Record<string, unknown>): (string | number | FlatNodeSpec)[] {
  const raw = meta.nodes as (string | number)[] | undefined;
  if (!Array.isArray(raw) || raw.length === 0) {
    return [10, 8, 6, 5, 3, 2];
  }
  return raw.slice(0, 15).map((v) => (typeof v === 'number' || typeof v === 'string' ? v : { value: 0 }));
}

export function renderHeap(entity: VisualEntity, parentEl: SVGElement): SVGGElement {
  const { outerG, innerG } = buildEntityGroup(entity);

  const s = getSizeParam(entity);
  const scale = s / 50;
  const color = entity.color ?? getCategoryColor('Heap');
  const defs = ensureDefs(parentEl);
  const gradId = `grad-heap-${color.replace(/[^a-fA-F0-9]/g, '')}`;
  createRadialGradient(gradId, color, defs);

  const meta = entity.metadata ?? {};
  const nodesArr = parseNodes(meta);
  const tree = treeFromFlatNodes(nodesArr);
  if (!tree) {
    const fallback = document.createElementNS(SVG_NS, 'text');
    fallback.setAttribute('x', '0');
    fallback.setAttribute('y', '0');
    fallback.setAttribute('text-anchor', 'middle');
    fallback.setAttribute('fill', color);
    fallback.textContent = 'Heap';
    innerG.appendChild(fallback);
    applyEntranceAnimation(innerG, entity);
    parentEl.appendChild(outerG);
    return outerG;
  }

  const nodeR = 9 * scale;
  const dx = s * 0.85;
  const dy = s * 0.55;
  const layoutResult = treeLayout(tree, 0, -s / 3, dx, dy, { nodeRadius: nodeR });
  const { nodes, edges } = layoutResult;
  const bottomY = nodes.length > 0 ? Math.max(...nodes.map((n) => n.y)) : s / 2;

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
