/**
 * @preplai/illustrations — RecursionTree Component (Cinematic Depth)
 *
 * Tree of function call nodes showing recursive calls with args and return values.
 * Cinematic depth: directional lighting, ground shadow, ambient occlusion,
 * specular highlight, micro-life (node breathe + tree float).
 *
 * Metadata:
 *   calls: Array<{ id, label, args, returnValue?, state: 'pending'|'executing'|'returned' }>
 *   edges: Array<{ from, to }> — parent->child call edges
 *   maxDepth?: number — optional max depth for layout
 */

import { SVG_NS, buildEntityGroup, applyEntranceAnimation, getSizeParam } from '../utils.js';
import { TYPOGRAPHY, LABEL_DEFAULTS } from '../design-tokens.js';import { resolveColorCascade } from '../color-cascade.js';
import { ensureDefs } from '../visual-utils.js';
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
  const size = getSizeParam(entity);
  const cc = resolveColorCascade(entity);
  const color = cc.base;
  const entityId = (entity.id ?? Math.random().toString(36).slice(2)).replace(/[^a-zA-Z0-9]/g, '').slice(0, 8);
  const scale = size / 50;

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
    placeholder.setAttribute('fill', cc.textSecondary);
    placeholder.setAttribute('font-size', String(TYPOGRAPHY.fontSizeLabel));
    placeholder.textContent = 'RecursionTree (no calls)';
    innerG.appendChild(placeholder);
    applyEntranceAnimation(innerG, entity);
    parentEl.appendChild(outerG);
    return outerG;
  }

  const defs = ensureDefs(parentEl);

  const dx = size * 1.1;
  const dy = size * 0.7;
  const nodeRadius = 10 * scale;
  const blockW = size * 0.95;
  const blockH = 32;
  const { nodes, edges: layoutEdges } = layoutMultiChildTree(tree, 0, -size / 4, dx, dy, { nodeRadius });

  const byId = new Map(calls.map((c) => [c.id, c]));

  // Compute bounding box for overlay layers
  const allX = nodes.map(n => n.x);
  const allY = nodes.map(n => n.y);
  const minX = Math.min(...allX) - blockW / 2 - 10;
  const maxX = Math.max(...allX) + blockW / 2 + 10;
  const minY = Math.min(...allY) - blockH / 2 - 10;
  const maxY = Math.max(...allY) + blockH / 2 + 10;
  const bW = maxX - minX;
  const bH = maxY - minY;
  const bCx = (minX + maxX) / 2;
  const _bCy = (minY + maxY) / 2;

  // ── Pillar 1: Directional Lighting ─────────────────────────────────
  const haloId = `rtree-halo-${entityId}`;
  if (!defs.querySelector(`#${haloId}`)) {
    const g = document.createElementNS(SVG_NS, 'radialGradient');
    g.setAttribute('id', haloId);
    g.setAttribute('cx', '38%'); g.setAttribute('cy', '38%'); g.setAttribute('r', '50%');
    const s1 = document.createElementNS(SVG_NS, 'stop');
    s1.setAttribute('offset', '0%'); s1.setAttribute('stop-color', color); s1.setAttribute('stop-opacity', '0.13');
    const s2 = document.createElementNS(SVG_NS, 'stop');
    s2.setAttribute('offset', '100%'); s2.setAttribute('stop-color', color); s2.setAttribute('stop-opacity', '0');
    g.appendChild(s1); g.appendChild(s2);
    defs.appendChild(g);
  }
  const halo = document.createElementNS(SVG_NS, 'rect');
  halo.setAttribute('x', String(minX)); halo.setAttribute('y', String(minY));
  halo.setAttribute('width', String(bW)); halo.setAttribute('height', String(bH));
  halo.setAttribute('fill', `url(#${haloId})`);
  innerG.appendChild(halo);

  // ── Pillar 2: Ground Shadow ────────────────────────────────────────
  const gsId = `rtree-gs-${entityId}`;
  if (!defs.querySelector(`#${gsId}`)) {
    const g = document.createElementNS(SVG_NS, 'radialGradient');
    g.setAttribute('id', gsId);
    g.setAttribute('cx', '50%'); g.setAttribute('cy', '50%'); g.setAttribute('r', '50%');
    const s1 = document.createElementNS(SVG_NS, 'stop');
    s1.setAttribute('offset', '0%'); s1.setAttribute('stop-color', '#000000'); s1.setAttribute('stop-opacity', '0.18');
    const s2 = document.createElementNS(SVG_NS, 'stop');
    s2.setAttribute('offset', '100%'); s2.setAttribute('stop-color', '#000000'); s2.setAttribute('stop-opacity', '0');
    g.appendChild(s1); g.appendChild(s2);
    defs.appendChild(g);
  }
  const gs = document.createElementNS(SVG_NS, 'ellipse');
  gs.setAttribute('cx', String(bCx));
  gs.setAttribute('cy', String(maxY + 4));
  gs.setAttribute('rx', String(bW * 0.4));
  gs.setAttribute('ry', String(bH * 0.06));
  gs.setAttribute('fill', `url(#${gsId})`);
  innerG.appendChild(gs);

  // ── Pillar 3: Ambient Occlusion ────────────────────────────────────
  const aoId = `rtree-ao-${entityId}`;
  if (!defs.querySelector(`#${aoId}`)) {
    const g = document.createElementNS(SVG_NS, 'radialGradient');
    g.setAttribute('id', aoId);
    g.setAttribute('cx', '70%'); g.setAttribute('cy', '75%'); g.setAttribute('r', '55%');
    const s1 = document.createElementNS(SVG_NS, 'stop');
    s1.setAttribute('offset', '0%'); s1.setAttribute('stop-color', '#000000'); s1.setAttribute('stop-opacity', '0.10');
    const s2 = document.createElementNS(SVG_NS, 'stop');
    s2.setAttribute('offset', '100%'); s2.setAttribute('stop-color', '#000000'); s2.setAttribute('stop-opacity', '0');
    g.appendChild(s1); g.appendChild(s2);
    defs.appendChild(g);
  }
  const ao = document.createElementNS(SVG_NS, 'rect');
  ao.setAttribute('x', String(minX)); ao.setAttribute('y', String(minY));
  ao.setAttribute('width', String(bW)); ao.setAttribute('height', String(bH));
  ao.setAttribute('fill', `url(#${aoId})`);
  ao.setAttribute('pointer-events', 'none');
  innerG.appendChild(ao);

  // ── Edges ──────────────────────────────────────────────────────────
  layoutEdges.forEach(({ x1, y1, x2, y2 }) => {
    const line = document.createElementNS(SVG_NS, 'line');
    line.setAttribute('x1', String(x1)); line.setAttribute('y1', String(y1));
    line.setAttribute('x2', String(x2)); line.setAttribute('y2', String(y2));
    line.setAttribute('stroke', cc.strokeSoft);
    line.setAttribute('stroke-width', '2.5');
    innerG.appendChild(line);
  });

  const labelFontSize = TYPOGRAPHY.fontSizeValue;
  const subFontSize = TYPOGRAPHY.fontSizeBadge;

  // ── Nodes ──────────────────────────────────────────────────────────
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
    rect.setAttribute('rx', '4');
    rect.setAttribute('fill', isExecuting ? cc.fillMedium : cc.fill);
    rect.setAttribute('stroke', cc.stroke);
    rect.setAttribute('stroke-width', isExecuting ? '2.5' : '2.5');
    if (isPending) {
      rect.setAttribute('opacity', '0.9');
      rect.setAttribute('stroke-dasharray', '4,4');
    }
    blockG.appendChild(rect);

    // Specular on each node
    const nodeSpecId = `rtree-nspec-${entityId}`;
    if (!defs.querySelector(`#${nodeSpecId}`)) {
      const sg = document.createElementNS(SVG_NS, 'radialGradient');
      sg.setAttribute('id', nodeSpecId);
      sg.setAttribute('cx', '35%'); sg.setAttribute('cy', '25%'); sg.setAttribute('r', '40%');
      const sp1 = document.createElementNS(SVG_NS, 'stop');
      sp1.setAttribute('offset', '0%'); sp1.setAttribute('stop-color', '#ffffff'); sp1.setAttribute('stop-opacity', '0.18');
      const sp2 = document.createElementNS(SVG_NS, 'stop');
      sp2.setAttribute('offset', '100%'); sp2.setAttribute('stop-color', '#ffffff'); sp2.setAttribute('stop-opacity', '0');
      sg.appendChild(sp1); sg.appendChild(sp2);
      defs.appendChild(sg);
    }
    const nodeSpec = document.createElementNS(SVG_NS, 'rect');
    nodeSpec.setAttribute('x', String(n.x - blockW / 2));
    nodeSpec.setAttribute('y', String(n.y - blockH / 2));
    nodeSpec.setAttribute('width', String(blockW));
    nodeSpec.setAttribute('height', String(blockH * 0.5));
    nodeSpec.setAttribute('rx', '4');
    nodeSpec.setAttribute('fill', `url(#${nodeSpecId})`);
    nodeSpec.setAttribute('pointer-events', 'none');
    blockG.appendChild(nodeSpec);

    const mainLabel = call?.label ?? String(n.value);
    const argsLabel = call?.args != null && call.args !== '' ? `(${call.args})` : '';
    const returnLabel = call?.returnValue != null ? ` → ${call.returnValue}` : '';

    const text = document.createElementNS(SVG_NS, 'text');
    text.setAttribute('x', String(n.x));
    text.setAttribute('y', String(n.y - (returnLabel ? 2 : 0)));
    text.setAttribute('text-anchor', 'middle');
    text.setAttribute('fill', isPending ? cc.textTertiary : cc.textPrimary);
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
      ret.setAttribute('fill', cc.textSecondary);
      ret.setAttribute('font-size', String(subFontSize));
      ret.setAttribute('font-family', TYPOGRAPHY.fontBadge);
      ret.textContent = returnLabel;
      blockG.appendChild(ret);
    }

    innerG.appendChild(blockG);
  });

  // ── Pillar 5: Micro-Life ───────────────────────────────────────────
  const styleId = `rtree-style-${entityId}`;
  const svg = parentEl.ownerSVGElement ?? (parentEl as SVGSVGElement);
  if (!svg.querySelector(`#${styleId}`)) {
    const style = document.createElementNS(SVG_NS, 'style');
    style.setAttribute('id', styleId);
    style.textContent = `
      @keyframes rtreeFloat_${entityId} {
        0%, 100% { transform: translateY(0); }
        50% { transform: translateY(-2.5px); }
      }
      .rtree-float-${entityId} {
        animation: rtreeFloat_${entityId} 3.5s ease-in-out infinite;
      }
    `;
    svg.insertBefore(style, svg.firstChild);
  }
  innerG.classList.add(`rtree-float-${entityId}`);

  // ── Label below ────────────────────────────────────────────────────
  if (entity.label) {
    const bottomY = nodes.length > 0 ? Math.max(...nodes.map((n) => n.y)) : size / 2;
    const label = document.createElementNS(SVG_NS, 'text');
    label.setAttribute('x', '0');
    label.setAttribute('y', String(bottomY + blockH / 2 + LABEL_DEFAULTS.offsetBelow));
    label.setAttribute('text-anchor', LABEL_DEFAULTS.textAnchor);
    label.setAttribute('fill', cc.textPrimary);
    label.setAttribute('font-size', String(TYPOGRAPHY.fontSizeLabel));
    label.setAttribute('font-weight', String(TYPOGRAPHY.fontWeightLabel));
    label.setAttribute('font-family', TYPOGRAPHY.fontLabel);
    label.textContent = entity.label;
    innerG.appendChild(label);
  }

  applyEntranceAnimation(innerG, entity);
  parentEl.appendChild(outerG);
  return outerG;
}
