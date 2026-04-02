/**
 * @preplai/illustrations — FreeBodyDiagram Component (Cinematic 5 Pillars)
 *
 * Central body circle with force vectors at specified angles.
 * Glassmorphic depth: directional lighting, ground shadow, AO, specular, micro-life.
 * Arrow vectors remain clear with lighting overlays via pointer-events: none.
 *
 * Metadata:
 *   forces: Array<{ label: string, angle: number, magnitude?: number, color?: string }>
 *   angle in degrees: 0 = right, 90 = up
 */

import { SVG_NS, buildEntityGroup, applyEntranceAnimation, getSizeParam } from '../utils.js';
import {
  getLabelFontSize,
  TYPOGRAPHY,
  LABEL_DEFAULTS,
  colorWithAlpha,
  OPACITY,
} from '../design-tokens.js';
import { resolveColorCascade } from '../color-cascade.js';
import { ensureDefs } from '../visual-utils.js';
import type { VisualEntity } from '@preplai/shared';

type ForceDef = { label: string; angle: number; magnitude?: number; color?: string };

const BODY_R = 18;
const BASE_LEN = 28;
const HEAD_LEN = 10;

function drawForceArrow(
  parent: SVGGElement,
  angleDeg: number,
  magnitude: number,
  color: string,
  strokeWidth: number,
  bodyR: number,
): void {
  const angle = ((angleDeg - 90) * Math.PI) / 180;
  const len = BASE_LEN * Math.max(0.3, Math.min(2, magnitude));
  const x1 = Math.cos(angle) * bodyR;
  const y1 = Math.sin(angle) * bodyR;
  const x2 = Math.cos(angle) * (bodyR + len);
  const y2 = Math.sin(angle) * (bodyR + len);

  const line = document.createElementNS(SVG_NS, 'line');
  line.setAttribute('x1', String(x1));
  line.setAttribute('y1', String(y1));
  line.setAttribute('x2', String(x2));
  line.setAttribute('y2', String(y2));
  line.setAttribute('stroke', color);
  line.setAttribute('stroke-width', '2.5');
  line.setAttribute('stroke-linecap', 'round');
  parent.appendChild(line);

  const headAngle = Math.atan2(y2 - y1, x2 - x1);
  const ax = x2 - HEAD_LEN * Math.cos(headAngle);
  const ay = y2 - HEAD_LEN * Math.sin(headAngle);
  const arrow = document.createElementNS(SVG_NS, 'polygon');
  arrow.setAttribute(
    'points',
    `${x2},${y2} ${ax + HEAD_LEN * 0.5 * Math.cos(headAngle - Math.PI / 2)},${ay + HEAD_LEN * 0.5 * Math.sin(headAngle - Math.PI / 2)} ${ax + HEAD_LEN * 0.5 * Math.cos(headAngle + Math.PI / 2)},${ay + HEAD_LEN * 0.5 * Math.sin(headAngle + Math.PI / 2)}`,
  );
  arrow.setAttribute('fill', color);
  parent.appendChild(arrow);
}

export function renderFreeBodyDiagram(entity: VisualEntity, parentEl: SVGElement): SVGGElement {
  const { outerG, innerG } = buildEntityGroup(entity);

  const s = getSizeParam(entity);
  const scale = s / 50;
  const cc = resolveColorCascade(entity);
  const color = cc.base;
  const entityId = (entity.id ?? Math.random().toString(36).slice(2)).replace(/[^a-zA-Z0-9]/g, '').slice(0, 8);

  const meta = entity.metadata ?? {};
  const forcesRaw = (meta.forces as ForceDef[] | undefined) ?? [
    { label: 'F\u2081', angle: 0, magnitude: 1 },
    { label: 'F\u2082', angle: 90, magnitude: 1 },
    { label: 'F\u2083', angle: 180, magnitude: 1 },
    { label: 'N', angle: 270, magnitude: 1 },
  ];
  type ForceInput = { label?: unknown; name?: unknown; angle?: unknown; magnitude?: unknown; color?: unknown };
  const forces: ForceDef[] = Array.isArray(forcesRaw)
    ? (forcesRaw as ForceInput[])
        .filter((f) => f != null && typeof f === 'object')
        .map((f) => ({
          label: String(f.label ?? f.name ?? 'F'),
          angle: Number(f.angle ?? 0),
          magnitude: Math.max(0.1, Number(f.magnitude ?? 1)),
          color: typeof f.color === 'string' ? f.color : undefined,
        }))
    : [{ label: 'F', angle: 0, magnitude: 1 }];

  const fontSize = getLabelFontSize('value', 1) / scale;
  const defs = ensureDefs(parentEl);

  // Max extent for halo sizing
  const maxLen = BASE_LEN * 2 + BODY_R + 15;

  const scaleGroup = document.createElementNS(SVG_NS, 'g');
  scaleGroup.setAttribute('transform', `scale(${scale})`);

  // ── Pillar 1: Directional Lighting ────────────────────────────────────
  const haloId = `fbd-halo-${entityId}`;
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
  halo.setAttribute('cx', String(-maxLen * 0.08));
  halo.setAttribute('cy', String(-maxLen * 0.05));
  halo.setAttribute('rx', String(maxLen * 1.1));
  halo.setAttribute('ry', String(maxLen * 1.0));
  halo.setAttribute('fill', `url(#${haloId})`);
  scaleGroup.appendChild(halo);

  // ── Pillar 2: Ground Shadow ───────────────────────────────────────────
  const gsId = `fbd-gshadow-${entityId}`;
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
  groundShadow.setAttribute('cy', String(maxLen * 0.7));
  groundShadow.setAttribute('rx', String(maxLen * 0.5));
  groundShadow.setAttribute('ry', String(5));
  groundShadow.setAttribute('fill', `url(#${gsId})`);
  scaleGroup.appendChild(groundShadow);

  // ── Pillar 3: Ambient Occlusion ───────────────────────────────────────
  const aoId = `fbd-ao-${entityId}`;
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
  ao.setAttribute('cx', String(BODY_R * 0.3));
  ao.setAttribute('cy', String(BODY_R * 0.3));
  ao.setAttribute('rx', String(BODY_R * 1.5));
  ao.setAttribute('ry', String(BODY_R * 1.3));
  ao.setAttribute('fill', `url(#${aoId})`);
  ao.setAttribute('pointer-events', 'none');
  scaleGroup.appendChild(ao);

  // Central body
  const body = document.createElementNS(SVG_NS, 'circle');
  body.setAttribute('cx', '0');
  body.setAttribute('cy', '0');
  body.setAttribute('r', String(BODY_R));
  body.setAttribute('fill', colorWithAlpha(color, OPACITY.fillLight));
  body.setAttribute('stroke', cc.stroke);
  body.setAttribute('stroke-width', '2.5');
  scaleGroup.appendChild(body);

  // ── Pillar 4: Specular Highlight on body ──────────────────────────────
  const specId = `fbd-spec-${entityId}`;
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
  const specular = document.createElementNS(SVG_NS, 'circle');
  specular.setAttribute('cx', String(-BODY_R * 0.15));
  specular.setAttribute('cy', String(-BODY_R * 0.2));
  specular.setAttribute('r', String(BODY_R * 0.85));
  specular.setAttribute('fill', `url(#${specId})`);
  specular.setAttribute('pointer-events', 'none');
  scaleGroup.appendChild(specular);

  // Force arrows + labels
  forces.forEach((force) => {
    const vecColor = force.color ?? color;
    drawForceArrow(scaleGroup, force.angle, force.magnitude!, vecColor, 2.5, BODY_R);

    const angle = ((force.angle - 90) * Math.PI) / 180;
    const len = BASE_LEN * Math.max(0.3, Math.min(2, force.magnitude ?? 1));
    const labelX = Math.cos(angle) * (BODY_R + len + 12);
    const labelY = Math.sin(angle) * (BODY_R + len + 12);

    const text = document.createElementNS(SVG_NS, 'text');
    text.setAttribute('x', String(labelX));
    text.setAttribute('y', String(labelY));
    text.setAttribute('text-anchor', LABEL_DEFAULTS.textAnchor);
    text.setAttribute('dominant-baseline', 'central');
    text.setAttribute('fill', vecColor);
    text.setAttribute('font-size', String(fontSize));
    text.setAttribute('font-weight', String(TYPOGRAPHY.fontWeightEmphasis));
    text.setAttribute('font-family', TYPOGRAPHY.fontLabel);
    text.textContent = force.label.length > 6 ? force.label.slice(0, 5) + '\u2026' : force.label;
    scaleGroup.appendChild(text);
  });

  innerG.appendChild(scaleGroup);

  // ── Pillar 5: Micro-Life ──────────────────────────────────────────────
  const styleId = `fbd-style-${entityId}`;
  const svg = parentEl.ownerSVGElement ?? (parentEl as SVGSVGElement);
  if (!svg.querySelector(`#${styleId}`)) {
    const style = document.createElementNS(SVG_NS, 'style');
    style.setAttribute('id', styleId);
    style.textContent = `
      @keyframes fbdFloat_${entityId} {
        0%, 100% { transform: translateY(0); }
        50% { transform: translateY(-2.5px); }
      }
      @keyframes fbdBreathe_${entityId} {
        0%, 100% { transform: scale(1); }
        50% { transform: scale(1.03); }
      }
      .fbd-float-${entityId} {
        animation: fbdFloat_${entityId} 3.5s ease-in-out infinite;
      }
      .fbd-breathe-${entityId} {
        animation: fbdBreathe_${entityId} 2.8s ease-in-out infinite;
      }
    `;
    svg.insertBefore(style, svg.firstChild);
  }
  innerG.classList.add(`fbd-float-${entityId}`);
  body.classList.add(`fbd-breathe-${entityId}`);

  if (entity.label) {
    const labelEl = document.createElementNS(SVG_NS, 'text');
    labelEl.setAttribute('x', '0');
    labelEl.setAttribute('y', String((BODY_R + 20) * scale + LABEL_DEFAULTS.offsetBelow));
    labelEl.setAttribute('text-anchor', LABEL_DEFAULTS.textAnchor);
    labelEl.setAttribute('fill', cc.textPrimary);
    labelEl.setAttribute('font-size', String(getLabelFontSize('label', scale)));
    labelEl.setAttribute('font-weight', String(TYPOGRAPHY.fontWeightLabel));
    labelEl.setAttribute('font-family', TYPOGRAPHY.fontLabel);
    labelEl.textContent = entity.label;
    innerG.appendChild(labelEl);
  }

  applyEntranceAnimation(innerG, entity);
  parentEl.appendChild(outerG);
  return outerG;
}
