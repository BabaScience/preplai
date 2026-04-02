/**
 * @preplai/illustrations — UserJourneyStep Component (Cinematic Depth)
 *
 * Horizontal journey track with sentiment-face markers at each step.
 * 5 Cinematic Pillars: directional lighting, ground shadow,
 * ambient occlusion, specular highlight, micro-life animations.
 */

import { SVG_NS, buildEntityGroup, applyEntranceAnimation, getSizeParam } from '../utils.js';
import { TYPOGRAPHY, STROKE, COLORS } from '../design-tokens.js';
import { resolveColorCascade } from '../color-cascade.js';
import { ensureDefs } from '../visual-utils.js';
import type { VisualEntity } from '@preplai/shared';

interface JourneyStep {
  step: string;
  sentiment: number; // 1-5
}

interface JourneyMetadata {
  steps?: JourneyStep[];
}

function getSentimentColor(sentiment: number): string {
  if (sentiment <= 2) return COLORS.red;
  if (sentiment === 3) return COLORS.orange;
  return COLORS.green;
}

function drawSentimentFace(
  parent: SVGGElement,
  cx: number,
  cy: number,
  r: number,
  sentiment: number,
  faceColor: string,
): void {
  const eyeR = r * 0.12;
  const eyeY = cy - r * 0.15;
  const eyeSpacing = r * 0.3;

  for (const sign of [-1, 1]) {
    const eye = document.createElementNS(SVG_NS, 'circle');
    eye.setAttribute('cx', String(cx + sign * eyeSpacing));
    eye.setAttribute('cy', String(eyeY));
    eye.setAttribute('r', String(eyeR));
    eye.setAttribute('fill', faceColor);
    eye.setAttribute('opacity', '0.9');
    parent.appendChild(eye);
  }

  const mouthY = cy + r * 0.2;
  const mouthW = r * 0.35;
  let mouthD: string;

  if (sentiment <= 2) {
    const arcH = r * 0.2;
    mouthD = `M ${cx - mouthW} ${mouthY + arcH} Q ${cx} ${mouthY - arcH} ${cx + mouthW} ${mouthY + arcH}`;
  } else if (sentiment === 3) {
    mouthD = `M ${cx - mouthW} ${mouthY} L ${cx + mouthW} ${mouthY}`;
  } else {
    const arcH = r * 0.2;
    mouthD = `M ${cx - mouthW} ${mouthY} Q ${cx} ${mouthY + arcH} ${cx + mouthW} ${mouthY}`;
  }

  const mouth = document.createElementNS(SVG_NS, 'path');
  mouth.setAttribute('d', mouthD);
  mouth.setAttribute('fill', 'none');
  mouth.setAttribute('stroke', faceColor);
  mouth.setAttribute('stroke-width', String(STROKE.thin));
  mouth.setAttribute('stroke-linecap', 'round');
  parent.appendChild(mouth);
}

export function renderUserJourneyStep(entity: VisualEntity, parentEl: SVGElement): SVGGElement {
  const { outerG, innerG } = buildEntityGroup(entity);
  const size = getSizeParam(entity);
  const cc = resolveColorCascade(entity);
  const color = cc.base;
  const entityId = (entity.id ?? Math.random().toString(36).slice(2)).replace(/[^a-zA-Z0-9]/g, '').slice(0, 8);

  const meta = (entity.metadata ?? {}) as JourneyMetadata;
  const steps = (meta.steps ?? []).slice(0, 7);
  const stepCount = steps.length;
  if (stepCount === 0) {
    applyEntranceAnimation(innerG, entity);
    parentEl.appendChild(outerG);
    return outerG;
  }

  const trackW = size * 2.8;
  const trackH = size * 0.08;
  const markerR = size * 0.16;
  const halfW = trackW / 2;

  const defs = ensureDefs(parentEl);

  // ── Pillar 1: Directional Lighting ─────────────────────────────────
  const haloId = `ujStep-halo-${entityId}`;
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
  halo.setAttribute('cx', String(-halfW * 0.1));
  halo.setAttribute('cy', '0');
  halo.setAttribute('rx', String(halfW * 0.9));
  halo.setAttribute('ry', String(markerR * 3));
  halo.setAttribute('fill', `url(#${haloId})`);
  innerG.appendChild(halo);

  // ── Pillar 2: Ground Shadow ────────────────────────────────────────
  const gsId = `ujStep-gshadow-${entityId}`;
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
  groundShadow.setAttribute('cy', String(markerR + 20));
  groundShadow.setAttribute('rx', String(halfW * 0.5));
  groundShadow.setAttribute('ry', String(4));
  groundShadow.setAttribute('fill', `url(#${gsId})`);
  innerG.appendChild(groundShadow);

  // ── Pillar 3: Ambient Occlusion ────────────────────────────────────
  const aoId = `ujStep-ao-${entityId}`;
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
  aoRect.setAttribute('x', String(-halfW));
  aoRect.setAttribute('y', String(-markerR * 1.5));
  aoRect.setAttribute('width', String(trackW));
  aoRect.setAttribute('height', String(markerR * 3));
  aoRect.setAttribute('fill', `url(#${aoId})`);
  aoRect.setAttribute('pointer-events', 'none');
  innerG.appendChild(aoRect);

  // ── Horizontal track ───────────────────────────────────────────────
  const track = document.createElementNS(SVG_NS, 'rect');
  track.setAttribute('x', String(-halfW));
  track.setAttribute('y', String(-trackH / 2));
  track.setAttribute('width', String(trackW));
  track.setAttribute('height', String(trackH));
  track.setAttribute('rx', String(trackH / 2));
  track.setAttribute('ry', String(trackH / 2));
  track.setAttribute('fill', cc.fillMedium);
  innerG.appendChild(track);

  // ── Step markers along the track ───────────────────────────────────
  for (let i = 0; i < stepCount; i++) {
    const t = stepCount === 1 ? 0.5 : i / (stepCount - 1);
    const mx = -halfW + t * trackW;
    const my = 0;
    const step = steps[i];
    const sentimentColor = getSentimentColor(step.sentiment);

    if (i < stepCount - 1) {
      const nextT = (i + 1) / (stepCount - 1);
      const nextX = -halfW + nextT * trackW;
      const seg = document.createElementNS(SVG_NS, 'line');
      seg.setAttribute('x1', String(mx));
      seg.setAttribute('y1', '0');
      seg.setAttribute('x2', String(nextX));
      seg.setAttribute('y2', '0');
      seg.setAttribute('stroke', cc.strokeSoft);
      seg.setAttribute('stroke-width', String(STROKE.thin));
      innerG.appendChild(seg);
    }

    const circle = document.createElementNS(SVG_NS, 'circle');
    circle.setAttribute('cx', String(mx));
    circle.setAttribute('cy', String(my));
    circle.setAttribute('r', String(markerR));
    circle.setAttribute('fill', `${sentimentColor}40`);
    circle.setAttribute('stroke', sentimentColor);
    circle.setAttribute('stroke-width', '2.5');
    innerG.appendChild(circle);

    drawSentimentFace(innerG, mx, my, markerR, step.sentiment, sentimentColor);

    const label = document.createElementNS(SVG_NS, 'text');
    label.setAttribute('x', String(mx));
    label.setAttribute('y', String(my + markerR + 14));
    label.setAttribute('text-anchor', 'middle');
    label.setAttribute('fill', cc.textPrimary);
    label.setAttribute('font-size', String(TYPOGRAPHY.fontSizeInline));
    label.setAttribute('font-weight', String(TYPOGRAPHY.fontWeightLabel));
    label.setAttribute('font-family', TYPOGRAPHY.fontLabel);
    label.setAttribute('opacity', '0.8');
    label.textContent = step.step.length > 12
      ? step.step.slice(0, 11) + '\u2026'
      : step.step;
    innerG.appendChild(label);
  }

  // ── Pillar 4: Specular Highlight ───────────────────────────────────
  const specId = `ujStep-spec-${entityId}`;
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
  specular.setAttribute('cx', String(-halfW * 0.3));
  specular.setAttribute('cy', String(-markerR * 0.5));
  specular.setAttribute('rx', String(halfW * 0.4));
  specular.setAttribute('ry', String(markerR * 0.6));
  specular.setAttribute('fill', `url(#${specId})`);
  specular.setAttribute('pointer-events', 'none');
  innerG.appendChild(specular);

  // ── Pillar 5: Micro-Life Animations ────────────────────────────────
  const styleId = `ujStep-style-${entityId}`;
  const svg = parentEl.ownerSVGElement ?? (parentEl as SVGSVGElement);
  if (!svg.querySelector(`#${styleId}`)) {
    const styleEl = document.createElementNS(SVG_NS, 'style');
    styleEl.setAttribute('id', styleId);
    styleEl.textContent = `
      @keyframes ujStepFloat_${entityId} {
        0%, 100% { transform: translateY(0); }
        50% { transform: translateY(-2px); }
      }
      @keyframes ujStepPulse_${entityId} {
        0%, 100% { transform: scale(1); }
        50% { transform: scale(1.02); }
      }
      .ujStep-float-${entityId} {
        animation: ujStepFloat_${entityId} 3.5s ease-in-out infinite;
      }
      .ujStep-pulse-${entityId} {
        animation: ujStepPulse_${entityId} 2.8s ease-in-out infinite;
      }
    `;
    svg.insertBefore(styleEl, svg.firstChild);
  }
  innerG.classList.add(`ujStep-float-${entityId}`);

  // ── Entity label below ─────────────────────────────────────────────
  if (entity.label) {
    const labelY = markerR + 34;
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
