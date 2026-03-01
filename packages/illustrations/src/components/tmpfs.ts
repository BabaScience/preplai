/**
 * @pre/illustrations — Tmpfs Component
 * RAM chip or fleeting cloud + /tmp label (ephemeral, in-memory)
 */

import { SVG_NS, buildEntityGroup, applyEntranceAnimation, getSizeParam } from '../utils.js';
import { createLinearGradient, ensureDefs } from '../visual-utils.js';
import { getCategoryColor, TYPOGRAPHY, SHAPES } from '../design-tokens.js';
import type { VisualEntity } from '@pre/shared';

export function renderTmpfs(entity: VisualEntity, parentEl: SVGElement): SVGGElement {
  const { outerG, innerG } = buildEntityGroup(entity);

  const s = getSizeParam(entity);
  const color = entity.color ?? getCategoryColor('Tmpfs');
  const defs = ensureDefs(parentEl);
  const gradId = `grad-tmpfs-${color.replace(/[^a-fA-F0-9]/g, '')}`;
  createLinearGradient(gradId, color, 'vertical', defs);

  const w = s * 1.1;
  const h = s * 0.7;

  // ── RAM chip shape (rounded rect with pins)
  const chip = document.createElementNS(SVG_NS, 'rect');
  chip.setAttribute('x', String(-w / 2));
  chip.setAttribute('y', String(-h / 2));
  chip.setAttribute('width', String(w));
  chip.setAttribute('height', String(h));
  chip.setAttribute('rx', String(SHAPES.borderRadius));
  chip.setAttribute('fill', `url(#${gradId})`);
  chip.setAttribute('stroke', color);
  chip.setAttribute('stroke-width', String(SHAPES.strokeWidth));
  innerG.appendChild(chip);

  // ── Small pins (bottom edge)
  const pinCount = 5;
  const pinW = w / (pinCount + 1);
  for (let i = 1; i <= pinCount; i++) {
    const px = -w / 2 + pinW * i;
    const pin = document.createElementNS(SVG_NS, 'line');
    pin.setAttribute('x1', String(px));
    pin.setAttribute('y1', String(h / 2));
    pin.setAttribute('x2', String(px));
    pin.setAttribute('y2', String(h / 2 + 6));
    pin.setAttribute('stroke', color);
    pin.setAttribute('stroke-width', '1.5');
    pin.setAttribute('opacity', '0.7');
    innerG.appendChild(pin);
  }

  // ── /tmp label inside
  const tmpText = document.createElementNS(SVG_NS, 'text');
  tmpText.setAttribute('x', '0');
  tmpText.setAttribute('y', '4');
  tmpText.setAttribute('text-anchor', 'middle');
  tmpText.setAttribute('fill', color);
  tmpText.setAttribute('font-size', '11');
  tmpText.setAttribute('font-weight', '600');
  tmpText.setAttribute('font-family', TYPOGRAPHY.fontBadge);
  tmpText.textContent = '/tmp';
  innerG.appendChild(tmpText);

  if (entity.label) {
    const text = document.createElementNS(SVG_NS, 'text');
    text.setAttribute('x', '0');
    text.setAttribute('y', String(h / 2 + 24));
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
