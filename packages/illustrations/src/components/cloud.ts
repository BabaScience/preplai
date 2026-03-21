/**
 * @preplai/illustrations — Cloud Component
 *
 * Clean cloud silhouette: overlapping ellipses with no interior decorations.
 * Use for: cloud computing, SaaS, AWS/GCP/Azure, distributed systems.
 *
 * Minimalist style matching the Composable engine aesthetic:
 * - 3 overlapping ellipses + flat base (iconic cloud shape)
 * - Subtle radial gradient
 * - Thin stroke
 * - Label below
 * - Optional highlight glow
 */

import { SVG_NS, buildEntityGroup, applyEntranceAnimation, getSizeParam } from '../utils.js';
import {
  getCategoryColor,
  TYPOGRAPHY,
  STROKE,
  LABEL_DEFAULTS,
  colorWithAlpha,
  OPACITY,
} from '../design-tokens.js';
import type { VisualEntity } from '@preplai/shared';

const CLOUD_ELLIPSES = [
  { cx: -0.18, cy: 0.02, rx: 0.28, ry: 0.20 },
  { cx: 0.06, cy: -0.08, rx: 0.34, ry: 0.24 },
  { cx: 0.22, cy: 0.04, rx: 0.24, ry: 0.18 },
];
const CLOUD_BASE = { cx: 0.02, cy: 0.14, rx: 0.38, ry: 0.10 };

export function renderCloud(entity: VisualEntity, parentEl: SVGElement): SVGGElement {
  const { outerG, innerG } = buildEntityGroup(entity);

  const s = getSizeParam(entity);
  const color = entity.color ?? getCategoryColor('Cloud');

  const strokeColor = colorWithAlpha(color, OPACITY.strokeSoft);

  // Highlight glow (larger cloud outline behind)
  if (entity.highlight) {
    for (const e of CLOUD_ELLIPSES) {
      const el = document.createElementNS(SVG_NS, 'ellipse');
      el.setAttribute('cx', String(e.cx * s));
      el.setAttribute('cy', String(e.cy * s));
      el.setAttribute('rx', String((e.rx + 0.04) * s));
      el.setAttribute('ry', String((e.ry + 0.04) * s));
      el.setAttribute('fill', 'none');
      el.setAttribute('stroke', colorWithAlpha(color, OPACITY.strokeMuted));
      el.setAttribute('stroke-width', String(STROKE.default));
      el.setAttribute('stroke-dasharray', '4,4');
      innerG.appendChild(el);
    }
  }

  // Cloud bumps
  for (const e of CLOUD_ELLIPSES) {
    const el = document.createElementNS(SVG_NS, 'ellipse');
    el.setAttribute('cx', String(e.cx * s));
    el.setAttribute('cy', String(e.cy * s));
    el.setAttribute('rx', String(e.rx * s));
    el.setAttribute('ry', String(e.ry * s));
    el.setAttribute('fill', colorWithAlpha(color, OPACITY.fillLight));
    el.setAttribute('stroke', strokeColor);
    el.setAttribute('stroke-width', String(STROKE.default));
    innerG.appendChild(el);
  }

  // Flat base
  const base = document.createElementNS(SVG_NS, 'ellipse');
  base.setAttribute('cx', String(CLOUD_BASE.cx * s));
  base.setAttribute('cy', String(CLOUD_BASE.cy * s));
  base.setAttribute('rx', String(CLOUD_BASE.rx * s));
  base.setAttribute('ry', String(CLOUD_BASE.ry * s));
  base.setAttribute('fill', colorWithAlpha(color, OPACITY.fillLight));
  base.setAttribute('stroke', 'none');
  innerG.appendChild(base);

  // Label below
  if (entity.label) {
    const text = document.createElementNS(SVG_NS, 'text');
    text.setAttribute('x', '0');
    text.setAttribute('y', String(s / 2 + LABEL_DEFAULTS.offsetBelow));
    text.setAttribute('text-anchor', LABEL_DEFAULTS.textAnchor);
    text.setAttribute('fill', color);
    text.setAttribute('font-size', String(TYPOGRAPHY.fontSizeLabel));
    text.setAttribute('font-weight', String(TYPOGRAPHY.fontWeightLabel));
    text.setAttribute('font-family', TYPOGRAPHY.fontLabel);
    text.textContent = entity.label;
    innerG.appendChild(text);
  }

  applyEntranceAnimation(innerG, entity);
  parentEl.appendChild(outerG);
  return outerG;
}
