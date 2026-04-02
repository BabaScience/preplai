/**
 * @preplai/illustrations — Database Component
 *
 * Clean cylinder shape with glowing status dots on top cap.
 * Use for: databases, data stores, persistent storage.
 *
 * Visual depth: radial halo, glowing status dots, LED connection indicators.
 */

import { SVG_NS, buildEntityGroup, applyEntranceAnimation, getSizeParam } from '../utils.js';
import { TYPOGRAPHY, STROKE, LABEL_DEFAULTS } from '../design-tokens.js';import { resolveColorCascade, applyGlowColors } from '../color-cascade.js';
import { renderCylinderBase, getCylinderLabelY } from '../cylinder-utils.js';
import { ensureDefs, ensureGlowFilter, ensureGlassFilter } from '../visual-utils.js';
import type { VisualEntity } from '@preplai/shared';

export function renderDatabase(entity: VisualEntity, parentEl: SVGElement): SVGGElement {
  const { outerG, innerG } = buildEntityGroup(entity);
  const size = getSizeParam(entity);
  const cc = resolveColorCascade(entity);
  const color = cc.base;
  const entityId = (entity.id ?? Math.random().toString(36).slice(2)).replace(/[^a-zA-Z0-9]/g, '').slice(0, 8);
  const gradId = `grad-db-${cc.base.replace(/[^a-fA-F0-9]/g, '')}`;

  const rx = size / 2;
  const ry = size / 6;
  const topY = -size / 3;

  const defs = ensureDefs(parentEl);

  // ── Radial depth halo ────────────────────────────────────────────────
  const haloId = `db-halo-${entityId}`;
  if (!defs.querySelector(`#${haloId}`)) {
    const grad = document.createElementNS(SVG_NS, 'radialGradient');
    grad.setAttribute('id', haloId);
    grad.setAttribute('cx', '38%'); grad.setAttribute('cy', '38%');
    grad.setAttribute('r', '50%');
    const hs1 = document.createElementNS(SVG_NS, 'stop');
    hs1.setAttribute('offset', '0%');
    hs1.setAttribute('stop-color', color);
    hs1.setAttribute('stop-opacity', '0.13');
    const hs2 = document.createElementNS(SVG_NS, 'stop');
    hs2.setAttribute('offset', '100%');
    hs2.setAttribute('stop-color', color);
    hs2.setAttribute('stop-opacity', '0');
    grad.appendChild(hs1); grad.appendChild(hs2);
    defs.appendChild(grad);
  }
  const halo = document.createElementNS(SVG_NS, 'ellipse');
  halo.setAttribute('cx', String(-rx * 0.15));
  halo.setAttribute('cy', String(-size * 0.05));
  halo.setAttribute('rx', String(rx * 2));
  halo.setAttribute('ry', String(rx * 1.4));
  halo.setAttribute('fill', `url(#${haloId})`);
  innerG.appendChild(halo);

  // ── Ground contact shadow ───────────────────────────────────────────
  const groundShadowId = `db-gshadow-${entityId}`;
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
  groundShadow.setAttribute('cy', String(topY + size * 0.55 + ry * 0.6));
  groundShadow.setAttribute('rx', String(rx * 1.1));
  groundShadow.setAttribute('ry', String(ry * 0.45));
  groundShadow.setAttribute('fill', `url(#${groundShadowId})`);
  innerG.appendChild(groundShadow);

  // ── Ambient occlusion ───────────────────────────────────────────────
  const aoId = `db-ao-${entityId}`;
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
  ao.setAttribute('height', String(size * 0.55));
  ao.setAttribute('fill', `url(#${aoId})`);
  ao.setAttribute('pointer-events', 'none');
  innerG.appendChild(ao);

  // Highlight glow (behind shape)
  if (entity.highlight) {
    const hRx = rx + 3;
    const hRy = ry + 2;
    const hTopY = topY - 3;
    const hBotY = topY + size * 0.55 + 3;
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

  // Outer color glow on cylinder body
  const glowUrl = ensureGlowFilter(parentEl, color);
  const glowBody = document.createElementNS(SVG_NS, 'rect');
  glowBody.setAttribute('x', String(-rx));
  glowBody.setAttribute('y', String(topY));
  glowBody.setAttribute('width', String(rx * 2));
  glowBody.setAttribute('height', String(size * 0.55));
  glowBody.setAttribute('fill', 'none');
  glowBody.setAttribute('stroke', color);
  glowBody.setAttribute('stroke-width', '1');
  glowBody.setAttribute('stroke-opacity', '0.4');
  glowBody.setAttribute('filter', glowUrl);
  innerG.appendChild(glowBody);

  renderCylinderBase(innerG, parentEl, {
    size,
    color: cc.base,
    gradId,
    stripeOffsets: [],
    glass: false,
  });

  // ── Glass filter on body ────────────────────────────────────────────
  const glassUrl = ensureGlassFilter(parentEl);
  const glassBody = document.createElementNS(SVG_NS, 'rect');
  glassBody.setAttribute('x', String(-rx));
  glassBody.setAttribute('y', String(topY));
  glassBody.setAttribute('width', String(rx * 2));
  glassBody.setAttribute('height', String(size * 0.55));
  glassBody.setAttribute('fill', 'rgba(255,255,255,0.03)');
  glassBody.setAttribute('filter', glassUrl);
  glassBody.setAttribute('pointer-events', 'none');
  innerG.appendChild(glassBody);

  // ── Material texture — 3 metallic sheen lines ───────────────────────
  for (let i = 0; i < 3; i++) {
    const ly = topY + size * 0.55 * ((i + 1) / 4);
    const sheenLine = document.createElementNS(SVG_NS, 'line');
    sheenLine.setAttribute('x1', String(-rx * 0.8));
    sheenLine.setAttribute('y1', String(ly));
    sheenLine.setAttribute('x2', String(rx * 0.8));
    sheenLine.setAttribute('y2', String(ly));
    sheenLine.setAttribute('stroke', 'rgba(255,255,255,0.06)');
    sheenLine.setAttribute('stroke-width', '0.5');
    sheenLine.setAttribute('pointer-events', 'none');
    innerG.appendChild(sheenLine);
  }

  // ── Specular highlight on top cap ───────────────────────────────────
  const specId = `db-spec-${entityId}`;
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

  // ── Glowing status dots on top cap ───────────────────────────────────
  const dotOpacities = [0.9, 0.7, 0.5];
  const dotXOffsets = [-rx * 0.4, 0, rx * 0.4];

  // ── Breathing micro-animation (staggered dot pulse) ──────────────────
  const styleId = `db-style-${entityId}`;
  const svg = parentEl.ownerSVGElement ?? (parentEl as SVGSVGElement);
  if (!svg.querySelector(`#${styleId}`)) {
    const style = document.createElementNS(SVG_NS, 'style');
    style.setAttribute('id', styleId);
    style.textContent = `
      @keyframes dbBreathe_${entityId} {
        0%, 100% { opacity: var(--db-base-op); transform: scale(1); }
        50% { opacity: 1; transform: scale(1.5); }
      }
      @keyframes dbFloat_${entityId} {
        0%, 100% { transform: translateY(0); }
        50% { transform: translateY(-2px); }
      }
      .db-dot-${entityId} {
        animation: dbBreathe_${entityId} 2s ease-in-out infinite;
      }
      .db-float-${entityId} {
        animation: dbFloat_${entityId} 3.5s ease-in-out infinite;
      }
    `;
    svg.insertBefore(style, svg.firstChild);
  }

  dotXOffsets.forEach((xOff, i) => {
    const dotGlowId = `dbDot${i}_${entityId}`;
    if (!defs.querySelector(`#${dotGlowId}`)) {
      const filter = document.createElementNS(SVG_NS, 'filter');
      filter.setAttribute('id', dotGlowId);
      filter.setAttribute('x', '-100%'); filter.setAttribute('y', '-100%');
      filter.setAttribute('width', '300%'); filter.setAttribute('height', '300%');
      const ds = document.createElementNS(SVG_NS, 'feDropShadow');
      ds.setAttribute('dx', '0'); ds.setAttribute('dy', '0');
      ds.setAttribute('stdDeviation', '3');
      ds.setAttribute('flood-color', color);
      ds.setAttribute('flood-opacity', String(dotOpacities[i]));
      filter.appendChild(ds);
      defs.appendChild(filter);
    }
    const dot = document.createElementNS(SVG_NS, 'circle');
    dot.setAttribute('cx', String(xOff));
    dot.setAttribute('cy', String(topY));
    dot.setAttribute('r', String(Math.max(2.5, rx * 0.07)));
    dot.setAttribute('fill', color);
    dot.setAttribute('opacity', String(dotOpacities[i]));
    dot.setAttribute('filter', `url(#${dotGlowId})`);
    dot.classList.add(`db-dot-${entityId}`);
    dot.style.setProperty('--db-base-op', String(dotOpacities[i]));
    dot.style.animationDelay = `${i * 0.4}s`;
    innerG.appendChild(dot);
  });
  innerG.classList.add(`db-float-${entityId}`);

  // Label below
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
