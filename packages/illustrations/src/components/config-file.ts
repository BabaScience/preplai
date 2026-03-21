/**
 * @preplai/illustrations — ConfigFile Component
 *
 * Clean rect with gear icon inside.
 * Use for: configuration files, .env, settings.
 *
 * Minimalist style matching the Composable engine aesthetic.
 */

import { SVG_NS, buildEntityGroup, applyEntranceAnimation, getSizeParam } from '../utils.js';
import { getCategoryColor, TYPOGRAPHY, SHAPES, STROKE, LABEL_DEFAULTS, colorWithAlpha, OPACITY } from '../design-tokens.js';
import type { VisualEntity } from '@preplai/shared';

export function renderConfigFile(entity: VisualEntity, parentEl: SVGElement): SVGGElement {
  const { outerG, innerG } = buildEntityGroup(entity);

  const s = getSizeParam(entity);
  const color = entity.color ?? getCategoryColor('ConfigFile');

  const w = s * 0.85;
  const h = s * 0.7;
  const hw = w / 2;
  const hh = h / 2;

  // Highlight glow
  if (entity.highlight) {
    const glow = document.createElementNS(SVG_NS, 'rect');
    glow.setAttribute('x', String(-hw - 3));
    glow.setAttribute('y', String(-hh - 3));
    glow.setAttribute('width', String(w + 6));
    glow.setAttribute('height', String(h + 6));
    glow.setAttribute('rx', String(SHAPES.borderRadius + 2));
    glow.setAttribute('fill', 'none');
    glow.setAttribute('stroke', colorWithAlpha(color, OPACITY.strokeMuted));
    glow.setAttribute('stroke-width', String(STROKE.default));
    glow.setAttribute('stroke-dasharray', '4,4');
    innerG.appendChild(glow);
  }

  // Body
  const card = document.createElementNS(SVG_NS, 'rect');
  card.setAttribute('x', String(-hw));
  card.setAttribute('y', String(-hh));
  card.setAttribute('width', String(w));
  card.setAttribute('height', String(h));
  card.setAttribute('rx', String(SHAPES.borderRadius));
  card.setAttribute('fill', colorWithAlpha(color, OPACITY.fillLight));
  card.setAttribute('stroke', color);
  card.setAttribute('stroke-width', String(STROKE.default));
  innerG.appendChild(card);

  // Gear icon (circle + 4 tick marks)
  const gr = s * 0.08;
  const gearCircle = document.createElementNS(SVG_NS, 'circle');
  gearCircle.setAttribute('cx', '0');
  gearCircle.setAttribute('cy', '0');
  gearCircle.setAttribute('r', String(gr));
  gearCircle.setAttribute('fill', 'none');
  gearCircle.setAttribute('stroke', color);
  gearCircle.setAttribute('stroke-width', String(STROKE.default));
  innerG.appendChild(gearCircle);

  for (let i = 0; i < 4; i++) {
    const angle = (Math.PI / 2) * i;
    const tick = document.createElementNS(SVG_NS, 'line');
    tick.setAttribute('x1', String(gr * Math.cos(angle)));
    tick.setAttribute('y1', String(gr * Math.sin(angle)));
    tick.setAttribute('x2', String((gr + s * 0.04) * Math.cos(angle)));
    tick.setAttribute('y2', String((gr + s * 0.04) * Math.sin(angle)));
    tick.setAttribute('stroke', color);
    tick.setAttribute('stroke-width', String(STROKE.default));
    tick.setAttribute('stroke-linecap', 'round');
    innerG.appendChild(tick);
  }

  // Label below
  if (entity.label) {
    const text = document.createElementNS(SVG_NS, 'text');
    text.setAttribute('x', '0');
    text.setAttribute('y', String(hh + LABEL_DEFAULTS.offsetBelow));
    text.setAttribute('text-anchor', LABEL_DEFAULTS.textAnchor);
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
