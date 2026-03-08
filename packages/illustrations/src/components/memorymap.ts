/**
 * @preplai/illustrations — MemoryMap Component
 *
 * Virtual memory map: vertical segmented bar (text, data, BSS, heap, stack) with address labels.
 *
 * Metadata: { segments: Array<{name, startAddr, endAddr, color?}>, pointerPosition?: string }
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
  LABEL_DEFAULTS,
} from '../design-tokens.js';
import type { VisualEntity } from '@preplai/shared';

type SegmentSpec = {
  name: string;
  startAddr: string;
  endAddr: string;
  color?: string;
  growDirection?: 'up' | 'down';
};

function parseSegments(meta: Record<string, unknown>, defaultColor: string): SegmentSpec[] {
  const raw = meta.segments as SegmentSpec[] | undefined;
  if (!Array.isArray(raw) || raw.length === 0) {
    return [
      { name: 'Stack', startAddr: '0xFFF0', endAddr: '0xFFFF', growDirection: 'down' },
      { name: 'Heap', startAddr: '0x1000', endAddr: '0x2000', growDirection: 'up' },
      { name: 'BSS', startAddr: '0x0800', endAddr: '0x1000' },
      { name: 'Data', startAddr: '0x0600', endAddr: '0x0800' },
      { name: 'Text', startAddr: '0x0000', endAddr: '0x0600' },
    ];
  }
  return raw.slice(0, 8).map((s) => ({
    name: String(s?.name ?? '?'),
    startAddr: String(s?.startAddr ?? '0x0'),
    endAddr: String(s?.endAddr ?? '0x0'),
    color: s?.color ?? defaultColor,
    growDirection: s?.growDirection,
  }));
}

export function renderMemoryMap(entity: VisualEntity, parentEl: SVGElement): SVGGElement {
  const { outerG, innerG } = buildEntityGroup(entity);

  const s = getSizeParam(entity);
  const scale = s / 50;
  const labelFontSize = getLabelFontSize('inline', scale);
  const addrFontSize = getLabelFontSize('index', scale);
  const strokeWidth = getStrokeWidth('thin', scale);
  const color = entity.color ?? getCategoryColor('MemoryMap');
  const defs = ensureDefs(parentEl);

  const meta = entity.metadata ?? {};
  const segments = parseSegments(meta, color);

  const barW = 50 * scale;
  const totalH = 120 * scale;
  const segCount = segments.length;
  const segH = totalH / segCount;
  const gap = 2;

  const baseId = entity.id?.replace(/[^a-z0-9]/gi, '') ?? 'mm';
  segments.forEach((seg, i) => {
    const segColor = seg.color ?? color;
    const gradId = `grad-mm-${baseId}-${i}-${segColor.replace(/[^a-fA-F0-9]/g, '')}`;
    if (!defs.querySelector(`#${gradId}`)) {
      createLinearGradient(gradId, segColor, 'vertical', defs);
    }
    const y = -totalH / 2 + i * segH + segH / 2;

    const rect = document.createElementNS(SVG_NS, 'rect');
    rect.setAttribute('x', String(-barW / 2));
    rect.setAttribute('y', String(y - segH / 2 + gap / 2));
    rect.setAttribute('width', String(barW));
    rect.setAttribute('height', String(segH - gap));
    rect.setAttribute('rx', String(SHAPES.borderRadius - 2));
    rect.setAttribute('fill', `url(#${gradId})`);
    rect.setAttribute('stroke', segColor);
    rect.setAttribute('stroke-width', String(strokeWidth));
    innerG.appendChild(rect);

    const nameText = document.createElementNS(SVG_NS, 'text');
    nameText.setAttribute('x', String(-barW / 2 - 4));
    nameText.setAttribute('y', String(y + 4));
    nameText.setAttribute('text-anchor', 'end');
    nameText.setAttribute('fill', segColor);
    nameText.setAttribute('font-size', String(labelFontSize));
    nameText.setAttribute('font-weight', '600');
    nameText.setAttribute('font-family', TYPOGRAPHY.fontBadge);
    nameText.textContent = seg.name;
    innerG.appendChild(nameText);

    const addrText = document.createElementNS(SVG_NS, 'text');
    addrText.setAttribute('x', String(barW / 2 + 4));
    addrText.setAttribute('y', String(y + 4));
    addrText.setAttribute('text-anchor', 'start');
    addrText.setAttribute('fill', colorWithAlpha(segColor, OPACITY.strokeSoft));
    addrText.setAttribute('font-size', String(addrFontSize));
    addrText.setAttribute('font-family', TYPOGRAPHY.fontBadge);
    addrText.textContent = `${seg.startAddr}–${seg.endAddr}`;
    innerG.appendChild(addrText);
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
