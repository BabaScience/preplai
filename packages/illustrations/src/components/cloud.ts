/**
 * @preplai/illustrations — Cloud Component
 *
 * Clean infrastructure cloud: 3 overlapping ellipses + base, glass filter.
 * Use for: cloud computing, SaaS, AWS/GCP/Azure, distributed systems.
 *
 * @see METADATA_SCHEMAS.md#cloud
 * @see ILLUSTRATIONS_AGENT_GUIDE.md
 */

import { SVG_NS, buildEntityGroup, applyEntranceAnimation, getSizeParam } from '../utils.js';
import { createRadialGradient, ensureDefs, ensureGlassFilter } from '../visual-utils.js';
import {
  getCategoryColor,
  getStrokeWidth,
  getLabelFontSize,
  colorWithAlpha,
  OPACITY,
  LABEL_DEFAULTS,
  TYPOGRAPHY,
  STROKE,
} from '../design-tokens.js';
import type { VisualEntity } from '@preplai/shared';

// Simplified 3-bump cloud + flat base (cleaner schematic)
const CLOUD_ELLIPSES = [
  { cx: -0.18, cy: 0.02, rx: 0.28, ry: 0.20 },   // left bump
  { cx: 0.06, cy: -0.08, rx: 0.34, ry: 0.24 },   // center (taller)
  { cx: 0.22, cy: 0.04, rx: 0.24, ry: 0.18 },     // right bump
];
const CLOUD_BASE = { cx: 0.02, cy: 0.14, rx: 0.38, ry: 0.10 };

export function renderCloud(entity: VisualEntity, parentEl: SVGElement): SVGGElement {
  const { outerG, innerG } = buildEntityGroup(entity);

  const s = getSizeParam(entity);
  const scale = s / 50;
  const color = entity.color ?? getCategoryColor('Cloud');
  const defs = ensureDefs(parentEl);
  const gradId = `grad-cloud-${color.replace(/[^a-fA-F0-9]/g, '')}`;
  createRadialGradient(gradId, color, defs);

  // Use glass filter (consistent with Server/Database) instead of glow
  const cloudG = document.createElementNS(SVG_NS, 'g');
  cloudG.setAttribute('filter', ensureGlassFilter(parentEl));

  const strokeWidth = getStrokeWidth('thin', scale);
  const strokeColor = colorWithAlpha(color, OPACITY.strokeSoft);

  // ── 3 cloud bumps ──
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

  // ── Flat base (closes bottom, no stroke for clean fill) ──
  const base = document.createElementNS(SVG_NS, 'ellipse');
  base.setAttribute('cx', String(CLOUD_BASE.cx * s));
  base.setAttribute('cy', String(CLOUD_BASE.cy * s));
  base.setAttribute('rx', String(CLOUD_BASE.rx * s));
  base.setAttribute('ry', String(CLOUD_BASE.ry * s));
  base.setAttribute('fill', `url(#${gradId})`);
  base.setAttribute('stroke', 'none');
  cloudG.appendChild(base);

  innerG.appendChild(cloudG);

  // ── Faint grid lines inside (suggests organized infrastructure) ──
  const lineWidth = s * 0.2;
  for (const ly of [-0.02, 0.06]) {
    const line = document.createElementNS(SVG_NS, 'line');
    line.setAttribute('x1', String(-lineWidth));
    line.setAttribute('y1', String(ly * s));
    line.setAttribute('x2', String(lineWidth));
    line.setAttribute('y2', String(ly * s));
    line.setAttribute('stroke', color);
    line.setAttribute('stroke-width', String(STROKE.minimal));
    line.setAttribute('opacity', '0.2');
    innerG.appendChild(line);
  }

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
