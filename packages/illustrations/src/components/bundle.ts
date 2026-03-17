/**
 * @preplai/illustrations — Bundle Component
 * A package/file icon with folded corner and size metric.
 */

import { SVG_NS, buildEntityGroup, applyEntranceAnimation, getSizeParam } from '../utils.js';
import { getCategoryColor, TYPOGRAPHY, STROKE, OPACITY, colorWithAlpha } from '../design-tokens.js';
import type { VisualEntity } from '@preplai/shared';

export function renderBundle(entity: VisualEntity, parentEl: SVGElement): SVGGElement {
  const { outerG, innerG } = buildEntityGroup(entity);
  const size = getSizeParam(entity);
  const color = entity.color ?? getCategoryColor('Bundle');

  const meta = entity.metadata ?? {};
  const name = (meta.name as string) ?? 'main.js';
  const fileSize = (meta.size as string) ?? '245 KB';
  const chunks = Math.min((meta.chunks as number) ?? 1, 4);

  const scale = size / 50;
  const w = 70 * scale;
  const h = 80 * scale;
  const fold = 14 * scale;
  const rx = 4 * scale;

  // ── Chunk shadow layers (stacked behind, max 3 shadows) ──
  const shadowCount = Math.min(chunks - 1, 3);
  const shadowOffset = 3 * scale;
  for (let i = shadowCount; i > 0; i--) {
    const sx = i * shadowOffset;
    const sy = -i * shadowOffset;
    const shadow = document.createElementNS(SVG_NS, 'rect');
    shadow.setAttribute('x', String(-w / 2 + sx));
    shadow.setAttribute('y', String(-h / 2 + sy));
    shadow.setAttribute('width', String(w));
    shadow.setAttribute('height', String(h));
    shadow.setAttribute('rx', String(rx));
    shadow.setAttribute('fill', colorWithAlpha(color, OPACITY.fillLight));
    shadow.setAttribute('stroke', color);
    shadow.setAttribute('stroke-width', String(STROKE.thin));
    shadow.setAttribute('opacity', String(0.3 / i));
    innerG.appendChild(shadow);
  }

  // ── Main file body (rounded rect with folded corner path) ──
  const x1 = -w / 2;
  const y1 = -h / 2;
  const bodyD = [
    `M ${x1 + rx} ${y1}`,
    `L ${x1 + w - fold} ${y1}`,
    `L ${x1 + w} ${y1 + fold}`,
    `L ${x1 + w} ${y1 + h - rx}`,
    `Q ${x1 + w} ${y1 + h} ${x1 + w - rx} ${y1 + h}`,
    `L ${x1 + rx} ${y1 + h}`,
    `Q ${x1} ${y1 + h} ${x1} ${y1 + h - rx}`,
    `L ${x1} ${y1 + rx}`,
    `Q ${x1} ${y1} ${x1 + rx} ${y1}`,
    'Z',
  ].join(' ');
  const bodyPath = document.createElementNS(SVG_NS, 'path');
  bodyPath.setAttribute('d', bodyD);
  bodyPath.setAttribute('fill', colorWithAlpha(color, OPACITY.fillLight));
  bodyPath.setAttribute('stroke', color);
  bodyPath.setAttribute('stroke-width', String(STROKE.default));
  innerG.appendChild(bodyPath);

  // ── Fold triangle (top-right corner) ──
  const foldPath = document.createElementNS(SVG_NS, 'path');
  const foldD = [
    `M ${x1 + w - fold} ${y1}`,
    `L ${x1 + w - fold} ${y1 + fold}`,
    `L ${x1 + w} ${y1 + fold}`,
    'Z',
  ].join(' ');
  foldPath.setAttribute('d', foldD);
  foldPath.setAttribute('fill', colorWithAlpha(color, OPACITY.fillMedium));
  foldPath.setAttribute('stroke', color);
  foldPath.setAttribute('stroke-width', String(STROKE.thin));
  innerG.appendChild(foldPath);

  // ── Curly braces icon "{}" ──
  const braceText = document.createElementNS(SVG_NS, 'text');
  braceText.setAttribute('x', '0');
  braceText.setAttribute('y', String(-4 * scale));
  braceText.setAttribute('text-anchor', 'middle');
  braceText.setAttribute('fill', color);
  braceText.setAttribute('font-size', String(20 * scale));
  braceText.setAttribute('font-weight', String(TYPOGRAPHY.fontWeightBold));
  braceText.setAttribute('font-family', TYPOGRAPHY.fontBadge);
  braceText.setAttribute('opacity', '0.5');
  braceText.textContent = '{ }';
  innerG.appendChild(braceText);

  // ── Name text (monospace, above size) ──
  const nameText = document.createElementNS(SVG_NS, 'text');
  nameText.setAttribute('x', '0');
  nameText.setAttribute('y', String(12 * scale));
  nameText.setAttribute('text-anchor', 'middle');
  nameText.setAttribute('fill', color);
  nameText.setAttribute('font-size', String(TYPOGRAPHY.fontSizeInline * scale));
  nameText.setAttribute('font-weight', String(TYPOGRAPHY.fontWeightLabel));
  nameText.setAttribute('font-family', TYPOGRAPHY.fontBadge);
  nameText.setAttribute('opacity', '0.8');
  nameText.textContent = name;
  innerG.appendChild(nameText);

  // ── Size metric (bold, prominent) ──
  const sizeText = document.createElementNS(SVG_NS, 'text');
  sizeText.setAttribute('x', '0');
  sizeText.setAttribute('y', String(26 * scale));
  sizeText.setAttribute('text-anchor', 'middle');
  sizeText.setAttribute('fill', color);
  sizeText.setAttribute('font-size', String(TYPOGRAPHY.fontSizeValue * scale));
  sizeText.setAttribute('font-weight', String(TYPOGRAPHY.fontWeightBold));
  sizeText.setAttribute('font-family', TYPOGRAPHY.fontBadge);
  sizeText.textContent = fileSize;
  innerG.appendChild(sizeText);

  // ── Entity label below ──
  if (entity.label) {
    const text = document.createElementNS(SVG_NS, 'text');
    text.setAttribute('x', '0');
    text.setAttribute('y', String(h / 2 + 18));
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
