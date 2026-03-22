/**
 * @preplai/illustrations — Composable Shape Primitives
 *
 * Reusable shape factories for the Composable illustration engine.
 * Each shape returns an SVG element (rect, circle, polygon, path)
 * with gradient fill and stroke from design tokens.
 *
 * Shapes are centered at (0,0) and sized by a base unit `s` (from getSizeParam).
 */

import { SVG_NS } from '../utils.js';
import { colorWithAlpha, OPACITY, STROKE, SHAPES } from '../design-tokens.js';

// ── Types ───────────────────────────────────────────────────────────────

export type ComposableShape =
  | 'rect'
  | 'circle'
  | 'hexagon'
  | 'diamond'
  | 'shield'
  | 'cylinder'
  | 'document'
  | 'stadium'
  | 'pill'
  | 'parallelogram'
  | 'pentagon'
  | 'octagon'
  | 'triangle'
  | 'trapezoid'
  | 'cloud';

export const COMPOSABLE_SHAPES: ComposableShape[] = [
  'rect', 'circle', 'hexagon', 'diamond', 'shield', 'cylinder',
  'document', 'stadium', 'pill', 'parallelogram', 'pentagon',
  'octagon', 'triangle', 'trapezoid', 'cloud',
];

export interface ShapeRenderOptions {
  /** Base size unit in pixels (from getSizeParam) */
  size: number;
  /** Accent color (hex) */
  color: string;
  /** Stroke weight — uses STROKE tokens */
  strokeWidth?: number;
  /** Whether to render a highlight glow ring */
  highlight?: boolean;
}

// ── Helpers ─────────────────────────────────────────────────────────────

function polarPoints(n: number, r: number, rotOffset: number = 0): string {
  return Array.from({ length: n }, (_, i) => {
    const angle = (2 * Math.PI * i) / n + rotOffset;
    return `${(Math.cos(angle) * r).toFixed(1)},${(Math.sin(angle) * r).toFixed(1)}`;
  }).join(' ');
}

function addHighlightRect(
  innerG: SVGGElement,
  w: number,
  h: number,
  rx: number,
  color: string,
  beforeEl: SVGElement,
): void {
  const glow = document.createElementNS(SVG_NS, 'rect');
  glow.setAttribute('x', String(-w / 2 - 3));
  glow.setAttribute('y', String(-h / 2 - 3));
  glow.setAttribute('width', String(w + 6));
  glow.setAttribute('height', String(h + 6));
  glow.setAttribute('rx', String(rx + 2));
  glow.setAttribute('fill', 'none');
  glow.setAttribute('stroke', colorWithAlpha(color, OPACITY.strokeMuted));
  glow.setAttribute('stroke-width', String(STROKE.default));
  glow.setAttribute('stroke-dasharray', '4,4');
  innerG.insertBefore(glow, beforeEl);
}

function addHighlightCircle(
  innerG: SVGGElement,
  r: number,
  color: string,
  beforeEl: SVGElement,
): void {
  const glow = document.createElementNS(SVG_NS, 'circle');
  glow.setAttribute('cx', '0');
  glow.setAttribute('cy', '0');
  glow.setAttribute('r', String(r + 4));
  glow.setAttribute('fill', 'none');
  glow.setAttribute('stroke', colorWithAlpha(color, OPACITY.strokeMuted));
  glow.setAttribute('stroke-width', String(STROKE.default));
  glow.setAttribute('stroke-dasharray', '4,4');
  innerG.insertBefore(glow, beforeEl);
}

// ── Shape renderers ─────────────────────────────────────────────────────

/**
 * Render a composable shape into innerG.
 * Returns the bounding info { width, height } for icon/label placement.
 */
export function renderShape(
  shape: ComposableShape,
  innerG: SVGGElement,
  parentEl: SVGElement,
  opts: ShapeRenderOptions,
): { width: number; height: number } {
  const { size: s, color, highlight } = opts;
  const sw = opts.strokeWidth ?? STROKE.default;

  switch (shape) {
    case 'rect': {
      const w = s * 1.4;
      const h = s;
      const rect = document.createElementNS(SVG_NS, 'rect');
      rect.setAttribute('x', String(-w / 2));
      rect.setAttribute('y', String(-h / 2));
      rect.setAttribute('width', String(w));
      rect.setAttribute('height', String(h));
      rect.setAttribute('rx', String(SHAPES.borderRadius));
      rect.setAttribute('fill', colorWithAlpha(color, OPACITY.fillLight));
      rect.setAttribute('stroke', color);
      rect.setAttribute('stroke-width', String(sw));
      rect.setAttribute('data-morph-target', 'true');
      innerG.appendChild(rect);
      if (highlight) addHighlightRect(innerG, w, h, SHAPES.borderRadius, color, rect);
      return { width: w, height: h };
    }

    case 'circle': {
      const r = s / 2;
      const circle = document.createElementNS(SVG_NS, 'circle');
      circle.setAttribute('cx', '0');
      circle.setAttribute('cy', '0');
      circle.setAttribute('r', String(r));
      circle.setAttribute('fill', colorWithAlpha(color, OPACITY.fillLight));
      circle.setAttribute('stroke', color);
      circle.setAttribute('stroke-width', String(sw));
      circle.setAttribute('data-morph-target', 'true');
      innerG.appendChild(circle);
      if (highlight) addHighlightCircle(innerG, r, color, circle);
      return { width: s, height: s };
    }

    case 'hexagon': {
      const r = s * 0.5;
      const polygon = document.createElementNS(SVG_NS, 'polygon');
      polygon.setAttribute('points', polarPoints(6, r, -Math.PI / 6));
      polygon.setAttribute('fill', colorWithAlpha(color, OPACITY.fillLight));
      polygon.setAttribute('stroke', color);
      polygon.setAttribute('stroke-width', String(sw));
      polygon.setAttribute('data-morph-target', 'true');
      innerG.appendChild(polygon);
      if (highlight) addHighlightCircle(innerG, r, color, polygon);
      return { width: r * 2, height: r * 2 };
    }

    case 'diamond': {
      const d = s / 2;
      const polygon = document.createElementNS(SVG_NS, 'polygon');
      polygon.setAttribute('points', `0,${-d} ${d},0 0,${d} ${-d},0`);
      polygon.setAttribute('fill', colorWithAlpha(color, OPACITY.fillLight));
      polygon.setAttribute('stroke', color);
      polygon.setAttribute('stroke-width', String(sw));
      polygon.setAttribute('data-morph-target', 'true');
      innerG.appendChild(polygon);
      if (highlight) addHighlightCircle(innerG, d, color, polygon);
      return { width: s, height: s };
    }

    case 'shield': {
      const w = s * 0.8;
      const h = s * 1.1;
      // Shield: flat top with pointed bottom
      const path = document.createElementNS(SVG_NS, 'path');
      const hw = w / 2;
      const hh = h / 2;
      path.setAttribute('d', [
        `M ${-hw} ${-hh}`,
        `Q ${-hw} ${-hh - 4} 0 ${-hh - 4}`,
        `Q ${hw} ${-hh - 4} ${hw} ${-hh}`,
        `L ${hw} ${hh * 0.3}`,
        `Q ${hw} ${hh * 0.8} 0 ${hh}`,
        `Q ${-hw} ${hh * 0.8} ${-hw} ${hh * 0.3}`,
        'Z',
      ].join(' '));
      path.setAttribute('fill', colorWithAlpha(color, OPACITY.fillLight));
      path.setAttribute('stroke', color);
      path.setAttribute('stroke-width', String(sw));
      path.setAttribute('data-morph-target', 'true');
      innerG.appendChild(path);
      if (highlight) addHighlightCircle(innerG, Math.max(hw, hh), color, path);
      return { width: w, height: h };
    }

    case 'cylinder': {
      const w = s * 0.9;
      const h = s * 1.1;
      const hw = w / 2;
      const hh = h / 2;
      const ry = h * 0.12; // ellipse radius for top/bottom caps

      // Body
      const body = document.createElementNS(SVG_NS, 'path');
      body.setAttribute('d', [
        `M ${-hw} ${-hh + ry}`,
        `L ${-hw} ${hh - ry}`,
        `A ${hw} ${ry} 0 0 0 ${hw} ${hh - ry}`,
        `L ${hw} ${-hh + ry}`,
      ].join(' '));
      body.setAttribute('fill', colorWithAlpha(color, OPACITY.fillLight));
      body.setAttribute('stroke', color);
      body.setAttribute('stroke-width', String(sw));
      body.setAttribute('data-morph-target', 'true');
      innerG.appendChild(body);

      // Bottom ellipse
      const bottom = document.createElementNS(SVG_NS, 'ellipse');
      bottom.setAttribute('cx', '0');
      bottom.setAttribute('cy', String(hh - ry));
      bottom.setAttribute('rx', String(hw));
      bottom.setAttribute('ry', String(ry));
      bottom.setAttribute('fill', colorWithAlpha(color, OPACITY.fillMedium));
      bottom.setAttribute('stroke', color);
      bottom.setAttribute('stroke-width', String(sw));
      innerG.appendChild(bottom);

      // Top ellipse (cap)
      const top = document.createElementNS(SVG_NS, 'ellipse');
      top.setAttribute('cx', '0');
      top.setAttribute('cy', String(-hh + ry));
      top.setAttribute('rx', String(hw));
      top.setAttribute('ry', String(ry));
      top.setAttribute('fill', colorWithAlpha(color, OPACITY.fillLight));
      top.setAttribute('stroke', color);
      top.setAttribute('stroke-width', String(sw));
      innerG.appendChild(top);

      if (highlight) addHighlightRect(innerG, w, h, 0, color, body);
      return { width: w, height: h };
    }

    case 'document': {
      const w = s * 1.2;
      const h = s * 1.3;
      const hw = w / 2;
      const hh = h / 2;
      const fold = Math.min(w * 0.2, 12);

      // Document with folded corner
      const path = document.createElementNS(SVG_NS, 'path');
      path.setAttribute('d', [
        `M ${-hw} ${-hh}`,
        `L ${hw - fold} ${-hh}`,
        `L ${hw} ${-hh + fold}`,
        `L ${hw} ${hh}`,
        `L ${-hw} ${hh}`,
        'Z',
      ].join(' '));
      path.setAttribute('fill', colorWithAlpha(color, OPACITY.fillLight));
      path.setAttribute('stroke', color);
      path.setAttribute('stroke-width', String(sw));
      path.setAttribute('data-morph-target', 'true');
      innerG.appendChild(path);

      // Fold triangle
      const foldPath = document.createElementNS(SVG_NS, 'path');
      foldPath.setAttribute('d', [
        `M ${hw - fold} ${-hh}`,
        `L ${hw - fold} ${-hh + fold}`,
        `L ${hw} ${-hh + fold}`,
      ].join(' '));
      foldPath.setAttribute('fill', colorWithAlpha(color, OPACITY.fillMedium));
      foldPath.setAttribute('stroke', color);
      foldPath.setAttribute('stroke-width', String(STROKE.thin));
      innerG.appendChild(foldPath);

      if (highlight) addHighlightRect(innerG, w, h, 0, color, path);
      return { width: w, height: h };
    }

    case 'stadium': {
      const w = s * 1.6;
      const h = s * 0.8;
      const r = h / 2;
      const rect = document.createElementNS(SVG_NS, 'rect');
      rect.setAttribute('x', String(-w / 2));
      rect.setAttribute('y', String(-h / 2));
      rect.setAttribute('width', String(w));
      rect.setAttribute('height', String(h));
      rect.setAttribute('rx', String(r));
      rect.setAttribute('fill', colorWithAlpha(color, OPACITY.fillLight));
      rect.setAttribute('stroke', color);
      rect.setAttribute('stroke-width', String(sw));
      rect.setAttribute('data-morph-target', 'true');
      innerG.appendChild(rect);
      if (highlight) addHighlightRect(innerG, w, h, r, color, rect);
      return { width: w, height: h };
    }

    case 'pill': {
      const w = s * 1.0;
      const h = s * 1.6;
      const r = w / 2;
      const rect = document.createElementNS(SVG_NS, 'rect');
      rect.setAttribute('x', String(-w / 2));
      rect.setAttribute('y', String(-h / 2));
      rect.setAttribute('width', String(w));
      rect.setAttribute('height', String(h));
      rect.setAttribute('rx', String(r));
      rect.setAttribute('fill', colorWithAlpha(color, OPACITY.fillLight));
      rect.setAttribute('stroke', color);
      rect.setAttribute('stroke-width', String(sw));
      rect.setAttribute('data-morph-target', 'true');
      innerG.appendChild(rect);
      if (highlight) addHighlightRect(innerG, w, h, r, color, rect);
      return { width: w, height: h };
    }

    case 'parallelogram': {
      const w = s * 1.5;
      const h = s * 0.9;
      const skew = w * 0.15;
      const hw = w / 2;
      const hh = h / 2;
      const polygon = document.createElementNS(SVG_NS, 'polygon');
      polygon.setAttribute('points', [
        `${-hw + skew},${-hh}`,
        `${hw + skew},${-hh}`,
        `${hw - skew},${hh}`,
        `${-hw - skew},${hh}`,
      ].join(' '));
      polygon.setAttribute('fill', colorWithAlpha(color, OPACITY.fillLight));
      polygon.setAttribute('stroke', color);
      polygon.setAttribute('stroke-width', String(sw));
      polygon.setAttribute('data-morph-target', 'true');
      innerG.appendChild(polygon);
      if (highlight) addHighlightRect(innerG, w + skew * 2, h, 0, color, polygon);
      return { width: w + skew * 2, height: h };
    }

    case 'pentagon': {
      const r = s * 0.5;
      const polygon = document.createElementNS(SVG_NS, 'polygon');
      polygon.setAttribute('points', polarPoints(5, r, -Math.PI / 2));
      polygon.setAttribute('fill', colorWithAlpha(color, OPACITY.fillLight));
      polygon.setAttribute('stroke', color);
      polygon.setAttribute('stroke-width', String(sw));
      polygon.setAttribute('data-morph-target', 'true');
      innerG.appendChild(polygon);
      if (highlight) addHighlightCircle(innerG, r, color, polygon);
      return { width: r * 2, height: r * 2 };
    }

    case 'octagon': {
      const r = s * 0.5;
      const polygon = document.createElementNS(SVG_NS, 'polygon');
      polygon.setAttribute('points', polarPoints(8, r, Math.PI / 8));
      polygon.setAttribute('fill', colorWithAlpha(color, OPACITY.fillLight));
      polygon.setAttribute('stroke', color);
      polygon.setAttribute('stroke-width', String(sw));
      polygon.setAttribute('data-morph-target', 'true');
      innerG.appendChild(polygon);
      if (highlight) addHighlightCircle(innerG, r, color, polygon);
      return { width: r * 2, height: r * 2 };
    }

    case 'triangle': {
      const r = s * 0.55;
      const polygon = document.createElementNS(SVG_NS, 'polygon');
      polygon.setAttribute('points', polarPoints(3, r, -Math.PI / 2));
      polygon.setAttribute('fill', colorWithAlpha(color, OPACITY.fillLight));
      polygon.setAttribute('stroke', color);
      polygon.setAttribute('stroke-width', String(sw));
      polygon.setAttribute('data-morph-target', 'true');
      innerG.appendChild(polygon);
      if (highlight) addHighlightCircle(innerG, r, color, polygon);
      return { width: r * 2, height: r * 2 };
    }

    case 'trapezoid': {
      const w = s * 1.4;
      const h = s * 0.9;
      const inset = w * 0.15;
      const hw = w / 2;
      const hh = h / 2;
      const polygon = document.createElementNS(SVG_NS, 'polygon');
      polygon.setAttribute('points', [
        `${-hw + inset},${-hh}`,
        `${hw - inset},${-hh}`,
        `${hw},${hh}`,
        `${-hw},${hh}`,
      ].join(' '));
      polygon.setAttribute('fill', colorWithAlpha(color, OPACITY.fillLight));
      polygon.setAttribute('stroke', color);
      polygon.setAttribute('stroke-width', String(sw));
      polygon.setAttribute('data-morph-target', 'true');
      innerG.appendChild(polygon);
      if (highlight) addHighlightRect(innerG, w, h, 0, color, polygon);
      return { width: w, height: h };
    }

    case 'cloud': {
      const w = s * 1.5;
      const h = s * 1.0;
      // Cloud shape using bezier curves
      const hw = w / 2;
      const hh = h / 2;
      const path = document.createElementNS(SVG_NS, 'path');
      path.setAttribute('d', [
        `M ${-hw * 0.6} ${hh * 0.5}`,
        `Q ${-hw} ${hh * 0.5} ${-hw * 0.85} ${-hh * 0.1}`,
        `Q ${-hw * 0.7} ${-hh * 0.8} ${-hw * 0.2} ${-hh * 0.7}`,
        `Q 0 ${-hh * 1.1} ${hw * 0.3} ${-hh * 0.7}`,
        `Q ${hw * 0.7} ${-hh * 0.9} ${hw * 0.85} ${-hh * 0.2}`,
        `Q ${hw} ${hh * 0.3} ${hw * 0.7} ${hh * 0.5}`,
        `Z`,
      ].join(' '));
      path.setAttribute('fill', colorWithAlpha(color, OPACITY.fillLight));
      path.setAttribute('stroke', color);
      path.setAttribute('stroke-width', String(sw));
      path.setAttribute('data-morph-target', 'true');
      innerG.appendChild(path);
      if (highlight) addHighlightCircle(innerG, Math.max(hw, hh), color, path);
      return { width: w, height: h };
    }

    default: {
      // Fallback to rect for any unrecognized shape
      return renderShape('rect', innerG, parentEl, opts);
    }
  }
}
