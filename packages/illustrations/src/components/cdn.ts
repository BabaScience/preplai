/**
 * @preplai/illustrations — CDN Component
 * Content Delivery Network: globe with distribution arrows
 * Metadata: { provider?: string, regions?: number }
 */

import { SVG_NS, buildEntityGroup, applyEntranceAnimation, getSizeParam } from '../utils.js';
import { createLinearGradient, ensureDefs } from '../visual-utils.js';
import {
  getCategoryColor, getStrokeWidth, getLabelFontSize,
  TYPOGRAPHY, STROKE,
} from '../design-tokens.js';
import type { VisualEntity } from '@preplai/shared';

export function renderCDN(entity: VisualEntity, parentEl: SVGElement): SVGGElement {
  const { outerG, innerG } = buildEntityGroup(entity);

  const s = getSizeParam(entity);
  const scale = s / 50;
  const color = entity.color ?? getCategoryColor('CDN');
  const defs = ensureDefs(parentEl);
  const gradId = `grad-cdn-${entity.id.replace(/[^a-zA-Z0-9]/g, '')}`;
  createLinearGradient(gradId, color, 'vertical', defs);

  const label = entity.label ?? 'CDN';
  const r = s * 0.35;

  // Globe circle
  const globe = document.createElementNS(SVG_NS, 'circle');
  globe.setAttribute('cx', '0');
  globe.setAttribute('cy', '0');
  globe.setAttribute('r', String(r));
  globe.setAttribute('fill', `url(#${gradId})`);
  globe.setAttribute('stroke', color);
  globe.setAttribute('stroke-width', String(getStrokeWidth('default', scale)));
  innerG.appendChild(globe);

  // Horizontal line (equator)
  const equator = document.createElementNS(SVG_NS, 'ellipse');
  equator.setAttribute('cx', '0');
  equator.setAttribute('cy', '0');
  equator.setAttribute('rx', String(r));
  equator.setAttribute('ry', String(r * 0.3));
  equator.setAttribute('fill', 'none');
  equator.setAttribute('stroke', color);
  equator.setAttribute('stroke-width', String(STROKE.thin));
  equator.setAttribute('opacity', '0.4');
  innerG.appendChild(equator);

  // Vertical meridian
  const meridian = document.createElementNS(SVG_NS, 'ellipse');
  meridian.setAttribute('cx', '0');
  meridian.setAttribute('cy', '0');
  meridian.setAttribute('rx', String(r * 0.3));
  meridian.setAttribute('ry', String(r));
  meridian.setAttribute('fill', 'none');
  meridian.setAttribute('stroke', color);
  meridian.setAttribute('stroke-width', String(STROKE.thin));
  meridian.setAttribute('opacity', '0.4');
  innerG.appendChild(meridian);

  // Distribution dots around globe (edge nodes)
  const edgeAngles = [30, 150, 270];
  for (const angle of edgeAngles) {
    const rad = (angle * Math.PI) / 180;
    const edgeDot = document.createElementNS(SVG_NS, 'circle');
    edgeDot.setAttribute('cx', String((r + 8) * Math.cos(rad)));
    edgeDot.setAttribute('cy', String((r + 8) * Math.sin(rad)));
    edgeDot.setAttribute('r', '3');
    edgeDot.setAttribute('fill', color);
    edgeDot.setAttribute('opacity', '0.6');
    innerG.appendChild(edgeDot);
  }

  // Label below
  if (label) {
    const text = document.createElementNS(SVG_NS, 'text');
    text.setAttribute('x', '0');
    text.setAttribute('y', String(r + 24));
    text.setAttribute('text-anchor', 'middle');
    text.setAttribute('fill', color);
    text.setAttribute('font-size', String(getLabelFontSize('label', scale)));
    text.setAttribute('font-weight', String(TYPOGRAPHY.fontWeightLabel));
    text.setAttribute('font-family', TYPOGRAPHY.fontLabel);
    text.textContent = label;
    innerG.appendChild(text);
  }

  applyEntranceAnimation(innerG, entity);
  parentEl.appendChild(outerG);
  return outerG;
}
