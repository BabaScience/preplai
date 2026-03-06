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
import { createRadialGradient, ensureDefs } from '../visual-utils.js';
import { getCategoryColor, TYPOGRAPHY, SHAPES } from '../design-tokens.js';
import type { VisualEntity } from '@preplai/shared';

// Overlapping ellipses arranged to form a cumulus cloud silhouette
// Layout: left bump, center-left (higher), center-right, right bump
const CLOUD_ELLIPSES = [
  { cx: -0.28, cy: 0.02, rx: 0.32, ry: 0.24 },  // left
  { cx: -0.08, cy: -0.12, rx: 0.38, ry: 0.28 }, // center-left (slightly higher)
  { cx: 0.12, cy: -0.06, rx: 0.36, ry: 0.26 },  // center-right
  { cx: 0.30, cy: 0.02, rx: 0.30, ry: 0.22 },   // right
];

export function renderCloud(entity: VisualEntity, parentEl: SVGElement): SVGGElement {
  const { outerG, innerG } = buildEntityGroup(entity);

  const s = getSizeParam(entity);
  const color = entity.color ?? getCategoryColor('Cloud');
  const defs = ensureDefs(parentEl);
  const gradId = `grad-cloud-${color.replace(/[^a-fA-F0-9]/g, '')}`;
  createRadialGradient(gradId, color, defs);

  for (const e of CLOUD_ELLIPSES) {
    const el = document.createElementNS(SVG_NS, 'ellipse');
    el.setAttribute('cx', String(e.cx * s));
    el.setAttribute('cy', String(e.cy * s));
    el.setAttribute('rx', String(e.rx * s));
    el.setAttribute('ry', String(e.ry * s));
    el.setAttribute('fill', `url(#${gradId})`);
    el.setAttribute('stroke', color);
    el.setAttribute('stroke-width', String(SHAPES.strokeWidth));
    innerG.appendChild(el);
  }

  if (entity.label) {
    const text = document.createElementNS(SVG_NS, 'text');
    text.setAttribute('x', '0');
    text.setAttribute('y', String(s / 2 + 20));
    text.setAttribute('text-anchor', 'middle');
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
