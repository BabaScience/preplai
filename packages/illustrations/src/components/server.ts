/**
 * @preplai/illustrations — Server Component
 * Rack-style server: gradient body + horizontal slot dividers + status LEDs + label
 */

import { SVG_NS, buildEntityGroup, applyEntranceAnimation, getSizeParam } from '../utils.js';
import { createLinearGradient, ensureDefs, ensureGlassFilter } from '../visual-utils.js';
import { getCategoryColor, TYPOGRAPHY, SHAPES, COLORS, STROKE } from '../design-tokens.js';
import type { VisualEntity } from '@preplai/shared';

export function renderServer(entity: VisualEntity, parentEl: SVGElement): SVGGElement {
  const { outerG, innerG } = buildEntityGroup(entity);

  const size = getSizeParam(entity);
  const color = entity.color ?? getCategoryColor('Server');
  const defs = ensureDefs(parentEl);
  const gradId = `grad-server-${color.replace(/[^a-fA-F0-9]/g, '')}`;
  createLinearGradient(gradId, color, 'vertical', defs);

  const w = size * 1.2;
  const h = size * 0.85;

  // ── Server body (wide rack shape) ──
  const body = document.createElementNS(SVG_NS, 'rect');
  body.setAttribute('x', String(-w / 2));
  body.setAttribute('y', String(-h / 2));
  body.setAttribute('width', String(w));
  body.setAttribute('height', String(h));
  body.setAttribute('rx', String(SHAPES.borderRadius));
  body.setAttribute('fill', `url(#${gradId})`);
  body.setAttribute('stroke', color);
  body.setAttribute('stroke-width', String(SHAPES.strokeWidth));
  body.setAttribute('filter', ensureGlassFilter(parentEl));
  innerG.appendChild(body);

  // ── Horizontal rack slot dividers (2 lines → 3 slots) ──
  const slotPositions = [-h / 6, h / 6];
  for (const sy of slotPositions) {
    const line = document.createElementNS(SVG_NS, 'line');
    line.setAttribute('x1', String(-w / 2 + 4));
    line.setAttribute('y1', String(sy));
    line.setAttribute('x2', String(w / 2 - 4));
    line.setAttribute('y2', String(sy));
    line.setAttribute('stroke', color);
    line.setAttribute('stroke-width', String(STROKE.minimal));
    line.setAttribute('opacity', '0.25');
    innerG.appendChild(line);
  }

  // ── Status LEDs (3 dots in the top-right — green, green, dim) ──
  const ledStartX = w / 2 - 22;
  const ledY = -h / 2 + h / 6 - h / 6 / 2; // center of top slot
  const ledSpacing = 7;
  const ledColors = [COLORS.green, COLORS.green, color];
  const ledOpacities = ['0.9', '0.9', '0.3'];

  for (let i = 0; i < 3; i++) {
    const led = document.createElementNS(SVG_NS, 'circle');
    led.setAttribute('cx', String(ledStartX + i * ledSpacing));
    led.setAttribute('cy', String(ledY));
    led.setAttribute('r', '2.5');
    led.setAttribute('fill', ledColors[i]);
    led.setAttribute('opacity', ledOpacities[i]);
    innerG.appendChild(led);
  }

  // ── Small ventilation pattern (3 short horizontal lines in bottom slot) ──
  const ventY = h / 6 + h / 6 / 2; // center of bottom slot
  const ventW = w * 0.15;
  for (let i = -1; i <= 1; i++) {
    const vent = document.createElementNS(SVG_NS, 'line');
    vent.setAttribute('x1', String(-ventW / 2));
    vent.setAttribute('y1', String(ventY + i * 4));
    vent.setAttribute('x2', String(ventW / 2));
    vent.setAttribute('y2', String(ventY + i * 4));
    vent.setAttribute('stroke', color);
    vent.setAttribute('stroke-width', String(STROKE.minimal));
    vent.setAttribute('opacity', '0.2');
    innerG.appendChild(vent);
  }

  // ── Label ──
  if (entity.label) {
    const text = document.createElementNS(SVG_NS, 'text');
    text.setAttribute('x', '0');
    text.setAttribute('y', String(h / 2 + 20));
    text.setAttribute('text-anchor', 'middle');
    text.setAttribute('fill', color);
    text.setAttribute('font-size', String(TYPOGRAPHY.fontSizeTitle));
    text.setAttribute('font-weight', String(TYPOGRAPHY.fontWeightLabel));
    text.setAttribute('font-family', TYPOGRAPHY.fontLabel);
    text.textContent = entity.label;
    innerG.appendChild(text);
  }

  applyEntranceAnimation(innerG, entity);
  parentEl.appendChild(outerG);
  return outerG;
}
