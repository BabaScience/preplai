/**
 * @preplai/illustrations — Cloud Component
 *
 * Classic cumulus cloud: overlapping ellipses forming a recognizable cloud shape.
 * Use for: cloud computing, SaaS, AWS/GCP/Azure, distributed systems.
 *
 * @see METADATA_SCHEMAS.md#cloud
 * @see ILLUSTRATIONS_AGENT_GUIDE.md
 *
 * No metadata required. Use entity.label, entity.color, entity.position.
 */

import { SVG_NS, buildEntityGroup, applyEntranceAnimation, getSizeParam } from '../utils.js';
import { createRadialGradient, ensureDefs, ensureGlowFilter } from '../visual-utils.js';
import {
  getCategoryColor,
  getStrokeWidth,
  getLabelFontSize,
  colorWithAlpha,
  OPACITY,
  LABEL_DEFAULTS,
  TYPOGRAPHY,
} from '../design-tokens.js';
import type { VisualEntity } from '@preplai/shared';

// Overlapping ellipses forming a cumulus cloud: puffy top, flatter base
const CLOUD_ELLIPSES = [
  { cx: -0.26, cy: 0.04, rx: 0.30, ry: 0.22 },   // left bump
  { cx: -0.06, cy: -0.10, rx: 0.36, ry: 0.26 }, // center-left (higher)
  { cx: 0.14, cy: -0.04, rx: 0.34, ry: 0.24 },   // center-right
  { cx: 0.32, cy: 0.04, rx: 0.28, ry: 0.20 },   // right bump
  { cx: 0.02, cy: 0.12, rx: 0.42, ry: 0.18 },   // base (flatter bottom)
];

export function renderCloud(entity: VisualEntity, parentEl: SVGElement): SVGGElement {
  const { outerG, innerG } = buildEntityGroup(entity);

  const s = getSizeParam(entity);
  const scale = s / 50;
  const color = entity.color ?? getCategoryColor('Cloud');
  const defs = ensureDefs(parentEl);
  const gradId = `grad-cloud-${color.replace(/[^a-fA-F0-9]/g, '')}`;
  createRadialGradient(gradId, color, defs);

  const cloudG = document.createElementNS(SVG_NS, 'g');
  cloudG.setAttribute('filter', ensureGlowFilter(parentEl, color, 'pre-cloud-glow'));

  const strokeWidth = getStrokeWidth('thin', scale);
  const strokeColor = colorWithAlpha(color, OPACITY.strokeSoft);

  for (const e of CLOUD_ELLIPSES) {
    const el = document.createElementNS(SVG_NS, 'ellipse');
    el.setAttribute('cx', String(e.cx * s));
    el.setAttribute('cy', String(e.cy * s));
    el.setAttribute('rx', String(e.rx * s));
    el.setAttribute('ry', String(e.ry * s));
    el.setAttribute('fill', `url(#${gradId})`);
    el.setAttribute('stroke', strokeColor);
    el.setAttribute('stroke-width', String(strokeWidth));
    cloudG.appendChild(el);
  }

  innerG.appendChild(cloudG);

  if (entity.label) {
    const fontSize = getLabelFontSize('label', scale);
    const text = document.createElementNS(SVG_NS, 'text');
    text.setAttribute('x', '0');
    text.setAttribute('y', String(s / 2 + LABEL_DEFAULTS.offsetBelow));
    text.setAttribute('text-anchor', LABEL_DEFAULTS.textAnchor);
    text.setAttribute('fill', color);
    text.setAttribute('font-size', String(fontSize));
    text.setAttribute('font-weight', String(TYPOGRAPHY.fontWeightLabel));
    text.setAttribute('font-family', TYPOGRAPHY.fontLabel);
    text.textContent = entity.label;
    innerG.appendChild(text);
  }

  applyEntranceAnimation(innerG, entity);
  parentEl.appendChild(outerG);
  return outerG;
}
