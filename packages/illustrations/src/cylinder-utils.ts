/**
 * @preplai/illustrations — Cylinder rendering helper
 *
 * Shared logic for Database, Cache, Volume components.
 * Renders: top ellipse, gradient body, bottom ellipse, side lines, horizontal stripes.
 */
import { SVG_NS } from './utils.js';
import { createLinearGradient, ensureDefs, ensureGlassFilter } from './visual-utils.js';
import { SHAPES } from './design-tokens.js';

export interface CylinderConfig {
  size: number;
  color: string;
  gradId: string;
  stripeOffsets: number[];
  /** Optional: rx override (default size/2) */
  rx?: number;
  /** Optional: body height override (default size*0.55) */
  bodyH?: number;
  /** Optional: stripe width as fraction of rx (default 0.85) */
  stripeWidthScale?: number;
  /** Apply glass materiality filter to cylinder body */
  glass?: boolean;
}

/**
 * Render cylinder base (ellipses, body, lines, stripes) into innerG.
 * Caller adds label and optional overlay (e.g. lightning bolt).
 */
export function renderCylinderBase(
  innerG: SVGGElement,
  parentEl: SVGElement,
  config: CylinderConfig,
): void {
  const {
    size,
    color,
    gradId,
    stripeOffsets,
    rx = size / 2,
    bodyH = size * 0.55,
    stripeWidthScale = 0.85,
    glass = false,
  } = config;
  const ry = size / 6;
  const topY = -size / 3;
  const botY = topY + bodyH;

  const defs = ensureDefs(parentEl);
  createLinearGradient(gradId, color, 'vertical', defs);

  // If glass materiality is enabled, wrap body shapes in a filtered sub-group
  const bodyTarget = glass
    ? (() => {
        const g = document.createElementNS(SVG_NS, 'g') as SVGGElement;
        g.setAttribute('filter', ensureGlassFilter(parentEl));
        innerG.appendChild(g);
        return g;
      })()
    : innerG;

  // Top ellipse (cap)
  const topEllipse = document.createElementNS(SVG_NS, 'ellipse');
  topEllipse.setAttribute('cx', '0');
  topEllipse.setAttribute('cy', String(topY));
  topEllipse.setAttribute('rx', String(rx));
  topEllipse.setAttribute('ry', String(ry));
  topEllipse.setAttribute('fill', `${color}25`);
  topEllipse.setAttribute('stroke', color);
  topEllipse.setAttribute('stroke-width', String(SHAPES.strokeWidth));
  bodyTarget.appendChild(topEllipse);

  // Body fill with gradient
  const bodyFill = document.createElementNS(SVG_NS, 'rect');
  bodyFill.setAttribute('x', String(-rx));
  bodyFill.setAttribute('y', String(topY));
  bodyFill.setAttribute('width', String(rx * 2));
  bodyFill.setAttribute('height', String(bodyH));
  bodyFill.setAttribute('fill', `url(#${gradId})`);
  bodyFill.setAttribute('stroke', 'none');
  bodyTarget.appendChild(bodyFill);

  // Bottom ellipse (base)
  const botEllipse = document.createElementNS(SVG_NS, 'ellipse');
  botEllipse.setAttribute('cx', '0');
  botEllipse.setAttribute('cy', String(botY));
  botEllipse.setAttribute('rx', String(rx));
  botEllipse.setAttribute('ry', String(ry));
  botEllipse.setAttribute('fill', `${color}15`);
  botEllipse.setAttribute('stroke', color);
  botEllipse.setAttribute('stroke-width', String(SHAPES.strokeWidth));
  bodyTarget.appendChild(botEllipse);

  // Vertical side lines
  for (const xSign of [-1, 1]) {
    const line = document.createElementNS(SVG_NS, 'line');
    line.setAttribute('x1', String(xSign * rx));
    line.setAttribute('y1', String(topY));
    line.setAttribute('x2', String(xSign * rx));
    line.setAttribute('y2', String(botY));
    line.setAttribute('stroke', color);
    line.setAttribute('stroke-width', String(SHAPES.strokeWidth));
    bodyTarget.appendChild(line);
  }

  // Horizontal stripes
  const stripeWidth = rx * stripeWidthScale;
  for (const t of stripeOffsets) {
    const sy = topY + bodyH * t;
    const stripe = document.createElementNS(SVG_NS, 'line');
    stripe.setAttribute('x1', String(-stripeWidth));
    stripe.setAttribute('y1', String(sy));
    stripe.setAttribute('x2', String(stripeWidth));
    stripe.setAttribute('y2', String(sy));
    stripe.setAttribute('stroke', color);
    stripe.setAttribute('stroke-width', '1.5');
    stripe.setAttribute('opacity', '0.5');
    bodyTarget.appendChild(stripe);
  }
}

/** Get label Y position below cylinder (for Database/Cache/Volume) */
export function getCylinderLabelY(size: number, bodyH?: number): number {
  const h = bodyH ?? size * 0.55;
  const topY = -size / 3;
  const botY = topY + h;
  const ry = size / 6;
  return botY + ry + 20;
}
