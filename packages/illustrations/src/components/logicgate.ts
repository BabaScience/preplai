/**
 * @preplai/illustrations — LogicGate Component
 *
 * Digital logic gate with distinct shape and input/output lines.
 *
 * Metadata:
 *   gate?: string — gate type: 'AND', 'OR', 'XOR', 'NOT', 'NAND', 'NOR' (default 'AND')
 */

import { SVG_NS, buildEntityGroup, applyEntranceAnimation, getSizeParam } from '../utils.js';
import { createLinearGradient, ensureDefs } from '../visual-utils.js';
import {
  getCategoryColor,
  getStrokeWidth,
  getLabelFontSize,
  TYPOGRAPHY,
  SHAPES,
  LABEL_DEFAULTS,
} from '../design-tokens.js';
import type { VisualEntity } from '@preplai/shared';

export function renderLogicGate(entity: VisualEntity, parentEl: SVGElement): SVGGElement {
  const { outerG, innerG } = buildEntityGroup(entity);

  const s = getSizeParam(entity);
  const scale = s / 50;
  const color = entity.color ?? getCategoryColor('LogicGate');
  const defs = ensureDefs(parentEl);
  const gradId = `grad-lg-${color.replace(/[^a-fA-F0-9]/g, '')}`;
  createLinearGradient(gradId, color, 'vertical', defs);

  const meta = entity.metadata ?? {};
  const gate = ((meta.gate as string) ?? 'AND').toUpperCase();
  const label = entity.label ?? gate;

  const w = s * 1.6;
  const h = s * 1.2;
  const halfW = w / 2;
  const halfH = h / 2;
  const sw = getStrokeWidth('thin', scale);

  // Gate body — shield/rounded shape
  const body = document.createElementNS(SVG_NS, 'rect');
  body.setAttribute('x', String(-halfW));
  body.setAttribute('y', String(-halfH));
  body.setAttribute('width', String(w));
  body.setAttribute('height', String(h));
  body.setAttribute('rx', String(SHAPES.borderRadiusLarge));
  body.setAttribute('fill', `url(#${gradId})`);
  body.setAttribute('stroke', color);
  body.setAttribute('stroke-width', String(sw));
  innerG.appendChild(body);

  // Input lines (left side)
  const inputCount = gate === 'NOT' ? 1 : 2;
  const inputSpacing = h / (inputCount + 1);
  for (let i = 0; i < inputCount; i++) {
    const iy = -halfH + inputSpacing * (i + 1);
    const line = document.createElementNS(SVG_NS, 'line');
    line.setAttribute('x1', String(-halfW - s * 0.35));
    line.setAttribute('y1', String(iy));
    line.setAttribute('x2', String(-halfW));
    line.setAttribute('y2', String(iy));
    line.setAttribute('stroke', color);
    line.setAttribute('stroke-width', String(sw));
    line.setAttribute('opacity', '0.6');
    line.setAttribute('stroke-linecap', 'round');
    innerG.appendChild(line);

    // Input dot
    const dot = document.createElementNS(SVG_NS, 'circle');
    dot.setAttribute('cx', String(-halfW - s * 0.35));
    dot.setAttribute('cy', String(iy));
    dot.setAttribute('r', String(Math.max(2, 3 * scale)));
    dot.setAttribute('fill', color);
    dot.setAttribute('opacity', '0.5');
    innerG.appendChild(dot);
  }

  // Output line (right side)
  const outLine = document.createElementNS(SVG_NS, 'line');
  outLine.setAttribute('x1', String(halfW));
  outLine.setAttribute('y1', '0');
  outLine.setAttribute('x2', String(halfW + s * 0.35));
  outLine.setAttribute('y2', '0');
  outLine.setAttribute('stroke', color);
  outLine.setAttribute('stroke-width', String(sw));
  outLine.setAttribute('opacity', '0.6');
  outLine.setAttribute('stroke-linecap', 'round');
  innerG.appendChild(outLine);

  // Output dot
  const outDot = document.createElementNS(SVG_NS, 'circle');
  outDot.setAttribute('cx', String(halfW + s * 0.35));
  outDot.setAttribute('cy', '0');
  outDot.setAttribute('r', String(Math.max(2, 3 * scale)));
  outDot.setAttribute('fill', color);
  outDot.setAttribute('opacity', '0.7');
  innerG.appendChild(outDot);

  // Inversion bubble for NAND, NOR, NOT
  if (gate === 'NAND' || gate === 'NOR' || gate === 'NOT') {
    const bubble = document.createElementNS(SVG_NS, 'circle');
    bubble.setAttribute('cx', String(halfW + 5 * scale));
    bubble.setAttribute('cy', '0');
    bubble.setAttribute('r', String(Math.max(3, 4 * scale)));
    bubble.setAttribute('fill', 'none');
    bubble.setAttribute('stroke', color);
    bubble.setAttribute('stroke-width', String(sw));
    innerG.appendChild(bubble);
  }

  // Gate type text inside body
  const typeText = document.createElementNS(SVG_NS, 'text');
  typeText.setAttribute('x', '0');
  typeText.setAttribute('y', String(4 * scale));
  typeText.setAttribute('text-anchor', 'middle');
  typeText.setAttribute('fill', color);
  typeText.setAttribute('font-size', String(Math.min(getLabelFontSize('title', scale), s * 0.35)));
  typeText.setAttribute('font-weight', String(TYPOGRAPHY.fontWeightBold));
  typeText.setAttribute('font-family', TYPOGRAPHY.fontBadge);
  typeText.textContent = gate;
  innerG.appendChild(typeText);

  // Label below
  if (label) {
    const labelText = document.createElementNS(SVG_NS, 'text');
    labelText.setAttribute('x', '0');
    labelText.setAttribute('y', String(halfH + LABEL_DEFAULTS.offsetBelow));
    labelText.setAttribute('text-anchor', LABEL_DEFAULTS.textAnchor);
    labelText.setAttribute('fill', color);
    labelText.setAttribute('font-size', String(getLabelFontSize('label', scale)));
    labelText.setAttribute('font-weight', String(TYPOGRAPHY.fontWeightLabel));
    labelText.setAttribute('font-family', TYPOGRAPHY.fontLabel);
    labelText.textContent = label.length > 14 ? label.slice(0, 12) + '…' : label;
    innerG.appendChild(labelText);
  }

  applyEntranceAnimation(innerG, entity);
  parentEl.appendChild(outerG);
  return outerG;
}
