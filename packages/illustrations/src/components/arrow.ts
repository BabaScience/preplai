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

import { resolveEntityRef } from '@preplai/shared';

const ARROW_LIKE_TYPES = ['Arrow', 'BidirectArrow', 'DottedArrow', 'DataFlow'] as const;

/**
 * Returns true if there is another arrow of the same type between the same two entities
 * in the opposite direction. Used to auto-apply curved rendering so opposing arrows don't overlap.
 * DataFlow only pairs with DataFlow, DottedArrow only with DottedArrow, etc.
 */
function hasOpposingArrow(
  entity: VisualEntity,
  allEntities: VisualEntity[],
  sourceId: string,
  targetId: string,
): boolean {
  return allEntities.some((e) => {
    if (e.id === entity.id || e.type !== entity.type || !(ARROW_LIKE_TYPES as readonly string[]).includes(e.type)) return false;
    const otherSource = resolveEntityRef(e.sourceEntityId, allEntities);
    const otherTarget = resolveEntityRef(e.targetEntityId, allEntities);
    if (!otherSource || !otherTarget) return false;
    return otherSource.id === targetId && otherTarget.id === sourceId;
  });
}

/**
 * Inject an arrowhead <marker> into <defs> if it doesn't already exist.
 * Uses orient="auto-start-reverse" so the same marker works for both marker-start and marker-end
 * (start arrowhead points back, end arrowhead points forward).
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
  marker.setAttribute('orient', 'auto-start-reverse');

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
  const hasOpposing = hasOpposingArrow(entity, allEntities, source.id, target.id);
  const useCurved = entity.metadata?.curved === true || hasOpposing;
  const isBidirect = entity.type === 'BidirectArrow';
  const isDotted = entity.type === 'DottedArrow';

  // Opposing arrows (A→B vs B→A) naturally curve in opposite directions because the
  // line direction is reversed—the perpendicular (-dy, dx) flips. Use same curvature magnitude.
  const curvatureSign = 1;

  let ctrlX = 0;
  let ctrlY = 0;
  if (useCurved) {
    const midX = (x1 + x2) / 2;
    const midY = (y1 + y2) / 2;
    const dx = x2 - x1;
    const dy = y2 - y1;
    const len = Math.sqrt(dx * dx + dy * dy) || 1;
    const curvature = curvatureSign * Math.min(len * 0.3, 80);
    ctrlX = midX + (-dy / len) * curvature;
    ctrlY = midY + (dx / len) * curvature;
  }

  // Unique arrowhead marker
  const markerId = `arrowhead-${entity.id}`;
  ensureArrowheadMarker(markerId, color, svgRoot);

  // Wrapper group
  const g = document.createElementNS(SVG_NS, 'g');
  g.setAttribute('id', entity.id);
  g.setAttribute('data-type', entity.type);
  g.style.willChange = 'opacity';

  const strokeAttrs: Record<string, string> = {
    fill: 'none',
    stroke: color,
    'stroke-width': '2.5',
    opacity: '0.85',
    'marker-end': `url(#${markerId})`,
  };
  if (isBidirect) strokeAttrs['marker-start'] = `url(#${markerId})`;
  if (isDotted) strokeAttrs['stroke-dasharray'] = '6,4';

  if (useCurved) {
    const path = document.createElementNS(SVG_NS, 'path');
    path.setAttribute('d', `M ${x1} ${y1} Q ${ctrlX} ${ctrlY} ${x2} ${y2}`);
    for (const [k, v] of Object.entries(strokeAttrs)) path.setAttribute(k, v);
    g.appendChild(path);
  } else {
    const line = document.createElementNS(SVG_NS, 'line');
    line.setAttribute('x1', String(x1));
    line.setAttribute('y1', String(y1));
    line.setAttribute('x2', String(x2));
    line.setAttribute('y2', String(y2));
    for (const [k, v] of Object.entries(strokeAttrs)) line.setAttribute(k, v);
    g.appendChild(line);
  }

  // Optional midpoint label (text only, no background)
  if (entity.label) {
    const midX = useCurved ? 0.25 * x1 + 0.5 * ctrlX + 0.25 * x2 : (x1 + x2) / 2;
    const midY = useCurved ? 0.25 * y1 + 0.5 * ctrlY + 0.25 * y2 : (y1 + y2) / 2;
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

  // Entrance animation (only when delay > 0; avoid opacity:0 when fadeIn keyframes missing)
  if (entity.animation?.delay != null && entity.animation.delay > 0) {
    g.style.animation = 'fadeIn 0.3s ease both';
    g.style.animationDelay = `${entity.animation.delay}ms`;
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
  const hasOpposing = hasOpposingArrow(entity, allEntities, source.id, target.id);
  const useCurved = entity.metadata?.curved === true || hasOpposing;
  const curvatureSign = 1;

  const g = document.createElementNS(SVG_NS, 'g');
  g.setAttribute('id', entity.id);
  g.setAttribute('data-type', 'DataFlow');

  if (useCurved) {
    const midX = (x1 + x2) / 2;
    const midY = (y1 + y2) / 2;
    const dx = x2 - x1;
    const dy = y2 - y1;
    const len = Math.sqrt(dx * dx + dy * dy) || 1;
    const curvature = curvatureSign * Math.min(len * 0.3, 80);
    const ctrlX = midX + (-dy / len) * curvature;
    const ctrlY = midY + (dx / len) * curvature;
    const path = document.createElementNS(SVG_NS, 'path');
    path.setAttribute('d', `M ${x1} ${y1} Q ${ctrlX} ${ctrlY} ${x2} ${y2}`);
    path.setAttribute('fill', 'none');
    path.setAttribute('stroke', color);
    path.setAttribute('stroke-width', '4');
    path.setAttribute('stroke-dasharray', '8,4');
    path.setAttribute('stroke-dashoffset', '0');
    path.setAttribute('opacity', '0.7');
    const anim = document.createElementNS(SVG_NS, 'animate');
    anim.setAttribute('attributeName', 'stroke-dashoffset');
    anim.setAttribute('from', '12');
    anim.setAttribute('to', '0');
    anim.setAttribute('dur', '0.8s');
    anim.setAttribute('repeatCount', 'indefinite');
    path.appendChild(anim);
    g.appendChild(path);
  } else {
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
    const anim = document.createElementNS(SVG_NS, 'animate');
    anim.setAttribute('attributeName', 'stroke-dashoffset');
    anim.setAttribute('from', '12');
    anim.setAttribute('to', '0');
    anim.setAttribute('dur', '0.8s');
    anim.setAttribute('repeatCount', 'indefinite');
    line.appendChild(anim);
    g.appendChild(line);
  }

  parentEl.appendChild(g);
  return g;
}
