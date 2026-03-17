/**
 * @preplai/illustrations — DataLake Component
 * Wide, shallow cylinder with wavy lines representing raw/unstructured data storage.
 */

import { SVG_NS, buildEntityGroup, applyEntranceAnimation, getSizeParam } from '../utils.js';
import { createLinearGradient, ensureDefs, ensureGlassFilter } from '../visual-utils.js';
import { getCategoryColor, TYPOGRAPHY, STROKE } from '../design-tokens.js';
import type { VisualEntity } from '@preplai/shared';

export function renderDataLake(entity: VisualEntity, parentEl: SVGElement): SVGGElement {
  const { outerG, innerG } = buildEntityGroup(entity);
  const size = getSizeParam(entity);
  const color = entity.color ?? getCategoryColor('DataLake');
  const meta = (entity.metadata ?? {}) as { provider?: string; format?: string };

  const defs = ensureDefs(parentEl);
  const gradId = `grad-datalake-${color.replace(/[^a-fA-F0-9]/g, '')}`;
  createLinearGradient(gradId, color, 'vertical', defs);

  // Wide and shallow proportions (wider than Database, shorter)
  const rx = size * 1.2;     // ~60px half-width at size=50
  const ry = size / 8;       // flatter ellipse than Database
  const bodyH = size * 0.45; // shorter body
  const topY = -bodyH / 2 - ry / 2;
  const botY = topY + bodyH;

  // ── Glass-filtered body group ──
  const bodyG = document.createElementNS(SVG_NS, 'g') as SVGGElement;
  bodyG.setAttribute('filter', ensureGlassFilter(parentEl));
  innerG.appendChild(bodyG);

  // ── Top ellipse (cap) ──
  const topEllipse = document.createElementNS(SVG_NS, 'ellipse');
  topEllipse.setAttribute('cx', '0');
  topEllipse.setAttribute('cy', String(topY));
  topEllipse.setAttribute('rx', String(rx));
  topEllipse.setAttribute('ry', String(ry));
  topEllipse.setAttribute('fill', `${color}25`);
  topEllipse.setAttribute('stroke', color);
  topEllipse.setAttribute('stroke-width', String(STROKE.default));
  bodyG.appendChild(topEllipse);

  // ── Body fill ──
  const bodyFill = document.createElementNS(SVG_NS, 'rect');
  bodyFill.setAttribute('x', String(-rx));
  bodyFill.setAttribute('y', String(topY));
  bodyFill.setAttribute('width', String(rx * 2));
  bodyFill.setAttribute('height', String(bodyH));
  bodyFill.setAttribute('fill', `url(#${gradId})`);
  bodyFill.setAttribute('stroke', 'none');
  bodyG.appendChild(bodyFill);

  // ── Bottom ellipse (base) ──
  const botEllipse = document.createElementNS(SVG_NS, 'ellipse');
  botEllipse.setAttribute('cx', '0');
  botEllipse.setAttribute('cy', String(botY));
  botEllipse.setAttribute('rx', String(rx));
  botEllipse.setAttribute('ry', String(ry));
  botEllipse.setAttribute('fill', `${color}15`);
  botEllipse.setAttribute('stroke', color);
  botEllipse.setAttribute('stroke-width', String(STROKE.default));
  bodyG.appendChild(botEllipse);

  // ── Side lines ──
  for (const xSign of [-1, 1]) {
    const line = document.createElementNS(SVG_NS, 'line');
    line.setAttribute('x1', String(xSign * rx));
    line.setAttribute('y1', String(topY));
    line.setAttribute('x2', String(xSign * rx));
    line.setAttribute('y2', String(botY));
    line.setAttribute('stroke', color);
    line.setAttribute('stroke-width', String(STROKE.default));
    bodyG.appendChild(line);
  }

  // ── Wavy lines inside the body (suggesting unstructured/raw data) ──
  const waveAmplitude = bodyH * 0.06;
  const waveWidth = rx * 0.8;
  const waveOffsets = [0.3, 0.55, 0.8];

  for (const t of waveOffsets) {
    const wy = topY + bodyH * t;
    // Build sine wave path with ~8 segments
    const segments = 8;
    const step = (waveWidth * 2) / segments;
    let d = `M ${-waveWidth} ${wy}`;
    for (let i = 1; i <= segments; i++) {
      const x = -waveWidth + i * step;
      const cp1x = -waveWidth + (i - 0.5) * step;
      const direction = i % 2 === 1 ? -1 : 1;
      d += ` Q ${cp1x} ${wy + direction * waveAmplitude} ${x} ${wy}`;
    }
    const wave = document.createElementNS(SVG_NS, 'path');
    wave.setAttribute('d', d);
    wave.setAttribute('fill', 'none');
    wave.setAttribute('stroke', color);
    wave.setAttribute('stroke-width', String(STROKE.thin));
    wave.setAttribute('opacity', '0.4');
    innerG.appendChild(wave);
  }

  // ── Provider badge (bottom-right) ──
  if (meta.provider) {
    const badgeText = document.createElementNS(SVG_NS, 'text');
    badgeText.setAttribute('x', String(rx - 6));
    badgeText.setAttribute('y', String(botY + ry - 2));
    badgeText.setAttribute('text-anchor', 'end');
    badgeText.setAttribute('fill', color);
    badgeText.setAttribute('font-size', String(TYPOGRAPHY.fontSizeIndex));
    badgeText.setAttribute('font-weight', String(TYPOGRAPHY.fontWeightLabel));
    badgeText.setAttribute('font-family', TYPOGRAPHY.fontBadge);
    badgeText.setAttribute('opacity', '0.6');
    badgeText.textContent = meta.provider;
    innerG.appendChild(badgeText);
  }

  // ── Entity label below ──
  if (entity.label) {
    const label = document.createElementNS(SVG_NS, 'text');
    label.setAttribute('x', '0');
    label.setAttribute('y', String(botY + ry + 20));
    label.setAttribute('text-anchor', 'middle');
    label.setAttribute('fill', color);
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
