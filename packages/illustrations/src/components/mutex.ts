/**
 * @preplai/illustrations — Mutex Component
 *
 * Clean rect with simple lock icon inside.
 * Use for: binary locks, synchronization primitives.
 *
 * Metadata:
 *   locked?: boolean — whether the mutex is locked (default false)
 *
 * Minimalist style matching the Composable engine aesthetic.
 */

import { SVG_NS, buildEntityGroup, applyEntranceAnimation, getSizeParam } from '../utils.js';
import { getCategoryColor, TYPOGRAPHY, SHAPES, STROKE, LABEL_DEFAULTS, colorWithAlpha, OPACITY } from '../design-tokens.js';
import type { VisualEntity } from '@preplai/shared';

export function renderMutex(entity: VisualEntity, parentEl: SVGElement): SVGGElement {
  const { outerG, innerG } = buildEntityGroup(entity);

  const s = getSizeParam(entity);
  const color = entity.color ?? getCategoryColor('Mutex');

  const meta = entity.metadata ?? {};
  const locked = (meta.locked as boolean) ?? false;

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
  const rect = document.createElementNS(SVG_NS, 'rect');
  rect.setAttribute('x', String(-hw));
  rect.setAttribute('y', String(-hh));
  rect.setAttribute('width', String(w));
  rect.setAttribute('height', String(h));
  rect.setAttribute('rx', String(SHAPES.borderRadius));
  rect.setAttribute('fill', colorWithAlpha(color, OPACITY.fillLight));
  rect.setAttribute('stroke', color);
  rect.setAttribute('stroke-width', String(STROKE.default));
  innerG.appendChild(rect);

  // Lock icon (stroke-based)
  const ls = s * 0.12; // lock scale unit
  // Lock body (small rect)
  const lockBody = document.createElementNS(SVG_NS, 'rect');
  lockBody.setAttribute('x', String(-ls * 1.2));
  lockBody.setAttribute('y', String(-ls * 0.2));
  lockBody.setAttribute('width', String(ls * 2.4));
  lockBody.setAttribute('height', String(ls * 1.8));
  lockBody.setAttribute('rx', String(ls * 0.3));
  lockBody.setAttribute('fill', 'none');
  lockBody.setAttribute('stroke', color);
  lockBody.setAttribute('stroke-width', String(STROKE.default));
  innerG.appendChild(lockBody);

  // Lock shackle (arc above body)
  const shackle = document.createElementNS(SVG_NS, 'path');
  if (locked) {
    // Closed shackle
    shackle.setAttribute('d',
      `M ${-ls * 0.7} ${-ls * 0.2} V ${-ls * 1.0} A ${ls * 0.7} ${ls * 0.7} 0 0 1 ${ls * 0.7} ${-ls * 1.0} V ${-ls * 0.2}`
    );
  } else {
    // Open shackle (shifted right)
    shackle.setAttribute('d',
      `M ${-ls * 0.7} ${-ls * 0.2} V ${-ls * 1.0} A ${ls * 0.7} ${ls * 0.7} 0 0 1 ${ls * 0.7} ${-ls * 1.0} V ${-ls * 0.6}`
    );
  }
  shackle.setAttribute('fill', 'none');
  shackle.setAttribute('stroke', color);
  shackle.setAttribute('stroke-width', String(STROKE.default));
  shackle.setAttribute('stroke-linecap', 'round');
  innerG.appendChild(shackle);

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
