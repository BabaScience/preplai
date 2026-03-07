/**
 * @preplai/illustrations — Service Component
 *
 * Cogwheel (gear) icon with text inside the central hub.
 * Base illustration for service-like entities (Service, API, APIGateway).
 *
 * @param innerText - Optional override for the text inside the gear (e.g. "API")
 */

import { SVG_NS, buildEntityGroup, applyEntranceAnimation, getSizeParam } from '../utils.js';
import { createRadialGradient, ensureDefs } from '../visual-utils.js';
import { getCategoryColor, TYPOGRAPHY, SHAPES } from '../design-tokens.js';
import type { VisualEntity } from '@preplai/shared';

const GEAR_TEETH = 10;
const INNER_HUB_RATIO = 0.42; // Inner circle as fraction of outer radius

function buildGearPath(outerR: number, innerR: number): string {
  const points: string[] = [];
  for (let i = 0; i < GEAR_TEETH * 2; i++) {
    const angle = (Math.PI / GEAR_TEETH) * i - Math.PI / 2; // Start from top
    const r = i % 2 === 0 ? outerR : innerR;
    const x = r * Math.cos(angle);
    const y = -r * Math.sin(angle);
    points.push(`${x.toFixed(2)},${y.toFixed(2)}`);
  }
  return `M ${points.join(' L ')} Z`;
}

export interface ServiceRenderOptions {
  /** When true, the cogwheel rotates continuously (e.g. for API). */
  rotate?: boolean;
}

export function renderService(
  entity: VisualEntity,
  parentEl: SVGElement,
  innerText?: string,
  options?: ServiceRenderOptions,
): SVGGElement {
  const { outerG, innerG } = buildEntityGroup(entity);
  const rotate = options?.rotate ?? false;

  const s = getSizeParam(entity);
  const color = entity.color ?? getCategoryColor('Service');
  const defs = ensureDefs(parentEl);
  const gradId = `grad-service-${color.replace(/[^a-fA-F0-9]/g, '')}`;
  createRadialGradient(gradId, color, defs);

  const outerR = s * 0.48;
  const innerR = outerR * (1 - INNER_HUB_RATIO);

  // Content group: gear + hub + text (optionally wrapped for rotation)
  const contentG = document.createElementNS(SVG_NS, 'g');
  if (rotate) {
    contentG.setAttribute('transform-origin', '0 0');
    const animate = document.createElementNS(SVG_NS, 'animateTransform');
    animate.setAttribute('attributeName', 'transform');
    animate.setAttribute('type', 'rotate');
    animate.setAttribute('from', '0 0 0');
    animate.setAttribute('to', '360 0 0');
    animate.setAttribute('dur', '12s');
    animate.setAttribute('repeatCount', 'indefinite');
    contentG.appendChild(animate);
  }

  // ── Cogwheel outer shape
  const gearPath = buildGearPath(outerR, innerR);
  const gear = document.createElementNS(SVG_NS, 'path');
  gear.setAttribute('d', gearPath);
  gear.setAttribute('fill', `url(#${gradId})`);
  gear.setAttribute('stroke', color);
  gear.setAttribute('stroke-width', String(SHAPES.strokeWidth));
  gear.setAttribute('stroke-linejoin', 'round');
  contentG.appendChild(gear);

  // ── Inner circle (hub)
  const hubR = s * 0.22;
  const hub = document.createElementNS(SVG_NS, 'circle');
  hub.setAttribute('cx', '0');
  hub.setAttribute('cy', '0');
  hub.setAttribute('r', String(hubR));
  hub.setAttribute('fill', `url(#${gradId})`);
  hub.setAttribute('stroke', color);
  hub.setAttribute('stroke-width', String(SHAPES.strokeWidth));
  contentG.appendChild(hub);

  innerG.appendChild(contentG);

  // ── Text inside hub (outside rotating group so it stays fixed when gear rotates)
  const displayText = innerText ?? entity.label ?? entity.type;
  if (displayText) {
    const text = document.createElementNS(SVG_NS, 'text');
    text.setAttribute('x', '0');
    text.setAttribute('y', '4');
    text.setAttribute('text-anchor', 'middle');
    text.setAttribute('fill', color);
    text.setAttribute('font-size', String(Math.min(12, Math.floor(hubR * 1.2))));
    text.setAttribute('font-weight', String(TYPOGRAPHY.fontWeightLabel));
    text.setAttribute('font-family', TYPOGRAPHY.fontLabel);
    text.textContent = displayText;
    innerG.appendChild(text);
  }

  // ── Optional label below (for longer descriptions)
  if (entity.label && displayText !== entity.label) {
    const label = document.createElementNS(SVG_NS, 'text');
    label.setAttribute('x', '0');
    label.setAttribute('y', String(s / 2 + 18));
    label.setAttribute('text-anchor', 'middle');
    label.setAttribute('fill', color);
    label.setAttribute('font-size', String(TYPOGRAPHY.fontSizeLabel));
    label.setAttribute('font-weight', String(TYPOGRAPHY.fontWeightLabel));
    label.setAttribute('font-family', TYPOGRAPHY.fontLabel);
    label.textContent = entity.label;
    innerG.appendChild(label);
  }

  applyEntranceAnimation(innerG, entity);
  parentEl.appendChild(outerG);
  return outerG;
}
