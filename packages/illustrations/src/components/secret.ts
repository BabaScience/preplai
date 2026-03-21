/**
 * @preplai/illustrations — Secret Component
 * Env var / vault secret: dark card with masked value + eye-slash icon
 * Metadata: { key?: string, masked?: boolean }
 */

import { SVG_NS, buildEntityGroup, applyEntranceAnimation, getSizeParam } from '../utils.js';
import {
  getCategoryColor, getStrokeWidth, getLabelFontSize,
  colorWithAlpha, OPACITY,
  TYPOGRAPHY, SHAPES, STROKE,
} from '../design-tokens.js';
import type { VisualEntity } from '@preplai/shared';

export function renderSecret(entity: VisualEntity, parentEl: SVGElement): SVGGElement {
  const { outerG, innerG } = buildEntityGroup(entity);

  const s = getSizeParam(entity);
  const scale = s / 50;
  const color = entity.color ?? getCategoryColor('Secret');

  const meta = entity.metadata ?? {};
  const key = (meta.key as string) ?? entity.label ?? 'SECRET_KEY';

  const w = s * 1.5;
  const h = s * 0.5;
  const hw = w / 2;
  const hh = h / 2;

  // Dark card
  const card = document.createElementNS(SVG_NS, 'rect');
  card.setAttribute('x', String(-hw));
  card.setAttribute('y', String(-hh));
  card.setAttribute('width', String(w));
  card.setAttribute('height', String(h));
  card.setAttribute('rx', String(SHAPES.borderRadius));
  card.setAttribute('fill', colorWithAlpha(color, OPACITY.fillLight));
  card.setAttribute('stroke', color);
  card.setAttribute('stroke-width', String(getStrokeWidth('default', scale)));
  innerG.appendChild(card);

  // Eye-slash icon (crossed circle)
  const eyeG = document.createElementNS(SVG_NS, 'g');
  eyeG.setAttribute('transform', `translate(${-hw + 16}, 0)`);
  const eye = document.createElementNS(SVG_NS, 'circle');
  eye.setAttribute('cx', '0');
  eye.setAttribute('cy', '0');
  eye.setAttribute('r', '5');
  eye.setAttribute('fill', 'none');
  eye.setAttribute('stroke', color);
  eye.setAttribute('stroke-width', String(STROKE.default));
  eyeG.appendChild(eye);
  const slash = document.createElementNS(SVG_NS, 'line');
  slash.setAttribute('x1', '-4');
  slash.setAttribute('y1', '4');
  slash.setAttribute('x2', '4');
  slash.setAttribute('y2', '-4');
  slash.setAttribute('stroke', color);
  slash.setAttribute('stroke-width', String(STROKE.emphasized));
  eyeG.appendChild(slash);
  innerG.appendChild(eyeG);

  // Key name + masked value
  const text = document.createElementNS(SVG_NS, 'text');
  text.setAttribute('x', String(-hw + 28));
  text.setAttribute('y', String(4));
  text.setAttribute('text-anchor', 'start');
  text.setAttribute('fill', color);
  text.setAttribute('font-size', String(getLabelFontSize('value', scale)));
  text.setAttribute('font-family', TYPOGRAPHY.fontCode);
  text.textContent = `${key}=${'*'.repeat(8)}`;
  innerG.appendChild(text);

  applyEntranceAnimation(innerG, entity);
  parentEl.appendChild(outerG);
  return outerG;
}
