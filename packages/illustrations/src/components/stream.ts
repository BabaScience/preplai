/**
 * @preplai/illustrations — Stream Component
 * Data stream / event stream: flowing arrow with data particles
 * Metadata: { protocol?: string, throughput?: string }
 */

import { SVG_NS, buildEntityGroup, applyEntranceAnimation, getSizeParam } from '../utils.js';
import {
  getCategoryColor, getStrokeWidth, getLabelFontSize,
  colorWithAlpha, OPACITY,
  TYPOGRAPHY, STROKE,
} from '../design-tokens.js';
import type { VisualEntity } from '@preplai/shared';

export function renderStream(entity: VisualEntity, parentEl: SVGElement): SVGGElement {
  const { outerG, innerG } = buildEntityGroup(entity);

  const s = getSizeParam(entity);
  const scale = s / 50;
  const color = entity.color ?? getCategoryColor('Stream');

  const label = entity.label ?? 'Stream';

  const w = s * 1.6;
  const h = s * 0.5;
  const hw = w / 2;
  const hh = h / 2;

  // Rounded pill body
  const body = document.createElementNS(SVG_NS, 'rect');
  body.setAttribute('x', String(-hw));
  body.setAttribute('y', String(-hh));
  body.setAttribute('width', String(w));
  body.setAttribute('height', String(h));
  body.setAttribute('rx', String(h / 2));
  body.setAttribute('fill', colorWithAlpha(color, OPACITY.fillLight));
  body.setAttribute('stroke', color);
  body.setAttribute('stroke-width', String(getStrokeWidth('default', scale)));
  innerG.appendChild(body);

  // Flow arrow (horizontal dashed line with arrowhead)
  const flowLine = document.createElementNS(SVG_NS, 'line');
  flowLine.setAttribute('x1', String(-hw + 12));
  flowLine.setAttribute('y1', '0');
  flowLine.setAttribute('x2', String(hw - 16));
  flowLine.setAttribute('y2', '0');
  flowLine.setAttribute('stroke', color);
  flowLine.setAttribute('stroke-width', String(STROKE.thin));
  flowLine.setAttribute('stroke-dasharray', '4,3');
  flowLine.setAttribute('opacity', '0.5');
  innerG.appendChild(flowLine);

  // Arrowhead
  const arrow = document.createElementNS(SVG_NS, 'path');
  arrow.setAttribute('d', `M ${hw - 16} ${-4} L ${hw - 10} 0 L ${hw - 16} 4`);
  arrow.setAttribute('stroke', color);
  arrow.setAttribute('stroke-width', String(STROKE.thin));
  arrow.setAttribute('fill', 'none');
  arrow.setAttribute('opacity', '0.5');
  innerG.appendChild(arrow);

  // Data particles (3 small circles along the flow)
  for (let i = 0; i < 3; i++) {
    const cx = -hw + 20 + i * (w - 40) / 2;
    const particle = document.createElementNS(SVG_NS, 'circle');
    particle.setAttribute('cx', String(cx));
    particle.setAttribute('cy', '0');
    particle.setAttribute('r', '2.5');
    particle.setAttribute('fill', color);
    particle.setAttribute('opacity', String(0.4 + i * 0.2));
    innerG.appendChild(particle);
  }

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
