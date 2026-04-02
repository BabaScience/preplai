/**
 * @preplai/illustrations — MindMapNode Component (Cinematic Depth)
 *
 * Central topic circle with radiating curved branches for brainstorming.
 * 5 Cinematic Pillars: directional lighting, ground shadow,
 * ambient occlusion, specular highlight, micro-life animations.
 */

import { SVG_NS, buildEntityGroup, applyEntranceAnimation, getSizeParam } from '../utils.js';
import { TYPOGRAPHY, STROKE } from '../design-tokens.js';
import { resolveColorCascade, applyGlowColors } from '../color-cascade.js';
import { ensureDefs } from '../visual-utils.js';
import type { VisualEntity } from '@preplai/shared';

interface MindMapBranch {
  label: string;
}

interface MindMapMetadata {
  topic?: string;
  branches?: MindMapBranch[];
}

export function renderMindMapNode(entity: VisualEntity, parentEl: SVGElement): SVGGElement {
  const { outerG, innerG } = buildEntityGroup(entity);
  const size = getSizeParam(entity);
  const cc = resolveColorCascade(entity);
  const color = cc.base;
  const entityId = (entity.id ?? Math.random().toString(36).slice(2)).replace(/[^a-zA-Z0-9]/g, '').slice(0, 8);

  const meta = (entity.metadata ?? {}) as MindMapMetadata;
  const topic = meta.topic ?? 'Topic';
  const branches = (meta.branches ?? []).slice(0, 6);

  const centerR = size * 0.4;
  const branchR = size * 0.18;
  const orbitR = size * 1.1;

  const defs = ensureDefs(parentEl);

  // ── Pillar 1: Directional Lighting ─────────────────────────────────
  const haloId = `mindMap-halo-${entityId}`;
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
  halo.setAttribute('cx', String(-orbitR * 0.1));
  halo.setAttribute('cy', String(-orbitR * 0.05));
  halo.setAttribute('rx', String(orbitR * 1.2));
  halo.setAttribute('ry', String(orbitR * 1.0));
  halo.setAttribute('fill', `url(#${haloId})`);
  innerG.appendChild(halo);

  // ── Pillar 2: Ground Shadow ────────────────────────────────────────
  const gsId = `mindMap-gshadow-${entityId}`;
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
  groundShadow.setAttribute('cy', String(orbitR + branchR + 6));
  groundShadow.setAttribute('rx', String(orbitR * 0.6));
  groundShadow.setAttribute('ry', String(branchR * 0.5));
  groundShadow.setAttribute('fill', `url(#${gsId})`);
  innerG.appendChild(groundShadow);

  // ── Pillar 3: Ambient Occlusion ────────────────────────────────────
  const aoId = `mindMap-ao-${entityId}`;
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
  const aoCircle = document.createElementNS(SVG_NS, 'circle');
  aoCircle.setAttribute('cx', String(centerR * 0.3));
  aoCircle.setAttribute('cy', String(centerR * 0.4));
  aoCircle.setAttribute('r', String(centerR * 1.2));
  aoCircle.setAttribute('fill', `url(#${aoId})`);
  aoCircle.setAttribute('pointer-events', 'none');
  innerG.appendChild(aoCircle);

  // ── Branch lines and nodes ─────────────────────────────────────────
  for (let i = 0; i < branches.length; i++) {
    const angle = (i / branches.length) * Math.PI * 2 - Math.PI / 2;
    const bx = Math.cos(angle) * orbitR;
    const by = Math.sin(angle) * orbitR;

    const cpOffset = orbitR * 0.3;
    const perpAngle = angle + Math.PI / 2;
    const cpx = (bx / 2) + Math.cos(perpAngle) * cpOffset;
    const cpy = (by / 2) + Math.sin(perpAngle) * cpOffset;

    const line = document.createElementNS(SVG_NS, 'path');
    line.setAttribute('d', `M 0 0 Q ${cpx} ${cpy} ${bx} ${by}`);
    line.setAttribute('fill', 'none');
    line.setAttribute('stroke', cc.strokeSoft);
    line.setAttribute('stroke-width', '2.5');
    innerG.appendChild(line);

    const branchCircle = document.createElementNS(SVG_NS, 'circle');
    branchCircle.setAttribute('cx', String(bx));
    branchCircle.setAttribute('cy', String(by));
    branchCircle.setAttribute('r', String(branchR));
    branchCircle.setAttribute('fill', cc.fill);
    branchCircle.setAttribute('stroke', cc.strokeSoft);
    branchCircle.setAttribute('stroke-width', String(STROKE.thin));
    innerG.appendChild(branchCircle);

    const branchLabel = document.createElementNS(SVG_NS, 'text');
    branchLabel.setAttribute('x', String(bx));
    branchLabel.setAttribute('y', String(by + 4));
    branchLabel.setAttribute('text-anchor', 'middle');
    branchLabel.setAttribute('fill', cc.textPrimary);
    branchLabel.setAttribute('font-size', String(TYPOGRAPHY.fontSizeValue));
    branchLabel.setAttribute('font-weight', String(TYPOGRAPHY.fontWeightLabel));
    branchLabel.setAttribute('font-family', TYPOGRAPHY.fontLabel);
    branchLabel.setAttribute('opacity', '0.85');
    branchLabel.textContent = branches[i].label.length > 10
      ? branches[i].label.slice(0, 9) + '\u2026'
      : branches[i].label;
    innerG.appendChild(branchLabel);
  }

  // ── Highlight glow ring ────────────────────────────────────────────
  if (entity.highlight) {
    const glowCircle = document.createElementNS(SVG_NS, 'circle');
    glowCircle.setAttribute('cx', '0');
    glowCircle.setAttribute('cy', '0');
    glowCircle.setAttribute('r', String(centerR + 4));
    glowCircle.setAttribute('fill', 'none');
    glowCircle.setAttribute('stroke-width', String(STROKE.default));
    glowCircle.setAttribute('stroke-dasharray', '4,4');
    applyGlowColors(glowCircle, cc);
    innerG.appendChild(glowCircle);
  }

  // ── Central circle (drawn after branches so it sits on top) ────────
  const centerCircle = document.createElementNS(SVG_NS, 'circle');
  centerCircle.setAttribute('cx', '0');
  centerCircle.setAttribute('cy', '0');
  centerCircle.setAttribute('r', String(centerR));
  centerCircle.setAttribute('fill', cc.fillMedium);
  centerCircle.setAttribute('stroke', cc.stroke);
  centerCircle.setAttribute('stroke-width', '2.5');
  innerG.appendChild(centerCircle);

  // Central topic text
  const topicText = document.createElementNS(SVG_NS, 'text');
  topicText.setAttribute('x', '0');
  topicText.setAttribute('y', '5');
  topicText.setAttribute('text-anchor', 'middle');
  topicText.setAttribute('fill', cc.textPrimary);
  topicText.setAttribute('font-size', String(TYPOGRAPHY.fontSizeBodyMax));
  topicText.setAttribute('font-weight', String(TYPOGRAPHY.fontWeightBold));
  topicText.setAttribute('font-family', TYPOGRAPHY.fontLabel);
  topicText.textContent = topic.length > 14 ? topic.slice(0, 13) + '\u2026' : topic;
  innerG.appendChild(topicText);

  // ── Pillar 4: Specular Highlight ───────────────────────────────────
  const specId = `mindMap-spec-${entityId}`;
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
  specular.setAttribute('cx', String(-centerR * 0.25));
  specular.setAttribute('cy', String(-centerR * 0.3));
  specular.setAttribute('rx', String(centerR * 0.5));
  specular.setAttribute('ry', String(centerR * 0.35));
  specular.setAttribute('fill', `url(#${specId})`);
  specular.setAttribute('pointer-events', 'none');
  innerG.appendChild(specular);

  // ── Pillar 5: Micro-Life Animations ────────────────────────────────
  const styleId = `mindMap-style-${entityId}`;
  const svg = parentEl.ownerSVGElement ?? (parentEl as SVGSVGElement);
  if (!svg.querySelector(`#${styleId}`)) {
    const styleEl = document.createElementNS(SVG_NS, 'style');
    styleEl.setAttribute('id', styleId);
    styleEl.textContent = `
      @keyframes mindMapFloat_${entityId} {
        0%, 100% { transform: translateY(0); }
        50% { transform: translateY(-2.5px); }
      }
      @keyframes mindMapPulse_${entityId} {
        0%, 100% { transform: scale(1); }
        50% { transform: scale(1.04); }
      }
      .mindMap-float-${entityId} {
        animation: mindMapFloat_${entityId} 3.5s ease-in-out infinite;
      }
      .mindMap-pulse-${entityId} {
        animation: mindMapPulse_${entityId} 2.5s ease-in-out infinite;
      }
    `;
    svg.insertBefore(styleEl, svg.firstChild);
  }
  innerG.classList.add(`mindMap-float-${entityId}`);

  // ── Entity label below the whole component ─────────────────────────
  if (entity.label) {
    const labelY = orbitR + branchR + 22;
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
