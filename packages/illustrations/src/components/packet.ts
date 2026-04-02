/**
 * @preplai/illustrations — Packet Component (Cinematic Depth)
 *
 * Horizontal bar divided into header sections and payload.
 * Data-driven but with cinematic lighting treatment.
 * Use for: network packets, protocol frames, data segments.
 *
 * 5 Cinematic Pillars: directional lighting, ground shadow,
 * ambient occlusion, specular highlight, micro-life animation.
 *
 * Metadata:
 *   headers: Array<{name: string, value: string, bytes?: number}>
 *   payload: string
 *   protocol: string
 */

import { SVG_NS, buildEntityGroup, applyEntranceAnimation, getSizeParam } from '../utils.js';
import { TYPOGRAPHY, STROKE, LABEL_DEFAULTS } from '../design-tokens.js';
import { resolveColorCascade, applyGlowColors } from '../color-cascade.js';
import { ensureDefs } from '../visual-utils.js';
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
  const cc = resolveColorCascade(entity);
  const color = cc.base;
  const entityId = (entity.id ?? Math.random().toString(36).slice(2)).replace(/[^a-zA-Z0-9]/g, '').slice(0, 8);

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

  const cellFontSize = TYPOGRAPHY.fontSizeValue * scale;
  const labelFontSize = TYPOGRAPHY.fontSizeInline * scale;

  const defs = ensureDefs(parentEl);

  // ── Pillar 1: Directional Lighting ──────────────────────────────────
  const haloId = `packet-halo-${entityId}`;
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
  halo.setAttribute('cy', '0');
  halo.setAttribute('rx', String(totalW * 0.55));
  halo.setAttribute('ry', String(barH * 1.2));
  halo.setAttribute('fill', `url(#${haloId})`);
  innerG.appendChild(halo);

  // ── Pillar 2: Ground Shadow ─────────────────────────────────────────
  const gsId = `packet-gshadow-${entityId}`;
  if (!defs.querySelector(`#${gsId}`)) {
    const gsg = document.createElementNS(SVG_NS, 'radialGradient');
    gsg.setAttribute('id', gsId);
    gsg.setAttribute('cx', '50%'); gsg.setAttribute('cy', '50%'); gsg.setAttribute('r', '50%');
    const g1 = document.createElementNS(SVG_NS, 'stop');
    g1.setAttribute('offset', '0%'); g1.setAttribute('stop-color', '#000000'); g1.setAttribute('stop-opacity', '0.18');
    const g2 = document.createElementNS(SVG_NS, 'stop');
    g2.setAttribute('offset', '100%'); g2.setAttribute('stop-color', '#000000'); g2.setAttribute('stop-opacity', '0');
    gsg.appendChild(g1); gsg.appendChild(g2);
    defs.appendChild(gsg);
  }
  const groundShadow = document.createElementNS(SVG_NS, 'ellipse');
  groundShadow.setAttribute('cx', '0');
  groundShadow.setAttribute('cy', String(barH / 2 + barH * 0.15));
  groundShadow.setAttribute('rx', String(totalW * 0.45));
  groundShadow.setAttribute('ry', String(barH * 0.15));
  groundShadow.setAttribute('fill', `url(#${gsId})`);
  innerG.appendChild(groundShadow);

  // ── Pillar 3: Ambient Occlusion ─────────────────────────────────────
  const aoId = `packet-ao-${entityId}`;
  if (!defs.querySelector(`#${aoId}`)) {
    const aoGrad = document.createElementNS(SVG_NS, 'radialGradient');
    aoGrad.setAttribute('id', aoId);
    aoGrad.setAttribute('cx', '70%'); aoGrad.setAttribute('cy', '75%'); aoGrad.setAttribute('r', '55%');
    const a1 = document.createElementNS(SVG_NS, 'stop');
    a1.setAttribute('offset', '0%'); a1.setAttribute('stop-color', '#000000'); a1.setAttribute('stop-opacity', '0.10');
    const a2 = document.createElementNS(SVG_NS, 'stop');
    a2.setAttribute('offset', '100%'); a2.setAttribute('stop-color', '#000000'); a2.setAttribute('stop-opacity', '0');
    aoGrad.appendChild(a1); aoGrad.appendChild(a2);
    defs.appendChild(aoGrad);
  }

  // ── Highlight glow ──────────────────────────────────────────────────
  if (entity.highlight) {
    const glow = document.createElementNS(SVG_NS, 'rect');
    glow.setAttribute('x', String(startX - 3));
    glow.setAttribute('y', String(-barH / 2 - 3));
    glow.setAttribute('width', String(totalW + 6));
    glow.setAttribute('height', String(barH + 6));
    glow.setAttribute('rx', '5');
    glow.setAttribute('fill', 'none');
    glow.setAttribute('stroke-width', String(STROKE.default));
    glow.setAttribute('stroke-dasharray', '4,4');
    applyGlowColors(glow, cc);
    innerG.appendChild(glow);
  }

  // ── Header sections ─────────────────────────────────────────────────
  headers.forEach((h) => {
    const bytes = h.bytes ?? 4;
    const sectionW = Math.max((bytes / totalBytes) * headerW, 26 * scale);

    const rect = document.createElementNS(SVG_NS, 'rect');
    rect.setAttribute('x', String(offsetX));
    rect.setAttribute('y', String(-barH / 2));
    rect.setAttribute('width', String(sectionW));
    rect.setAttribute('height', String(barH));
    rect.setAttribute('rx', '3');
    rect.setAttribute('fill', cc.fill);
    rect.setAttribute('stroke', cc.strokeMuted);
    rect.setAttribute('stroke-width', '2.5');
    innerG.appendChild(rect);

    // AO overlay
    const aoRect = document.createElementNS(SVG_NS, 'rect');
    aoRect.setAttribute('x', String(offsetX));
    aoRect.setAttribute('y', String(-barH / 2));
    aoRect.setAttribute('width', String(sectionW));
    aoRect.setAttribute('height', String(barH));
    aoRect.setAttribute('rx', '3');
    aoRect.setAttribute('fill', `url(#${aoId})`);
    aoRect.setAttribute('pointer-events', 'none');
    innerG.appendChild(aoRect);

    const nameText = document.createElementNS(SVG_NS, 'text');
    nameText.setAttribute('x', String(offsetX + sectionW / 2));
    nameText.setAttribute('y', String(-barH / 2 + padding + 2));
    nameText.setAttribute('text-anchor', 'middle');
    nameText.setAttribute('fill', cc.textSecondary);
    nameText.setAttribute('font-size', String(labelFontSize * 0.8));
    nameText.setAttribute('font-family', TYPOGRAPHY.fontLabel);
    nameText.textContent = h.name;
    innerG.appendChild(nameText);

    const valText = document.createElementNS(SVG_NS, 'text');
    valText.setAttribute('x', String(offsetX + sectionW / 2));
    valText.setAttribute('y', String(barH / 2 - padding));
    valText.setAttribute('text-anchor', 'middle');
    valText.setAttribute('fill', cc.textPrimary);
    valText.setAttribute('font-size', String(cellFontSize * 0.85));
    valText.setAttribute('font-weight', String(TYPOGRAPHY.fontWeightLabel));
    valText.setAttribute('font-family', TYPOGRAPHY.fontBadge);
    valText.textContent = h.value.length > 10 ? h.value.slice(0, 8) + '\u2026' : h.value;
    innerG.appendChild(valText);

    offsetX += sectionW + sectionGap;
  });

  // ── Payload section ─────────────────────────────────────────────────
  const payloadW = startX + totalW - offsetX;
  const payloadRect = document.createElementNS(SVG_NS, 'rect');
  payloadRect.setAttribute('x', String(offsetX));
  payloadRect.setAttribute('y', String(-barH / 2));
  payloadRect.setAttribute('width', String(payloadW));
  payloadRect.setAttribute('height', String(barH));
  payloadRect.setAttribute('rx', '3');
  payloadRect.setAttribute('fill', cc.fill);
  payloadRect.setAttribute('stroke', cc.strokeMuted);
  payloadRect.setAttribute('stroke-width', '2.5');
  innerG.appendChild(payloadRect);

  // AO on payload
  const aoPayload = document.createElementNS(SVG_NS, 'rect');
  aoPayload.setAttribute('x', String(offsetX));
  aoPayload.setAttribute('y', String(-barH / 2));
  aoPayload.setAttribute('width', String(payloadW));
  aoPayload.setAttribute('height', String(barH));
  aoPayload.setAttribute('rx', '3');
  aoPayload.setAttribute('fill', `url(#${aoId})`);
  aoPayload.setAttribute('pointer-events', 'none');
  innerG.appendChild(aoPayload);

  const payloadVal = document.createElementNS(SVG_NS, 'text');
  payloadVal.setAttribute('x', String(offsetX + payloadW / 2));
  payloadVal.setAttribute('y', String(3));
  payloadVal.setAttribute('text-anchor', 'middle');
  payloadVal.setAttribute('fill', cc.textPrimary);
  payloadVal.setAttribute('font-size', String(cellFontSize * 0.8));
  payloadVal.setAttribute('font-family', TYPOGRAPHY.fontBadge);
  payloadVal.textContent = payload;
  innerG.appendChild(payloadVal);

  // ── Pillar 4: Specular Highlight ────────────────────────────────────
  const specId = `packet-spec-${entityId}`;
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
  const specular = document.createElementNS(SVG_NS, 'rect');
  specular.setAttribute('x', String(startX));
  specular.setAttribute('y', String(-barH / 2));
  specular.setAttribute('width', String(totalW));
  specular.setAttribute('height', String(barH));
  specular.setAttribute('rx', '3');
  specular.setAttribute('fill', `url(#${specId})`);
  specular.setAttribute('pointer-events', 'none');
  innerG.appendChild(specular);

  // ── Pillar 5: Micro-Life Animation ──────────────────────────────────
  const styleId = `packet-style-${entityId}`;
  const svg = parentEl.ownerSVGElement ?? (parentEl as SVGSVGElement);
  if (!svg.querySelector(`#${styleId}`)) {
    const style = document.createElementNS(SVG_NS, 'style');
    style.setAttribute('id', styleId);
    style.textContent = `
      @keyframes packetFloat_${entityId} {
        0%, 100% { transform: translateY(0); }
        50% { transform: translateY(-2px); }
      }
      @keyframes packetPulse_${entityId} {
        0%, 100% { transform: scale(1); }
        50% { transform: scale(1.02); }
      }
      .packet-float-${entityId} {
        animation: packetFloat_${entityId} 3.5s ease-in-out infinite;
      }
      .packet-pulse-${entityId} {
        animation: packetPulse_${entityId} 2.8s ease-in-out infinite;
      }
    `;
    svg.insertBefore(style, svg.firstChild);
  }
  innerG.classList.add(`packet-float-${entityId}`);

  // ── Label below ─────────────────────────────────────────────────────
  if (entity.label) {
    const labelEl = document.createElementNS(SVG_NS, 'text');
    labelEl.setAttribute('x', '0');
    labelEl.setAttribute('y', String(barH / 2 + LABEL_DEFAULTS.offsetBelow));
    labelEl.setAttribute('text-anchor', LABEL_DEFAULTS.textAnchor);
    labelEl.setAttribute('fill', cc.textPrimary);
    labelEl.setAttribute('font-size', String(TYPOGRAPHY.fontSizeLabel * scale));
    labelEl.setAttribute('font-weight', String(TYPOGRAPHY.fontWeightTitle));
    labelEl.setAttribute('font-family', TYPOGRAPHY.fontLabel);
    labelEl.textContent = entity.label;
    innerG.appendChild(labelEl);
  }

  applyEntranceAnimation(innerG, entity);
  parentEl.appendChild(outerG);
  return outerG;
}
