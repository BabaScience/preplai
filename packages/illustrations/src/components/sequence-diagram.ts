/**
 * @preplai/illustrations — SequenceDiagram Component (Cinematic Depth)
 *
 * Self-contained sequence diagram with participant boxes, dashed lifelines,
 * and message arrows. 5 Cinematic Pillars: directional lighting, ground shadow,
 * ambient occlusion, specular highlight, micro-life animations.
 */

import { SVG_NS, buildEntityGroup, applyEntranceAnimation, getSizeParam } from '../utils.js';
import { TYPOGRAPHY, STROKE } from '../design-tokens.js';import { resolveColorCascade, applyGlowColors } from '../color-cascade.js';
import { ensureDefs } from '../visual-utils.js';
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
  const cc = resolveColorCascade(entity);
  const color = cc.base;
  const entityId = (entity.id ?? Math.random().toString(36).slice(2)).replace(/[^a-zA-Z0-9]/g, '').slice(0, 8);
  const meta = (entity.metadata ?? {}) as { participants?: Participant[]; messages?: Message[] };

  const participants = meta.participants?.length ? meta.participants : defaultParticipants;
  const messages = meta.messages?.length ? meta.messages : defaultMessages;

  const scale = size / 50;
  const boxW = 80 * scale;
  const boxH = 30 * scale;
  const participantSpacing = 100 * scale;
  const messageSpacing = 35 * scale;
  const lifelineStartY = boxH / 2 + 4 * scale;
  const messageStartY = boxH / 2 + 28 * scale;

  const totalW = (participants.length - 1) * participantSpacing;
  const totalMsgH = messages.length * messageSpacing;
  const lifelineH = messageStartY - lifelineStartY + totalMsgH + 20 * scale;
  const startX = -totalW / 2;

  const pIndex = new Map<string, number>();
  participants.forEach((p, i) => pIndex.set(p.name, i));

  const defs = ensureDefs(parentEl);

  // ── Pillar 1: Directional Lighting ─────────────────────────────────
  const haloId = `seqDiag-halo-${entityId}`;
  if (!defs.querySelector(`#${haloId}`)) {
    const haloGrad = document.createElementNS(SVG_NS, 'radialGradient');
    haloGrad.setAttribute('id', haloId);
    haloGrad.setAttribute('cx', '38%'); haloGrad.setAttribute('cy', '38%');
    haloGrad.setAttribute('r', '50%');
    const s1 = document.createElementNS(SVG_NS, 'stop');
    s1.setAttribute('offset', '0%'); s1.setAttribute('stop-color', color); s1.setAttribute('stop-opacity', '0.13');
    const s2 = document.createElementNS(SVG_NS, 'stop');
    s2.setAttribute('offset', '100%'); s2.setAttribute('stop-color', color); s2.setAttribute('stop-opacity', '0');
    haloGrad.appendChild(s1); haloGrad.appendChild(s2);
    defs.appendChild(haloGrad);
  }
  const halo = document.createElementNS(SVG_NS, 'ellipse');
  halo.setAttribute('cx', '0');
  halo.setAttribute('cy', String(lifelineStartY + lifelineH * 0.3));
  halo.setAttribute('rx', String(totalW * 0.8));
  halo.setAttribute('ry', String(lifelineH * 0.6));
  halo.setAttribute('fill', `url(#${haloId})`);
  innerG.appendChild(halo);

  // ── Pillar 2: Ground Shadow ────────────────────────────────────────
  const gsId = `seqDiag-gshadow-${entityId}`;
  if (!defs.querySelector(`#${gsId}`)) {
    const gsg = document.createElementNS(SVG_NS, 'radialGradient');
    gsg.setAttribute('id', gsId);
    gsg.setAttribute('cx', '50%'); gsg.setAttribute('cy', '50%'); gsg.setAttribute('r', '50%');
    const gs1 = document.createElementNS(SVG_NS, 'stop');
    gs1.setAttribute('offset', '0%'); gs1.setAttribute('stop-color', '#000000'); gs1.setAttribute('stop-opacity', '0.18');
    const gs2 = document.createElementNS(SVG_NS, 'stop');
    gs2.setAttribute('offset', '100%'); gs2.setAttribute('stop-color', '#000000'); gs2.setAttribute('stop-opacity', '0');
    gsg.appendChild(gs1); gsg.appendChild(gs2);
    defs.appendChild(gsg);
  }
  const groundShadow = document.createElementNS(SVG_NS, 'ellipse');
  groundShadow.setAttribute('cx', '0');
  groundShadow.setAttribute('cy', String(lifelineStartY + lifelineH + 8 * scale));
  groundShadow.setAttribute('rx', String(totalW * 0.55));
  groundShadow.setAttribute('ry', String(6 * scale));
  groundShadow.setAttribute('fill', `url(#${gsId})`);
  innerG.appendChild(groundShadow);

  // ── Pillar 3: Ambient Occlusion ────────────────────────────────────
  const aoId = `seqDiag-ao-${entityId}`;
  if (!defs.querySelector(`#${aoId}`)) {
    const aoGrad = document.createElementNS(SVG_NS, 'radialGradient');
    aoGrad.setAttribute('id', aoId);
    aoGrad.setAttribute('cx', '70%'); aoGrad.setAttribute('cy', '75%'); aoGrad.setAttribute('r', '55%');
    const ao1 = document.createElementNS(SVG_NS, 'stop');
    ao1.setAttribute('offset', '0%'); ao1.setAttribute('stop-color', '#000000'); ao1.setAttribute('stop-opacity', '0.10');
    const ao2 = document.createElementNS(SVG_NS, 'stop');
    ao2.setAttribute('offset', '100%'); ao2.setAttribute('stop-color', '#000000'); ao2.setAttribute('stop-opacity', '0');
    aoGrad.appendChild(ao1); aoGrad.appendChild(ao2);
    defs.appendChild(aoGrad);
  }
  const ao = document.createElementNS(SVG_NS, 'rect');
  ao.setAttribute('x', String(startX - boxW / 2));
  ao.setAttribute('y', String(-boxH / 2));
  ao.setAttribute('width', String(totalW + boxW));
  ao.setAttribute('height', String(lifelineH + boxH));
  ao.setAttribute('fill', `url(#${aoId})`);
  ao.setAttribute('pointer-events', 'none');
  innerG.appendChild(ao);

  // ── Highlight glow ring ────────────────────────────────────────────
  if (entity.highlight) {
    const glowRect = document.createElementNS(SVG_NS, 'rect');
    glowRect.setAttribute('x', String(startX - boxW / 2 - 4));
    glowRect.setAttribute('y', String(-boxH / 2 - 4));
    glowRect.setAttribute('width', String(totalW + boxW + 8));
    glowRect.setAttribute('height', String(lifelineH + boxH + 8));
    glowRect.setAttribute('rx', '6');
    glowRect.setAttribute('fill', 'none');
    glowRect.setAttribute('stroke-width', String(STROKE.default));
    glowRect.setAttribute('stroke-dasharray', '4,4');
    applyGlowColors(glowRect, cc);
    innerG.appendChild(glowRect);
  }

  // ── Participant boxes + lifelines ──────────────────────────────────
  for (let i = 0; i < participants.length; i++) {
    const px = startX + i * participantSpacing;

    const rect = document.createElementNS(SVG_NS, 'rect');
    rect.setAttribute('x', String(px - boxW / 2));
    rect.setAttribute('y', String(-boxH / 2));
    rect.setAttribute('width', String(boxW));
    rect.setAttribute('height', String(boxH));
    rect.setAttribute('rx', '4');
    rect.setAttribute('ry', '4');
    rect.setAttribute('fill', cc.fill);
    rect.setAttribute('stroke', cc.stroke);
    rect.setAttribute('stroke-width', '2.5');
    innerG.appendChild(rect);

    const label = document.createElementNS(SVG_NS, 'text');
    label.setAttribute('x', String(px));
    label.setAttribute('y', String(3 * scale));
    label.setAttribute('text-anchor', 'middle');
    label.setAttribute('fill', cc.textPrimary);
    label.setAttribute('font-size', String(Math.round(12 * scale)));
    label.setAttribute('font-weight', String(TYPOGRAPHY.fontWeightEmphasis));
    label.setAttribute('font-family', TYPOGRAPHY.fontLabel);
    label.textContent = participants[i].name;
    innerG.appendChild(label);

    const lifeline = document.createElementNS(SVG_NS, 'line');
    lifeline.setAttribute('x1', String(px));
    lifeline.setAttribute('y1', String(lifelineStartY));
    lifeline.setAttribute('x2', String(px));
    lifeline.setAttribute('y2', String(lifelineStartY + lifelineH));
    lifeline.setAttribute('stroke', cc.strokeSoft);
    lifeline.setAttribute('stroke-width', String(STROKE.thin));
    lifeline.setAttribute('stroke-dasharray', '6,4');
    innerG.appendChild(lifeline);
  }

  // ── Message arrows ─────────────────────────────────────────────────
  for (let i = 0; i < messages.length; i++) {
    const msg = messages[i];
    const fromIdx = pIndex.get(msg.from);
    const toIdx = pIndex.get(msg.to);
    if (fromIdx == null || toIdx == null) continue;

    const fromX = startX + fromIdx * participantSpacing;
    const toX = startX + toIdx * participantSpacing;
    const y = messageStartY + i * messageSpacing;
    const msgType = msg.type ?? 'sync';

    const line = document.createElementNS(SVG_NS, 'line');
    line.setAttribute('x1', String(fromX));
    line.setAttribute('y1', String(y));
    line.setAttribute('x2', String(toX));
    line.setAttribute('y2', String(y));
    line.setAttribute('stroke', cc.stroke);
    line.setAttribute('stroke-width', String(STROKE.thin));
    if (msgType === 'async' || msgType === 'reply') {
      line.setAttribute('stroke-dasharray', '5,3');
    }
    line.setAttribute('opacity', '0.85');
    innerG.appendChild(line);

    const dir = toX > fromX ? 1 : -1;
    const headLen = 6 * scale;
    const arrowhead = document.createElementNS(SVG_NS, 'path');

    if (msgType === 'reply') {
      arrowhead.setAttribute('d', [
        `M ${toX - dir * headLen} ${y - headLen * 0.5}`,
        `L ${toX} ${y}`,
        `L ${toX - dir * headLen} ${y + headLen * 0.5}`,
      ].join(' '));
      arrowhead.setAttribute('fill', 'none');
      arrowhead.setAttribute('stroke', cc.stroke);
      arrowhead.setAttribute('stroke-width', String(STROKE.thin));
    } else {
      arrowhead.setAttribute('d', [
        `M ${toX} ${y}`,
        `L ${toX - dir * headLen} ${y - headLen * 0.5}`,
        `L ${toX - dir * headLen} ${y + headLen * 0.5}`,
        'Z',
      ].join(' '));
      arrowhead.setAttribute('fill', cc.stroke);
    }
    arrowhead.setAttribute('opacity', '0.85');
    innerG.appendChild(arrowhead);

    const midX = (fromX + toX) / 2;
    const labelEl = document.createElementNS(SVG_NS, 'text');
    labelEl.setAttribute('x', String(midX));
    labelEl.setAttribute('y', String(y - 6 * scale));
    labelEl.setAttribute('text-anchor', 'middle');
    labelEl.setAttribute('fill', cc.textPrimary);
    labelEl.setAttribute('font-size', String(Math.round(11 * scale)));
    labelEl.setAttribute('font-weight', String(TYPOGRAPHY.fontWeightLabel));
    labelEl.setAttribute('font-family', TYPOGRAPHY.fontLabel);
    labelEl.setAttribute('opacity', '0.9');
    labelEl.textContent = msg.label;
    innerG.appendChild(labelEl);
  }

  // ── Pillar 4: Specular Highlight ───────────────────────────────────
  const specId = `seqDiag-spec-${entityId}`;
  if (!defs.querySelector(`#${specId}`)) {
    const specGrad = document.createElementNS(SVG_NS, 'radialGradient');
    specGrad.setAttribute('id', specId);
    specGrad.setAttribute('cx', '35%'); specGrad.setAttribute('cy', '25%'); specGrad.setAttribute('r', '40%');
    const sp1 = document.createElementNS(SVG_NS, 'stop');
    sp1.setAttribute('offset', '0%'); sp1.setAttribute('stop-color', '#ffffff'); sp1.setAttribute('stop-opacity', '0.18');
    const sp2 = document.createElementNS(SVG_NS, 'stop');
    sp2.setAttribute('offset', '100%'); sp2.setAttribute('stop-color', '#ffffff'); sp2.setAttribute('stop-opacity', '0');
    specGrad.appendChild(sp1); specGrad.appendChild(sp2);
    defs.appendChild(specGrad);
  }
  const specular = document.createElementNS(SVG_NS, 'ellipse');
  specular.setAttribute('cx', String(startX));
  specular.setAttribute('cy', String(-boxH * 0.2));
  specular.setAttribute('rx', String(totalW * 0.35));
  specular.setAttribute('ry', String(lifelineH * 0.2));
  specular.setAttribute('fill', `url(#${specId})`);
  specular.setAttribute('pointer-events', 'none');
  innerG.appendChild(specular);

  // ── Pillar 5: Micro-Life Animations ────────────────────────────────
  const styleId = `seqDiag-style-${entityId}`;
  const svg = parentEl.ownerSVGElement ?? (parentEl as SVGSVGElement);
  if (!svg.querySelector(`#${styleId}`)) {
    const style = document.createElementNS(SVG_NS, 'style');
    style.setAttribute('id', styleId);
    style.textContent = `
      @keyframes seqDiagFloat_${entityId} {
        0%, 100% { transform: translateY(0); }
        50% { transform: translateY(-2px); }
      }
      @keyframes seqDiagPulse_${entityId} {
        0%, 100% { transform: scale(1); }
        50% { transform: scale(1.03); }
      }
      .seqDiag-float-${entityId} {
        animation: seqDiagFloat_${entityId} 3.5s ease-in-out infinite;
      }
      .seqDiag-pulse-${entityId} {
        animation: seqDiagPulse_${entityId} 2.8s ease-in-out infinite;
      }
    `;
    svg.insertBefore(style, svg.firstChild);
  }
  innerG.classList.add(`seqDiag-float-${entityId}`);

  // ── Entity label (below diagram) ───────────────────────────────────
  if (entity.label) {
    const labelY = lifelineStartY + lifelineH + 18 * scale;
    const text = document.createElementNS(SVG_NS, 'text');
    text.setAttribute('x', '0');
    text.setAttribute('y', String(labelY));
    text.setAttribute('text-anchor', 'middle');
    text.setAttribute('fill', cc.textPrimary);
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
