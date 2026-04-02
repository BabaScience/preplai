/**
 * @preplai/illustrations — PipelineStage Component (Cinematic 5 Pillars)
 *
 * Single CI/CD pipeline stage: chevron shape with label and optional status.
 * Glassmorphic depth: directional lighting, ground shadow, AO, specular, micro-life.
 *
 * Metadata:
 *   label?: string — stage name (e.g. Build, Test, Deploy)
 *   status?: 'pending' | 'running' | 'success' | 'failed' — visual state
 */

import { SVG_NS, buildEntityGroup, applyEntranceAnimation, getSizeParam } from '../utils.js';
import {
  getStrokeWidth,
  getLabelFontSize,
  colorWithAlpha,
  OPACITY,
  TYPOGRAPHY,
} from '../design-tokens.js';
import { resolveColorCascade } from '../color-cascade.js';
import { ensureDefs } from '../visual-utils.js';
import type { VisualEntity } from '@preplai/shared';

type Status = 'pending' | 'running' | 'success' | 'failed';

export function renderPipelineStage(entity: VisualEntity, parentEl: SVGElement): SVGGElement {
  const { outerG, innerG } = buildEntityGroup(entity);

  const s = getSizeParam(entity);
  const scale = s / 50;
  const cc = resolveColorCascade(entity);
  const color = cc.base;
  const entityId = (entity.id ?? Math.random().toString(36).slice(2)).replace(/[^a-zA-Z0-9]/g, '').slice(0, 8);

  const labelFontSize = getLabelFontSize('label', scale);
  const _strokeWidth = getStrokeWidth('default', scale);

  const meta = entity.metadata ?? {};
  const label = (meta.label as string) ?? entity.label ?? 'Stage';
  const status = (meta.status as Status) ?? 'pending';

  const segW = s * 0.9;
  const segH = s * 0.6;
  const cx = 0;
  const cy = 0;

  const defs = ensureDefs(parentEl);

  // ── Pillar 1: Directional Lighting ────────────────────────────────────
  const haloId = `ps-halo-${entityId}`;
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
  halo.setAttribute('cx', String(-segW * 0.06));
  halo.setAttribute('cy', String(-segH * 0.06));
  halo.setAttribute('rx', String(segW * 0.7));
  halo.setAttribute('ry', String(segH * 0.7));
  halo.setAttribute('fill', `url(#${haloId})`);
  innerG.appendChild(halo);

  // ── Pillar 2: Ground Shadow ───────────────────────────────────────────
  const gsId = `ps-gshadow-${entityId}`;
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
  groundShadow.setAttribute('cy', String(segH / 2 + 6));
  groundShadow.setAttribute('rx', String(segW * 0.4));
  groundShadow.setAttribute('ry', String(4));
  groundShadow.setAttribute('fill', `url(#${gsId})`);
  innerG.appendChild(groundShadow);

  // ── Pillar 3: Ambient Occlusion ───────────────────────────────────────
  const aoId = `ps-ao-${entityId}`;
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

  const chevronPath = [
    `M ${cx - segW / 2} ${cy}`,
    `L ${cx} ${cy - segH / 2}`,
    `L ${cx + segW / 2} ${cy}`,
    `L ${cx} ${cy + segH / 2}`,
    'Z',
  ].join(' ');

  // Chevron shape
  const seg = document.createElementNS(SVG_NS, 'path');
  seg.setAttribute('d', chevronPath);
  seg.setAttribute('fill', colorWithAlpha(color, OPACITY.fillLight));
  seg.setAttribute('stroke', cc.stroke);
  seg.setAttribute('stroke-width', '2.5');
  innerG.appendChild(seg);

  // AO overlay on chevron
  const aoPath = document.createElementNS(SVG_NS, 'path');
  aoPath.setAttribute('d', chevronPath);
  aoPath.setAttribute('fill', `url(#${aoId})`);
  aoPath.setAttribute('pointer-events', 'none');
  innerG.appendChild(aoPath);

  // ── Pillar 4: Specular Highlight ──────────────────────────────────────
  const specId = `ps-spec-${entityId}`;
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
  const specPath = document.createElementNS(SVG_NS, 'path');
  specPath.setAttribute('d', chevronPath);
  specPath.setAttribute('fill', `url(#${specId})`);
  specPath.setAttribute('pointer-events', 'none');
  innerG.appendChild(specPath);

  // Label text
  const labelText = document.createElementNS(SVG_NS, 'text');
  labelText.setAttribute('x', String(cx));
  labelText.setAttribute('y', String(cy + 4));
  labelText.setAttribute('text-anchor', 'middle');
  labelText.setAttribute('fill', cc.textPrimary);
  labelText.setAttribute('font-size', String(labelFontSize));
  labelText.setAttribute('font-weight', String(TYPOGRAPHY.fontWeightEmphasis));
  labelText.setAttribute('font-family', TYPOGRAPHY.fontLabel);
  labelText.textContent = label.length > 12 ? label.slice(0, 10) + '\u2026' : label;
  innerG.appendChild(labelText);

  // Status indicator
  const statusR = s * 0.12;
  const statusY = cy - segH / 2 - statusR - 4;
  if (status !== 'pending') {
    const statusCircle = document.createElementNS(SVG_NS, 'circle');
    statusCircle.setAttribute('cx', String(cx + segW / 2 - statusR));
    statusCircle.setAttribute('cy', String(statusY));
    statusCircle.setAttribute('r', String(statusR));
    statusCircle.setAttribute('fill', 'none');
    statusCircle.setAttribute('stroke', cc.stroke);
    statusCircle.setAttribute('stroke-width', '2.5');
    innerG.appendChild(statusCircle);

    if (status === 'success') {
      const check = document.createElementNS(SVG_NS, 'path');
      const sx = cx + segW / 2 - statusR;
      check.setAttribute('d', `M ${sx - 4} ${statusY} L ${sx - 1} ${statusY + 4} L ${sx + 5} ${statusY - 3}`);
      check.setAttribute('fill', 'none');
      check.setAttribute('stroke', cc.stroke);
      check.setAttribute('stroke-width', '2.5');
      check.setAttribute('stroke-linecap', 'round');
      check.setAttribute('stroke-linejoin', 'round');
      innerG.appendChild(check);
    } else if (status === 'failed') {
      const x = cx + segW / 2 - statusR;
      const cross1 = document.createElementNS(SVG_NS, 'line');
      cross1.setAttribute('x1', String(x - 4));
      cross1.setAttribute('y1', String(statusY - 4));
      cross1.setAttribute('x2', String(x + 4));
      cross1.setAttribute('y2', String(statusY + 4));
      cross1.setAttribute('stroke', cc.stroke);
      cross1.setAttribute('stroke-width', '2.5');
      innerG.appendChild(cross1);
      const cross2 = document.createElementNS(SVG_NS, 'line');
      cross2.setAttribute('x1', String(x + 4));
      cross2.setAttribute('y1', String(statusY - 4));
      cross2.setAttribute('x2', String(x - 4));
      cross2.setAttribute('y2', String(statusY + 4));
      cross2.setAttribute('stroke', cc.stroke);
      cross2.setAttribute('stroke-width', '2.5');
      innerG.appendChild(cross2);
    } else if (status === 'running') {
      const dot = document.createElementNS(SVG_NS, 'circle');
      dot.setAttribute('cx', String(cx + segW / 2 - statusR));
      dot.setAttribute('cy', String(statusY));
      dot.setAttribute('r', String(statusR * 0.5));
      dot.setAttribute('fill', color);
      innerG.appendChild(dot);
    }
  }

  // Connection stubs (left/right)
  const stubLen = s * 0.15;
  const leftStub = document.createElementNS(SVG_NS, 'line');
  leftStub.setAttribute('x1', String(cx - segW / 2 - stubLen));
  leftStub.setAttribute('y1', String(cy));
  leftStub.setAttribute('x2', String(cx - segW / 2));
  leftStub.setAttribute('y2', String(cy));
  leftStub.setAttribute('stroke', colorWithAlpha(color, OPACITY.strokeSoft));
  leftStub.setAttribute('stroke-width', '2.5');
  innerG.appendChild(leftStub);

  const rightStub = document.createElementNS(SVG_NS, 'line');
  rightStub.setAttribute('x1', String(cx + segW / 2));
  rightStub.setAttribute('y1', String(cy));
  rightStub.setAttribute('x2', String(cx + segW / 2 + stubLen));
  rightStub.setAttribute('y2', String(cy));
  rightStub.setAttribute('stroke', colorWithAlpha(color, OPACITY.strokeSoft));
  rightStub.setAttribute('stroke-width', '2.5');
  innerG.appendChild(rightStub);

  // ── Pillar 5: Micro-Life ──────────────────────────────────────────────
  const styleId = `ps-style-${entityId}`;
  const svg = parentEl.ownerSVGElement ?? (parentEl as SVGSVGElement);
  if (!svg.querySelector(`#${styleId}`)) {
    const style = document.createElementNS(SVG_NS, 'style');
    style.setAttribute('id', styleId);
    style.textContent = `
      @keyframes psFloat_${entityId} {
        0%, 100% { transform: translateY(0); }
        50% { transform: translateY(-2px); }
      }
      @keyframes psBreathe_${entityId} {
        0%, 100% { transform: scale(1); }
        50% { transform: scale(1.03); }
      }
      .ps-float-${entityId} {
        animation: psFloat_${entityId} 3.4s ease-in-out infinite;
      }
      .ps-breathe-${entityId} {
        animation: psBreathe_${entityId} 2.6s ease-in-out infinite;
      }
    `;
    svg.insertBefore(style, svg.firstChild);
  }
  innerG.classList.add(`ps-float-${entityId}`);
  seg.classList.add(`ps-breathe-${entityId}`);

  applyEntranceAnimation(innerG, entity);
  parentEl.appendChild(outerG);
  return outerG;
}
