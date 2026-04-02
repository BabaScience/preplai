/**
 * @preplai/illustrations — Wave Component (Cinematic 5 Pillars)
 *
 * Parametric waveform (sine, square, sawtooth) as SVG path with glassmorphic depth.
 * Directional lighting, ground shadow, AO, specular, micro-life.
 * Handles different frequencies and amplitudes gracefully.
 *
 * Metadata: { frequency?, amplitude?, phase?, waveType?: 'sine'|'square'|'sawtooth' }
 */

import { SVG_NS, buildEntityGroup, applyEntranceAnimation, getSizeParam } from '../utils.js';
import {
  getStrokeWidth,
  getLabelFontSize,
  colorWithAlpha,
  OPACITY,
  TYPOGRAPHY,
  SHAPES,
  LABEL_DEFAULTS,
} from '../design-tokens.js';
import { resolveColorCascade } from '../color-cascade.js';
import { ensureDefs } from '../visual-utils.js';
import type { VisualEntity } from '@preplai/shared';

type WaveType = 'sine' | 'square' | 'sawtooth';

function sampleWave(t: number, waveType: WaveType): number {
  switch (waveType) {
    case 'square':
      return Math.sin(t * Math.PI * 2) >= 0 ? 1 : -1;
    case 'sawtooth':
      return 2 * (t - Math.floor(t)) - 1;
    case 'sine':
    default:
      return Math.sin(t * Math.PI * 2);
  }
}

export function renderWave(entity: VisualEntity, parentEl: SVGElement): SVGGElement {
  const { outerG, innerG } = buildEntityGroup(entity);

  const s = getSizeParam(entity);
  const scale = s / 50;
  const cc = resolveColorCascade(entity);
  const color = cc.base;
  const entityId = (entity.id ?? Math.random().toString(36).slice(2)).replace(/[^a-zA-Z0-9]/g, '').slice(0, 8);
  const meta = entity.metadata ?? {};

  const totalW = s * 2.4;
  const totalH = s * 1.2;
  const amp = (meta.amplitude as number) ?? totalH * 0.35;
  const freq = (meta.frequency as number) ?? 2;
  const phase = (meta.phase as number) ?? 0;
  const waveType = (meta.waveType as WaveType) ?? 'sine';

  const defs = ensureDefs(parentEl);

  // ── Pillar 1: Directional Lighting ────────────────────────────────────
  const haloId = `wave-halo-${entityId}`;
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
  halo.setAttribute('cx', String(-totalW * 0.06));
  halo.setAttribute('cy', String(-totalH * 0.06));
  halo.setAttribute('rx', String(totalW * 0.6));
  halo.setAttribute('ry', String(totalH * 0.65));
  halo.setAttribute('fill', `url(#${haloId})`);
  innerG.appendChild(halo);

  // ── Pillar 2: Ground Shadow ───────────────────────────────────────────
  const gsId = `wave-gshadow-${entityId}`;
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
  groundShadow.setAttribute('cy', String(totalH / 2 + 6));
  groundShadow.setAttribute('rx', String(totalW * 0.4));
  groundShadow.setAttribute('ry', String(4));
  groundShadow.setAttribute('fill', `url(#${gsId})`);
  innerG.appendChild(groundShadow);

  // ── Pillar 3: Ambient Occlusion ───────────────────────────────────────
  const aoId = `wave-ao-${entityId}`;
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

  // Background panel
  const bg = document.createElementNS(SVG_NS, 'rect');
  bg.setAttribute('x', String(-totalW / 2));
  bg.setAttribute('y', String(-totalH / 2));
  bg.setAttribute('width', String(totalW));
  bg.setAttribute('height', String(totalH));
  bg.setAttribute('rx', String(SHAPES.borderRadius));
  bg.setAttribute('fill', colorWithAlpha(color, OPACITY.fillLight));
  bg.setAttribute('stroke', cc.stroke);
  bg.setAttribute('stroke-width', '2.5');
  innerG.appendChild(bg);

  // AO overlay on panel
  const aoRect = document.createElementNS(SVG_NS, 'rect');
  aoRect.setAttribute('x', String(-totalW / 2));
  aoRect.setAttribute('y', String(-totalH / 2));
  aoRect.setAttribute('width', String(totalW));
  aoRect.setAttribute('height', String(totalH));
  aoRect.setAttribute('rx', String(SHAPES.borderRadius));
  aoRect.setAttribute('fill', `url(#${aoId})`);
  aoRect.setAttribute('pointer-events', 'none');
  innerG.appendChild(aoRect);

  // Center baseline
  const baseline = document.createElementNS(SVG_NS, 'line');
  baseline.setAttribute('x1', String(-totalW / 2));
  baseline.setAttribute('y1', '0');
  baseline.setAttribute('x2', String(totalW / 2));
  baseline.setAttribute('y2', '0');
  baseline.setAttribute('stroke', colorWithAlpha(color, OPACITY.strokeMuted));
  baseline.setAttribute('stroke-width', String(getStrokeWidth('minimal', scale)));
  baseline.setAttribute('stroke-dasharray', '4,3');
  innerG.appendChild(baseline);

  // Wave path
  const steps = 80;
  const dx = totalW / steps;
  const parts: string[] = [];
  for (let i = 0; i <= steps; i++) {
    const t = (i / steps) * freq + phase / (2 * Math.PI);
    const py = -amp * sampleWave(t, waveType);
    const px = -totalW / 2 + i * dx;
    parts.push(`${i === 0 ? 'M' : 'L'} ${px.toFixed(2)} ${py.toFixed(2)}`);
  }

  const wavePath = document.createElementNS(SVG_NS, 'path');
  wavePath.setAttribute('d', parts.join(' '));
  wavePath.setAttribute('fill', 'none');
  wavePath.setAttribute('stroke', color);
  wavePath.setAttribute('stroke-width', '2.5');
  wavePath.setAttribute('stroke-linecap', 'round');
  wavePath.setAttribute('stroke-linejoin', 'round');
  innerG.appendChild(wavePath);

  // ── Pillar 4: Specular Highlight ──────────────────────────────────────
  const specId = `wave-spec-${entityId}`;
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
  specular.setAttribute('x', String(-totalW / 2));
  specular.setAttribute('y', String(-totalH / 2));
  specular.setAttribute('width', String(totalW));
  specular.setAttribute('height', String(totalH));
  specular.setAttribute('rx', String(SHAPES.borderRadius));
  specular.setAttribute('fill', `url(#${specId})`);
  specular.setAttribute('pointer-events', 'none');
  innerG.appendChild(specular);

  // ── Pillar 5: Micro-Life ──────────────────────────────────────────────
  const styleId = `wave-style-${entityId}`;
  const svg = parentEl.ownerSVGElement ?? (parentEl as SVGSVGElement);
  if (!svg.querySelector(`#${styleId}`)) {
    const style = document.createElementNS(SVG_NS, 'style');
    style.setAttribute('id', styleId);
    style.textContent = `
      @keyframes waveFloat_${entityId} {
        0%, 100% { transform: translateY(0); }
        50% { transform: translateY(-2px); }
      }
      @keyframes waveBreathe_${entityId} {
        0%, 100% { transform: scale(1); }
        50% { transform: scale(1.02); }
      }
      .wave-float-${entityId} {
        animation: waveFloat_${entityId} 3.6s ease-in-out infinite;
      }
      .wave-breathe-${entityId} {
        animation: waveBreathe_${entityId} 2.8s ease-in-out infinite;
      }
    `;
    svg.insertBefore(style, svg.firstChild);
  }
  innerG.classList.add(`wave-float-${entityId}`);
  wavePath.classList.add(`wave-breathe-${entityId}`);

  if (entity.label) {
    const text = document.createElementNS(SVG_NS, 'text');
    text.setAttribute('x', '0');
    text.setAttribute('y', String(totalH / 2 + LABEL_DEFAULTS.offsetBelow));
    text.setAttribute('text-anchor', LABEL_DEFAULTS.textAnchor);
    text.setAttribute('fill', cc.textPrimary);
    text.setAttribute('font-size', String(getLabelFontSize('label', scale)));
    text.setAttribute('font-weight', String(TYPOGRAPHY.fontWeightLabel));
    text.setAttribute('font-family', TYPOGRAPHY.fontLabel);
    text.textContent = entity.label;
    innerG.appendChild(text);
  }

  applyEntranceAnimation(innerG, entity);
  parentEl.appendChild(outerG);
  return outerG;
}
