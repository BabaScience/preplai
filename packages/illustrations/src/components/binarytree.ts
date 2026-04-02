/**
 * @preplai/illustrations — BinaryTree Component (Cinematic Depth)
 *
 * Root + children + leaf nodes + branch lines.
 * Cinematic depth: directional lighting, ground shadow, ambient occlusion,
 * specular highlight, micro-life (level highlight staggered + node pulse + float).
 *
 * Metadata: tree: { value, left?, right? } or nodes: (value|{value})[]
 */

import { SVG_NS, buildEntityGroup, applyEntranceAnimation, getSizeParam } from '../utils.js';
import { TYPOGRAPHY, STROKE, LABEL_DEFAULTS, colorWithAlpha } from '../design-tokens.js';
import { resolveColorCascade, applyGlowColors } from '../color-cascade.js';
import { ensureDefs } from '../visual-utils.js';import { treeLayout, treeFromFlatNodes, type BinaryTreeNode, type FlatNodeSpec } from '../layouts/index.js';
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
  const size = getSizeParam(entity);
  const cc = resolveColorCascade(entity);
  const color = cc.base;
  const entityId = (entity.id ?? Math.random().toString(36).slice(2)).replace(/[^a-zA-Z0-9]/g, '').slice(0, 8);

  const scale = size / 50;
  const meta = entity.metadata ?? {};
  const tree = parseTree(meta);

  const nodeR = 9 * scale;
  const dx = size * 0.85;
  const dy = size * 0.55;
  const { nodes, edges } = treeLayout(tree, 0, -size / 3, dx, dy, { nodeRadius: nodeR });
  const bottomY = nodes.length > 0 ? Math.max(...nodes.map((n) => n.y)) : size / 2;
  const topY = nodes.length > 0 ? Math.min(...nodes.map((n) => n.y)) : -size / 3;
  const leftX = nodes.length > 0 ? Math.min(...nodes.map((n) => n.x)) : -size;
  const rightX = nodes.length > 0 ? Math.max(...nodes.map((n) => n.x)) : size;
  const bodyW = rightX - leftX + nodeR * 4;
  const bodyH = bottomY - topY + nodeR * 4;

  const defs = ensureDefs(parentEl);

  // ── Pillar 1: Directional Lighting ──────────────────────────────────
  const haloId = `bt-halo-${entityId}`;
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
  const haloEl = document.createElementNS(SVG_NS, 'ellipse');
  haloEl.setAttribute('cx', String(-bodyW * 0.08));
  haloEl.setAttribute('cy', String(topY - nodeR));
  haloEl.setAttribute('rx', String(bodyW * 0.55));
  haloEl.setAttribute('ry', String(bodyH * 0.5));
  haloEl.setAttribute('fill', `url(#${haloId})`);
  innerG.appendChild(haloEl);

  // ── Pillar 2: Ground Shadow ─────────────────────────────────────────
  const gsId = `bt-gs-${entityId}`;
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
  const gsEl = document.createElementNS(SVG_NS, 'ellipse');
  gsEl.setAttribute('cx', '0');
  gsEl.setAttribute('cy', String(bottomY + nodeR + nodeR * 0.3));
  gsEl.setAttribute('rx', String(bodyW * 0.4));
  gsEl.setAttribute('ry', String(nodeR * 0.4));
  gsEl.setAttribute('fill', `url(#${gsId})`);
  innerG.appendChild(gsEl);

  // ── Pillar 3: Ambient Occlusion ─────────────────────────────────────
  const aoId = `bt-ao-${entityId}`;
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
  const aoEl = document.createElementNS(SVG_NS, 'rect');
  aoEl.setAttribute('x', String(leftX - nodeR * 2));
  aoEl.setAttribute('y', String(topY - nodeR * 2));
  aoEl.setAttribute('width', String(bodyW));
  aoEl.setAttribute('height', String(bodyH));
  aoEl.setAttribute('fill', `url(#${aoId})`);
  aoEl.setAttribute('pointer-events', 'none');
  innerG.appendChild(aoEl);

  // ── Body gradients ──────────────────────────────────────────────────
  const bodyFillId = `bt-bf-${entityId}`;
  if (!defs.querySelector(`#${bodyFillId}`)) {
    const g = document.createElementNS(SVG_NS, 'radialGradient');
    g.setAttribute('id', bodyFillId);
    const s1 = document.createElementNS(SVG_NS, 'stop');
    s1.setAttribute('offset', '0%'); s1.setAttribute('stop-color', color); s1.setAttribute('stop-opacity', '0.3');
    const s2 = document.createElementNS(SVG_NS, 'stop');
    s2.setAttribute('offset', '100%'); s2.setAttribute('stop-color', color); s2.setAttribute('stop-opacity', '0.08');
    g.appendChild(s1); g.appendChild(s2);
    defs.appendChild(g);
  }
  const bodyStrokeId = `bt-bs-${entityId}`;
  if (!defs.querySelector(`#${bodyStrokeId}`)) {
    const g = document.createElementNS(SVG_NS, 'linearGradient');
    g.setAttribute('id', bodyStrokeId);
    g.setAttribute('x1', '0%'); g.setAttribute('y1', '0%'); g.setAttribute('x2', '100%'); g.setAttribute('y2', '100%');
    const s1 = document.createElementNS(SVG_NS, 'stop');
    s1.setAttribute('offset', '0%'); s1.setAttribute('stop-color', color); s1.setAttribute('stop-opacity', '0.9');
    const s2 = document.createElementNS(SVG_NS, 'stop');
    s2.setAttribute('offset', '100%'); s2.setAttribute('stop-color', color); s2.setAttribute('stop-opacity', '0.3');
    g.appendChild(s1); g.appendChild(s2);
    defs.appendChild(g);
  }

  // ── Highlight glow ring ─────────────────────────────────────────────
  if (entity.highlight) {
    const glow = document.createElementNS(SVG_NS, 'rect');
    glow.setAttribute('x', String(leftX - nodeR * 2 - 3));
    glow.setAttribute('y', String(topY - nodeR - 3));
    glow.setAttribute('width', String(bodyW + 6));
    glow.setAttribute('height', String(bodyH + 6));
    glow.setAttribute('rx', '6');
    glow.setAttribute('fill', 'none');
    glow.setAttribute('stroke-width', String(STROKE.default));
    glow.setAttribute('stroke-dasharray', '4,4');
    applyGlowColors(glow, cc);
    innerG.appendChild(glow);
  }

  // ── Edges ───────────────────────────────────────────────────────────
  edges.forEach(({ x1, y1, x2, y2 }) => {
    const line = document.createElementNS(SVG_NS, 'line');
    line.setAttribute('x1', String(x1)); line.setAttribute('y1', String(y1));
    line.setAttribute('x2', String(x2)); line.setAttribute('y2', String(y2));
    line.setAttribute('stroke', colorWithAlpha(color, '88'));
    line.setAttribute('stroke-width', String(STROKE.default * 0.7));
    innerG.appendChild(line);
  });

  // ── Nodes ───────────────────────────────────────────────────────────
  // Compute depth for stagger
  const rootY = nodes.length > 0 ? Math.min(...nodes.map((n) => n.y)) : 0;
  nodes.forEach(({ x, y, value }, _idx) => {
    const depth = Math.round((y - rootY) / (dy || 1));
    const circle = document.createElementNS(SVG_NS, 'circle');
    circle.setAttribute('cx', String(x));
    circle.setAttribute('cy', String(y));
    circle.setAttribute('r', String(nodeR));
    circle.setAttribute('fill', `url(#${bodyFillId})`);
    circle.setAttribute('stroke', `url(#${bodyStrokeId})`);
    circle.setAttribute('stroke-width', String(STROKE.default));
    circle.classList.add(`bt-node-${entityId}`);
    circle.style.animationDelay = `${depth * 0.25}s`;
    innerG.appendChild(circle);

    const text = document.createElementNS(SVG_NS, 'text');
    text.setAttribute('x', String(x));
    text.setAttribute('y', String(y));
    text.setAttribute('text-anchor', 'middle');
    text.setAttribute('dominant-baseline', 'middle');
    text.setAttribute('fill', cc.textPrimary);
    text.setAttribute('font-size', String(TYPOGRAPHY.fontSizeLabel * 0.85));
    text.setAttribute('font-weight', String(TYPOGRAPHY.fontWeightTitle));
    text.setAttribute('font-family', TYPOGRAPHY.fontLabel);
    text.textContent = String(value);
    innerG.appendChild(text);
  });

  // ── Pillar 4: Specular Highlight ────────────────────────────────────
  const specId = `bt-spec-${entityId}`;
  if (!defs.querySelector(`#${specId}`)) {
    const g = document.createElementNS(SVG_NS, 'radialGradient');
    g.setAttribute('id', specId);
    g.setAttribute('cx', '35%'); g.setAttribute('cy', '25%'); g.setAttribute('r', '40%');
    const s1 = document.createElementNS(SVG_NS, 'stop');
    s1.setAttribute('offset', '0%'); s1.setAttribute('stop-color', '#ffffff'); s1.setAttribute('stop-opacity', '0.18');
    const s2 = document.createElementNS(SVG_NS, 'stop');
    s2.setAttribute('offset', '100%'); s2.setAttribute('stop-color', '#ffffff'); s2.setAttribute('stop-opacity', '0');
    g.appendChild(s1); g.appendChild(s2);
    defs.appendChild(g);
  }
  const specEl = document.createElementNS(SVG_NS, 'ellipse');
  specEl.setAttribute('cx', String(-bodyW * 0.1));
  specEl.setAttribute('cy', String(topY));
  specEl.setAttribute('rx', String(bodyW * 0.3));
  specEl.setAttribute('ry', String(bodyH * 0.2));
  specEl.setAttribute('fill', `url(#${specId})`);
  specEl.setAttribute('pointer-events', 'none');
  innerG.appendChild(specEl);

  // ── Pillar 5: Micro-Life ────────────────────────────────────────────
  const styleId = `bt-style-${entityId}`;
  const svg = parentEl.ownerSVGElement ?? (parentEl as unknown as SVGSVGElement);
  if (!svg.querySelector(`#${styleId}`)) {
    const style = document.createElementNS(SVG_NS, 'style');
    style.setAttribute('id', styleId);
    style.textContent = `
      @keyframes btNodePulse_${entityId} {
        0%, 100% { transform: scale(1); }
        50% { transform: scale(1.08); }
      }
      @keyframes btFloat_${entityId} {
        0%, 100% { transform: translateY(0); }
        50% { transform: translateY(-2.5px); }
      }
      .bt-node-${entityId} {
        animation: btNodePulse_${entityId} 2.4s ease-in-out infinite;
      }
      .bt-float-${entityId} {
        animation: btFloat_${entityId} 3.5s ease-in-out infinite;
      }
    `;
    svg.insertBefore(style, svg.firstChild);
  }
  innerG.classList.add(`bt-float-${entityId}`);

  // ── Label below ─────────────────────────────────────────────────────
  if (entity.label) {
    const label = document.createElementNS(SVG_NS, 'text');
    label.setAttribute('x', '0');
    label.setAttribute('y', String(bottomY + nodeR + LABEL_DEFAULTS.offsetBelow));
    label.setAttribute('text-anchor', LABEL_DEFAULTS.textAnchor);
    label.setAttribute('fill', cc.textPrimary);
    label.setAttribute('font-size', String(TYPOGRAPHY.fontSizeLabel));
    label.setAttribute('font-weight', String(TYPOGRAPHY.fontWeightTitle));
    label.setAttribute('font-family', TYPOGRAPHY.fontLabel);
    label.textContent = entity.label;
    innerG.appendChild(label);
  }

  applyEntranceAnimation(innerG, entity);
  parentEl.appendChild(outerG);
  return outerG;
}
