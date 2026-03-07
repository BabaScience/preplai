/**
 * @preplai/illustrations — APIGateway Component
 *
 * Gateway icon: two angled portal shapes with dashed lines and </> code symbol.
 * Represents API gateways, routing layers, API management.
 * Distinct from API (rotating cogwheel) and Service (static cogwheel).
 */

import { SVG_NS, buildEntityGroup, applyEntranceAnimation, getSizeParam } from '../utils.js';
import { createLinearGradient, ensureDefs } from '../visual-utils.js';
import { getCategoryColor, TYPOGRAPHY, SHAPES } from '../design-tokens.js';
import type { VisualEntity } from '@preplai/shared';

export function renderAPIGateway(entity: VisualEntity, parentEl: SVGElement): SVGGElement {
  const { outerG, innerG } = buildEntityGroup(entity);

  const s = getSizeParam(entity);
  const color = entity.color ?? getCategoryColor('APIGateway');
  const defs = ensureDefs(parentEl);
  const gradId = `grad-apigw-${color.replace(/[^a-fA-F0-9]/g, '')}`;
  createLinearGradient(gradId, color, 'horizontal', defs);

  const w = s * 0.42;
  const h = s * 0.38;
  const innerW = s * 0.12;

  // ── Left gateway (angled trapezoid, receding toward center)
  const leftPath = `M ${-w},${-h} L ${-innerW},${-h / 2} L ${-innerW},${h / 2} L ${-w},${h} Z`;
  const leftGate = document.createElementNS(SVG_NS, 'path');
  leftGate.setAttribute('d', leftPath);
  leftGate.setAttribute('fill', `url(#${gradId})`);
  leftGate.setAttribute('stroke', color);
  leftGate.setAttribute('stroke-width', String(SHAPES.strokeWidth));
  leftGate.setAttribute('stroke-linejoin', 'round');
  innerG.appendChild(leftGate);

  // ── Right gateway (mirror of left)
  const rightPath = `M ${w},${-h} L ${innerW},${-h / 2} L ${innerW},${h / 2} L ${w},${h} Z`;
  const rightGate = document.createElementNS(SVG_NS, 'path');
  rightGate.setAttribute('d', rightPath);
  rightGate.setAttribute('fill', `url(#${gradId})`);
  rightGate.setAttribute('stroke', color);
  rightGate.setAttribute('stroke-width', String(SHAPES.strokeWidth));
  rightGate.setAttribute('stroke-linejoin', 'round');
  innerG.appendChild(rightGate);

  // ── Two horizontal dashed lines (flow/boundary between gateways)
  const dashY1 = -s * 0.08;
  const dashY2 = s * 0.08;
  const dashX = innerW + s * 0.06;

  const dash1 = document.createElementNS(SVG_NS, 'line');
  dash1.setAttribute('x1', String(-dashX));
  dash1.setAttribute('y1', String(dashY1));
  dash1.setAttribute('x2', String(dashX));
  dash1.setAttribute('y2', String(dashY1));
  dash1.setAttribute('stroke', color);
  dash1.setAttribute('stroke-width', String(SHAPES.strokeWidth));
  dash1.setAttribute('stroke-dasharray', '4,4');
  innerG.appendChild(dash1);

  const dash2 = document.createElementNS(SVG_NS, 'line');
  dash2.setAttribute('x1', String(-dashX));
  dash2.setAttribute('y1', String(dashY2));
  dash2.setAttribute('x2', String(dashX));
  dash2.setAttribute('y2', String(dashY2));
  dash2.setAttribute('stroke', color);
  dash2.setAttribute('stroke-width', String(SHAPES.strokeWidth));
  dash2.setAttribute('stroke-dasharray', '4,4');
  innerG.appendChild(dash2);

  // ── </> code symbol centered
  const codeText = document.createElementNS(SVG_NS, 'text');
  codeText.setAttribute('x', '0');
  codeText.setAttribute('y', '4');
  codeText.setAttribute('text-anchor', 'middle');
  codeText.setAttribute('fill', color);
  codeText.setAttribute('font-size', String(Math.min(14, Math.floor(s * 0.28))));
  codeText.setAttribute('font-weight', String(TYPOGRAPHY.fontWeightLabel));
  codeText.setAttribute('font-family', TYPOGRAPHY.fontCode);
  codeText.textContent = '</>';
  innerG.appendChild(codeText);

  // ── Optional label below
  const displayLabel = entity.label;
  if (displayLabel) {
    const label = document.createElementNS(SVG_NS, 'text');
    label.setAttribute('x', '0');
    label.setAttribute('y', String(s / 2 + 18));
    label.setAttribute('text-anchor', 'middle');
    label.setAttribute('fill', color);
    label.setAttribute('font-size', String(TYPOGRAPHY.fontSizeLabel));
    label.setAttribute('font-weight', String(TYPOGRAPHY.fontWeightLabel));
    label.setAttribute('font-family', TYPOGRAPHY.fontLabel);
    label.textContent = displayLabel;
    innerG.appendChild(label);
  }

  applyEntranceAnimation(innerG, entity);
  parentEl.appendChild(outerG);
  return outerG;
}
