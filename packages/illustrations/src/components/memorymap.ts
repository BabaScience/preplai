/**
 * @preplai/illustrations — MemoryMap Component (Cinematic Depth)
 *
 * Virtual memory map: vertical segmented bar (text, data, BSS, heap, stack) with address labels.
 * Cinematic lighting, ground shadow, ambient occlusion, specular, micro-life.
 *
 * Metadata: { segments: Array<{name, startAddr, endAddr, color?}>, pointerPosition?: string }
 */

import { SVG_NS, buildEntityGroup, applyEntranceAnimation, getSizeParam } from '../utils.js';
import { TYPOGRAPHY, SHAPES, LABEL_DEFAULTS } from '../design-tokens.js';
import { resolveColorCascade, resolveColorCascadeFromHex } from '../color-cascade.js';
import { ensureDefs } from '../visual-utils.js';
import type { VisualEntity } from '@preplai/shared';

type SegmentSpec = {
  name: string;
  startAddr: string;
  endAddr: string;
  color?: string;
  growDirection?: 'up' | 'down';
};

function parseSegments(meta: Record<string, unknown>): SegmentSpec[] {
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
    color: s?.color,
    growDirection: s?.growDirection,
  }));
}

export function renderMemoryMap(entity: VisualEntity, parentEl: SVGElement): SVGGElement {
  const { outerG, innerG } = buildEntityGroup(entity);
  const s = getSizeParam(entity);
  const scale = s / 50;
  const cc = resolveColorCascade(entity);
  const color = cc.base;
  const entityId = (entity.id ?? Math.random().toString(36).slice(2)).replace(/[^a-zA-Z0-9]/g, '').slice(0, 8);

  const meta = entity.metadata ?? {};
  const segments = parseSegments(meta);

  const barW = 50 * scale;
  const totalH = 120 * scale;
  const segCount = segments.length;
  const segH = totalH / segCount;
  const gap = 2;

  const labelFontSize = TYPOGRAPHY.fontSizeInline * scale;
  const addrFontSize = TYPOGRAPHY.fontSizeIndex * scale;

  const defs = ensureDefs(parentEl);

  // ── Pillar 1: Directional Lighting ──────────────────────────────────
  const haloId = `memmap-halo-${entityId}`;
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
  halo.setAttribute('cx', String(-barW * 0.1));
  halo.setAttribute('cy', '0');
  halo.setAttribute('rx', String(barW * 1.5));
  halo.setAttribute('ry', String(totalH * 0.55));
  halo.setAttribute('fill', `url(#${haloId})`);
  innerG.appendChild(halo);

  // ── Pillar 2: Ground Shadow ─────────────────────────────────────────
  const gsId = `memmap-gshadow-${entityId}`;
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
  groundShadow.setAttribute('cy', String(totalH / 2 + segH * 0.3));
  groundShadow.setAttribute('rx', String(barW * 0.6));
  groundShadow.setAttribute('ry', String(segH * 0.25));
  groundShadow.setAttribute('fill', `url(#${gsId})`);
  innerG.appendChild(groundShadow);

  // ── Pillar 3: Ambient Occlusion ─────────────────────────────────────
  const aoId = `memmap-ao-${entityId}`;
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

  // ── Segments ────────────────────────────────────────────────────────
  segments.forEach((seg, i) => {
    const _segColor = seg.color ?? color;
    const segCc = seg.color ? resolveColorCascadeFromHex(seg.color) : cc;
    const y = -totalH / 2 + i * segH + segH / 2;

    const rect = document.createElementNS(SVG_NS, 'rect');
    rect.setAttribute('x', String(-barW / 2));
    rect.setAttribute('y', String(y - segH / 2 + gap / 2));
    rect.setAttribute('width', String(barW));
    rect.setAttribute('height', String(segH - gap));
    rect.setAttribute('rx', String(SHAPES.borderRadius - 2));
    rect.setAttribute('fill', segCc.fill);
    rect.setAttribute('stroke', segCc.stroke);
    rect.setAttribute('stroke-width', '2.5');
    innerG.appendChild(rect);

    // AO overlay
    const aoRect = document.createElementNS(SVG_NS, 'rect');
    aoRect.setAttribute('x', String(-barW / 2));
    aoRect.setAttribute('y', String(y - segH / 2 + gap / 2));
    aoRect.setAttribute('width', String(barW));
    aoRect.setAttribute('height', String(segH - gap));
    aoRect.setAttribute('rx', String(SHAPES.borderRadius - 2));
    aoRect.setAttribute('fill', `url(#${aoId})`);
    aoRect.setAttribute('pointer-events', 'none');
    innerG.appendChild(aoRect);

    const nameText = document.createElementNS(SVG_NS, 'text');
    nameText.setAttribute('x', String(-barW / 2 - 4));
    nameText.setAttribute('y', String(y + 4));
    nameText.setAttribute('text-anchor', 'end');
    nameText.setAttribute('fill', segCc.textPrimary);
    nameText.setAttribute('font-size', String(labelFontSize));
    nameText.setAttribute('font-weight', '600');
    nameText.setAttribute('font-family', TYPOGRAPHY.fontBadge);
    nameText.textContent = seg.name;
    innerG.appendChild(nameText);

    const addrText = document.createElementNS(SVG_NS, 'text');
    addrText.setAttribute('x', String(barW / 2 + 4));
    addrText.setAttribute('y', String(y + 4));
    addrText.setAttribute('text-anchor', 'start');
    addrText.setAttribute('fill', segCc.textSecondary);
    addrText.setAttribute('font-size', String(addrFontSize));
    addrText.setAttribute('font-family', TYPOGRAPHY.fontBadge);
    addrText.textContent = `${seg.startAddr}\u2013${seg.endAddr}`;
    innerG.appendChild(addrText);
  });

  // ── Pillar 4: Specular Highlight ────────────────────────────────────
  const specId = `memmap-spec-${entityId}`;
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
  specular.setAttribute('x', String(-barW / 2));
  specular.setAttribute('y', String(-totalH / 2));
  specular.setAttribute('width', String(barW));
  specular.setAttribute('height', String(totalH));
  specular.setAttribute('fill', `url(#${specId})`);
  specular.setAttribute('pointer-events', 'none');
  innerG.appendChild(specular);

  // ── Pillar 5: Micro-Life Animation ──────────────────────────────────
  const styleId = `memmap-style-${entityId}`;
  const svg = parentEl.ownerSVGElement ?? (parentEl as SVGSVGElement);
  if (!svg.querySelector(`#${styleId}`)) {
    const style = document.createElementNS(SVG_NS, 'style');
    style.setAttribute('id', styleId);
    style.textContent = `
      @keyframes memmapFloat_${entityId} {
        0%, 100% { transform: translateY(0); }
        50% { transform: translateY(-2px); }
      }
      .memmap-float-${entityId} {
        animation: memmapFloat_${entityId} 3.5s ease-in-out infinite;
      }
    `;
    svg.insertBefore(style, svg.firstChild);
  }
  innerG.classList.add(`memmap-float-${entityId}`);

  // ── Label below ─────────────────────────────────────────────────────
  if (entity.label) {
    const labelEl = document.createElementNS(SVG_NS, 'text');
    labelEl.setAttribute('x', '0');
    labelEl.setAttribute('y', String(totalH / 2 + LABEL_DEFAULTS.offsetBelow));
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
