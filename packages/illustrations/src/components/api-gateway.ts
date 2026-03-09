/**
 * @preplai/illustrations — APIGateway Component
 * API Gateway: shield-like shape with routing lines
 * Metadata: { routes?: number, rateLimit?: string }
 */

import { SVG_NS, buildEntityGroup, applyEntranceAnimation, getSizeParam } from '../utils.js';
import { createLinearGradient, ensureDefs, ensureGlassFilter } from '../visual-utils.js';
import {
  getCategoryColor, getStrokeWidth, getLabelFontSize,
  TYPOGRAPHY, STROKE,
} from '../design-tokens.js';
import type { VisualEntity } from '@preplai/shared';

export function renderAPIGateway(entity: VisualEntity, parentEl: SVGElement): SVGGElement {
  const { outerG, innerG } = buildEntityGroup(entity);

  const s = getSizeParam(entity);
  const scale = s / 50;
  const color = entity.color ?? getCategoryColor('APIGateway');
  const defs = ensureDefs(parentEl);
  const gradId = `grad-apigw-${entity.id.replace(/[^a-zA-Z0-9]/g, '')}`;
  createLinearGradient(gradId, color, 'vertical', defs);

  const label = entity.label ?? 'API Gateway';

  const w = s * 1.0;
  const h = s * 0.9;
  const hw = w / 2;
  const hh = h / 2;

  // Gateway shape (wide rect with pointed left edge = funnel)
  const body = document.createElementNS(SVG_NS, 'path');
  body.setAttribute('d', `M ${-hw - 6} 0 L ${-hw} ${-hh} L ${hw} ${-hh} L ${hw} ${hh} L ${-hw} ${hh} Z`);
  body.setAttribute('fill', `url(#${gradId})`);
  body.setAttribute('stroke', color);
  body.setAttribute('stroke-width', String(getStrokeWidth('default', scale)));
  body.setAttribute('filter', ensureGlassFilter(parentEl));
  innerG.appendChild(body);

  // Routing lines (3 horizontal lines fanning out)
  const lineCount = 3;
  for (let i = 0; i < lineCount; i++) {
    const startY = (i - 1) * (h * 0.15);
    const endY = (i - 1) * (h * 0.25);
    const line = document.createElementNS(SVG_NS, 'line');
    line.setAttribute('x1', String(-hw * 0.3));
    line.setAttribute('y1', String(startY));
    line.setAttribute('x2', String(hw * 0.6));
    line.setAttribute('y2', String(endY));
    line.setAttribute('stroke', color);
    line.setAttribute('stroke-width', String(STROKE.thin));
    line.setAttribute('opacity', '0.4');
    innerG.appendChild(line);

    // Endpoint dots
    const dot = document.createElementNS(SVG_NS, 'circle');
    dot.setAttribute('cx', String(hw * 0.6));
    dot.setAttribute('cy', String(endY));
    dot.setAttribute('r', '2');
    dot.setAttribute('fill', color);
    dot.setAttribute('opacity', '0.5');
    innerG.appendChild(dot);
  }

  // Input dot
  const inputDot = document.createElementNS(SVG_NS, 'circle');
  inputDot.setAttribute('cx', String(-hw * 0.3));
  inputDot.setAttribute('cy', '0');
  inputDot.setAttribute('r', '3');
  inputDot.setAttribute('fill', color);
  inputDot.setAttribute('opacity', '0.6');
  innerG.appendChild(inputDot);

  // Label below
  if (label) {
    const text = document.createElementNS(SVG_NS, 'text');
    text.setAttribute('x', '0');
    text.setAttribute('y', String(hh + 18));
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
