/**
 * @preplai/illustrations — File Component
 * Generic file/document: card with folded corner + filename + extension badge
 * Metadata: { extension?: string, size?: string }
 */

import { SVG_NS, buildEntityGroup, applyEntranceAnimation, getSizeParam } from '../utils.js';
import {
  getCategoryColor, getStrokeWidth, getLabelFontSize,
  TYPOGRAPHY, STROKE, colorWithAlpha, OPACITY,
} from '../design-tokens.js';
import type { VisualEntity } from '@preplai/shared';

export function renderFile(entity: VisualEntity, parentEl: SVGElement): SVGGElement {
  const { outerG, innerG } = buildEntityGroup(entity);

  const s = getSizeParam(entity);
  const scale = s / 50;
  const color = entity.color ?? getCategoryColor('File');

  const label = entity.label ?? 'readme.md';
  const meta = entity.metadata ?? {};
  const extension = (meta.extension as string) ?? label.split('.').pop() ?? '';
  const w = s * 0.9;
  const h = s * 1.1;
  const hw = w / 2;
  const hh = h / 2;
  const fold = 10;

  // File shape with folded corner (top-right)
  const filePath = document.createElementNS(SVG_NS, 'path');
  filePath.setAttribute('d', `M ${-hw} ${-hh} L ${hw - fold} ${-hh} L ${hw} ${-hh + fold} L ${hw} ${hh} L ${-hw} ${hh} Z`);
  filePath.setAttribute('fill', colorWithAlpha(color, OPACITY.fillLight));
  filePath.setAttribute('stroke', color);
  filePath.setAttribute('stroke-width', String(getStrokeWidth('default', scale)));
  innerG.appendChild(filePath);

  // Fold triangle
  const foldPath = document.createElementNS(SVG_NS, 'path');
  foldPath.setAttribute('d', `M ${hw - fold} ${-hh} L ${hw - fold} ${-hh + fold} L ${hw} ${-hh + fold}`);
  foldPath.setAttribute('fill', color);
  foldPath.setAttribute('opacity', '0.2');
  foldPath.setAttribute('stroke', color);
  foldPath.setAttribute('stroke-width', String(STROKE.thin));
  innerG.appendChild(foldPath);

  // Content lines (3 horizontal lines)
  for (let i = 0; i < 3; i++) {
    const lineY = -hh + 20 + i * 8;
    const lineW = w * (0.7 - i * 0.1);
    const line = document.createElementNS(SVG_NS, 'line');
    line.setAttribute('x1', String(-hw + 8));
    line.setAttribute('y1', String(lineY));
    line.setAttribute('x2', String(-hw + 8 + lineW));
    line.setAttribute('y2', String(lineY));
    line.setAttribute('stroke', color);
    line.setAttribute('stroke-width', String(STROKE.thin));
    line.setAttribute('opacity', '0.2');
    innerG.appendChild(line);
  }

  // Extension badge at bottom
  if (extension) {
    const badgeW = Math.max(20, extension.length * 6 + 8);
    const badgeH = 12;
    const badge = document.createElementNS(SVG_NS, 'rect');
    badge.setAttribute('x', String(-badgeW / 2));
    badge.setAttribute('y', String(hh - badgeH - 6));
    badge.setAttribute('width', String(badgeW));
    badge.setAttribute('height', String(badgeH));
    badge.setAttribute('rx', '3');
    badge.setAttribute('fill', color);
    badge.setAttribute('opacity', '0.2');
    innerG.appendChild(badge);

    const extText = document.createElementNS(SVG_NS, 'text');
    extText.setAttribute('x', '0');
    extText.setAttribute('y', String(hh - 8));
    extText.setAttribute('text-anchor', 'middle');
    extText.setAttribute('fill', color);
    extText.setAttribute('font-size', String(getLabelFontSize('inline', scale)));
    extText.setAttribute('font-weight', String(TYPOGRAPHY.fontWeightBold));
    extText.setAttribute('font-family', TYPOGRAPHY.fontCode);
    extText.textContent = `.${extension}`;
    innerG.appendChild(extText);
  }

  // Label below
  const text = document.createElementNS(SVG_NS, 'text');
  text.setAttribute('x', '0');
  text.setAttribute('y', String(hh + 16));
  text.setAttribute('text-anchor', 'middle');
  text.setAttribute('fill', color);
  text.setAttribute('font-size', String(getLabelFontSize('label', scale)));
  text.setAttribute('font-weight', String(TYPOGRAPHY.fontWeightLabel));
  text.setAttribute('font-family', TYPOGRAPHY.fontLabel);
  text.textContent = label;
  innerG.appendChild(text);

  applyEntranceAnimation(innerG, entity);
  parentEl.appendChild(outerG);
  return outerG;
}
