/**
 * @preplai/illustrations — Sidecar Component
 * A small proxy box visually attached to a parent service (Envoy, Istio, Linkerd).
 */

import { SVG_NS, buildEntityGroup, applyEntranceAnimation, getSizeParam } from '../utils.js';
import { getCategoryColor, TYPOGRAPHY, STROKE, OPACITY, colorWithAlpha } from '../design-tokens.js';
import type { VisualEntity } from '@preplai/shared';

export function renderSidecar(entity: VisualEntity, parentEl: SVGElement): SVGGElement {
  const { outerG, innerG } = buildEntityGroup(entity);
  const size = getSizeParam(entity);
  const color = entity.color ?? getCategoryColor('Sidecar');

  const meta = entity.metadata ?? {};
  const proxy = (meta.proxy as string) ?? 'Envoy';

  const scale = size / 50;
  const mainW = 80 * scale;
  const mainH = 50 * scale;
  const sideW = 40 * scale;
  const sideH = mainH;
  const totalW = mainW + sideW;
  const rx = 4 * scale;

  // ── Main service box (left) ──
  const mainRect = document.createElementNS(SVG_NS, 'rect');
  mainRect.setAttribute('x', String(-totalW / 2));
  mainRect.setAttribute('y', String(-mainH / 2));
  mainRect.setAttribute('width', String(mainW));
  mainRect.setAttribute('height', String(mainH));
  mainRect.setAttribute('rx', String(rx));
  mainRect.setAttribute('fill', colorWithAlpha(color, OPACITY.fillLight));
  mainRect.setAttribute('stroke', color);
  mainRect.setAttribute('stroke-width', String(STROKE.default));
  innerG.appendChild(mainRect);

  // ── Service icon (small server lines inside main box) ──
  const svcCx = -totalW / 2 + mainW / 2;
  for (const yOff of [-6 * scale, 0, 6 * scale]) {
    const line = document.createElementNS(SVG_NS, 'line');
    line.setAttribute('x1', String(svcCx - 10 * scale));
    line.setAttribute('y1', String(yOff));
    line.setAttribute('x2', String(svcCx + 10 * scale));
    line.setAttribute('y2', String(yOff));
    line.setAttribute('stroke', color);
    line.setAttribute('stroke-width', String(STROKE.thin));
    line.setAttribute('opacity', '0.5');
    innerG.appendChild(line);
  }

  // ── Sidecar box (right, slightly more visible fill) ──
  const sideRect = document.createElementNS(SVG_NS, 'rect');
  sideRect.setAttribute('x', String(-totalW / 2 + mainW));
  sideRect.setAttribute('y', String(-sideH / 2));
  sideRect.setAttribute('width', String(sideW));
  sideRect.setAttribute('height', String(sideH));
  sideRect.setAttribute('rx', String(rx));
  sideRect.setAttribute('fill', colorWithAlpha(color, OPACITY.fillMedium));
  sideRect.setAttribute('stroke', color);
  sideRect.setAttribute('stroke-width', String(STROKE.default));
  innerG.appendChild(sideRect);

  // ── Mesh icon (3 connected dots) inside sidecar ──
  const meshCx = -totalW / 2 + mainW + sideW / 2;
  const meshCy = -6 * scale;
  const dotR = 2.5 * scale;
  const dotSpread = 8 * scale;

  // Three dots in a triangle
  const dots: [number, number][] = [
    [meshCx, meshCy - dotSpread * 0.6],
    [meshCx - dotSpread * 0.5, meshCy + dotSpread * 0.4],
    [meshCx + dotSpread * 0.5, meshCy + dotSpread * 0.4],
  ];

  // Connecting lines between dots
  for (let i = 0; i < dots.length; i++) {
    for (let j = i + 1; j < dots.length; j++) {
      const conn = document.createElementNS(SVG_NS, 'line');
      conn.setAttribute('x1', String(dots[i][0]));
      conn.setAttribute('y1', String(dots[i][1]));
      conn.setAttribute('x2', String(dots[j][0]));
      conn.setAttribute('y2', String(dots[j][1]));
      conn.setAttribute('stroke', color);
      conn.setAttribute('stroke-width', String(STROKE.minimal));
      conn.setAttribute('opacity', '0.7');
      innerG.appendChild(conn);
    }
  }

  // Dots
  for (const [dx, dy] of dots) {
    const dot = document.createElementNS(SVG_NS, 'circle');
    dot.setAttribute('cx', String(dx));
    dot.setAttribute('cy', String(dy));
    dot.setAttribute('r', String(dotR));
    dot.setAttribute('fill', color);
    dot.setAttribute('opacity', '0.9');
    innerG.appendChild(dot);
  }

  // ── Proxy name text inside sidecar ──
  const proxyText = document.createElementNS(SVG_NS, 'text');
  proxyText.setAttribute('x', String(meshCx));
  proxyText.setAttribute('y', String(sideH / 2 - 6 * scale));
  proxyText.setAttribute('text-anchor', 'middle');
  proxyText.setAttribute('fill', color);
  proxyText.setAttribute('font-size', String(TYPOGRAPHY.fontSizeInline * scale));
  proxyText.setAttribute('font-weight', String(TYPOGRAPHY.fontWeightLabel));
  proxyText.setAttribute('font-family', TYPOGRAPHY.fontBadge);
  proxyText.textContent = proxy;
  innerG.appendChild(proxyText);

  // ── Entity label below ──
  if (entity.label) {
    const text = document.createElementNS(SVG_NS, 'text');
    text.setAttribute('x', '0');
    text.setAttribute('y', String(mainH / 2 + 18));
    text.setAttribute('text-anchor', 'middle');
    text.setAttribute('fill', color);
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
