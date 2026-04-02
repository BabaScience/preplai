/**
 * @preplai/illustrations — GPU Component (Cinematic Depth)
 *
 * Processor/accelerator with parallel cores grid, heat sink fins,
 * model/memory labels, and full cinematic lighting treatment.
 *
 * 5 Cinematic Pillars: directional lighting, ground shadow,
 * ambient occlusion, specular highlight, micro-life animation.
 */

import { SVG_NS, buildEntityGroup, applyEntranceAnimation, getSizeParam } from '../utils.js';
import { TYPOGRAPHY, STROKE } from '../design-tokens.js';import { resolveColorCascade, applyGlowColors } from '../color-cascade.js';
import { ensureDefs } from '../visual-utils.js';
import type { VisualEntity } from '@preplai/shared';

export function renderGPU(entity: VisualEntity, parentEl: SVGElement): SVGGElement {
  const { outerG, innerG } = buildEntityGroup(entity);
  const size = getSizeParam(entity);
  const cc = resolveColorCascade(entity);
  const color = cc.base;
  const entityId = (entity.id ?? Math.random().toString(36).slice(2)).replace(/[^a-zA-Z0-9]/g, '').slice(0, 8);

  const meta = entity.metadata ?? {};
  const model = (meta.model as string) ?? 'A100';
  const memory = (meta.memory as string) ?? '80GB';

  const scale = size / 50;
  const w = 90 * scale;
  const h = 60 * scale;
  const rx = 4 * scale;

  const defs = ensureDefs(parentEl);

  // ── Pillar 1: Directional Lighting ──────────────────────────────────
  const haloId = `gpu-halo-${entityId}`;
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
  halo.setAttribute('cx', String(-w * 0.08));
  halo.setAttribute('cy', String(-h * 0.05));
  halo.setAttribute('rx', String(w * 0.9));
  halo.setAttribute('ry', String(h * 0.85));
  halo.setAttribute('fill', `url(#${haloId})`);
  innerG.appendChild(halo);

  // ── Pillar 2: Ground Shadow ─────────────────────────────────────────
  const gsId = `gpu-gshadow-${entityId}`;
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
  groundShadow.setAttribute('cy', String(h / 2 + h * 0.12));
  groundShadow.setAttribute('rx', String(w * 0.55));
  groundShadow.setAttribute('ry', String(h * 0.15));
  groundShadow.setAttribute('fill', `url(#${gsId})`);
  innerG.appendChild(groundShadow);

  // ── Pillar 3: Ambient Occlusion ─────────────────────────────────────
  const aoId = `gpu-ao-${entityId}`;
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
    glow.setAttribute('x', String(-w / 2 - 3));
    glow.setAttribute('y', String(-h / 2 - 3));
    glow.setAttribute('width', String(w + 6));
    glow.setAttribute('height', String(h + 6));
    glow.setAttribute('rx', String(rx + 2));
    glow.setAttribute('fill', 'none');
    glow.setAttribute('stroke-width', String(STROKE.default));
    glow.setAttribute('stroke-dasharray', '4,4');
    applyGlowColors(glow, cc);
    innerG.appendChild(glow);
  }

  // ── Main body rectangle ─────────────────────────────────────────────
  const body = document.createElementNS(SVG_NS, 'rect');
  body.setAttribute('x', String(-w / 2));
  body.setAttribute('y', String(-h / 2));
  body.setAttribute('width', String(w));
  body.setAttribute('height', String(h));
  body.setAttribute('rx', String(rx));
  body.setAttribute('fill', cc.fill);
  body.setAttribute('stroke', cc.stroke);
  body.setAttribute('stroke-width', '2.5');
  innerG.appendChild(body);

  // AO overlay on body
  const aoRect = document.createElementNS(SVG_NS, 'rect');
  aoRect.setAttribute('x', String(-w / 2));
  aoRect.setAttribute('y', String(-h / 2));
  aoRect.setAttribute('width', String(w));
  aoRect.setAttribute('height', String(h));
  aoRect.setAttribute('rx', String(rx));
  aoRect.setAttribute('fill', `url(#${aoId})`);
  aoRect.setAttribute('pointer-events', 'none');
  innerG.appendChild(aoRect);

  // ── Heat sink lines on top ──────────────────────────────────────────
  const sinkW = 4 * scale;
  const sinkH = 8 * scale;
  const sinkGap = 14 * scale;
  const sinkY = -h / 2 - sinkH;
  for (let i = -1; i <= 1; i++) {
    const sink = document.createElementNS(SVG_NS, 'rect');
    sink.setAttribute('x', String(i * sinkGap - sinkW / 2));
    sink.setAttribute('y', String(sinkY));
    sink.setAttribute('width', String(sinkW));
    sink.setAttribute('height', String(sinkH));
    sink.setAttribute('rx', String(1 * scale));
    sink.setAttribute('fill', cc.strokeSoft);
    innerG.appendChild(sink);
  }

  // ── Grid of cores (4x3) ────────────────────────────────────────────
  const coreCols = 4;
  const coreRows = 3;
  const coreSize = 6 * scale;
  const coreGap = 4 * scale;
  const gridW = coreCols * coreSize + (coreCols - 1) * coreGap;
  const gridH = coreRows * coreSize + (coreRows - 1) * coreGap;
  const gridStartX = -gridW / 2;
  const gridStartY = -h / 2 + 8 * scale;

  for (let row = 0; row < coreRows; row++) {
    for (let col = 0; col < coreCols; col++) {
      const cx = gridStartX + col * (coreSize + coreGap);
      const cy = gridStartY + row * (coreSize + coreGap);
      const core = document.createElementNS(SVG_NS, 'rect');
      core.setAttribute('x', String(cx));
      core.setAttribute('y', String(cy));
      core.setAttribute('width', String(coreSize));
      core.setAttribute('height', String(coreSize));
      core.setAttribute('rx', String(1 * scale));
      core.setAttribute('fill', cc.fillMedium);
      innerG.appendChild(core);
    }
  }

  // ── Model name ──────────────────────────────────────────────────────
  const modelText = document.createElementNS(SVG_NS, 'text');
  modelText.setAttribute('x', '0');
  modelText.setAttribute('y', String(gridStartY + gridH + 12 * scale));
  modelText.setAttribute('text-anchor', 'middle');
  modelText.setAttribute('fill', cc.textPrimary);
  modelText.setAttribute('font-size', String(TYPOGRAPHY.fontSizeValue * scale));
  modelText.setAttribute('font-weight', String(TYPOGRAPHY.fontWeightBold));
  modelText.setAttribute('font-family', TYPOGRAPHY.fontBadge);
  modelText.textContent = model;
  innerG.appendChild(modelText);

  // ── Memory text ─────────────────────────────────────────────────────
  const memText = document.createElementNS(SVG_NS, 'text');
  memText.setAttribute('x', '0');
  memText.setAttribute('y', String(h / 2 - 4 * scale));
  memText.setAttribute('text-anchor', 'middle');
  memText.setAttribute('fill', cc.textSecondary);
  memText.setAttribute('font-size', String(TYPOGRAPHY.fontSizeInline * scale));
  memText.setAttribute('font-weight', String(TYPOGRAPHY.fontWeightLabel));
  memText.setAttribute('font-family', TYPOGRAPHY.fontBadge);
  memText.textContent = memory;
  innerG.appendChild(memText);

  // ── Pillar 4: Specular Highlight ────────────────────────────────────
  const specId = `gpu-spec-${entityId}`;
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
  specular.setAttribute('x', String(-w / 2));
  specular.setAttribute('y', String(-h / 2));
  specular.setAttribute('width', String(w));
  specular.setAttribute('height', String(h));
  specular.setAttribute('rx', String(rx));
  specular.setAttribute('fill', `url(#${specId})`);
  specular.setAttribute('pointer-events', 'none');
  innerG.appendChild(specular);

  // ── Pillar 5: Micro-Life Animation ──────────────────────────────────
  const styleId = `gpu-style-${entityId}`;
  const svg = parentEl.ownerSVGElement ?? (parentEl as SVGSVGElement);
  if (!svg.querySelector(`#${styleId}`)) {
    const style = document.createElementNS(SVG_NS, 'style');
    style.setAttribute('id', styleId);
    style.textContent = `
      @keyframes gpuFloat_${entityId} {
        0%, 100% { transform: translateY(0); }
        50% { transform: translateY(-2px); }
      }
      @keyframes gpuPulse_${entityId} {
        0%, 100% { transform: scale(1); }
        50% { transform: scale(1.03); }
      }
      .gpu-float-${entityId} {
        animation: gpuFloat_${entityId} 3.5s ease-in-out infinite;
      }
      .gpu-pulse-${entityId} {
        animation: gpuPulse_${entityId} 2.8s ease-in-out infinite;
      }
    `;
    svg.insertBefore(style, svg.firstChild);
  }
  innerG.classList.add(`gpu-float-${entityId}`);
  body.classList.add(`gpu-pulse-${entityId}`);

  // ── Entity label below ──────────────────────────────────────────────
  if (entity.label) {
    const text = document.createElementNS(SVG_NS, 'text');
    text.setAttribute('x', '0');
    text.setAttribute('y', String(h / 2 + 18));
    text.setAttribute('text-anchor', 'middle');
    text.setAttribute('fill', cc.textPrimary);
    text.setAttribute('font-size', String(TYPOGRAPHY.fontSizeLabel));
    text.setAttribute('font-weight', String(TYPOGRAPHY.fontWeightTitle));
    text.setAttribute('font-family', TYPOGRAPHY.fontLabel);
    text.textContent = entity.label;
    innerG.appendChild(text);
  }

  applyEntranceAnimation(innerG, entity);
  parentEl.appendChild(outerG);
  return outerG;
}
