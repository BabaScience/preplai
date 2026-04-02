/**
 * @preplai/illustrations — Timeline Component (Cinematic Depth)
 *
 * Horizontal line + markers. Use for: event sequences, process steps, time flow.
 * 5 Cinematic Pillars: directional lighting, ground shadow, ambient occlusion,
 * specular highlight, micro-life (float + breathe).
 *
 * Metadata: { events?: [{ label: string, position?: number }] } -- position 0-1 along line
 */

import { SVG_NS, buildEntityGroup, applyEntranceAnimation, getSizeParam } from '../utils.js';
import { getCategoryColor, getLabelFontSize, TYPOGRAPHY } from '../design-tokens.js';import { resolveColorCascade } from '../color-cascade.js';
import { ensureDefs } from '../visual-utils.js';
import { timelineLayout } from '../layouts/index.js';
import type { VisualEntity } from '@preplai/shared';

interface TimelineEvent {
  label: string;
  position?: number;
}

function parseEvents(meta: Record<string, unknown>): TimelineEvent[] {
  const raw = meta.events as TimelineEvent[] | undefined;
  if (!Array.isArray(raw) || raw.length === 0) return [];
  return raw.slice(0, 8).map((e) => ({
    label: String(e?.label ?? ''),
    position: typeof e?.position === 'number' ? Math.max(0, Math.min(1, e.position)) : undefined,
  })).filter((e) => e.label || e.position !== undefined);
}

export function renderTimeline(entity: VisualEntity, parentEl: SVGElement): SVGGElement {
  const { outerG, innerG } = buildEntityGroup(entity);
  const cc = resolveColorCascade(entity);

  const s = getSizeParam(entity);
  const scale = s / 50;
  const color = entity.color ?? getCategoryColor('Timeline');
  const entityId = (entity.id ?? Math.random().toString(36).slice(2)).replace(/[^a-zA-Z0-9]/g, '').slice(0, 8);

  const lineLen = s * 1.6;
  const d = s / 6;
  const halfLen = lineLen / 2;

  const defs = ensureDefs(parentEl);

  // ── Pillar 1: Directional Lighting ────────────────────────────────────
  const haloId = `timeline-halo-${entityId}`;
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
  halo.setAttribute('rx', String(halfLen * 1.2));
  halo.setAttribute('ry', String(d * 3));
  halo.setAttribute('fill', `url(#${haloId})`);
  innerG.appendChild(halo);

  // ── Pillar 2: Ground Shadow ───────────────────────────────────────────
  const gsId = `timeline-gshadow-${entityId}`;
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
  groundShadow.setAttribute('cy', String(d + 20));
  groundShadow.setAttribute('rx', String(halfLen * 0.8));
  groundShadow.setAttribute('ry', String(d * 0.3));
  groundShadow.setAttribute('fill', `url(#${gsId})`);
  innerG.appendChild(groundShadow);

  // ── Pillar 3: Ambient Occlusion ───────────────────────────────────────
  const aoId = `timeline-ao-${entityId}`;
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
  const aoRect = document.createElementNS(SVG_NS, 'rect');
  aoRect.setAttribute('x', String(-halfLen));
  aoRect.setAttribute('y', String(-d * 2));
  aoRect.setAttribute('width', String(lineLen));
  aoRect.setAttribute('height', String(d * 4));
  aoRect.setAttribute('fill', `url(#${aoId})`);
  aoRect.setAttribute('pointer-events', 'none');
  innerG.appendChild(aoRect);

  // ── Pillar 4: Specular Highlight ──────────────────────────────────────
  const specId = `timeline-spec-${entityId}`;
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

  // Main timeline line
  const line = document.createElementNS(SVG_NS, 'line');
  line.setAttribute('x1', String(-halfLen));
  line.setAttribute('y1', String(0));
  line.setAttribute('x2', String(halfLen));
  line.setAttribute('y2', String(0));
  line.setAttribute('stroke', color);
  line.setAttribute('stroke-width', '2.5');
  innerG.appendChild(line);

  const meta = entity.metadata ?? {};
  const events = parseEvents(meta);

  if (events.length > 0) {
    const fontSize = getLabelFontSize('index', scale);
    events.forEach((ev, i) => {
      const pos = ev.position ?? (events.length === 1 ? 0.5 : (i + 1) / (events.length + 1));
      const x = -halfLen + pos * lineLen;
      const diamond = document.createElementNS(SVG_NS, 'polygon');
      diamond.setAttribute('points', `${x},${-d} ${x + d},0 ${x},${d} ${x - d},0`);
      diamond.setAttribute('fill', `${color}40`);
      diamond.setAttribute('stroke', color);
      diamond.setAttribute('stroke-width', '2.5');
      innerG.appendChild(diamond);
      if (ev.label) {
        const text = document.createElementNS(SVG_NS, 'text');
        text.setAttribute('x', String(x));
        text.setAttribute('y', String(d + 14));
        text.setAttribute('text-anchor', 'middle');
        text.setAttribute('fill', cc.textPrimary);
        text.setAttribute('font-size', String(fontSize));
        text.setAttribute('font-weight', String(TYPOGRAPHY.fontWeightLabel));
        text.setAttribute('font-family', TYPOGRAPHY.fontLabel);
        text.textContent = ev.label.length > 10 ? ev.label.slice(0, 9) + '\u2026' : ev.label;
        innerG.appendChild(text);
      }
    });
  } else {
    const { markers } = timelineLayout(lineLen, d, true);
    if (markers && markers.length > 0) {
      const diamond = document.createElementNS(SVG_NS, 'polygon');
      const m = markers[0];
      diamond.setAttribute('points', `${m.x},${-m.d} ${m.x + m.d},0 ${m.x},${m.d} ${m.x - m.d},0`);
      diamond.setAttribute('fill', `${color}40`);
      diamond.setAttribute('stroke', color);
      diamond.setAttribute('stroke-width', '2.5');
      innerG.appendChild(diamond);
    }
    if (entity.label) {
      const text = document.createElementNS(SVG_NS, 'text');
      text.setAttribute('x', '0');
      text.setAttribute('y', String(d + 18));
      text.setAttribute('text-anchor', 'middle');
      text.setAttribute('fill', cc.textPrimary);
      text.setAttribute('font-size', String(TYPOGRAPHY.fontSizeLabel));
      text.setAttribute('font-weight', String(TYPOGRAPHY.fontWeightLabel));
      text.setAttribute('font-family', TYPOGRAPHY.fontLabel);
      text.textContent = entity.label;
      innerG.appendChild(text);
    }
  }

  // Specular overlay
  const specRect = document.createElementNS(SVG_NS, 'rect');
  specRect.setAttribute('x', String(-halfLen));
  specRect.setAttribute('y', String(-d * 2));
  specRect.setAttribute('width', String(lineLen));
  specRect.setAttribute('height', String(d * 4));
  specRect.setAttribute('fill', `url(#${specId})`);
  specRect.setAttribute('pointer-events', 'none');
  innerG.appendChild(specRect);

  if (entity.label && events.length > 0) {
    const totalLabelH = d + 28;
    const text = document.createElementNS(SVG_NS, 'text');
    text.setAttribute('x', '0');
    text.setAttribute('y', String(totalLabelH));
    text.setAttribute('text-anchor', 'middle');
    text.setAttribute('fill', cc.textPrimary);
    text.setAttribute('font-size', String(getLabelFontSize('label', scale)));
    text.setAttribute('font-weight', String(TYPOGRAPHY.fontWeightLabel));
    text.setAttribute('font-family', TYPOGRAPHY.fontLabel);
    text.textContent = entity.label;
    innerG.appendChild(text);
  }

  // ── Pillar 5: Micro-Life ──────────────────────────────────────────────
  const styleId = `timeline-style-${entityId}`;
  const svg = parentEl.ownerSVGElement ?? (parentEl as SVGSVGElement);
  if (!svg.querySelector(`#${styleId}`)) {
    const style = document.createElementNS(SVG_NS, 'style');
    style.setAttribute('id', styleId);
    style.textContent = `
      @keyframes timelineFloat_${entityId} {
        0%, 100% { transform: translateY(0); }
        50% { transform: translateY(-2px); }
      }
      @keyframes timelineBreathe_${entityId} {
        0%, 100% { transform: scale(1); }
        50% { transform: scale(1.01); }
      }
      .timeline-float-${entityId} {
        animation: timelineFloat_${entityId} 3.5s ease-in-out infinite;
      }
      .timeline-breathe-${entityId} {
        animation: timelineBreathe_${entityId} 3s ease-in-out infinite;
      }
    `;
    svg.insertBefore(style, svg.firstChild);
  }
  innerG.classList.add(`timeline-float-${entityId}`);

  applyEntranceAnimation(innerG, entity);
  parentEl.appendChild(outerG);
  return outerG;
}
