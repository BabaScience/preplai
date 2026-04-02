/**
 * @preplai/illustrations — MLModel Component (Cinematic 5-Pillar)
 *
 * Simplified brain/model icon for high-level ML architecture.
 * Rounded rectangle body with stylized brain shape, status indicator, and metadata badges.
 *
 * Cinematic Depth: directional lighting, ground shadow, ambient occlusion,
 * specular highlight, micro-life pulse animation.
 */

import { SVG_NS, buildEntityGroup, applyEntranceAnimation, getSizeParam } from '../utils.js';
import { ensureGlassFilter } from '../visual-utils.js';
import { TYPOGRAPHY, STROKE, COLORS, SHAPES } from '../design-tokens.js';
import { resolveColorCascade, applyGlowColors } from '../color-cascade.js';
import { ensureDefs } from '../visual-utils.js';
import type { VisualEntity } from '@preplai/shared';

/** Status -> dot color mapping */
const STATUS_COLORS: Record<string, string> = {
  training: COLORS.orange,
  deployed: COLORS.green,
  archived: '#888888',
};

export function renderMLModel(entity: VisualEntity, parentEl: SVGElement): SVGGElement {
  const { outerG, innerG } = buildEntityGroup(entity);
  const size = getSizeParam(entity);
  const cc = resolveColorCascade(entity);
  const color = cc.base;
  const entityId = (entity.id ?? Math.random().toString(36).slice(2)).replace(/[^a-zA-Z0-9]/g, '').slice(0, 8);
  const meta = (entity.metadata ?? {}) as {
    framework?: string;
    version?: string;
    accuracy?: string;
    status?: string;
  };

  const w = size * 2.0;
  const h = size * 1.4;

  const defs = ensureDefs(parentEl);

  // ── Pillar 1: Directional Lighting ──────────────────────────────────
  const haloId = `mlm-halo-${entityId}`;
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
  halo.setAttribute('cx', String(-w * 0.06));
  halo.setAttribute('cy', String(-h * 0.06));
  halo.setAttribute('rx', String(w * 0.7));
  halo.setAttribute('ry', String(h * 0.65));
  halo.setAttribute('fill', `url(#${haloId})`);
  innerG.appendChild(halo);

  // ── Pillar 2: Ground Shadow ─────────────────────────────────────────
  const gsId = `mlm-gshadow-${entityId}`;
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
  groundShadow.setAttribute('cy', String(h / 2 + 6));
  groundShadow.setAttribute('rx', String(w * 0.4));
  groundShadow.setAttribute('ry', String(h * 0.1));
  groundShadow.setAttribute('fill', `url(#${gsId})`);
  innerG.appendChild(groundShadow);

  // ── Pillar 3: Ambient Occlusion ─────────────────────────────────────
  const aoId = `mlm-ao-${entityId}`;
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
  ao.setAttribute('x', String(-w / 2));
  ao.setAttribute('y', String(-h / 2));
  ao.setAttribute('width', String(w));
  ao.setAttribute('height', String(h));
  ao.setAttribute('rx', String(SHAPES.borderRadiusLarge));
  ao.setAttribute('fill', `url(#${aoId})`);
  ao.setAttribute('pointer-events', 'none');
  innerG.appendChild(ao);

  // ── Highlight glow ──────────────────────────────────────────────────
  if (entity.highlight) {
    const glow = document.createElementNS(SVG_NS, 'rect');
    glow.setAttribute('x', String(-w / 2 - 3));
    glow.setAttribute('y', String(-h / 2 - 3));
    glow.setAttribute('width', String(w + 6));
    glow.setAttribute('height', String(h + 6));
    glow.setAttribute('rx', String(SHAPES.borderRadiusLarge + 2));
    glow.setAttribute('fill', 'none');
    glow.setAttribute('stroke-width', String(STROKE.default));
    glow.setAttribute('stroke-dasharray', '4,4');
    applyGlowColors(glow, cc);
    innerG.appendChild(glow);
  }

  // ── Body (rounded rectangle) ──
  const body = document.createElementNS(SVG_NS, 'rect');
  body.setAttribute('x', String(-w / 2));
  body.setAttribute('y', String(-h / 2));
  body.setAttribute('width', String(w));
  body.setAttribute('height', String(h));
  body.setAttribute('rx', String(SHAPES.borderRadiusLarge));
  body.setAttribute('fill', cc.fill);
  body.setAttribute('stroke', cc.stroke);
  body.setAttribute('stroke-width', '2.5');
  body.setAttribute('filter', ensureGlassFilter(parentEl));
  innerG.appendChild(body);

  // ── Brain icon ──
  const brainScale = size * 0.28;
  const brainY = -h * 0.08;

  // Left hemisphere
  const brainLeft = document.createElementNS(SVG_NS, 'path');
  brainLeft.setAttribute('d', [
    `M 0 ${brainY - brainScale * 0.8}`,
    `C ${-brainScale * 0.3} ${brainY - brainScale} ${-brainScale * 0.9} ${brainY - brainScale * 0.6} ${-brainScale * 0.85} ${brainY - brainScale * 0.1}`,
    `C ${-brainScale * 0.8} ${brainY + brainScale * 0.5} ${-brainScale * 0.3} ${brainY + brainScale * 0.9} 0 ${brainY + brainScale * 0.8}`,
  ].join(' '));
  brainLeft.setAttribute('fill', 'none');
  brainLeft.setAttribute('stroke', cc.stroke);
  brainLeft.setAttribute('stroke-width', '2.5');
  brainLeft.setAttribute('stroke-linecap', 'round');
  brainLeft.setAttribute('opacity', '0.8');
  innerG.appendChild(brainLeft);

  // Right hemisphere
  const brainRight = document.createElementNS(SVG_NS, 'path');
  brainRight.setAttribute('d', [
    `M 0 ${brainY - brainScale * 0.8}`,
    `C ${brainScale * 0.3} ${brainY - brainScale} ${brainScale * 0.9} ${brainY - brainScale * 0.6} ${brainScale * 0.85} ${brainY - brainScale * 0.1}`,
    `C ${brainScale * 0.8} ${brainY + brainScale * 0.5} ${brainScale * 0.3} ${brainY + brainScale * 0.9} 0 ${brainY + brainScale * 0.8}`,
  ].join(' '));
  brainRight.setAttribute('fill', 'none');
  brainRight.setAttribute('stroke', cc.stroke);
  brainRight.setAttribute('stroke-width', '2.5');
  brainRight.setAttribute('stroke-linecap', 'round');
  brainRight.setAttribute('opacity', '0.8');
  innerG.appendChild(brainRight);

  // Center divide line
  const centerLine = document.createElementNS(SVG_NS, 'line');
  centerLine.setAttribute('x1', '0');
  centerLine.setAttribute('y1', String(brainY - brainScale * 0.7));
  centerLine.setAttribute('x2', '0');
  centerLine.setAttribute('y2', String(brainY + brainScale * 0.7));
  centerLine.setAttribute('stroke', cc.strokeSoft);
  centerLine.setAttribute('stroke-width', String(STROKE.minimal));
  centerLine.setAttribute('opacity', '0.4');
  innerG.appendChild(centerLine);

  // ── Status indicator ──
  const status = meta.status?.toLowerCase() ?? '';
  const statusColor = STATUS_COLORS[status] ?? color;
  const statusDot = document.createElementNS(SVG_NS, 'circle');
  statusDot.setAttribute('cx', String(w / 2 - 10));
  statusDot.setAttribute('cy', String(-h / 2 + 10));
  statusDot.setAttribute('r', '4');
  statusDot.setAttribute('fill', statusColor);
  statusDot.setAttribute('opacity', '0.9');
  innerG.appendChild(statusDot);

  // ── Accuracy badge ──
  if (meta.accuracy) {
    const accText = document.createElementNS(SVG_NS, 'text');
    accText.setAttribute('x', '0');
    accText.setAttribute('y', String(brainY + brainScale + 10));
    accText.setAttribute('text-anchor', 'middle');
    accText.setAttribute('fill', cc.textPrimary);
    accText.setAttribute('font-size', String(TYPOGRAPHY.fontSizeBadge));
    accText.setAttribute('font-weight', String(TYPOGRAPHY.fontWeightEmphasis));
    accText.setAttribute('font-family', TYPOGRAPHY.fontBadge);
    accText.setAttribute('opacity', '0.8');
    accText.textContent = meta.accuracy;
    innerG.appendChild(accText);
  }

  // ── Version text ──
  if (meta.version) {
    const verText = document.createElementNS(SVG_NS, 'text');
    verText.setAttribute('x', String(-w / 2 + 8));
    verText.setAttribute('y', String(h / 2 - 6));
    verText.setAttribute('text-anchor', 'start');
    verText.setAttribute('fill', cc.textTertiary);
    verText.setAttribute('font-size', String(TYPOGRAPHY.fontSizeIndex));
    verText.setAttribute('font-weight', String(TYPOGRAPHY.fontWeightLabel));
    verText.setAttribute('font-family', TYPOGRAPHY.fontBadge);
    verText.textContent = `v${meta.version}`;
    innerG.appendChild(verText);
  }

  // ── Pillar 4: Specular Highlight ────────────────────────────────────
  const specId = `mlm-spec-${entityId}`;
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
  specular.setAttribute('height', String(h * 0.45));
  specular.setAttribute('rx', String(SHAPES.borderRadiusLarge));
  specular.setAttribute('fill', `url(#${specId})`);
  specular.setAttribute('pointer-events', 'none');
  innerG.appendChild(specular);

  // ── Pillar 5: Micro-Life (pulse animation on brain) ─────────────────
  const styleId = `mlm-style-${entityId}`;
  const svg = parentEl.ownerSVGElement ?? (parentEl as SVGSVGElement);
  if (!svg.querySelector(`#${styleId}`)) {
    const style = document.createElementNS(SVG_NS, 'style');
    style.setAttribute('id', styleId);
    style.textContent = `
      @keyframes mlmPulse_${entityId} {
        0%, 100% { transform: scale(1); }
        50% { transform: scale(1.05); }
      }
      @keyframes mlmFloat_${entityId} {
        0%, 100% { transform: translateY(0); }
        50% { transform: translateY(-2px); }
      }
      .mlm-pulse-${entityId} {
        animation: mlmPulse_${entityId} 2.5s ease-in-out infinite;
      }
      .mlm-float-${entityId} {
        animation: mlmFloat_${entityId} 3.5s ease-in-out infinite;
      }
    `;
    svg.insertBefore(style, svg.firstChild);
  }
  brainLeft.classList.add(`mlm-pulse-${entityId}`);
  brainRight.classList.add(`mlm-pulse-${entityId}`);
  innerG.classList.add(`mlm-float-${entityId}`);

  // ── Entity label below ──
  if (entity.label) {
    const label = document.createElementNS(SVG_NS, 'text');
    label.setAttribute('x', '0');
    label.setAttribute('y', String(h / 2 + 20));
    label.setAttribute('text-anchor', 'middle');
    label.setAttribute('fill', cc.textPrimary);
    label.setAttribute('font-size', String(TYPOGRAPHY.fontSizeLabel));
    label.setAttribute('font-weight', String(TYPOGRAPHY.fontWeightLabel));
    label.setAttribute('font-family', TYPOGRAPHY.fontLabel);
    label.textContent = entity.label;
    innerG.appendChild(label);
  }

  applyEntranceAnimation(innerG, entity);
  parentEl.appendChild(outerG);
  return outerG;
}
