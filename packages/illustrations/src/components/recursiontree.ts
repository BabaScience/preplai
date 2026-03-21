/**
 * @preplai/illustrations — RecursionTree Component (minimalist)
 *
 * Tree of function call nodes showing recursive calls with args and return values.
 * States: pending (dimmed), executing (highlighted), returned (normal + return value).
 * No gradient fills, no drop-shadow filters.
 *
 * Metadata:
 *   calls: Array<{ id, label, args, returnValue?, state: 'pending'|'executing'|'returned' }>
 *   edges: Array<{ from, to }> — parent→child call edges
 *   maxDepth?: number — optional max depth for layout
 */

import { SVG_NS, buildEntityGroup, applyEntranceAnimation, getSizeParam } from '../utils.js';
import {
  getCategoryColor,
  getStrokeWidth,
  getLabelFontSize,
  colorWithAlpha,
  OPACITY,
  TYPOGRAPHY,
  LABEL_DEFAULTS,
  SHAPES,
} from '../design-tokens.js';
import { layoutMultiChildTree, type MultiChildTreeNode } from '../layouts/index.js';
import type { VisualEntity } from '@preplai/shared';

interface RecursionCall {
  id: string;
  label: string;
  args: string;
  returnValue?: string;
  state?: 'pending' | 'executing' | 'returned';
}

interface RecursionEdge {
  from: string;
  to: string;
}

function buildTreeFromCalls(calls: RecursionCall[], edges: RecursionEdge[]): MultiChildTreeNode | null {
  if (!calls.length) return null;
  const byId = new Map(calls.map((c) => [c.id, c]));
  const childrenOf = new Map<string, string[]>();
  const hasParent = new Set<string>();
  for (const e of edges) {
    if (!byId.has(e.from) || !byId.has(e.to)) continue;
    const list = childrenOf.get(e.from) ?? [];
    list.push(e.to);
    childrenOf.set(e.from, list);
    hasParent.add(e.to);
  }
  const roots = calls.filter((c) => !hasParent.has(c.id));
  const root = roots[0] ?? calls[0];
  if (!root) return null;

  function toNode(call: RecursionCall): MultiChildTreeNode {
    const childIds = childrenOf.get(call.id) ?? [];
    const children = childIds
      .map((id) => byId.get(id))
      .filter((c): c is RecursionCall => c != null)
      .map(toNode);
    return {
      value: call.label,
      id: call.id,
      children: children.length ? children : undefined,
      highlight: call.state === 'executing' ? 'active' : call.state === 'pending' ? undefined : 'visited',
      enabled: call.state !== 'pending',
      selected: call.state === 'executing',
    };
  }

  return toNode(root);
}

export function renderRecursionTree(entity: VisualEntity, parentEl: SVGElement): SVGGElement {
  const { outerG, innerG } = buildEntityGroup(entity);

  const s = getSizeParam(entity);
  const scale = s / 50;
  const color = entity.color ?? getCategoryColor('RecursionTree');

  const meta = entity.metadata ?? {};
  const callsData = meta.calls as RecursionCall[] | undefined;
  const edgesData = meta.edges as RecursionEdge[] | undefined;

  const calls: RecursionCall[] = callsData ?? [
    { id: 'r1', label: 'fib', args: '4', state: 'executing' },
    { id: 'r2', label: 'fib', args: '3', state: 'executing' },
    { id: 'r3', label: 'fib', args: '2', returnValue: '1', state: 'returned' },
    { id: 'r4', label: 'fib', args: '1', returnValue: '1', state: 'returned' },
    { id: 'r5', label: 'fib', args: '2', state: 'pending' },
  ];
  const edges: RecursionEdge[] = edgesData ?? [
    { from: 'r1', to: 'r2' },
    { from: 'r2', to: 'r3' },
    { from: 'r2', to: 'r4' },
    { from: 'r1', to: 'r5' },
  ];

  const tree = buildTreeFromCalls(calls, edges);
  if (!tree) {
    const placeholder = document.createElementNS(SVG_NS, 'text');
    placeholder.setAttribute('x', '0');
    placeholder.setAttribute('y', '0');
    placeholder.setAttribute('text-anchor', 'middle');
    placeholder.setAttribute('fill', colorWithAlpha(color, OPACITY.strokeSoft));
    placeholder.setAttribute('font-size', String(getLabelFontSize('label', scale)));
    placeholder.textContent = 'RecursionTree (no calls)';
    innerG.appendChild(placeholder);
    applyEntranceAnimation(innerG, entity);
    parentEl.appendChild(outerG);
    return outerG;
  }

  const dx = s * 1.1;
  const dy = s * 0.7;
  const nodeRadius = 10 * scale;
  const blockW = s * 0.95;
  const blockH = 32;
  const { nodes, edges: layoutEdges } = layoutMultiChildTree(tree, 0, -s / 4, dx, dy, { nodeRadius });

  const byId = new Map(calls.map((c) => [c.id, c]));

  // Edges
  layoutEdges.forEach(({ x1, y1, x2, y2 }) => {
    const line = document.createElementNS(SVG_NS, 'line');
    line.setAttribute('x1', String(x1));
    line.setAttribute('y1', String(y1));
    line.setAttribute('x2', String(x2));
    line.setAttribute('y2', String(y2));
    line.setAttribute('stroke', colorWithAlpha(color, OPACITY.strokeSoft));
    line.setAttribute('stroke-width', String(getStrokeWidth('minimal', scale)));
    innerG.appendChild(line);
  });

  const labelFontSize = getLabelFontSize('value', scale);
  const subFontSize = getLabelFontSize('index', scale);

  // Nodes
  nodes.forEach((n) => {
    const call: RecursionCall | undefined = (n.id ? byId.get(n.id) : undefined) ?? calls.find((c) => c.label === n.value);
    const state = call?.state ?? 'returned';
    const isExecuting = state === 'executing';
    const isPending = state === 'pending';

    const blockG = document.createElementNS(SVG_NS, 'g');
    const rect = document.createElementNS(SVG_NS, 'rect');
    rect.setAttribute('x', String(n.x - blockW / 2));
    rect.setAttribute('y', String(n.y - blockH / 2));
    rect.setAttribute('width', String(blockW));
    rect.setAttribute('height', String(blockH));
    rect.setAttribute('rx', String(SHAPES.borderRadius));
    rect.setAttribute('fill', colorWithAlpha(color, isExecuting ? OPACITY.fillMedium : OPACITY.fillLight));
    rect.setAttribute('stroke', color);
    rect.setAttribute('stroke-width', String(getStrokeWidth(isExecuting ? 'emphasized' : 'thin', scale)));
    if (isPending) {
      rect.setAttribute('opacity', '0.9');
      rect.setAttribute('stroke-dasharray', '4,4');
    }
    blockG.appendChild(rect);

    const mainLabel = call?.label ?? String(n.value);
    const argsLabel = call?.args != null && call.args !== '' ? `(${call.args})` : '';
    const returnLabel = call?.returnValue != null ? ` → ${call.returnValue}` : '';

    const text = document.createElementNS(SVG_NS, 'text');
    text.setAttribute('x', String(n.x));
    text.setAttribute('y', String(n.y - (returnLabel ? 2 : 0)));
    text.setAttribute('text-anchor', 'middle');
    text.setAttribute('fill', isPending ? colorWithAlpha(color, 'cc') : color);
    text.setAttribute('font-size', String(labelFontSize));
    text.setAttribute('font-weight', String(TYPOGRAPHY.fontWeightBold));
    text.setAttribute('font-family', TYPOGRAPHY.fontBadge);
    text.textContent = mainLabel + argsLabel;
    blockG.appendChild(text);

    if (returnLabel) {
      const ret = document.createElementNS(SVG_NS, 'text');
      ret.setAttribute('x', String(n.x));
      ret.setAttribute('y', String(n.y + 10));
      ret.setAttribute('text-anchor', 'middle');
      ret.setAttribute('fill', colorWithAlpha(color, OPACITY.strokeSoft));
      ret.setAttribute('font-size', String(subFontSize));
      ret.setAttribute('font-family', TYPOGRAPHY.fontBadge);
      ret.textContent = returnLabel;
      blockG.appendChild(ret);
    }

    innerG.appendChild(blockG);
  });

  if (entity.label) {
    const bottomY = nodes.length > 0 ? Math.max(...nodes.map((n) => n.y)) : s / 2;
    const label = document.createElementNS(SVG_NS, 'text');
    label.setAttribute('x', '0');
    label.setAttribute('y', String(bottomY + blockH / 2 + LABEL_DEFAULTS.offsetBelow));
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
