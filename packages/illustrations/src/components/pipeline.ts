/**
 * @preplai/illustrations — Pipeline Component
 *
 * Clean horizontal row of chevron segments.
 * Use for: CI/CD pipelines, data pipelines, processing stages.
 *
 * Minimalist style matching the Composable engine aesthetic.
 */

import { SVG_NS, buildEntityGroup, applyEntranceAnimation, getSizeParam } from '../utils.js';
import { TYPOGRAPHY, STROKE, LABEL_DEFAULTS } from '../design-tokens.js';
import { resolveColorCascade, applyGlowColors } from '../color-cascade.js';
import type { VisualEntity } from '@preplai/shared';

export function renderPipeline(entity: VisualEntity, parentEl: SVGElement): SVGGElement {
  const { outerG, innerG } = buildEntityGroup(entity);

  const s = getSizeParam(entity);
  const cc = resolveColorCascade(entity);

  const segCount = 3;
  const segW = s * 0.28;
  const segH = s * 0.4;
  const gap = s * 0.06;
  const totalW = segCount * segW + (segCount - 1) * gap;

  // Highlight glow
  if (entity.highlight) {
    const glow = document.createElementNS(SVG_NS, 'rect');
    glow.setAttribute('x', String(-totalW / 2 - 5));
    glow.setAttribute('y', String(-segH / 2 - 5));
    glow.setAttribute('width', String(totalW + 10));
    glow.setAttribute('height', String(segH + 10));
    glow.setAttribute('rx', '5');
    glow.setAttribute('stroke-width', String(STROKE.default));
    glow.setAttribute('stroke-dasharray', '4,4');
    applyGlowColors(glow, cc);
    innerG.appendChild(glow);
  }

  for (let i = 0; i < segCount; i++) {
    const cx = -totalW / 2 + segW / 2 + i * (segW + gap);
    const chevron = document.createElementNS(SVG_NS, 'path');
    chevron.setAttribute('d', [
      `M ${cx - segW / 2} ${-segH / 2}`,
      `L ${cx + segW / 4} ${-segH / 2}`,
      `L ${cx + segW / 2} 0`,
      `L ${cx + segW / 4} ${segH / 2}`,
      `L ${cx - segW / 2} ${segH / 2}`,
      `L ${cx - segW / 4} 0`,
      'Z',
    ].join(' '));
    chevron.setAttribute('fill', cc.fill);
    chevron.setAttribute('stroke', cc.stroke);
    chevron.setAttribute('stroke-width', String(STROKE.default));
    chevron.setAttribute('stroke-linejoin', 'round');
    innerG.appendChild(chevron);
  }

  // Label below
  if (entity.label) {
    const text = document.createElementNS(SVG_NS, 'text');
    text.setAttribute('x', '0');
    text.setAttribute('y', String(segH / 2 + LABEL_DEFAULTS.offsetBelow));
    text.setAttribute('text-anchor', LABEL_DEFAULTS.textAnchor);
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
