/**
 * @preplai/illustrations — SystemBoundary Component
 *
 * Large dashed rectangle used to visually contain other entities in C4 diagrams.
 * Shows the boundary of "your system" vs external actors.
 *
 * Metadata:
 *   label?:       string          — falls back to entity.label
 *   style?:       "dashed"|"solid" — default "dashed"
 *   description?: string          — optional subtitle
 */

import { SVG_NS, buildEntityGroup, applyEntranceAnimation, getSizeParam } from '../utils.js';
import {
  getCategoryColor,
  TYPOGRAPHY,
  STROKE,
  SHAPES,
  colorWithAlpha,
  OPACITY,
} from '../design-tokens.js';
import type { VisualEntity } from '@preplai/shared';

export function renderSystemBoundary(entity: VisualEntity, parentEl: SVGElement): SVGGElement {
  const { outerG, innerG } = buildEntityGroup(entity);
  const size = getSizeParam(entity);
  const color = entity.color ?? getCategoryColor('SystemBoundary');

  const meta = (entity.metadata ?? {}) as Record<string, unknown>;
  const labelText = (meta.label as string) ?? entity.label ?? 'System Boundary';
  const style = (meta.style as string) ?? 'dashed';
  const description = (meta.description as string) ?? '';

  // ── Dimensions ────────────────────────────────────────────────────
  // SystemBoundary is intentionally large so other entities sit inside it.
  // Base width ~300px, height ~200px at size=50, scaling proportionally.
  const scale = size / 50;
  const w = 300 * scale;
  const h = 200 * scale;
  const rx = SHAPES.borderRadiusLarge;

  // ── Background fill (very low opacity tinted region) ──────────────
  const rect = document.createElementNS(SVG_NS, 'rect');
  rect.setAttribute('x', String(-w / 2));
  rect.setAttribute('y', String(-h / 2));
  rect.setAttribute('width', String(w));
  rect.setAttribute('height', String(h));
  rect.setAttribute('rx', String(rx));
  rect.setAttribute('fill', colorWithAlpha(color, '0D')); // ~5% opacity
  rect.setAttribute('stroke', colorWithAlpha(color, OPACITY.fillHeavy)); // 40% opacity
  rect.setAttribute('stroke-width', String(STROKE.emphasized));
  if (style === 'dashed') {
    rect.setAttribute('stroke-dasharray', '10,6');
  }
  innerG.appendChild(rect);

  // ── Label pill (top-left, inside the boundary) ────────────────────
  const labelX = -w / 2 + 16 * scale;
  const labelY = -h / 2 + 16 * scale;
  const labelFontSize = 14 * scale;
  const pillPadX = 8 * scale;
  const pillPadY = 4 * scale;

  // Estimate label width for the background pill
  const estimatedTextWidth = labelText.length * labelFontSize * 0.6;

  // Pill background
  const pill = document.createElementNS(SVG_NS, 'rect');
  pill.setAttribute('x', String(labelX - pillPadX));
  pill.setAttribute('y', String(labelY - labelFontSize * 0.8 - pillPadY));
  pill.setAttribute('width', String(estimatedTextWidth + pillPadX * 2));
  pill.setAttribute('height', String(labelFontSize + pillPadY * 2));
  pill.setAttribute('rx', String(4 * scale));
  pill.setAttribute('fill', colorWithAlpha(color, OPACITY.fillLight));
  innerG.appendChild(pill);

  // Label text
  const label = document.createElementNS(SVG_NS, 'text');
  label.setAttribute('x', String(labelX));
  label.setAttribute('y', String(labelY));
  label.setAttribute('text-anchor', 'start');
  label.setAttribute('fill', color);
  label.setAttribute('font-size', String(labelFontSize));
  label.setAttribute('font-weight', String(TYPOGRAPHY.fontWeightBold));
  label.setAttribute('font-family', TYPOGRAPHY.fontLabel);
  label.textContent = labelText;
  innerG.appendChild(label);

  // ── Optional description/subtitle ─────────────────────────────────
  if (description) {
    const descFontSize = 11 * scale;
    const desc = document.createElementNS(SVG_NS, 'text');
    desc.setAttribute('x', String(labelX));
    desc.setAttribute('y', String(labelY + labelFontSize * 1.2));
    desc.setAttribute('text-anchor', 'start');
    desc.setAttribute('fill', color);
    desc.setAttribute('opacity', '0.6');
    desc.setAttribute('font-size', String(descFontSize));
    desc.setAttribute('font-weight', String(TYPOGRAPHY.fontWeightLabel));
    desc.setAttribute('font-family', TYPOGRAPHY.fontLabel);
    desc.textContent = description;
    innerG.appendChild(desc);
  }

  applyEntranceAnimation(innerG, entity);
  parentEl.appendChild(outerG);
  return outerG;
}
