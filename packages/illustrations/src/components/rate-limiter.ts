/**
 * @preplai/illustrations — RateLimiter Component
 * A funnel/gauge icon with throttled flow drops.
 */

import { SVG_NS, buildEntityGroup, applyEntranceAnimation, getSizeParam } from '../utils.js';
import { getCategoryColor, TYPOGRAPHY, STROKE, OPACITY, colorWithAlpha } from '../design-tokens.js';
import type { VisualEntity } from '@preplai/shared';

export function renderRateLimiter(entity: VisualEntity, parentEl: SVGElement): SVGGElement {
  const { outerG, innerG } = buildEntityGroup(entity);
  const size = getSizeParam(entity);
  const color = entity.color ?? getCategoryColor('RateLimiter');

  const meta = entity.metadata ?? {};
  const limit = (meta.limit as string) ?? '1000 req/s';
  const algorithm = (meta.algorithm as string) ?? 'token-bucket';

  const scale = size / 50;

  // ── Funnel dimensions ──
  const topW = 70 * scale;
  const bottomW = 16 * scale;
  const funnelH = 55 * scale;
  const neckH = 10 * scale;

  // ── Funnel shape (trapezoid path) ──
  const funnel = document.createElementNS(SVG_NS, 'path');
  const funnelD = [
    `M ${-topW / 2} ${-funnelH / 2}`,
    `L ${topW / 2} ${-funnelH / 2}`,
    `L ${bottomW / 2} ${funnelH / 2 - neckH}`,
    `L ${bottomW / 2} ${funnelH / 2}`,
    `L ${-bottomW / 2} ${funnelH / 2}`,
    `L ${-bottomW / 2} ${funnelH / 2 - neckH}`,
    `L ${-topW / 2} ${-funnelH / 2}`,
    'Z',
  ].join(' ');
  funnel.setAttribute('d', funnelD);
  funnel.setAttribute('fill', colorWithAlpha(color, OPACITY.fillLight));
  funnel.setAttribute('stroke', color);
  funnel.setAttribute('stroke-width', String(STROKE.default));
  funnel.setAttribute('stroke-linejoin', 'round');
  innerG.appendChild(funnel);

  // ── Limit text inside the wide part ──
  const limitText = document.createElementNS(SVG_NS, 'text');
  limitText.setAttribute('x', '0');
  limitText.setAttribute('y', String(-funnelH / 2 + 18 * scale));
  limitText.setAttribute('text-anchor', 'middle');
  limitText.setAttribute('fill', color);
  limitText.setAttribute('font-size', String(TYPOGRAPHY.fontSizeValue * scale));
  limitText.setAttribute('font-weight', String(TYPOGRAPHY.fontWeightEmphasis));
  limitText.setAttribute('font-family', TYPOGRAPHY.fontBadge);
  limitText.textContent = limit;
  innerG.appendChild(limitText);

  // ── Throttled drops below funnel neck (3 small circles) ──
  const dropR = 3 * scale;
  const dropStartY = funnelH / 2 + 6 * scale;
  const dropPositions: [number, number][] = [
    [0, dropStartY],
    [-5 * scale, dropStartY + 8 * scale],
    [4 * scale, dropStartY + 14 * scale],
  ];

  for (const [dx, dy] of dropPositions) {
    const drop = document.createElementNS(SVG_NS, 'circle');
    drop.setAttribute('cx', String(dx));
    drop.setAttribute('cy', String(dy));
    drop.setAttribute('r', String(dropR));
    drop.setAttribute('fill', color);
    drop.setAttribute('opacity', '0.6');
    innerG.appendChild(drop);
  }

  // ── Algorithm label below funnel in monospace ──
  const algoText = document.createElementNS(SVG_NS, 'text');
  algoText.setAttribute('x', '0');
  algoText.setAttribute('y', String(funnelH / 2 + 30 * scale));
  algoText.setAttribute('text-anchor', 'middle');
  algoText.setAttribute('fill', color);
  algoText.setAttribute('font-size', String(TYPOGRAPHY.fontSizeInline * scale));
  algoText.setAttribute('font-weight', String(TYPOGRAPHY.fontWeightLabel));
  algoText.setAttribute('font-family', TYPOGRAPHY.fontBadge);
  algoText.setAttribute('opacity', '0.7');
  algoText.textContent = algorithm;
  innerG.appendChild(algoText);

  // ── Entity label below ──
  if (entity.label) {
    const text = document.createElementNS(SVG_NS, 'text');
    text.setAttribute('x', '0');
    text.setAttribute('y', String(funnelH / 2 + 44 * scale));
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
