/**
 * @preplai/illustrations — Arrow & DataFlow Components
 *
 * Special: Arrow/DataFlow do NOT use the double-<g> pattern.
 * Their position is defined by x1/y1/x2/y2 line attributes.
 * They require source/target entity resolution.
 *
 * Arrows connect at entity edges (not centers) for cleaner flow diagrams.
 */

import { SVG_NS, getSizeParam } from '../utils.js';
import { CANVAS_WIDTH, CANVAS_HEIGHT } from '@preplai/shared';
import { getCategoryColor, TYPOGRAPHY } from '../design-tokens.js';
import type { VisualEntity } from '@preplai/shared';

/** Rect in SVG coordinates */
interface Rect {
  left: number;
  right: number;
  top: number;
  bottom: number;
}

/**
 * Get the bounding rect of an entity in SVG coordinates.
 * Uses DOM getBBox when the element exists; otherwise estimates from position + size.
 */
function getEntityRect(entity: VisualEntity, svgRoot: SVGElement | null): Rect {
  const cx = (entity.position.x / 100) * CANVAS_WIDTH;
  const cy = (entity.position.y / 100) * CANVAS_HEIGHT;

  const escapedId = typeof CSS !== 'undefined' && CSS.escape
    ? CSS.escape(entity.id)
    : entity.id.replace(/[!"#$%&'()*+,.\/:;<=>?@[\\\]^`{|}~]/g, '\\$&');
  const el = svgRoot?.querySelector(`#${escapedId}`);
  if (el && typeof (el as SVGGraphicsElement).getBBox === 'function') {
    const bbox = (el as SVGGraphicsElement).getBBox();
    return {
      left: cx + bbox.x,
      right: cx + bbox.x + bbox.width,
      top: cy + bbox.y,
      bottom: cy + bbox.y + bbox.height,
    };
  }

  // Fallback: estimate from size (entities are roughly 2×baseSize wide, 1.5×baseSize tall)
  const base = getSizeParam(entity);
  const halfW = base * 1.2;
  const halfH = base * 0.9;
  return {
    left: cx - halfW,
    right: cx + halfW,
    top: cy - halfH,
    bottom: cy + halfH,
  };
}

/**
 * Find where a line segment intersects a rect's boundary.
 * Returns the point on the line that lies on the rect edge.
 * - For source: exit point (smallest t > 0)
 * - For target: entry point (largest t < 1)
 */
function lineRectIntersection(
  x1: number,
  y1: number,
  x2: number,
  y2: number,
  rect: Rect,
  wantExitFromSource: boolean
): { x: number; y: number } | null {
  const dx = x2 - x1;
  const dy = y2 - y1;
  const len = Math.sqrt(dx * dx + dy * dy);
  if (len < 1e-6) return null;

  const { left, right, top, bottom } = rect;
  let bestT: number | null = null;

  // Test each edge: top, right, bottom, left
  const edges: Array<[[number, number], [number, number]]> = [
    [[left, top], [right, top]],
    [[right, top], [right, bottom]],
    [[right, bottom], [left, bottom]],
    [[left, bottom], [left, top]],
  ];

  for (const [[ex1, ey1], [ex2, ey2]] of edges) {
    const ex = ex2 - ex1;
    const ey = ey2 - ey1;
    const denom = dx * ey - dy * ex;
    if (Math.abs(denom) < 1e-9) continue;

    const t = ((ex1 - x1) * ey - (ey1 - y1) * ex) / denom;
    const u = ((x1 - ex1) * dy - (y1 - ey1) * dx) / -denom;

    if (u >= 0 && u <= 1 && t >= 0 && t <= 1) {
      if (wantExitFromSource) {
        if (bestT === null || t < bestT) bestT = t;
      } else {
        if (bestT === null || t > bestT) bestT = t;
      }
    }
  }

  if (bestT === null) return null;
  return {
    x: x1 + bestT * dx,
    y: y1 + bestT * dy,
  };
}

/**
 * Resolves an entity reference string (ID or label) to a VisualEntity.
 * Three-tier lookup: exact ID → exact label (case-insensitive) → substring label.
 */
export function resolveEntityRef(ref: string | undefined, allEntities: VisualEntity[]): VisualEntity | null {
  if (!ref) return null;

  // Tier 1: Exact ID match
  let found = allEntities.find(e => e.id === ref);
  if (found) return found;

  // Tier 2: Exact label match (case-insensitive)
  found = allEntities.find(
    e => e.label?.toLowerCase() === ref.toLowerCase()
  );
  if (found) return found;

  // Tier 3: Substring match
  found = allEntities.find(
    e => e.label?.toLowerCase().includes(ref.toLowerCase())
  );
  return found ?? null;
}

/**
 * Inject an arrowhead <marker> into <defs> if it doesn't already exist.
 */
function ensureArrowheadMarker(markerId: string, color: string, svgEl: SVGElement): void {
  if (svgEl.querySelector(`#${markerId}`)) return;

  let defs = svgEl.querySelector('defs');
  if (!defs) {
    defs = document.createElementNS(SVG_NS, 'defs');
    svgEl.insertBefore(defs, svgEl.firstChild);
  }

  const marker = document.createElementNS(SVG_NS, 'marker');
  marker.setAttribute('id', markerId);
  marker.setAttribute('markerWidth', '10');
  marker.setAttribute('markerHeight', '10');
  marker.setAttribute('refX', '9');
  marker.setAttribute('refY', '3');
  marker.setAttribute('orient', 'auto');

  const polygon = document.createElementNS(SVG_NS, 'polygon');
  polygon.setAttribute('points', '0 0, 10 3, 0 6');
  polygon.setAttribute('fill', color);

  marker.appendChild(polygon);
  defs.appendChild(marker);
}

/**
 * Renders a connection arrow between two entities.
 * Called in Pass 2 (after all other entities are in DOM).
 */
export function renderArrow(
  entity: VisualEntity,
  allEntities: VisualEntity[],
  parentEl: SVGElement,
): SVGElement | null {
  const source = resolveEntityRef(entity.sourceEntityId, allEntities);
  const target = resolveEntityRef(entity.targetEntityId, allEntities);

  if (!source || !target) {
    console.warn(
      `[Arrow] Could not resolve source="${entity.sourceEntityId}" ` +
      `or target="${entity.targetEntityId}" for arrow id="${entity.id}"`
    );
    return null;
  }

  const sx = (source.position.x / 100) * CANVAS_WIDTH;
  const sy = (source.position.y / 100) * CANVAS_HEIGHT;
  const tx = (target.position.x / 100) * CANVAS_WIDTH;
  const ty = (target.position.y / 100) * CANVAS_HEIGHT;

  const svgRoot = parentEl.ownerSVGElement ?? (parentEl as SVGElement);
  const sourceRect = getEntityRect(source, svgRoot);
  const targetRect = getEntityRect(target, svgRoot);

  const sourceExit = lineRectIntersection(sx, sy, tx, ty, sourceRect, true);
  const targetEntry = lineRectIntersection(sx, sy, tx, ty, targetRect, false);

  const x1 = sourceExit?.x ?? sx;
  const y1 = sourceExit?.y ?? sy;
  const x2 = targetEntry?.x ?? tx;
  const y2 = targetEntry?.y ?? ty;

  const color = entity.color ?? getCategoryColor('Arrow');

  // Unique arrowhead marker
  const markerId = `arrowhead-${entity.id}`;
  ensureArrowheadMarker(markerId, color, svgRoot);

  // Wrapper group
  const g = document.createElementNS(SVG_NS, 'g');
  g.setAttribute('id', entity.id);
  g.setAttribute('data-type', 'Arrow');
  g.style.willChange = 'opacity';

  // Line
  const line = document.createElementNS(SVG_NS, 'line');
  line.setAttribute('x1', String(x1));
  line.setAttribute('y1', String(y1));
  line.setAttribute('x2', String(x2));
  line.setAttribute('y2', String(y2));
  line.setAttribute('stroke', color);
  line.setAttribute('stroke-width', '2.5');
  line.setAttribute('opacity', '0.85');
  line.setAttribute('marker-end', `url(#${markerId})`);
  g.appendChild(line);

  // Optional midpoint label with background pill for readability
  if (entity.label) {
    const midX = (x1 + x2) / 2;
    const midY = (y1 + y2) / 2;
    const labelLen = entity.label.length * 6;
    const pillW = Math.max(labelLen + 16, 40);
    const pillH = 20;
    const pill = document.createElementNS(SVG_NS, 'rect');
    pill.setAttribute('x', String(midX - pillW / 2));
    pill.setAttribute('y', String(midY - pillH - 14));
    pill.setAttribute('width', String(pillW));
    pill.setAttribute('height', String(pillH));
    pill.setAttribute('rx', '10');
    pill.setAttribute('fill', 'rgba(12, 13, 20, 0.9)');
    pill.setAttribute('stroke', `${color}60`);
    pill.setAttribute('stroke-width', '1');
    g.appendChild(pill);
    const text = document.createElementNS(SVG_NS, 'text');
    text.setAttribute('x', String(midX));
    text.setAttribute('y', String(midY - 6));
    text.setAttribute('text-anchor', 'middle');
    text.setAttribute('fill', color);
    text.setAttribute('font-size', '12');
    text.setAttribute('font-weight', String(TYPOGRAPHY.fontWeightLabel));
    text.setAttribute('font-family', TYPOGRAPHY.fontLabel);
    text.textContent = entity.label;
    g.appendChild(text);
  }

  // Entrance animation (fade in only)
  if (entity.animation?.delay != null) {
    g.style.animation = 'fadeIn 0.3s ease both';
    g.style.animationDelay = `${entity.animation.delay}ms`;
    g.style.opacity = '0';
  }

  parentEl.appendChild(g);
  return g;
}

/**
 * DataFlow: animated dashed arrow variant.
 * Uses SMIL stroke-dashoffset animation for the "flowing data" effect.
 */
export function renderDataFlow(
  entity: VisualEntity,
  allEntities: VisualEntity[],
  parentEl: SVGElement,
): SVGElement | null {
  const source = resolveEntityRef(entity.sourceEntityId, allEntities);
  const target = resolveEntityRef(entity.targetEntityId, allEntities);

  if (!source || !target) {
    console.warn(`[DataFlow] Could not resolve source/target for id="${entity.id}"`);
    return null;
  }

  const sx = (source.position.x / 100) * CANVAS_WIDTH;
  const sy = (source.position.y / 100) * CANVAS_HEIGHT;
  const tx = (target.position.x / 100) * CANVAS_WIDTH;
  const ty = (target.position.y / 100) * CANVAS_HEIGHT;

  const svgRoot = parentEl.ownerSVGElement ?? (parentEl as SVGElement);
  const sourceRect = getEntityRect(source, svgRoot);
  const targetRect = getEntityRect(target, svgRoot);

  const sourceExit = lineRectIntersection(sx, sy, tx, ty, sourceRect, true);
  const targetEntry = lineRectIntersection(sx, sy, tx, ty, targetRect, false);

  const x1 = sourceExit?.x ?? sx;
  const y1 = sourceExit?.y ?? sy;
  const x2 = targetEntry?.x ?? tx;
  const y2 = targetEntry?.y ?? ty;
  const color = entity.color ?? getCategoryColor('DataFlow');

  const markerId = `arrowhead-dataflow-${entity.id}`;
  ensureArrowheadMarker(markerId, color, svgRoot);

  const g = document.createElementNS(SVG_NS, 'g');
  g.setAttribute('id', entity.id);
  g.setAttribute('data-type', 'DataFlow');

  const line = document.createElementNS(SVG_NS, 'line');
  line.setAttribute('x1', String(x1));
  line.setAttribute('y1', String(y1));
  line.setAttribute('x2', String(x2));
  line.setAttribute('y2', String(y2));
  line.setAttribute('stroke', color);
  line.setAttribute('stroke-width', '4');
  line.setAttribute('stroke-dasharray', '8,4');
  line.setAttribute('stroke-dashoffset', '0');
  line.setAttribute('opacity', '0.7');
  line.setAttribute('marker-end', `url(#${markerId})`);

  // SMIL dash animation
  const anim = document.createElementNS(SVG_NS, 'animate');
  anim.setAttribute('attributeName', 'stroke-dashoffset');
  anim.setAttribute('from', '12');
  anim.setAttribute('to', '0');
  anim.setAttribute('dur', '0.8s');
  anim.setAttribute('repeatCount', 'indefinite');
  line.appendChild(anim);
  g.appendChild(line);

  parentEl.appendChild(g);
  return g;
}
