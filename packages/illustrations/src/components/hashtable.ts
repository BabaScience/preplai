/**
 * @preplai/illustrations — HashTable / Dict Component
 *
 * Clean grid of key→value pairs.
 * Use for: hash tables, dictionaries, maps, key-value stores.
 *
 * Metadata: { pairs: [string, string][], cols?: number }
 *
 * Minimalist style matching the Composable engine aesthetic.
 */

import { SVG_NS, buildEntityGroup, applyEntranceAnimation, getSizeParam } from '../utils.js';
import { createLinearGradient, ensureDefs } from '../visual-utils.js';
import {
  getCategoryColor,
  getStrokeWidth,
  getLabelFontSize,
  colorWithAlpha,
  OPACITY,
  TYPOGRAPHY,
  SHAPES,
  STROKE,
  LABEL_DEFAULTS,
} from '../design-tokens.js';
import type { VisualEntity } from '@preplai/shared';

export function renderHashTable(entity: VisualEntity, parentEl: SVGElement): SVGGElement {
  const { outerG, innerG } = buildEntityGroup(entity);

  const s = getSizeParam(entity);
  const scale = s / 50;
  const color = entity.color ?? getCategoryColor(entity.type);
  const defs = ensureDefs(parentEl);
  const gradId = `grad-ht-${color.replace(/[^a-fA-F0-9]/g, '')}`;
  createLinearGradient(gradId, color, 'vertical', defs);

  const meta = entity.metadata ?? {};
  const pairs = ((meta.pairs as [string, string][]) ?? [['a', '1'], ['b', '2'], ['k', 'v']]).slice(0, 8);
  const cols = Math.max(1, Math.min(4, (meta.cols as number) ?? 2));

  const cellW = 44 * scale;
  const cellH = 22 * scale;
  const gap = 4 * scale;

  const rows = Math.ceil(pairs.length / cols);
  const totalW = cols * cellW + (cols - 1) * gap;
  const totalH = rows * cellH + (rows - 1) * gap;

  // Highlight glow
  if (entity.highlight) {
    const glow = document.createElementNS(SVG_NS, 'rect');
    glow.setAttribute('x', String(-totalW / 2 - 3));
    glow.setAttribute('y', String(-totalH / 2 - 3));
    glow.setAttribute('width', String(totalW + 6));
    glow.setAttribute('height', String(totalH + 6));
    glow.setAttribute('rx', String(SHAPES.borderRadius + 2));
    glow.setAttribute('fill', 'none');
    glow.setAttribute('stroke', colorWithAlpha(color, OPACITY.strokeMuted));
    glow.setAttribute('stroke-width', String(STROKE.default));
    glow.setAttribute('stroke-dasharray', '4,4');
    innerG.appendChild(glow);
  }

  pairs.forEach(([key, val], i) => {
    const col = i % cols;
    const row = Math.floor(i / cols);
    const x = -totalW / 2 + col * (cellW + gap) + cellW / 2;
    const y = -totalH / 2 + row * (cellH + gap) + cellH / 2;

    const cell = document.createElementNS(SVG_NS, 'rect');
    cell.setAttribute('x', String(x - cellW / 2));
    cell.setAttribute('y', String(y - cellH / 2));
    cell.setAttribute('width', String(cellW));
    cell.setAttribute('height', String(cellH));
    cell.setAttribute('rx', String(Math.max(1, SHAPES.borderRadius - 2)));
    cell.setAttribute('fill', `url(#${gradId})`);
    cell.setAttribute('stroke', color);
    cell.setAttribute('stroke-width', String(getStrokeWidth('thin', scale)));
    innerG.appendChild(cell);

    // Divider
    const divider = document.createElementNS(SVG_NS, 'line');
    divider.setAttribute('x1', String(x));
    divider.setAttribute('y1', String(y - cellH / 2 + 2));
    divider.setAttribute('x2', String(x));
    divider.setAttribute('y2', String(y + cellH / 2 - 2));
    divider.setAttribute('stroke', colorWithAlpha(color, OPACITY.strokeMuted));
    divider.setAttribute('stroke-width', String(getStrokeWidth('minimal', scale) * 0.5));
    innerG.appendChild(divider);

    const fontSize = getLabelFontSize('value', scale);

    // Key (left)
    const keyText = document.createElementNS(SVG_NS, 'text');
    keyText.setAttribute('x', String(x - cellW / 4));
    keyText.setAttribute('y', String(y + 4));
    keyText.setAttribute('text-anchor', 'middle');
    keyText.setAttribute('fill', colorWithAlpha(color, OPACITY.strokeSoft));
    keyText.setAttribute('font-size', String(fontSize));
    keyText.setAttribute('font-weight', String(TYPOGRAPHY.fontWeightLabel));
    keyText.setAttribute('font-family', TYPOGRAPHY.fontBadge);
    keyText.textContent = key.slice(0, 6);
    innerG.appendChild(keyText);

    // Value (right)
    const valText = document.createElementNS(SVG_NS, 'text');
    valText.setAttribute('x', String(x + cellW / 4));
    valText.setAttribute('y', String(y + 4));
    valText.setAttribute('text-anchor', 'middle');
    valText.setAttribute('fill', color);
    valText.setAttribute('font-size', String(fontSize));
    valText.setAttribute('font-weight', String(TYPOGRAPHY.fontWeightEmphasis));
    valText.setAttribute('font-family', TYPOGRAPHY.fontBadge);
    valText.textContent = val.slice(0, 6);
    innerG.appendChild(valText);
  });

  // Label below
  if (entity.label) {
    const text = document.createElementNS(SVG_NS, 'text');
    text.setAttribute('x', '0');
    text.setAttribute('y', String(totalH / 2 + LABEL_DEFAULTS.offsetBelow));
    text.setAttribute('text-anchor', LABEL_DEFAULTS.textAnchor);
    text.setAttribute('fill', color);
    text.setAttribute('font-size', String(getLabelFontSize('label', scale)));
    text.setAttribute('font-weight', String(TYPOGRAPHY.fontWeightLabel));
    text.setAttribute('font-family', TYPOGRAPHY.fontLabel);
    text.textContent = entity.label;
    innerG.appendChild(text);
  }

  applyEntranceAnimation(innerG, entity);
  parentEl.appendChild(outerG);
  return outerG;
}
