/**
 * @preplai/illustrations — Packet Component
 *
 * Network packet: horizontal rect divided into header sections (src/dst IP, ports, flags)
 * and payload area, with optional byte-offset markers.
 *
 * Metadata:
 *   headers: Array<{name: string, value: string, bytes?: number}> — header fields
 *   payload: string — payload preview text
 *   protocol: string — e.g. TCP, UDP, IP
 *   highlightSection?: string — name of section to highlight (header name or 'payload')
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

interface HeaderDef {
  name: string;
  value: string;
  bytes?: number;
}

function parseHeaders(meta: Record<string, unknown>): HeaderDef[] {
  const raw = meta.headers as HeaderDef[] | undefined;
  if (!Array.isArray(raw) || raw.length === 0) {
    return [
      { name: 'Src IP', value: '192.168.1.1', bytes: 4 },
      { name: 'Dst IP', value: '10.0.0.5', bytes: 4 },
      { name: 'Src Port', value: '443', bytes: 2 },
      { name: 'Dst Port', value: '8080', bytes: 2 },
      { name: 'Flags', value: 'ACK', bytes: 1 },
    ];
  }
  return raw.slice(0, 8).map((h) => ({
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
  const defs = ensureDefs(parentEl);
  const gradId = `grad-pkt-${color.replace(/[^a-fA-F0-9]/g, '')}`;
  createLinearGradient(gradId, color, 'vertical', defs);

  const meta = entity.metadata ?? {};
  const headers = parseHeaders(meta);
  const payload = String(meta.payload ?? 'Data...').slice(0, 20);
  const protocol = String(meta.protocol ?? 'TCP').toUpperCase();
  const highlightSection = meta.highlightSection as string | undefined;

  const totalW = s * 3.2;
  const barH = s * 0.5;
  const headerRatio = 0.65;
  const headerW = totalW * headerRatio;
  const _payloadW = totalW * (1 - headerRatio);
  const sectionGap = 2;
  const padding = 6 * scale;

  const startX = -totalW / 2;
  let offsetX = startX;

  const totalBytes = headers.reduce((sum, h) => sum + (h.bytes ?? 4), 0) + 16;

  headers.forEach((h) => {
    const bytes = h.bytes ?? 4;
    const sectionW = Math.max((bytes / totalBytes) * headerW, 28 * scale);
    const isHighlighted = highlightSection === h.name;

    const rect = document.createElementNS(SVG_NS, 'rect');
    rect.setAttribute('x', String(offsetX));
    rect.setAttribute('y', String(-barH / 2));
    rect.setAttribute('width', String(sectionW));
    rect.setAttribute('height', String(barH));
    rect.setAttribute('rx', String(SHAPES.borderRadius - 2));
    rect.setAttribute('fill', isHighlighted ? colorWithAlpha(color, OPACITY.fillLight) : `url(#${gradId})`);
    rect.setAttribute('stroke', isHighlighted ? color : colorWithAlpha(color, OPACITY.strokeSoft));
    rect.setAttribute('stroke-width', String(isHighlighted ? strokeWidth * 1.5 : strokeWidth));
    innerG.appendChild(rect);

    const nameText = document.createElementNS(SVG_NS, 'text');
    nameText.setAttribute('x', String(offsetX + sectionW / 2));
    nameText.setAttribute('y', String(-barH / 2 + padding + 2));
    nameText.setAttribute('text-anchor', 'middle');
    nameText.setAttribute('fill', colorWithAlpha(color, OPACITY.strokeSoft));
    nameText.setAttribute('font-size', String(labelFontSize * 0.85));
    nameText.setAttribute('font-family', TYPOGRAPHY.fontLabel);
    nameText.textContent = h.name;
    innerG.appendChild(nameText);

    const valText = document.createElementNS(SVG_NS, 'text');
    valText.setAttribute('x', String(offsetX + sectionW / 2));
    valText.setAttribute('y', String(barH / 2 - padding));
    valText.setAttribute('text-anchor', 'middle');
    valText.setAttribute('fill', color);
    valText.setAttribute('font-size', String(cellFontSize * 0.9));
    valText.setAttribute('font-weight', String(TYPOGRAPHY.fontWeightEmphasis));
    valText.setAttribute('font-family', TYPOGRAPHY.fontBadge);
    valText.textContent = h.value.length > 10 ? h.value.slice(0, 8) + '…' : h.value;
    innerG.appendChild(valText);

    offsetX += sectionW + sectionGap;
  });

  const payloadHighlighted = highlightSection === 'payload';
  const payloadRect = document.createElementNS(SVG_NS, 'rect');
  payloadRect.setAttribute('x', String(offsetX));
  payloadRect.setAttribute('y', String(-barH / 2));
  payloadRect.setAttribute('width', String(startX + totalW - offsetX));
  payloadRect.setAttribute('height', String(barH));
  payloadRect.setAttribute('rx', String(SHAPES.borderRadius - 2));
  payloadRect.setAttribute('fill', payloadHighlighted ? colorWithAlpha(color, OPACITY.fillLight) : `url(#${gradId})`);
  payloadRect.setAttribute('stroke', payloadHighlighted ? color : colorWithAlpha(color, OPACITY.strokeSoft));
  payloadRect.setAttribute('stroke-width', String(payloadHighlighted ? strokeWidth * 1.5 : strokeWidth));
  innerG.appendChild(payloadRect);

  const payloadSectionW = startX + totalW - offsetX;
  const payloadLabel = document.createElementNS(SVG_NS, 'text');
  payloadLabel.setAttribute('x', String(offsetX + payloadSectionW / 2));
  payloadLabel.setAttribute('y', String(-barH / 2 + padding + 2));
  payloadLabel.setAttribute('text-anchor', 'middle');
  payloadLabel.setAttribute('fill', colorWithAlpha(color, OPACITY.strokeSoft));
  payloadLabel.setAttribute('font-size', String(labelFontSize * 0.85));
  payloadLabel.setAttribute('font-family', TYPOGRAPHY.fontLabel);
  payloadLabel.textContent = 'Payload';
  innerG.appendChild(payloadLabel);

  const payloadVal = document.createElementNS(SVG_NS, 'text');
  payloadVal.setAttribute('x', String(offsetX + payloadSectionW / 2));
  payloadVal.setAttribute('y', String(barH / 2 - padding));
  payloadVal.setAttribute('text-anchor', 'middle');
  payloadVal.setAttribute('fill', color);
  payloadVal.setAttribute('font-size', String(cellFontSize * 0.85));
  payloadVal.setAttribute('font-family', TYPOGRAPHY.fontBadge);
  payloadVal.textContent = payload;
  innerG.appendChild(payloadVal);

  const protocolBadge = document.createElementNS(SVG_NS, 'text');
  protocolBadge.setAttribute('x', String(startX));
  protocolBadge.setAttribute('y', String(-barH / 2 - 6));
  protocolBadge.setAttribute('text-anchor', 'start');
  protocolBadge.setAttribute('fill', colorWithAlpha(color, OPACITY.strokeSoft));
  protocolBadge.setAttribute('font-size', String(labelFontSize));
  protocolBadge.setAttribute('font-weight', String(TYPOGRAPHY.fontWeightEmphasis));
  protocolBadge.setAttribute('font-family', TYPOGRAPHY.fontBadge);
  protocolBadge.textContent = protocol;
  innerG.appendChild(protocolBadge);

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
