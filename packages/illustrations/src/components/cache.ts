/**
 * @preplai/illustrations — Cache Component (Glassmorphic Depth)
 *
 * An electric storage vessel. Brilliant glowing top cap, dark glass body,
 * gradient lightning bolt with electric glow — semantically distinct from Database.
 * Use for: caches, Redis, Memcached, fast storage layers.
 *
 * Glassmorphic Depth: glowing top cap (radial gradient), dark glass tube body,
 * gradient lightning bolt (white-to-color), glow filter on bolt and cap.
 */

import { SVG_NS, buildEntityGroup, applyEntranceAnimation, getSizeParam } from '../utils.js';
import { TYPOGRAPHY, STROKE, LABEL_DEFAULTS } from '../design-tokens.js';import { resolveColorCascade, applyGlowColors } from '../color-cascade.js';
import { ensureDefs } from '../visual-utils.js';import { getCylinderLabelY } from '../cylinder-utils.js';
import type { VisualEntity } from '@preplai/shared';

export function renderCache(entity: VisualEntity, parentEl: SVGElement): SVGGElement {
  const { outerG, innerG } = buildEntityGroup(entity);
  const size = getSizeParam(entity);
  const cc = resolveColorCascade(entity);
  const color = cc.base;
  const entityId = (entity.id ?? Math.random().toString(36).slice(2)).replace(/[^a-zA-Z0-9]/g, '').slice(0, 8);

  const rx = size / 2;
  const ry = size / 6;
  const topY = -size / 3;
  const bodyH = size * 0.55;
  const botY = topY + bodyH;

  const defs = ensureDefs(parentEl);

  // ── Radial depth halo ────────────────────────────────────────────────
  const haloId = `cache-halo-${entityId}`;
  if (!defs.querySelector(`#${haloId}`)) {
    const haloGrad = document.createElementNS(SVG_NS, 'radialGradient');
    haloGrad.setAttribute('id', haloId);
    haloGrad.setAttribute('cx', '38%'); haloGrad.setAttribute('cy', '38%');
    haloGrad.setAttribute('r', '50%');
    const hhs1 = document.createElementNS(SVG_NS, 'stop');
    hhs1.setAttribute('offset', '0%');
    hhs1.setAttribute('stop-color', color);
    hhs1.setAttribute('stop-opacity', '0.13');
    const hhs2 = document.createElementNS(SVG_NS, 'stop');
    hhs2.setAttribute('offset', '100%');
    hhs2.setAttribute('stop-color', color);
    hhs2.setAttribute('stop-opacity', '0');
    haloGrad.appendChild(hhs1); haloGrad.appendChild(hhs2);
    defs.appendChild(haloGrad);
  }
  const halo = document.createElementNS(SVG_NS, 'ellipse');
  halo.setAttribute('cx', String(-rx * 0.15));
  halo.setAttribute('cy', String(-size * 0.05));
  halo.setAttribute('rx', String(rx * 2));
  halo.setAttribute('ry', String(rx * 1.4));
  halo.setAttribute('fill', `url(#${haloId})`);
  innerG.appendChild(halo);

  // ── Ground contact shadow ───────────────────────────────────────────
  const groundShadowId = `cache-gshadow-${entityId}`;
  if (!defs.querySelector(`#${groundShadowId}`)) {
    const gsg = document.createElementNS(SVG_NS, 'radialGradient');
    gsg.setAttribute('id', groundShadowId);
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
  groundShadow.setAttribute('cy', String(botY + ry * 0.6));
  groundShadow.setAttribute('rx', String(rx * 1.1));
  groundShadow.setAttribute('ry', String(ry * 0.45));
  groundShadow.setAttribute('fill', `url(#${groundShadowId})`);
  innerG.appendChild(groundShadow);

  // ── Ambient occlusion ───────────────────────────────────────────────
  const aoId = `cache-ao-${entityId}`;
  if (!defs.querySelector(`#${aoId}`)) {
    const aoGrad = document.createElementNS(SVG_NS, 'radialGradient');
    aoGrad.setAttribute('id', aoId);
    aoGrad.setAttribute('cx', '70%'); aoGrad.setAttribute('cy', '75%'); aoGrad.setAttribute('r', '60%');
    const ao1 = document.createElementNS(SVG_NS, 'stop');
    ao1.setAttribute('offset', '0%'); ao1.setAttribute('stop-color', '#000000'); ao1.setAttribute('stop-opacity', '0.12');
    const ao2 = document.createElementNS(SVG_NS, 'stop');
    ao2.setAttribute('offset', '100%'); ao2.setAttribute('stop-color', '#000000'); ao2.setAttribute('stop-opacity', '0');
    aoGrad.appendChild(ao1); aoGrad.appendChild(ao2);
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

  // ── Gradient IDs (unique per instance) ──────────────────────────────
  const capGradId = `cache-cap-${entityId}`;
  const bodyGradId = `cache-body-${entityId}`;
  const boltGradId = `cache-bolt-${entityId}`;
  const glowFilterId = `cache-glow-${entityId}`;

  // Top cap radial gradient (white center → color → transparent edge)
  if (!defs.querySelector(`#${capGradId}`)) {
    const grad = document.createElementNS(SVG_NS, 'radialGradient');
    grad.setAttribute('id', capGradId);
    grad.setAttribute('cx', '50%'); grad.setAttribute('cy', '50%');
    grad.setAttribute('r', '50%');
    const s1 = document.createElementNS(SVG_NS, 'stop');
    s1.setAttribute('offset', '0%');
    s1.setAttribute('stop-color', '#ffffff');
    s1.setAttribute('stop-opacity', '0.9');
    const s2 = document.createElementNS(SVG_NS, 'stop');
    s2.setAttribute('offset', '40%');
    s2.setAttribute('stop-color', color);
    s2.setAttribute('stop-opacity', '0.85');
    const s3 = document.createElementNS(SVG_NS, 'stop');
    s3.setAttribute('offset', '100%');
    s3.setAttribute('stop-color', color);
    s3.setAttribute('stop-opacity', '0.4');
    grad.appendChild(s1); grad.appendChild(s2); grad.appendChild(s3);
    defs.appendChild(grad);
  }

  // Body linear gradient (dark glass tube: slightly lit top → very dark bottom)
  if (!defs.querySelector(`#${bodyGradId}`)) {
    const grad = document.createElementNS(SVG_NS, 'linearGradient');
    grad.setAttribute('id', bodyGradId);
    grad.setAttribute('x1', '0%'); grad.setAttribute('y1', '0%');
    grad.setAttribute('x2', '0%'); grad.setAttribute('y2', '100%');
    const s1 = document.createElementNS(SVG_NS, 'stop');
    s1.setAttribute('offset', '0%');
    s1.setAttribute('stop-color', color);
    s1.setAttribute('stop-opacity', '0.25');
    const s2 = document.createElementNS(SVG_NS, 'stop');
    s2.setAttribute('offset', '100%');
    s2.setAttribute('stop-color', color);
    s2.setAttribute('stop-opacity', '0.06');
    grad.appendChild(s1); grad.appendChild(s2);
    defs.appendChild(grad);
  }

  // Lightning bolt gradient (white top → color bottom — lit from above)
  if (!defs.querySelector(`#${boltGradId}`)) {
    const grad = document.createElementNS(SVG_NS, 'linearGradient');
    grad.setAttribute('id', boltGradId);
    grad.setAttribute('x1', '0%'); grad.setAttribute('y1', '0%');
    grad.setAttribute('x2', '0%'); grad.setAttribute('y2', '100%');
    const s1 = document.createElementNS(SVG_NS, 'stop');
    s1.setAttribute('offset', '0%');
    s1.setAttribute('stop-color', '#ffffff');
    s1.setAttribute('stop-opacity', '0.95');
    const s2 = document.createElementNS(SVG_NS, 'stop');
    s2.setAttribute('offset', '100%');
    s2.setAttribute('stop-color', color);
    s2.setAttribute('stop-opacity', '1');
    grad.appendChild(s1); grad.appendChild(s2);
    defs.appendChild(grad);
  }

  // Glow filter (for top cap and bolt — electric halo)
  if (!defs.querySelector(`#${glowFilterId}`)) {
    const filter = document.createElementNS(SVG_NS, 'filter');
    filter.setAttribute('id', glowFilterId);
    filter.setAttribute('x', '-50%'); filter.setAttribute('y', '-50%');
    filter.setAttribute('width', '200%'); filter.setAttribute('height', '200%');
    const fds = document.createElementNS(SVG_NS, 'feDropShadow');
    fds.setAttribute('dx', '0'); fds.setAttribute('dy', '0');
    fds.setAttribute('stdDeviation', '4');
    fds.setAttribute('flood-color', color);
    fds.setAttribute('flood-opacity', '0.9');
    filter.appendChild(fds);
    defs.appendChild(filter);
  }

  // ── Highlight glow ring ──────────────────────────────────────────────
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

  // ── Cylinder body (dark glass tube) ─────────────────────────────────
  const bodyFill = document.createElementNS(SVG_NS, 'rect');
  bodyFill.setAttribute('x', String(-rx));
  bodyFill.setAttribute('y', String(topY));
  bodyFill.setAttribute('width', String(rx * 2));
  bodyFill.setAttribute('height', String(bodyH));
  bodyFill.setAttribute('fill', `url(#${bodyGradId})`);
  innerG.appendChild(bodyFill);

  // Vertical side lines
  for (const xSign of [-1, 1]) {
    const line = document.createElementNS(SVG_NS, 'line');
    line.setAttribute('x1', String(xSign * rx));
    line.setAttribute('y1', String(topY));
    line.setAttribute('x2', String(xSign * rx));
    line.setAttribute('y2', String(botY));
    line.setAttribute('stroke', cc.stroke);
    line.setAttribute('stroke-width', String(STROKE.default));
    innerG.appendChild(line);
  }

  // ── Bottom cap (dim, fading) ─────────────────────────────────────────
  const botEllipse = document.createElementNS(SVG_NS, 'ellipse');
  botEllipse.setAttribute('cx', '0');
  botEllipse.setAttribute('cy', String(botY));
  botEllipse.setAttribute('rx', String(rx));
  botEllipse.setAttribute('ry', String(ry));
  botEllipse.setAttribute('fill', `${color}10`);
  botEllipse.setAttribute('stroke', cc.strokeSoft);
  botEllipse.setAttribute('stroke-width', String(STROKE.default));
  innerG.appendChild(botEllipse);

  // ── Top cap (bright, glowing — under electrical load) ────────────────
  // Outer glow halo (behind cap)
  const capHalo = document.createElementNS(SVG_NS, 'ellipse');
  capHalo.setAttribute('cx', '0');
  capHalo.setAttribute('cy', String(topY));
  capHalo.setAttribute('rx', String(rx + 4));
  capHalo.setAttribute('ry', String(ry + 3));
  capHalo.setAttribute('fill', `${color}22`);
  capHalo.setAttribute('filter', `url(#${glowFilterId})`);
  innerG.appendChild(capHalo);

  // Cap fill (radial gradient — bright center)
  const capFill = document.createElementNS(SVG_NS, 'ellipse');
  capFill.setAttribute('cx', '0');
  capFill.setAttribute('cy', String(topY));
  capFill.setAttribute('rx', String(rx));
  capFill.setAttribute('ry', String(ry));
  capFill.setAttribute('fill', `url(#${capGradId})`);
  innerG.appendChild(capFill);

  // Cap ring stroke (bright, emphasized)
  const capRing = document.createElementNS(SVG_NS, 'ellipse');
  capRing.setAttribute('cx', '0');
  capRing.setAttribute('cy', String(topY));
  capRing.setAttribute('rx', String(rx));
  capRing.setAttribute('ry', String(ry));
  capRing.setAttribute('fill', 'none');
  capRing.setAttribute('stroke', cc.stroke);
  capRing.setAttribute('stroke-width', String(STROKE.emphasized));
  innerG.appendChild(capRing);

  // ── Lightning bolt (gradient fill, glow — centered in body) ──────────
  const boltCY = topY + bodyH * 0.5;
  const bs = rx * 0.38;

  const boltD = [
    `M ${-bs * 0.12} ${boltCY - bs}`,
    `L ${bs * 0.42} ${boltCY - bs * 0.08}`,
    `L ${bs * 0.02} ${boltCY - bs * 0.08}`,
    `L ${bs * 0.12} ${boltCY + bs}`,
    `L ${-bs * 0.42} ${boltCY + bs * 0.08}`,
    `L ${-bs * 0.02} ${boltCY + bs * 0.08}`,
    'Z',
  ].join(' ');

  // Glow halo behind bolt
  const boltHalo = document.createElementNS(SVG_NS, 'path');
  boltHalo.setAttribute('d', boltD);
  boltHalo.setAttribute('fill', `${color}55`);
  boltHalo.setAttribute('filter', `url(#${glowFilterId})`);
  innerG.appendChild(boltHalo);

  // Bolt with gradient fill
  const bolt = document.createElementNS(SVG_NS, 'path');
  bolt.setAttribute('d', boltD);
  bolt.setAttribute('fill', `url(#${boltGradId})`);
  innerG.appendChild(bolt);

  // ── Luminous center glow dot on cap ──────────────────────────────────
  const glowDotId = `cacheDot_${entityId}`;
  if (!defs.querySelector(`#${glowDotId}`)) {
    const glowDotGrad = document.createElementNS(SVG_NS, 'radialGradient');
    glowDotGrad.setAttribute('id', glowDotId);
    [['0%', '#ffffff', '0.95'], ['60%', color, '0.7'], ['100%', color, '0']].forEach(([off, col, op]) => {
      const st = document.createElementNS(SVG_NS, 'stop');
      st.setAttribute('offset', off);
      st.setAttribute('stop-color', col);
      st.setAttribute('stop-opacity', op);
      glowDotGrad.appendChild(st);
    });
    defs.appendChild(glowDotGrad);
  }

  const glowDot = document.createElementNS(SVG_NS, 'ellipse');
  glowDot.setAttribute('cx', '0');
  glowDot.setAttribute('cy', String(topY));
  glowDot.setAttribute('rx', String(rx * 0.18));
  glowDot.setAttribute('ry', String(ry * 0.55));
  glowDot.setAttribute('fill', `url(#${glowDotId})`);
  glowDot.setAttribute('filter', `url(#${glowFilterId})`);
  innerG.appendChild(glowDot);

  // ── 4 subtle scan lines on body ─────────────────────────────────────
  for (let i = 0; i < 4; i++) {
    const ly = topY + bodyH * ((i + 1) / 5);
    const scanLine = document.createElementNS(SVG_NS, 'line');
    scanLine.setAttribute('x1', String(-rx * 0.8));
    scanLine.setAttribute('y1', String(ly));
    scanLine.setAttribute('x2', String(rx * 0.8));
    scanLine.setAttribute('y2', String(ly));
    scanLine.setAttribute('stroke', 'rgba(255,255,255,0.05)');
    scanLine.setAttribute('stroke-width', '0.5');
    scanLine.setAttribute('pointer-events', 'none');
    innerG.appendChild(scanLine);
  }

  // ── Specular highlight on top cap ───────────────────────────────────
  const specId = `cache-spec-${entityId}`;
  if (!defs.querySelector(`#${specId}`)) {
    const specGrad = document.createElementNS(SVG_NS, 'radialGradient');
    specGrad.setAttribute('id', specId);
    specGrad.setAttribute('cx', '35%'); specGrad.setAttribute('cy', '35%'); specGrad.setAttribute('r', '45%');
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

  // ── Breathing micro-animation — bolt pulse + cap breathe ────────────
  const styleId = `cache-style-${entityId}`;
  const svg = parentEl.ownerSVGElement ?? (parentEl as SVGSVGElement);
  if (!svg.querySelector(`#${styleId}`)) {
    const style = document.createElementNS(SVG_NS, 'style');
    style.setAttribute('id', styleId);
    style.textContent = `
      @keyframes cacheBreathe_${entityId} {
        0%, 100% { opacity: 0.7; transform: scale(1); }
        50% { opacity: 1; transform: scale(1.15); }
      }
      @keyframes cacheFloat_${entityId} {
        0%, 100% { transform: translateY(0); }
        50% { transform: translateY(-2.5px); }
      }
      .cache-breathe-${entityId} {
        animation: cacheBreathe_${entityId} 2.5s ease-in-out infinite;
      }
      .cache-float-${entityId} {
        animation: cacheFloat_${entityId} 3.5s ease-in-out infinite;
      }
    `;
    svg.insertBefore(style, svg.firstChild);
  }
  capFill.classList.add(`cache-breathe-${entityId}`);
  bolt.classList.add(`cache-breathe-${entityId}`);
  bolt.style.animationDelay = '0.5s';
  innerG.classList.add(`cache-float-${entityId}`);

  // ── Label below ──────────────────────────────────────────────────────
  if (entity.label) {
    const text = document.createElementNS(SVG_NS, 'text');
    text.setAttribute('x', '0');
    text.setAttribute('y', String(getCylinderLabelY(size)));
    text.setAttribute('text-anchor', LABEL_DEFAULTS.textAnchor);
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
