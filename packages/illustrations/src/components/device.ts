/**
 * @preplai/illustrations — Device Component
 * Laptop shape: screen rect + base + optional keyboard lines
 */

import { SVG_NS, buildEntityGroup, applyEntranceAnimation, getSizeParam } from '../utils.js';
import { createLinearGradient, ensureDefs } from '../visual-utils.js';
import { getCategoryColor, TYPOGRAPHY, SHAPES } from '../design-tokens.js';
import type { VisualEntity } from '@preplai/shared';

export function renderDevice(entity: VisualEntity, parentEl: SVGElement): SVGGElement {
  const { outerG, innerG } = buildEntityGroup(entity);

  const s = getSizeParam(entity);
  const color = entity.color ?? getCategoryColor('Device');
  const defs = ensureDefs(parentEl);
  const gradId = `grad-device-${color.replace(/[^a-fA-F0-9]/g, '')}`;
  createLinearGradient(gradId, color, 'vertical', defs);

  const screenW = s * 1.2;
  const screenH = s * 0.7;
  const baseH = s * 0.2;

  // ── Screen
  const screen = document.createElementNS(SVG_NS, 'rect');
  screen.setAttribute('x', String(-screenW / 2));
  screen.setAttribute('y', String(-screenH - baseH / 2));
  screen.setAttribute('width', String(screenW));
  screen.setAttribute('height', String(screenH));
  screen.setAttribute('rx', '2');
  screen.setAttribute('fill', `url(#${gradId})`);
  screen.setAttribute('stroke', color);
  screen.setAttribute('stroke-width', String(SHAPES.strokeWidth));
  innerG.appendChild(screen);

  // ── Screen inner (display area)
  const display = document.createElementNS(SVG_NS, 'rect');
  display.setAttribute('x', String(-screenW / 2 + 6));
  display.setAttribute('y', String(-screenH - baseH / 2 + 6));
  display.setAttribute('width', String(screenW - 12));
  display.setAttribute('height', String(screenH - 12));
  display.setAttribute('rx', '1');
  display.setAttribute('fill', '#0d0d14');
  display.setAttribute('stroke', `${color}30`);
  display.setAttribute('stroke-width', '1');
  innerG.appendChild(display);

  // ── Base
  const base = document.createElementNS(SVG_NS, 'rect');
  base.setAttribute('x', String(-screenW / 2 - 4));
  base.setAttribute('y', String(-baseH / 2));
  base.setAttribute('width', String(screenW + 8));
  base.setAttribute('height', String(baseH));
  base.setAttribute('rx', '2');
  base.setAttribute('fill', `${color}25`);
  base.setAttribute('stroke', color);
  base.setAttribute('stroke-width', '1.5');
  innerG.appendChild(base);

  // ── Keyboard lines
  for (let i = 0; i < 3; i++) {
    const ly = -baseH / 2 + baseH * 0.4 + i * 4;
    const line = document.createElementNS(SVG_NS, 'line');
    line.setAttribute('x1', String(-screenW / 2 + 10));
    line.setAttribute('y1', String(ly));
    line.setAttribute('x2', String(screenW / 2 - 10));
    line.setAttribute('y2', String(ly));
    line.setAttribute('stroke', color);
    line.setAttribute('stroke-width', '1');
    line.setAttribute('opacity', '0.5');
    innerG.appendChild(line);
  }

  if (entity.label) {
    const text = document.createElementNS(SVG_NS, 'text');
    text.setAttribute('x', '0');
    text.setAttribute('y', String(s / 2 + 20));
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
