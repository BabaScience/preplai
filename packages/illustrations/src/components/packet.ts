/**
 * @preplai/illustrations — Packet Component
 *
 * Horizontal bar divided into header sections and payload.
 * Data-driven but with cleaner, lighter visuals.
 * Use for: network packets, protocol frames, data segments.
 *
 * Metadata:
 *   headers: Array<{name: string, value: string, bytes?: number}>
 *   payload: string
 *   protocol: string
 */

import { SVG_NS, buildEntityGroup, applyEntranceAnimation, getSizeParam } from '../utils.js';
import {
  getCategoryColor,
  getStrokeWidth,
  getLabelFontSize,
  colorWithAlpha,
  OPACITY,
  TYPOGRAPHY,
  STROKE,
  LABEL_DEFAULTS,
} from '../design-tokens.js';
import type { VisualEntity } from '@preplai/shared';

interface HeaderDef {
  name: string;
  value: string;
  bytes?: number;
}

function parseHeaders(meta: Record<string, unknown>): HeaderDef[] {
  const raw = meta.headers as HeaderDef[] | undefined;
  if (!Array.isArray(raw) || raw.length === 0) {
    return [
      { name: 'Src', value: '192.168.1.1', bytes: 4 },
      { name: 'Dst', value: '10.0.0.5', bytes: 4 },
      { name: 'Port', value: '443', bytes: 2 },
      { name: 'Flags', value: 'ACK', bytes: 1 },
    ];
  }
  return raw.slice(0, 6).map((h) => ({
    name: String(h?.name ?? '?'),
    value: String(h?.value ?? ''),
    bytes: typeof h?.bytes === 'number' ? h.bytes : undefined,
  }));
}

export function renderPacket(entity: VisualEntity, parentEl: SVGElement): SVGGElement {
  const { outerG, innerG } = buildEntityGroup(entity);

  const s = getSizeParam(entity);
  const scale = s / 50;
  const cellFontSize = getLabelFontSize('value', scale);
  const labelFontSize = getLabelFontSize('inline', scale);
  const strokeWidth = getStrokeWidth('thin', scale);
  const color = entity.color ?? getCategoryColor('Packet');

  const meta = entity.metadata ?? {};
  const headers = parseHeaders(meta);
  const payload = String(meta.payload ?? 'Data...').slice(0, 16);

  const totalW = s * 3;
  const barH = s * 0.45;
  const headerRatio = 0.65;
  const headerW = totalW * headerRatio;
  const sectionGap = 2;
  const padding = 5 * scale;

  const startX = -totalW / 2;
  let offsetX = startX;

  const totalBytes = headers.reduce((sum, h) => sum + (h.bytes ?? 4), 0) + 16;

  // Highlight glow
  if (entity.highlight) {
    const glow = document.createElementNS(SVG_NS, 'rect');
    glow.setAttribute('x', String(startX - 3));
    glow.setAttribute('y', String(-barH / 2 - 3));
    glow.setAttribute('width', String(totalW + 6));
    glow.setAttribute('height', String(barH + 6));
    glow.setAttribute('rx', '5');
    glow.setAttribute('fill', 'none');
    glow.setAttribute('stroke', colorWithAlpha(color, OPACITY.strokeMuted));
    glow.setAttribute('stroke-width', String(STROKE.default));
    glow.setAttribute('stroke-dasharray', '4,4');
    innerG.appendChild(glow);
  }

  headers.forEach((h) => {
    const bytes = h.bytes ?? 4;
    const sectionW = Math.max((bytes / totalBytes) * headerW, 26 * scale);

    const rect = document.createElementNS(SVG_NS, 'rect');
    rect.setAttribute('x', String(offsetX));
    rect.setAttribute('y', String(-barH / 2));
    rect.setAttribute('width', String(sectionW));
    rect.setAttribute('height', String(barH));
    rect.setAttribute('rx', '3');
    rect.setAttribute('fill', colorWithAlpha(color, OPACITY.fillLight));
    rect.setAttribute('stroke', colorWithAlpha(color, OPACITY.strokeMuted));
    rect.setAttribute('stroke-width', String(strokeWidth));
    innerG.appendChild(rect);

    const nameText = document.createElementNS(SVG_NS, 'text');
    nameText.setAttribute('x', String(offsetX + sectionW / 2));
    nameText.setAttribute('y', String(-barH / 2 + padding + 2));
    nameText.setAttribute('text-anchor', 'middle');
    nameText.setAttribute('fill', colorWithAlpha(color, OPACITY.strokeSoft));
    nameText.setAttribute('font-size', String(labelFontSize * 0.8));
    nameText.setAttribute('font-family', TYPOGRAPHY.fontLabel);
    nameText.textContent = h.name;
    innerG.appendChild(nameText);

    const valText = document.createElementNS(SVG_NS, 'text');
    valText.setAttribute('x', String(offsetX + sectionW / 2));
    valText.setAttribute('y', String(barH / 2 - padding));
    valText.setAttribute('text-anchor', 'middle');
    valText.setAttribute('fill', color);
    valText.setAttribute('font-size', String(cellFontSize * 0.85));
    valText.setAttribute('font-weight', String(TYPOGRAPHY.fontWeightLabel));
    valText.setAttribute('font-family', TYPOGRAPHY.fontBadge);
    valText.textContent = h.value.length > 10 ? h.value.slice(0, 8) + '…' : h.value;
    innerG.appendChild(valText);

    offsetX += sectionW + sectionGap;
  });

  // Payload section
  const payloadRect = document.createElementNS(SVG_NS, 'rect');
  payloadRect.setAttribute('x', String(offsetX));
  payloadRect.setAttribute('y', String(-barH / 2));
  payloadRect.setAttribute('width', String(startX + totalW - offsetX));
  payloadRect.setAttribute('height', String(barH));
  payloadRect.setAttribute('rx', '3');
  payloadRect.setAttribute('fill', colorWithAlpha(color, OPACITY.fillLight));
  payloadRect.setAttribute('stroke', colorWithAlpha(color, OPACITY.strokeMuted));
  payloadRect.setAttribute('stroke-width', String(strokeWidth));
  innerG.appendChild(payloadRect);

  const payloadSectionW = startX + totalW - offsetX;
  const payloadVal = document.createElementNS(SVG_NS, 'text');
  payloadVal.setAttribute('x', String(offsetX + payloadSectionW / 2));
  payloadVal.setAttribute('y', String(3));
  payloadVal.setAttribute('text-anchor', 'middle');
  payloadVal.setAttribute('fill', color);
  payloadVal.setAttribute('font-size', String(cellFontSize * 0.8));
  payloadVal.setAttribute('font-family', TYPOGRAPHY.fontBadge);
  payloadVal.textContent = payload;
  innerG.appendChild(payloadVal);

  // Label below
  if (entity.label) {
    const labelEl = document.createElementNS(SVG_NS, 'text');
    labelEl.setAttribute('x', '0');
    labelEl.setAttribute('y', String(barH / 2 + LABEL_DEFAULTS.offsetBelow));
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
