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
import { getCategoryColor, TYPOGRAPHY, getLabelFontSize, colorWithAlpha } from '../design-tokens.js';
import type { VisualEntity } from '@preplai/shared';

/**
 * Arrow stroke widths — balanced for 1920x1080 canvas at typical display sizes.
 * At 700px display: 8px canvas → ~2.9px screen (polished, not heavy).
 */
const ARROW_STROKE = 4;
/** DataFlow stroke — slightly thicker for dashes to read clearly */
const DATAFLOW_STROKE = 4.5;
/** Dotted arrow dash pattern */
const DOTTED_DASH = '14,8';
/** DataFlow flowing dash pattern */
const DATAFLOW_DASH = '16,7';

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

import { resolveEntityRef, isConnectionType } from '@preplai/shared';

/**
 * Check if a straight line from (x1,y1) to (x2,y2) passes through any
 * entity's bounding box that isn't the source or target.
 * Uses a simple line-segment vs axis-aligned rect intersection test.
 */
function checkArrowCollision(
  x1: number, y1: number, x2: number, y2: number,
  sourceId: string, targetId: string,
  allEntities: VisualEntity[], svgRoot: SVGElement | null,
): boolean {
  for (const e of allEntities) {
    // Skip source, target, and connections
    if (e.id === sourceId || e.id === targetId) continue;
    if (isConnectionType(e.type)) continue;

    const rect = getEntityRect(e, svgRoot);
    // Pad the rect slightly so arrows don't graze edges
    const PAD = 8;
    const padded: Rect = {
      left: rect.left - PAD,
      right: rect.right + PAD,
      top: rect.top - PAD,
      bottom: rect.bottom + PAD,
    };

    // Check if line segment intersects this padded rect
    if (lineSegmentIntersectsRect(x1, y1, x2, y2, padded)) {
      return true;
    }
  }
  return false;
}

/**
 * Test whether a line segment from (x1,y1) to (x2,y2) intersects an AABB.
 */
function lineSegmentIntersectsRect(
  x1: number, y1: number, x2: number, y2: number, rect: Rect,
): boolean {
  const dx = x2 - x1;
  const dy = y2 - y1;

  // Check all 4 edges for intersection with t in [0,1]
  const edges: Array<[[number, number], [number, number]]> = [
    [[rect.left, rect.top], [rect.right, rect.top]],
    [[rect.right, rect.top], [rect.right, rect.bottom]],
    [[rect.right, rect.bottom], [rect.left, rect.bottom]],
    [[rect.left, rect.bottom], [rect.left, rect.top]],
  ];

  for (const [[ex1, ey1], [ex2, ey2]] of edges) {
    const ex = ex2 - ex1;
    const ey = ey2 - ey1;
    const denom = dx * ey - dy * ex;
    if (Math.abs(denom) < 1e-9) continue;

    const t = ((ex1 - x1) * ey - (ey1 - y1) * ex) / denom;
    const u = ((x1 - ex1) * dy - (y1 - ey1) * dx) / -denom;

    if (t > 0.05 && t < 0.95 && u >= 0 && u <= 1) {
      return true; // Intersection within the middle 90% of the arrow (skip near endpoints)
    }
  }
  return false;
}

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
  marker.setAttribute('markerWidth', '16');
  marker.setAttribute('markerHeight', '12');
  marker.setAttribute('refX', '14');
  marker.setAttribute('refY', '6');
  marker.setAttribute('orient', 'auto-start-reverse');
  marker.setAttribute('markerUnits', 'userSpaceOnUse');

  // Sleek triangular arrowhead
  const polygon = document.createElementNS(SVG_NS, 'polygon');
  polygon.setAttribute('points', '0 1, 16 6, 0 11, 3 6');
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

  // Add gap so arrow doesn't touch entity edges
  const GAP = 12;
  const dx0 = tx - sx;
  const dy0 = ty - sy;
  const totalLen = Math.sqrt(dx0 * dx0 + dy0 * dy0) || 1;
  const ux = dx0 / totalLen;
  const uy = dy0 / totalLen;

  const x1 = (sourceExit?.x ?? sx) + ux * GAP;
  const y1 = (sourceExit?.y ?? sy) + uy * GAP;
  const x2 = (targetEntry?.x ?? tx) - ux * GAP;
  const y2 = (targetEntry?.y ?? ty) - uy * GAP;

  const color = entity.color ?? getCategoryColor('Arrow');
  const hasOpposing = hasOpposingArrow(entity, allEntities, source.id, target.id);

  // Collision detection: check if straight line crosses any unrelated entity
  const hasCollision = !entity.metadata?.curved && checkArrowCollision(
    x1, y1, x2, y2, source.id, target.id, allEntities, svgRoot,
  );

  const useCurved = entity.metadata?.curved === true || hasOpposing || hasCollision;
  const isBidirect = entity.type === 'BidirectArrow' || entity.metadata?.bidirectional === true;
  const isDotted = entity.type === 'DottedArrow';

  // Metadata-driven thickness override
  const thicknessMeta = entity.metadata?.thickness as string | undefined;
  const strokeWidth = thicknessMeta === 'thin' ? 2.5
    : thicknessMeta === 'thick' ? 6.5
    : ARROW_STROKE;

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
    'stroke-width': String(strokeWidth),
    'stroke-linecap': 'round',
    'stroke-linejoin': 'round',
    opacity: '0.7',
    'marker-end': `url(#${markerId})`,
  };
  if (isBidirect) strokeAttrs['marker-start'] = `url(#${markerId})`;
  if (isDotted) strokeAttrs['stroke-dasharray'] = DOTTED_DASH;

  // Build the path/line element
  const pathD = useCurved
    ? `M ${x1} ${y1} Q ${ctrlX} ${ctrlY} ${x2} ${y2}`
    : `M ${x1} ${y1} L ${x2} ${y2}`;

  const mainLine = document.createElementNS(SVG_NS, 'path');
  mainLine.setAttribute('d', pathD);
  for (const [k, v] of Object.entries(strokeAttrs)) mainLine.setAttribute(k, v);

  g.appendChild(mainLine);

  // Optional midpoint label with background pill
  if (entity.label) {
    const midX = useCurved ? 0.25 * x1 + 0.5 * ctrlX + 0.25 * x2 : (x1 + x2) / 2;
    const midY = useCurved ? 0.25 * y1 + 0.5 * ctrlY + 0.25 * y2 : (y1 + y2) / 2;
    const labelY = midY - 24;
    const labelFontSize = getLabelFontSize('label');
    const padH = 12;
    const padV = 6;
    // Estimate text width: ~8px per character at label font size
    const pillW = entity.label.length * (labelFontSize * 0.6) + padH * 2;
    const pillH = labelFontSize + padV * 2;

    // Background pill — uses color with transparency for theme-adaptive look
    const pill = document.createElementNS(SVG_NS, 'rect');
    pill.setAttribute('x', String(midX - pillW / 2));
    pill.setAttribute('y', String(labelY - pillH / 2));
    pill.setAttribute('width', String(pillW));
    pill.setAttribute('height', String(pillH));
    pill.setAttribute('rx', '8');
    pill.setAttribute('ry', '8');
    pill.setAttribute('fill', colorWithAlpha(color, '1f'));
    pill.setAttribute('stroke', colorWithAlpha(color, '40'));
    pill.setAttribute('stroke-width', '1');
    g.appendChild(pill);

    const text = document.createElementNS(SVG_NS, 'text');
    text.setAttribute('x', String(midX));
    text.setAttribute('y', String(labelY));
    text.setAttribute('text-anchor', 'middle');
    text.setAttribute('dominant-baseline', 'central');
    text.setAttribute('fill', color);
    text.setAttribute('font-size', String(labelFontSize));
    text.setAttribute('font-weight', String(TYPOGRAPHY.fontWeightBold));
    text.setAttribute('font-family', TYPOGRAPHY.fontLabel);
    text.textContent = entity.label;
    g.appendChild(text);
  }

  // ── Draw-on animation ──
  // Line draws itself from source → target, then arrival pulse, then idle flow
  const delayMs = entity.animation?.delay ?? 0;
  const dx = x2 - x1;
  const dy = y2 - y1;
  const dist = Math.sqrt(dx * dx + dy * dy);
  const pathLen = useCurved ? dist * 1.08 : dist;

  if (delayMs > 0 && pathLen > 10) {
    // Hide group initially, quick fade to reveal
    g.style.opacity = '0';
    g.style.animation = 'fadeIn 0.15s ease both';
    g.style.animationDelay = `${delayMs}ms`;

    // Draw-on: use stroke-dashoffset transition
    mainLine.style.strokeDasharray = `${pathLen}`;
    mainLine.style.strokeDashoffset = `${pathLen}`;
    mainLine.style.transition = 'stroke-dashoffset 0.6s cubic-bezier(0.22, 1, 0.36, 1)';

    // Phase 1: trigger draw-on
    setTimeout(() => {
      mainLine.style.strokeDashoffset = '0';
    }, delayMs + 30);

    // Phase 2: arrival pulse at target
    if (dist > 40) {
      setTimeout(() => {
        const pulse = document.createElementNS(SVG_NS, 'circle');
        pulse.setAttribute('cx', String(x2));
        pulse.setAttribute('cy', String(y2));
        pulse.setAttribute('r', '3');
        pulse.setAttribute('fill', color);
        pulse.setAttribute('opacity', '0');
        const scaleAnim = document.createElementNS(SVG_NS, 'animate');
        scaleAnim.setAttribute('attributeName', 'r');
        scaleAnim.setAttribute('from', '3');
        scaleAnim.setAttribute('to', '12');
        scaleAnim.setAttribute('dur', '0.4s');
        scaleAnim.setAttribute('begin', 'indefinite');
        scaleAnim.setAttribute('fill', 'freeze');
        pulse.appendChild(scaleAnim);
        const opacAnim = document.createElementNS(SVG_NS, 'animate');
        opacAnim.setAttribute('attributeName', 'opacity');
        opacAnim.setAttribute('values', '0;0.5;0');
        opacAnim.setAttribute('keyTimes', '0;0.25;1');
        opacAnim.setAttribute('dur', '0.4s');
        opacAnim.setAttribute('begin', 'indefinite');
        opacAnim.setAttribute('fill', 'freeze');
        pulse.appendChild(opacAnim);
        g.appendChild(pulse);
        if (typeof scaleAnim.beginElement === 'function') scaleAnim.beginElement();
        if (typeof opacAnim.beginElement === 'function') opacAnim.beginElement();
        setTimeout(() => { if (pulse.parentNode) pulse.parentNode.removeChild(pulse); }, 500);
      }, delayMs + 600);
    }

    // Phase 3: transition to idle flow
    setTimeout(() => {
      // Clear CSS transition, switch to SVG attributes for SMIL
      mainLine.style.strokeDasharray = '';
      mainLine.style.strokeDashoffset = '';
      mainLine.style.transition = '';
      // Restore original dasharray if dotted
      if (isDotted) {
        mainLine.setAttribute('stroke-dasharray', DOTTED_DASH);
      }
      // Apply flowing animation if metadata.animated is true
      if (entity.metadata?.animated === true && !isDotted) {
        mainLine.setAttribute('stroke-dasharray', DATAFLOW_DASH);
        const anim = document.createElementNS(SVG_NS, 'animate');
        anim.setAttribute('attributeName', 'stroke-dashoffset');
        anim.setAttribute('from', '17');
        anim.setAttribute('to', '0');
        anim.setAttribute('dur', '0.8s');
        anim.setAttribute('repeatCount', 'indefinite');
        mainLine.appendChild(anim);
      }
    }, delayMs + 1200);
  } else if (delayMs > 0) {
    // Short arrow or fallback: simple fadeIn
    g.style.animation = 'fadeIn 0.3s ease both';
    g.style.animationDelay = `${delayMs}ms`;
  }

  // Apply flowing animation for non-delayed arrows with metadata.animated
  if (entity.metadata?.animated === true && !isDotted && !(delayMs > 0 && pathLen > 10)) {
    mainLine.setAttribute('stroke-dasharray', DATAFLOW_DASH);
    const anim = document.createElementNS(SVG_NS, 'animate');
    anim.setAttribute('attributeName', 'stroke-dashoffset');
    anim.setAttribute('from', '17');
    anim.setAttribute('to', '0');
    anim.setAttribute('dur', '0.8s');
    anim.setAttribute('repeatCount', 'indefinite');
    mainLine.appendChild(anim);
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

  const DF_GAP = 12;
  const dfdx = tx - sx;
  const dfdy = ty - sy;
  const dfLen = Math.sqrt(dfdx * dfdx + dfdy * dfdy) || 1;
  const dfux = dfdx / dfLen;
  const dfuy = dfdy / dfLen;

  const x1 = (sourceExit?.x ?? sx) + dfux * DF_GAP;
  const y1 = (sourceExit?.y ?? sy) + dfuy * DF_GAP;
  const x2 = (targetEntry?.x ?? tx) - dfux * DF_GAP;
  const y2 = (targetEntry?.y ?? ty) - dfuy * DF_GAP;
  const color = entity.color ?? getCategoryColor('DataFlow');
  const hasOpposing = hasOpposingArrow(entity, allEntities, source.id, target.id);

  // Collision detection for DataFlow
  const dfHasCollision = !entity.metadata?.curved && checkArrowCollision(
    x1, y1, x2, y2, source.id, target.id, allEntities, svgRoot,
  );

  const useCurved = entity.metadata?.curved === true || hasOpposing || dfHasCollision;

  // Metadata-driven thickness override for DataFlow
  const dfThickness = entity.metadata?.thickness as string | undefined;
  const dfStrokeWidth = dfThickness === 'thin' ? 2.5
    : dfThickness === 'thick' ? 7
    : DATAFLOW_STROKE;
  const curvatureSign = 1;

  // Arrowhead for DataFlow
  const dfMarkerId = `arrowhead-${entity.id}`;
  ensureArrowheadMarker(dfMarkerId, color, svgRoot);

  const g = document.createElementNS(SVG_NS, 'g');
  g.setAttribute('id', entity.id);
  g.setAttribute('data-type', 'DataFlow');
  g.style.willChange = 'opacity';

  // Build path geometry
  let pathD: string;
  if (useCurved) {
    const midX = (x1 + x2) / 2;
    const midY = (y1 + y2) / 2;
    const ddx = x2 - x1;
    const ddy = y2 - y1;
    const len = Math.sqrt(ddx * ddx + ddy * ddy) || 1;
    const curvature = curvatureSign * Math.min(len * 0.3, 80);
    const ctrlX = midX + (-ddy / len) * curvature;
    const ctrlY = midY + (ddx / len) * curvature;
    pathD = `M ${x1} ${y1} Q ${ctrlX} ${ctrlY} ${x2} ${y2}`;
  } else {
    pathD = `M ${x1} ${y1} L ${x2} ${y2}`;
  }

  const mainLine = document.createElementNS(SVG_NS, 'path');
  mainLine.setAttribute('d', pathD);
  mainLine.setAttribute('fill', 'none');
  mainLine.setAttribute('stroke', color);
  mainLine.setAttribute('stroke-width', String(dfStrokeWidth));
  mainLine.setAttribute('stroke-linecap', 'round');
  mainLine.setAttribute('stroke-dasharray', DATAFLOW_DASH);
  mainLine.setAttribute('stroke-dashoffset', '0');
  mainLine.setAttribute('opacity', '0.85');
  mainLine.setAttribute('marker-end', `url(#${dfMarkerId})`);

  // ── Draw-on animation for DataFlow ──
  const delayMs = entity.animation?.delay ?? 0;
  const dx2 = x2 - x1;
  const dy2 = y2 - y1;
  const dist = Math.sqrt(dx2 * dx2 + dy2 * dy2);
  const pathLen = useCurved ? dist * 1.08 : dist;

  if (delayMs > 0 && pathLen > 10) {
    // Hide group, quick fade to reveal
    g.style.opacity = '0';
    g.style.animation = 'fadeIn 0.15s ease both';
    g.style.animationDelay = `${delayMs}ms`;

    // Draw-on via stroke-dashoffset
    mainLine.setAttribute('stroke-dasharray', `${pathLen}`);
    mainLine.setAttribute('stroke-dashoffset', `${pathLen}`);
    mainLine.style.transition = 'stroke-dashoffset 0.6s cubic-bezier(0.22, 1, 0.36, 1)';

    // Phase 1: trigger draw-on
    setTimeout(() => {
      mainLine.style.strokeDashoffset = '0';
    }, delayMs + 30);

    // Phase 2: transition to DataFlow dash pattern + SMIL flow
    setTimeout(() => {
      mainLine.style.strokeDasharray = '';
      mainLine.style.strokeDashoffset = '';
      mainLine.style.transition = '';
      mainLine.setAttribute('stroke-dasharray', DATAFLOW_DASH);
      mainLine.setAttribute('stroke-dashoffset', '0');
      const anim = document.createElementNS(SVG_NS, 'animate');
      anim.setAttribute('attributeName', 'stroke-dashoffset');
      anim.setAttribute('from', '17');
      anim.setAttribute('to', '0');
      anim.setAttribute('dur', '0.8s');
      anim.setAttribute('repeatCount', 'indefinite');
      mainLine.appendChild(anim);
    }, delayMs + 700);
  } else {
    // No draw-on: immediate SMIL flow animation
    const anim = document.createElementNS(SVG_NS, 'animate');
    anim.setAttribute('attributeName', 'stroke-dashoffset');
    anim.setAttribute('from', '12');
    anim.setAttribute('to', '0');
    anim.setAttribute('dur', '0.8s');
    anim.setAttribute('repeatCount', 'indefinite');
    mainLine.appendChild(anim);
  }

  g.appendChild(mainLine);
  parentEl.appendChild(g);
  return g;
}
