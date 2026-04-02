/**
 * @preplai/illustrations — FeatureStore Component (Cinematic 5-Pillar)
 *
 * Dual-port storage icon for ML feature serving (Training + Inference ports).
 * Cylinder body with "F" badge and left/right port indicators.
 *
 * Cinematic Depth: directional lighting, ground shadow, ambient occlusion,
 * specular highlight, micro-life float animation.
 */

import { SVG_NS, buildEntityGroup, applyEntranceAnimation, getSizeParam } from '../utils.js';
import { TYPOGRAPHY, STROKE } from '../design-tokens.js';import { resolveColorCascade, applyGlowColors } from '../color-cascade.js';
import { ensureDefs } from '../visual-utils.js';
import { renderCylinderBase, getCylinderLabelY } from '../cylinder-utils.js';
import type { VisualEntity } from '@preplai/shared';

export function renderFeatureStore(entity: VisualEntity, parentEl: SVGElement): SVGGElement {
  const { outerG, innerG } = buildEntityGroup(entity);
  const size = getSizeParam(entity);
  const cc = resolveColorCascade(entity);
  const color = cc.base;
  const entityId = (entity.id ?? Math.random().toString(36).slice(2)).replace(/[^a-zA-Z0-9]/g, '').slice(0, 8);
  const gradId = `grad-fstore-${entityId}`;

  const rx = size / 2;
  const ry = size / 6;
  const topY = -size / 3;
  const bodyH = size * 0.55;
  const botY = topY + bodyH;
  const bodyMidY = topY + bodyH / 2;

  const defs = ensureDefs(parentEl);

  // ── Pillar 1: Directional Lighting ──────────────────────────────────
  const haloId = `fstore-halo-${entityId}`;
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
  halo.setAttribute('cx', String(-rx * 0.15));
  halo.setAttribute('cy', String(-size * 0.05));
  halo.setAttribute('rx', String(rx * 2));
  halo.setAttribute('ry', String(rx * 1.4));
  halo.setAttribute('fill', `url(#${haloId})`);
  innerG.appendChild(halo);

  // ── Pillar 2: Ground Shadow ─────────────────────────────────────────
  const gsId = `fstore-gshadow-${entityId}`;
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
  groundShadow.setAttribute('cy', String(botY + ry * 0.6));
  groundShadow.setAttribute('rx', String(rx * 1.1));
  groundShadow.setAttribute('ry', String(ry * 0.45));
  groundShadow.setAttribute('fill', `url(#${gsId})`);
  innerG.appendChild(groundShadow);

  // ── Pillar 3: Ambient Occlusion ─────────────────────────────────────
  const aoId = `fstore-ao-${entityId}`;
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
  const ao = document.createElementNS(SVG_NS, 'rect');
  ao.setAttribute('x', String(-rx));
  ao.setAttribute('y', String(topY));
  ao.setAttribute('width', String(rx * 2));
  ao.setAttribute('height', String(bodyH));
  ao.setAttribute('fill', `url(#${aoId})`);
  ao.setAttribute('pointer-events', 'none');
  innerG.appendChild(ao);

  // ── Highlight glow ──────────────────────────────────────────────────
  if (entity.highlight) {
    const hRx = rx + 3;
    const hRy = ry + 2;
    const hTopY = topY - 3;
    const hBotY = botY + 3;
    const glowPath = document.createElementNS(SVG_NS, 'path');
    glowPath.setAttribute('d', [
      `M ${-hRx} ${hTopY}`,
      `A ${hRx} ${hRy} 0 0 1 ${hRx} ${hTopY}`,
      `L ${hRx} ${hBotY}`,
      `A ${hRx} ${hRy} 0 0 1 ${-hRx} ${hBotY}`,
      'Z',
    ].join(' '));
    glowPath.setAttribute('stroke-width', String(STROKE.default));
    glowPath.setAttribute('stroke-dasharray', '4,4');
    applyGlowColors(glowPath, cc);
    innerG.appendChild(glowPath);
  }

  // ── Cylinder body (reuse shared cylinder renderer) ──
  renderCylinderBase(innerG, parentEl, {
    size,
    color,
    gradId,
    stripeOffsets: [],
    glass: true,
  });

  // ── "F" badge centered in cylinder body ──
  const badge = document.createElementNS(SVG_NS, 'text');
  badge.setAttribute('x', '0');
  badge.setAttribute('y', String(bodyMidY + 5));
  badge.setAttribute('text-anchor', 'middle');
  badge.setAttribute('fill', cc.textPrimary);
  badge.setAttribute('font-size', String(Math.max(12, size * 0.3)));
  badge.setAttribute('font-weight', String(TYPOGRAPHY.fontWeightBold));
  badge.setAttribute('font-family', TYPOGRAPHY.fontBadge);
  badge.setAttribute('opacity', '0.9');
  badge.textContent = 'F';
  innerG.appendChild(badge);

  // ── Left port (Training) ──
  const portW = size * 0.18;
  const portH = size * 0.12;
  const portR = 2;

  const leftPort = document.createElementNS(SVG_NS, 'rect');
  leftPort.setAttribute('x', String(-rx - portW));
  leftPort.setAttribute('y', String(bodyMidY - portH / 2));
  leftPort.setAttribute('width', String(portW));
  leftPort.setAttribute('height', String(portH));
  leftPort.setAttribute('rx', String(portR));
  leftPort.setAttribute('ry', String(portR));
  leftPort.setAttribute('fill', cc.fillMedium);
  leftPort.setAttribute('stroke', cc.stroke);
  leftPort.setAttribute('stroke-width', String(STROKE.thin));
  innerG.appendChild(leftPort);

  const leftLine = document.createElementNS(SVG_NS, 'line');
  leftLine.setAttribute('x1', String(-rx));
  leftLine.setAttribute('y1', String(bodyMidY));
  leftLine.setAttribute('x2', String(-rx - portW));
  leftLine.setAttribute('y2', String(bodyMidY));
  leftLine.setAttribute('stroke', cc.strokeSoft);
  leftLine.setAttribute('stroke-width', String(STROKE.thin));
  innerG.appendChild(leftLine);

  const leftLabel = document.createElementNS(SVG_NS, 'text');
  leftLabel.setAttribute('x', String(-rx - portW / 2));
  leftLabel.setAttribute('y', String(bodyMidY + portH / 2 + 11));
  leftLabel.setAttribute('text-anchor', 'middle');
  leftLabel.setAttribute('fill', cc.textSecondary);
  leftLabel.setAttribute('font-size', String(TYPOGRAPHY.fontSizeIndex));
  leftLabel.setAttribute('font-weight', String(TYPOGRAPHY.fontWeightLabel));
  leftLabel.setAttribute('font-family', TYPOGRAPHY.fontLabel);
  leftLabel.textContent = 'Training';
  innerG.appendChild(leftLabel);

  // ── Right port (Inference) ──
  const rightPort = document.createElementNS(SVG_NS, 'rect');
  rightPort.setAttribute('x', String(rx));
  rightPort.setAttribute('y', String(bodyMidY - portH / 2));
  rightPort.setAttribute('width', String(portW));
  rightPort.setAttribute('height', String(portH));
  rightPort.setAttribute('rx', String(portR));
  rightPort.setAttribute('ry', String(portR));
  rightPort.setAttribute('fill', cc.fillMedium);
  rightPort.setAttribute('stroke', cc.stroke);
  rightPort.setAttribute('stroke-width', String(STROKE.thin));
  innerG.appendChild(rightPort);

  const rightLine = document.createElementNS(SVG_NS, 'line');
  rightLine.setAttribute('x1', String(rx));
  rightLine.setAttribute('y1', String(bodyMidY));
  rightLine.setAttribute('x2', String(rx + portW));
  rightLine.setAttribute('y2', String(bodyMidY));
  rightLine.setAttribute('stroke', cc.strokeSoft);
  rightLine.setAttribute('stroke-width', String(STROKE.thin));
  innerG.appendChild(rightLine);

  const rightLabel = document.createElementNS(SVG_NS, 'text');
  rightLabel.setAttribute('x', String(rx + portW / 2));
  rightLabel.setAttribute('y', String(bodyMidY + portH / 2 + 11));
  rightLabel.setAttribute('text-anchor', 'middle');
  rightLabel.setAttribute('fill', cc.textSecondary);
  rightLabel.setAttribute('font-size', String(TYPOGRAPHY.fontSizeIndex));
  rightLabel.setAttribute('font-weight', String(TYPOGRAPHY.fontWeightLabel));
  rightLabel.setAttribute('font-family', TYPOGRAPHY.fontLabel);
  rightLabel.textContent = 'Inference';
  innerG.appendChild(rightLabel);

  // ── Pillar 4: Specular Highlight ────────────────────────────────────
  const specId = `fstore-spec-${entityId}`;
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
  specular.setAttribute('cx', String(-rx * 0.2));
  specular.setAttribute('cy', String(topY));
  specular.setAttribute('rx', String(rx * 0.6));
  specular.setAttribute('ry', String(ry * 0.5));
  specular.setAttribute('fill', `url(#${specId})`);
  specular.setAttribute('pointer-events', 'none');
  innerG.appendChild(specular);

  // ── Pillar 5: Micro-Life ────────────────────────────────────────────
  const styleId = `fstore-style-${entityId}`;
  const svg = parentEl.ownerSVGElement ?? (parentEl as SVGSVGElement);
  if (!svg.querySelector(`#${styleId}`)) {
    const style = document.createElementNS(SVG_NS, 'style');
    style.setAttribute('id', styleId);
    style.textContent = `
      @keyframes fstoreFloat_${entityId} {
        0%, 100% { transform: translateY(0); }
        50% { transform: translateY(-2.5px); }
      }
      .fstore-float-${entityId} {
        animation: fstoreFloat_${entityId} 3.5s ease-in-out infinite;
      }
    `;
    svg.insertBefore(style, svg.firstChild);
  }
  innerG.classList.add(`fstore-float-${entityId}`);

  // ── Entity label below ──
  if (entity.label) {
    const text = document.createElementNS(SVG_NS, 'text');
    text.setAttribute('x', '0');
    text.setAttribute('y', String(getCylinderLabelY(size)));
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
