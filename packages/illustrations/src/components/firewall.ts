/**
 * @preplai/illustrations — Firewall Component
 *
 * Clean vertical rectangle with a shield icon inside.
 * Use for: firewalls, security boundaries, network barriers.
 *
 * Minimalist style matching the Composable engine aesthetic.
 */

import { SVG_NS, buildEntityGroup, applyEntranceAnimation, getSizeParam } from '../utils.js';
import { TYPOGRAPHY, STROKE, LABEL_DEFAULTS } from '../design-tokens.js';
import { resolveColorCascade, applyShapeColors, applyGlowColors } from '../color-cascade.js';
import type { VisualEntity } from '@preplai/shared';

export function renderFirewall(entity: VisualEntity, parentEl: SVGElement): SVGGElement {
  const { outerG, innerG } = buildEntityGroup(entity);

  const s = getSizeParam(entity);
  const cc = resolveColorCascade(entity);

  const w = s * 0.5;
  const h = s * 0.75;
  const hw = w / 2;
  const hh = h / 2;

  // Highlight glow
  if (entity.highlight) {
    const glow = document.createElementNS(SVG_NS, 'rect');
    glow.setAttribute('x', String(-hw - 3));
    glow.setAttribute('y', String(-hh - 3));
    glow.setAttribute('width', String(w + 6));
    glow.setAttribute('height', String(h + 6));
    glow.setAttribute('rx', '5');
    glow.setAttribute('stroke-width', String(STROKE.default));
    glow.setAttribute('stroke-dasharray', '4,4');
    applyGlowColors(glow, cc);
    innerG.appendChild(glow);
  }

  // Wall body
  const body = document.createElementNS(SVG_NS, 'rect');
  body.setAttribute('x', String(-hw));
  body.setAttribute('y', String(-hh));
  body.setAttribute('width', String(w));
  body.setAttribute('height', String(h));
  body.setAttribute('rx', '3');
  body.setAttribute('stroke-width', String(STROKE.default));
  applyShapeColors(body, cc);
  innerG.appendChild(body);

  // Shield icon (stroke-based path)
  const iconH = h * 0.3;
  const iconW = w * 0.4;
  const shield = document.createElementNS(SVG_NS, 'path');
  shield.setAttribute('d', [
    `M 0 ${-iconH * 0.7}`,
    `L ${iconW / 2} ${-iconH * 0.35}`,
    `L ${iconW / 2} ${iconH * 0.2}`,
    `Q 0 ${iconH * 0.7} 0 ${iconH * 0.7}`,
    `Q 0 ${iconH * 0.7} ${-iconW / 2} ${iconH * 0.2}`,
    `L ${-iconW / 2} ${-iconH * 0.35}`,
    'Z',
  ].join(' '));
  shield.setAttribute('fill', 'none');
  shield.setAttribute('stroke', cc.stroke);
  shield.setAttribute('stroke-width', String(STROKE.default));
  shield.setAttribute('stroke-linejoin', 'round');
  innerG.appendChild(shield);

  // Label below
  if (entity.label) {
    const text = document.createElementNS(SVG_NS, 'text');
    text.setAttribute('x', '0');
    text.setAttribute('y', String(hh + LABEL_DEFAULTS.offsetBelow));
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
