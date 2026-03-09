/**
 * @preplai/illustrations — Server Component
 * Tower process: gradient body + terminal prompt icon + status LED + label
 */

import { SVG_NS, buildEntityGroup, applyEntranceAnimation, getSizeParam } from '../utils.js';
import { createLinearGradient, ensureDefs, ensureGlassFilter } from '../visual-utils.js';
import { getCategoryColor, TYPOGRAPHY, SHAPES, COLORS } from '../design-tokens.js';
import type { VisualEntity } from '@preplai/shared';

export function renderServer(entity: VisualEntity, parentEl: SVGElement): SVGGElement {
  const { outerG, innerG } = buildEntityGroup(entity);

  const size = getSizeParam(entity);
  const color = entity.color ?? getCategoryColor('Server');
  const defs = ensureDefs(parentEl);
  const gradId = `grad-server-${color.replace(/[^a-fA-F0-9]/g, '')}`;
  createLinearGradient(gradId, color, 'vertical', defs);

  const w = size * 0.9;
  const h = size;

  // ── Server body (taller, narrower — process/tower shape) ──
  const body = document.createElementNS(SVG_NS, 'rect');
  body.setAttribute('x', String(-w / 2));
  body.setAttribute('y', String(-h / 2));
  body.setAttribute('width', String(w));
  body.setAttribute('height', String(h));
  body.setAttribute('rx', String(SHAPES.borderRadiusLarge));
  body.setAttribute('fill', `url(#${gradId})`);
  body.setAttribute('stroke', color);
  body.setAttribute('stroke-width', String(SHAPES.strokeWidth));
  body.setAttribute('filter', ensureGlassFilter(parentEl));
  innerG.appendChild(body);

  // ── Single status LED (top-right) ──
  const ledX = w / 2 - 10;
  const ledY = -h / 2 + 10;

  const ledGlow = document.createElementNS(SVG_NS, 'circle');
  ledGlow.setAttribute('cx', String(ledX));
  ledGlow.setAttribute('cy', String(ledY));
  ledGlow.setAttribute('r', '5');
  ledGlow.setAttribute('fill', 'none');
  ledGlow.setAttribute('stroke', COLORS.green);
  ledGlow.setAttribute('stroke-width', '1');
  ledGlow.setAttribute('opacity', '0.3');
  innerG.appendChild(ledGlow);

  const led = document.createElementNS(SVG_NS, 'circle');
  led.setAttribute('cx', String(ledX));
  led.setAttribute('cy', String(ledY));
  led.setAttribute('r', '3');
  led.setAttribute('fill', COLORS.green);
  led.setAttribute('opacity', '0.9');
  innerG.appendChild(led);

  // ── Terminal prompt icon (>_) — reads as "running process" ──
  const promptText = document.createElementNS(SVG_NS, 'text');
  promptText.setAttribute('x', '0');
  promptText.setAttribute('y', '4');
  promptText.setAttribute('text-anchor', 'middle');
  promptText.setAttribute('dominant-baseline', 'central');
  promptText.setAttribute('fill', color);
  promptText.setAttribute('font-size', String(size * 0.3));
  promptText.setAttribute('font-family', TYPOGRAPHY.fontCode);
  promptText.setAttribute('font-weight', String(TYPOGRAPHY.fontWeightLabel));
  promptText.setAttribute('opacity', '0.6');
  promptText.textContent = '>_';
  innerG.appendChild(promptText);

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
