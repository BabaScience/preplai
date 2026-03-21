/**
 * @preplai/illustrations — MemoryBlock Component
 *
 * Memory address space: vertical stack of addressable cells with addr on left, value on right.
 *
 * Metadata: { cells: Array<{addr: string, value: string}> } or { cells: [addr, value][] }
 */

import { SVG_NS, buildEntityGroup, applyEntranceAnimation, getSizeParam } from '../utils.js';
import {
  getCategoryColor,
  getStrokeWidth,
  getLabelFontSize,
  colorWithAlpha,
  OPACITY,
  TYPOGRAPHY,
  SHAPES,
  LABEL_DEFAULTS,
} from '../design-tokens.js';
import type { VisualEntity } from '@preplai/shared';

type CellSpec = { addr: string; value: string } | [string, string];

function parseCells(meta: Record<string, unknown>): Array<{ addr: string; value: string }> {
  const raw = meta.cells as CellSpec[] | undefined;
  if (!Array.isArray(raw) || raw.length === 0) {
    return [
      { addr: '0x0000', value: 'main' },
      { addr: '0x0008', value: '42' },
      { addr: '0x0010', value: 'ptr' },
      { addr: '0x0018', value: '0x0020' },
    ];
  }
  return raw.slice(0, 10).map((c) => {
    if (Array.isArray(c) && c.length >= 2) {
      return { addr: String(c[0]), value: String(c[1]) };
    }
    if (typeof c === 'object' && c != null && 'addr' in c && 'value' in c) {
      return { addr: String((c as { addr: unknown }).addr), value: String((c as { value: unknown }).value) };
    }
    return { addr: '?', value: '?' };
  });
}

export function renderMemoryBlock(entity: VisualEntity, parentEl: SVGElement): SVGGElement {
  const { outerG, innerG } = buildEntityGroup(entity);

  const s = getSizeParam(entity);
  const scale = s / 50;
  const cellFontSize = getLabelFontSize('value', scale);
  const strokeWidth = getStrokeWidth('thin', scale);
  const color = entity.color ?? getCategoryColor('MemoryBlock');

  const meta = entity.metadata ?? {};
  const cells = parseCells(meta);

  const cellW = 70 * scale;
  const cellH = 20 * scale;
  const gap = 3;
  const _addrW = cellW * 0.5;
  const totalH = cells.length * cellH + (cells.length - 1) * gap;
  const startY = -totalH / 2 + cellH / 2;

  cells.forEach(({ addr, value }, i) => {
    const y = startY + i * (cellH + gap);

    const rect = document.createElementNS(SVG_NS, 'rect');
    rect.setAttribute('x', String(-cellW / 2));
    rect.setAttribute('y', String(y - cellH / 2));
    rect.setAttribute('width', String(cellW));
    rect.setAttribute('height', String(cellH));
    rect.setAttribute('rx', String(SHAPES.borderRadius - 2));
    rect.setAttribute('fill', colorWithAlpha(color, OPACITY.fillLight));
    rect.setAttribute('stroke', color);
    rect.setAttribute('stroke-width', String(strokeWidth));
    innerG.appendChild(rect);

    const addrText = document.createElementNS(SVG_NS, 'text');
    addrText.setAttribute('x', String(-cellW / 2 + 6));
    addrText.setAttribute('y', String(y + 4));
    addrText.setAttribute('text-anchor', 'start');
    addrText.setAttribute('fill', colorWithAlpha(color, OPACITY.strokeSoft));
    addrText.setAttribute('font-size', String(cellFontSize * 0.9));
    addrText.setAttribute('font-family', TYPOGRAPHY.fontBadge);
    addrText.textContent = addr.length > 10 ? addr.slice(0, 8) + '…' : addr;
    innerG.appendChild(addrText);

    const valText = document.createElementNS(SVG_NS, 'text');
    valText.setAttribute('x', String(cellW / 2 - 6));
    valText.setAttribute('y', String(y + 4));
    valText.setAttribute('text-anchor', 'end');
    valText.setAttribute('fill', color);
    valText.setAttribute('font-size', String(cellFontSize));
    valText.setAttribute('font-weight', String(TYPOGRAPHY.fontWeightEmphasis));
    valText.setAttribute('font-family', TYPOGRAPHY.fontBadge);
    valText.textContent = value.length > 12 ? value.slice(0, 10) + '…' : value;
    innerG.appendChild(valText);
  });

  if (entity.label) {
    const labelEl = document.createElementNS(SVG_NS, 'text');
    labelEl.setAttribute('x', '0');
    labelEl.setAttribute('y', String(totalH / 2 + LABEL_DEFAULTS.offsetBelow));
    labelEl.setAttribute('text-anchor', LABEL_DEFAULTS.textAnchor);
    labelEl.setAttribute('fill', color);
    labelEl.setAttribute('font-size', String(getLabelFontSize('label', scale)));
    labelEl.setAttribute('font-weight', String(TYPOGRAPHY.fontWeightLabel));
    labelEl.setAttribute('font-family', TYPOGRAPHY.fontLabel);
    labelEl.textContent = entity.label;
    innerG.appendChild(labelEl);
  }

  applyEntranceAnimation(innerG, entity);
  parentEl.appendChild(outerG);
  return outerG;
}
