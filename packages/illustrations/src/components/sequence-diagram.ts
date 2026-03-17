/**
 * @preplai/illustrations — SequenceDiagram Component
 * Self-contained sequence diagram with participant boxes, dashed lifelines, and message arrows.
 */

import { SVG_NS, buildEntityGroup, applyEntranceAnimation, getSizeParam } from '../utils.js';
import { getCategoryColor, TYPOGRAPHY, STROKE, OPACITY, colorWithAlpha } from '../design-tokens.js';
import type { VisualEntity } from '@preplai/shared';

interface Participant {
  name: string;
  type?: string;
}

interface Message {
  from: string;
  to: string;
  label: string;
  type?: 'sync' | 'async' | 'reply';
}

const defaultParticipants: Participant[] = [
  { name: 'Client' },
  { name: 'Server' },
  { name: 'Database' },
];

const defaultMessages: Message[] = [
  { from: 'Client', to: 'Server', label: 'Request', type: 'sync' },
  { from: 'Server', to: 'Database', label: 'Query', type: 'sync' },
  { from: 'Database', to: 'Server', label: 'Result', type: 'reply' },
  { from: 'Server', to: 'Client', label: 'Response', type: 'reply' },
];

export function renderSequenceDiagram(entity: VisualEntity, parentEl: SVGElement): SVGGElement {
  const { outerG, innerG } = buildEntityGroup(entity);
  const size = getSizeParam(entity);
  const color = entity.color ?? getCategoryColor('SequenceDiagram');
  const meta = (entity.metadata ?? {}) as { participants?: Participant[]; messages?: Message[] };

  const participants = meta.participants?.length ? meta.participants : defaultParticipants;
  const messages = meta.messages?.length ? meta.messages : defaultMessages;

  const scale = size / 50; // normalize: size=50 is base
  const boxW = 80 * scale;
  const boxH = 30 * scale;
  const participantSpacing = 100 * scale;
  const messageSpacing = 35 * scale;
  const lifelineStartY = boxH / 2 + 4 * scale;
  const messageStartY = boxH / 2 + 28 * scale;

  // Total width/height for centering
  const totalW = (participants.length - 1) * participantSpacing;
  const totalMsgH = messages.length * messageSpacing;
  const lifelineH = messageStartY - lifelineStartY + totalMsgH + 20 * scale;
  const startX = -totalW / 2;

  // Build participant index for x lookup
  const pIndex = new Map<string, number>();
  participants.forEach((p, i) => pIndex.set(p.name, i));

  // ── Participant boxes + lifelines ──
  for (let i = 0; i < participants.length; i++) {
    const px = startX + i * participantSpacing;

    // Rounded rectangle
    const rect = document.createElementNS(SVG_NS, 'rect');
    rect.setAttribute('x', String(px - boxW / 2));
    rect.setAttribute('y', String(-boxH / 2));
    rect.setAttribute('width', String(boxW));
    rect.setAttribute('height', String(boxH));
    rect.setAttribute('rx', '4');
    rect.setAttribute('ry', '4');
    rect.setAttribute('fill', colorWithAlpha(color, OPACITY.fillMedium));
    rect.setAttribute('stroke', color);
    rect.setAttribute('stroke-width', String(STROKE.default));
    innerG.appendChild(rect);

    // Participant name label
    const label = document.createElementNS(SVG_NS, 'text');
    label.setAttribute('x', String(px));
    label.setAttribute('y', String(3 * scale));
    label.setAttribute('text-anchor', 'middle');
    label.setAttribute('fill', color);
    label.setAttribute('font-size', String(Math.round(12 * scale)));
    label.setAttribute('font-weight', String(TYPOGRAPHY.fontWeightEmphasis));
    label.setAttribute('font-family', TYPOGRAPHY.fontLabel);
    label.textContent = participants[i].name;
    innerG.appendChild(label);

    // Dashed lifeline
    const lifeline = document.createElementNS(SVG_NS, 'line');
    lifeline.setAttribute('x1', String(px));
    lifeline.setAttribute('y1', String(lifelineStartY));
    lifeline.setAttribute('x2', String(px));
    lifeline.setAttribute('y2', String(lifelineStartY + lifelineH));
    lifeline.setAttribute('stroke', color);
    lifeline.setAttribute('stroke-width', String(STROKE.thin));
    lifeline.setAttribute('stroke-dasharray', '6,4');
    lifeline.setAttribute('opacity', '0.4');
    innerG.appendChild(lifeline);
  }

  // ── Message arrows ──
  for (let i = 0; i < messages.length; i++) {
    const msg = messages[i];
    const fromIdx = pIndex.get(msg.from);
    const toIdx = pIndex.get(msg.to);
    if (fromIdx == null || toIdx == null) continue;

    const fromX = startX + fromIdx * participantSpacing;
    const toX = startX + toIdx * participantSpacing;
    const y = messageStartY + i * messageSpacing;
    const msgType = msg.type ?? 'sync';

    // Arrow line
    const line = document.createElementNS(SVG_NS, 'line');
    line.setAttribute('x1', String(fromX));
    line.setAttribute('y1', String(y));
    line.setAttribute('x2', String(toX));
    line.setAttribute('y2', String(y));
    line.setAttribute('stroke', color);
    line.setAttribute('stroke-width', String(STROKE.thin));
    if (msgType === 'async' || msgType === 'reply') {
      line.setAttribute('stroke-dasharray', '5,3');
    }
    line.setAttribute('opacity', '0.85');
    innerG.appendChild(line);

    // Arrowhead
    const dir = toX > fromX ? 1 : -1;
    const headLen = 6 * scale;
    const arrowhead = document.createElementNS(SVG_NS, 'path');

    if (msgType === 'reply') {
      // Open arrowhead (two lines, no fill)
      arrowhead.setAttribute('d', [
        `M ${toX - dir * headLen} ${y - headLen * 0.5}`,
        `L ${toX} ${y}`,
        `L ${toX - dir * headLen} ${y + headLen * 0.5}`,
      ].join(' '));
      arrowhead.setAttribute('fill', 'none');
      arrowhead.setAttribute('stroke', color);
      arrowhead.setAttribute('stroke-width', String(STROKE.thin));
    } else {
      // Filled arrowhead (closed triangle)
      arrowhead.setAttribute('d', [
        `M ${toX} ${y}`,
        `L ${toX - dir * headLen} ${y - headLen * 0.5}`,
        `L ${toX - dir * headLen} ${y + headLen * 0.5}`,
        'Z',
      ].join(' '));
      arrowhead.setAttribute('fill', color);
    }
    arrowhead.setAttribute('opacity', '0.85');
    innerG.appendChild(arrowhead);

    // Message label (small text above arrow)
    const midX = (fromX + toX) / 2;
    const labelEl = document.createElementNS(SVG_NS, 'text');
    labelEl.setAttribute('x', String(midX));
    labelEl.setAttribute('y', String(y - 6 * scale));
    labelEl.setAttribute('text-anchor', 'middle');
    labelEl.setAttribute('fill', color);
    labelEl.setAttribute('font-size', String(Math.round(11 * scale)));
    labelEl.setAttribute('font-weight', String(TYPOGRAPHY.fontWeightLabel));
    labelEl.setAttribute('font-family', TYPOGRAPHY.fontLabel);
    labelEl.setAttribute('opacity', '0.9');
    labelEl.textContent = msg.label;
    innerG.appendChild(labelEl);
  }

  // ── Entity label (below diagram) ──
  if (entity.label) {
    const labelY = lifelineStartY + lifelineH + 18 * scale;
    const text = document.createElementNS(SVG_NS, 'text');
    text.setAttribute('x', '0');
    text.setAttribute('y', String(labelY));
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
