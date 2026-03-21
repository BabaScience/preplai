/**
 * @preplai/illustrations — DeadlockGraph Component (minimalist)
 *
 * Resource allocation / wait-for graph: nodes (processes/resources) and directed edges.
 * A cycle indicates deadlock. No gradient fills.
 *
 * Metadata:
 *   nodes: Array<{ id, label }> — processes or resources
 *   edges: Array<{ from, to }> — "waits for" relationships (from → to)
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
  STROKE,
} from '../design-tokens.js';
import type { VisualEntity } from '@preplai/shared';

interface NodeDef {
  id: string;
  label?: string;
}

interface EdgeDef {
  from: string;
  to: string;
}

export function renderDeadlockGraph(entity: VisualEntity, parentEl: SVGElement): SVGGElement {
  const { outerG, innerG } = buildEntityGroup(entity);

  const s = getSizeParam(entity);
  const scale = s / 50;
  const nodeFontSize = getLabelFontSize('value', scale);
  const strokeDefault = getStrokeWidth('default', scale);
  const strokeEmphasized = getStrokeWidth('emphasized', scale);
  const color = entity.color ?? getCategoryColor('DeadlockGraph');

  const meta = entity.metadata ?? {};
  const nodesData = meta.nodes as NodeDef[] | undefined;
  const edgesData = meta.edges as EdgeDef[] | undefined;

  const nodes: NodeDef[] = nodesData ?? [
    { id: 'P1', label: 'P1' },
    { id: 'R1', label: 'R1' },
    { id: 'P2', label: 'P2' },
    { id: 'R2', label: 'R2' },
  ];
  const edges: EdgeDef[] = edgesData ?? [
    { from: 'P1', to: 'R1' },
    { from: 'R1', to: 'P2' },
    { from: 'P2', to: 'R2' },
    { from: 'R2', to: 'P1' },
  ];

  const r = s * 0.28;
  const spacing = s * 0.55;
  const positions: Record<string, { x: number; y: number }> = {};
  nodes.forEach((n, i) => {
    const angle = (i / nodes.length) * Math.PI * 2 - Math.PI / 2;
    positions[n.id] = { x: Math.cos(angle) * spacing, y: Math.sin(angle) * spacing };
  });

  // Highlight glow
  if (entity.highlight) {
    const glow = document.createElementNS(SVG_NS, 'circle');
    glow.setAttribute('cx', '0');
    glow.setAttribute('cy', '0');
    glow.setAttribute('r', String(spacing + r + 6));
    glow.setAttribute('fill', 'none');
    glow.setAttribute('stroke', colorWithAlpha(color, OPACITY.strokeMuted));
    glow.setAttribute('stroke-width', String(STROKE.default));
    glow.setAttribute('stroke-dasharray', '4,4');
    innerG.appendChild(glow);
  }

  // Arrow markers — inline SVG marker (no defs dependency)
  const markerId = `arrow-dg-${entity.id.replace(/[^a-z0-9]/gi, '')}`;
  const defs = document.createElementNS(SVG_NS, 'defs');
  const marker = document.createElementNS(SVG_NS, 'marker');
  marker.setAttribute('id', markerId);
  marker.setAttribute('markerWidth', '10');
  marker.setAttribute('markerHeight', '8');
  marker.setAttribute('refX', '9');
  marker.setAttribute('refY', '4');
  marker.setAttribute('orient', 'auto');
  const poly = document.createElementNS(SVG_NS, 'polygon');
  poly.setAttribute('points', '0 0, 10 4, 0 8');
  poly.setAttribute('fill', colorWithAlpha(color, OPACITY.strokeSoft));
  marker.appendChild(poly);
  defs.appendChild(marker);
  innerG.appendChild(defs);

  // Edges
  for (const { from, to } of edges) {
    const p1 = positions[from];
    const p2 = positions[to];
    if (!p1 || !p2) continue;
    const dx = p2.x - p1.x;
    const dy = p2.y - p1.y;
    const len = Math.sqrt(dx * dx + dy * dy) || 1;
    const nx = dx / len;
    const ny = dy / len;
    const trim = r + 4;
    const x1 = p1.x + nx * trim;
    const y1 = p1.y + ny * trim;
    const x2 = p2.x - nx * trim;
    const y2 = p2.y - ny * trim;

    const line = document.createElementNS(SVG_NS, 'line');
    line.setAttribute('x1', String(x1));
    line.setAttribute('y1', String(y1));
    line.setAttribute('x2', String(x2));
    line.setAttribute('y2', String(y2));
    line.setAttribute('stroke', colorWithAlpha(color, OPACITY.strokeSoft));
    line.setAttribute('stroke-width', String(strokeEmphasized));
    line.setAttribute('marker-end', `url(#${markerId})`);
    innerG.appendChild(line);
  }

  // Nodes
  for (const node of nodes) {
    const pos = positions[node.id] ?? { x: 0, y: 0 };
    const label = node.label ?? node.id;

    const circle = document.createElementNS(SVG_NS, 'circle');
    circle.setAttribute('cx', String(pos.x));
    circle.setAttribute('cy', String(pos.y));
    circle.setAttribute('r', String(r));
    circle.setAttribute('fill', colorWithAlpha(color, OPACITY.fillMedium));
    circle.setAttribute('stroke', color);
    circle.setAttribute('stroke-width', String(strokeDefault));
    innerG.appendChild(circle);

    const text = document.createElementNS(SVG_NS, 'text');
    text.setAttribute('x', String(pos.x));
    text.setAttribute('y', String(pos.y + 4));
    text.setAttribute('text-anchor', 'middle');
    text.setAttribute('fill', color);
    text.setAttribute('font-size', String(nodeFontSize));
    text.setAttribute('font-weight', String(TYPOGRAPHY.fontWeightEmphasis));
    text.setAttribute('font-family', TYPOGRAPHY.fontBadge);
    text.textContent = label;
    innerG.appendChild(text);
  }

  if (entity.label) {
    const text = document.createElementNS(SVG_NS, 'text');
    text.setAttribute('x', '0');
    text.setAttribute('y', String(spacing + r + LABEL_DEFAULTS.offsetBelow));
    text.setAttribute('text-anchor', LABEL_DEFAULTS.textAnchor);
    text.setAttribute('fill', color);
    text.setAttribute('font-size', String(getLabelFontSize('label', scale)));
    text.setAttribute('font-weight', String(TYPOGRAPHY.fontWeightLabel));
    text.setAttribute('font-family', TYPOGRAPHY.fontLabel);
    text.textContent = entity.label;
    innerG.appendChild(text);
  }

  applyEntranceAnimation(innerG, entity);
  parentEl.appendChild(outerG);
  return outerG;
}
