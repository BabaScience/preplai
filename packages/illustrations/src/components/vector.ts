/**
 * @preplai/illustrations — Vector Component (Cinematic 5 Pillars)
 *
 * Single vector arrow from origin with glassmorphic depth.
 * Directional lighting, ground shadow, AO, specular, micro-life.
 * Arrow remains clear with lighting overlays via pointer-events: none.
 *
 * Metadata:
 *   dx, dy: number — vector components (default 3, 2)
 *   label?: string — label near arrow (e.g. "v\u20D7", "F")
 *   showMagnitude?: boolean — show |v| below arrow
 */

import { SVG_NS, buildEntityGroup, applyEntranceAnimation, getSizeParam } from '../utils.js';
import {
  getStrokeWidth,
  getLabelFontSize,
  TYPOGRAPHY,
  LABEL_DEFAULTS,
} from '../design-tokens.js';
import { resolveColorCascade } from '../color-cascade.js';
import { ensureDefs } from '../visual-utils.js';
import type { VisualEntity } from '@preplai/shared';

const UNIT_SCALE = 12;
const HEAD_LEN = 10;

export function renderVector(entity: VisualEntity, parentEl: SVGElement): SVGGElement {
  const { outerG, innerG } = buildEntityGroup(entity);

  const s = getSizeParam(entity);
  const scale = s / 50;
  const cc = resolveColorCascade(entity);
  const color = cc.base;
  const entityId = (entity.id ?? Math.random().toString(36).slice(2)).replace(/[^a-zA-Z0-9]/g, '').slice(0, 8);
  const _strokeWidth = getStrokeWidth('thin', scale);
  const fontSize = getLabelFontSize('value', scale);

  const meta = entity.metadata ?? {};
  let dx = Number(meta.dx);
  let dy = Number(meta.dy);
  if (Number.isNaN(dx)) dx = 3;
  if (Number.isNaN(dy)) dy = 2;
  if (dx === 0 && dy === 0) dx = 1;
  const label = (meta.label as string) ?? '';
  const showMagnitude = meta.showMagnitude === true;

  const unitScale = UNIT_SCALE * scale;
  const ox = 0;
  const oy = 0;
  const ex = dx * unitScale;
  const ey = -dy * unitScale;

  // Bounding extents for shadow/halo sizing
  const extentX = Math.max(Math.abs(ex), Math.abs(ox)) + 10;
  const extentY = Math.max(Math.abs(ey), Math.abs(oy)) + 10;

  const defs = ensureDefs(parentEl);

  // ── Pillar 1: Directional Lighting ────────────────────────────────────
  const haloId = `vec-halo-${entityId}`;
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
  halo.setAttribute('cx', String(ex * 0.3));
  halo.setAttribute('cy', String(ey * 0.3));
  halo.setAttribute('rx', String(extentX * 1.2));
  halo.setAttribute('ry', String(extentY * 1.2));
  halo.setAttribute('fill', `url(#${haloId})`);
  innerG.appendChild(halo);

  // ── Pillar 2: Ground Shadow ───────────────────────────────────────────
  const gsId = `vec-gshadow-${entityId}`;
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
  groundShadow.setAttribute('cx', String(ex * 0.4));
  groundShadow.setAttribute('cy', String(Math.max(oy, ey) + 8));
  groundShadow.setAttribute('rx', String(extentX * 0.5));
  groundShadow.setAttribute('ry', String(4));
  groundShadow.setAttribute('fill', `url(#${gsId})`);
  innerG.appendChild(groundShadow);

  // ── Pillar 3: Ambient Occlusion ───────────────────────────────────────
  const aoId = `vec-ao-${entityId}`;
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
  const ao = document.createElementNS(SVG_NS, 'ellipse');
  ao.setAttribute('cx', String(ex * 0.5));
  ao.setAttribute('cy', String(ey * 0.5));
  ao.setAttribute('rx', String(extentX * 0.8));
  ao.setAttribute('ry', String(extentY * 0.6));
  ao.setAttribute('fill', `url(#${aoId})`);
  ao.setAttribute('pointer-events', 'none');
  innerG.appendChild(ao);

  // Origin dot
  const origin = document.createElementNS(SVG_NS, 'circle');
  origin.setAttribute('cx', String(ox));
  origin.setAttribute('cy', String(oy));
  origin.setAttribute('r', String(3 * scale));
  origin.setAttribute('fill', color);
  origin.setAttribute('stroke', cc.stroke);
  origin.setAttribute('stroke-width', '2.5');
  innerG.appendChild(origin);

  // Arrow line
  const line = document.createElementNS(SVG_NS, 'line');
  line.setAttribute('x1', String(ox));
  line.setAttribute('y1', String(oy));
  line.setAttribute('x2', String(ex));
  line.setAttribute('y2', String(ey));
  line.setAttribute('stroke', cc.stroke);
  line.setAttribute('stroke-width', '2.5');
  line.setAttribute('stroke-linecap', 'round');
  innerG.appendChild(line);

  // Arrowhead
  const angle = Math.atan2(ey - oy, ex - ox);
  const headScale = scale;
  const ax = ex - HEAD_LEN * headScale * Math.cos(angle);
  const ay = ey - HEAD_LEN * headScale * Math.sin(angle);
  const arrow = document.createElementNS(SVG_NS, 'polygon');
  arrow.setAttribute(
    'points',
    `${ex},${ey} ${ax + HEAD_LEN * 0.5 * headScale * Math.cos(angle - Math.PI / 2)},${ay + HEAD_LEN * 0.5 * headScale * Math.sin(angle - Math.PI / 2)} ${ax + HEAD_LEN * 0.5 * headScale * Math.cos(angle + Math.PI / 2)},${ay + HEAD_LEN * 0.5 * headScale * Math.sin(angle + Math.PI / 2)}`,
  );
  arrow.setAttribute('fill', color);
  innerG.appendChild(arrow);

  // ── Pillar 4: Specular Highlight ──────────────────────────────────────
  const specId = `vec-spec-${entityId}`;
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
  specular.setAttribute('cx', String(ex * 0.35));
  specular.setAttribute('cy', String(ey * 0.25));
  specular.setAttribute('rx', String(extentX * 0.5));
  specular.setAttribute('ry', String(extentY * 0.4));
  specular.setAttribute('fill', `url(#${specId})`);
  specular.setAttribute('pointer-events', 'none');
  innerG.appendChild(specular);

  // Label (offset from arrow midpoint)
  const midX = (ox + ex) / 2;
  const midY = (oy + ey) / 2;
  const labelOffset = 8 * scale;

  if (label) {
    const tl = document.createElementNS(SVG_NS, 'text');
    tl.setAttribute('x', String(midX + labelOffset));
    tl.setAttribute('y', String(midY - labelOffset));
    tl.setAttribute('fill', cc.textPrimary);
    tl.setAttribute('font-size', String(fontSize));
    tl.setAttribute('font-weight', String(TYPOGRAPHY.fontWeightEmphasis));
    tl.setAttribute('font-family', TYPOGRAPHY.fontLabel);
    tl.textContent = label;
    innerG.appendChild(tl);
  }

  if (showMagnitude) {
    const mag = Math.sqrt(dx * dx + dy * dy);
    const magText = document.createElementNS(SVG_NS, 'text');
    magText.setAttribute('x', String(midX - labelOffset));
    magText.setAttribute('y', String(midY + labelOffset + fontSize));
    magText.setAttribute('fill', cc.textPrimary);
    magText.setAttribute('font-size', String(fontSize * 0.9));
    magText.setAttribute('font-family', TYPOGRAPHY.fontBadge);
    magText.textContent = `|v| = ${mag.toFixed(2)}`;
    innerG.appendChild(magText);
  }

  // ── Pillar 5: Micro-Life ──────────────────────────────────────────────
  const styleId = `vec-style-${entityId}`;
  const svg = parentEl.ownerSVGElement ?? (parentEl as SVGSVGElement);
  if (!svg.querySelector(`#${styleId}`)) {
    const style = document.createElementNS(SVG_NS, 'style');
    style.setAttribute('id', styleId);
    style.textContent = `
      @keyframes vecFloat_${entityId} {
        0%, 100% { transform: translateY(0); }
        50% { transform: translateY(-2px); }
      }
      @keyframes vecPulse_${entityId} {
        0%, 100% { transform: scale(1); }
        50% { transform: scale(1.04); }
      }
      .vec-float-${entityId} {
        animation: vecFloat_${entityId} 3.4s ease-in-out infinite;
      }
      .vec-pulse-${entityId} {
        animation: vecPulse_${entityId} 2.5s ease-in-out infinite;
      }
    `;
    svg.insertBefore(style, svg.firstChild);
  }
  innerG.classList.add(`vec-float-${entityId}`);
  arrow.classList.add(`vec-pulse-${entityId}`);

  // Entity label below
  if (entity.label) {
    const title = document.createElementNS(SVG_NS, 'text');
    title.setAttribute('x', '0');
    title.setAttribute('y', String(Math.max(Math.abs(ey), Math.abs(oy)) + LABEL_DEFAULTS.offsetBelow));
    title.setAttribute('text-anchor', LABEL_DEFAULTS.textAnchor);
    title.setAttribute('fill', cc.textPrimary);
    title.setAttribute('font-size', String(getLabelFontSize('label', scale)));
    title.setAttribute('font-weight', String(TYPOGRAPHY.fontWeightLabel));
    title.setAttribute('font-family', TYPOGRAPHY.fontLabel);
    title.textContent = entity.label;
    innerG.appendChild(title);
  }

  applyEntranceAnimation(innerG, entity);
  parentEl.appendChild(outerG);
  return outerG;
}
