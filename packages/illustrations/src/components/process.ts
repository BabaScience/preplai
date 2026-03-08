/**
 * @preplai/illustrations — Process Component
 *
 * Process box: rounded rect + play-triangle icon.
 * Use for: flow diagrams, workflow steps, generic "run/execute" process nodes.
 *
 * Metadata: label (or entity.label) — process name
 */

import { SVG_NS, buildEntityGroup, applyEntranceAnimation, getSizeParam } from '../utils.js';
import { createLinearGradient, ensureDefs } from '../visual-utils.js';
import {
  getCategoryColor,
  getStrokeWidth,
  getLabelFontSize,
  TYPOGRAPHY,
  SHAPES,
} from '../design-tokens.js';
import type { VisualEntity } from '@preplai/shared';

export function renderProcess(entity: VisualEntity, parentEl: SVGElement): SVGGElement {
  const { outerG, innerG } = buildEntityGroup(entity);

  const s = getSizeParam(entity);
  const scale = s / 50;
  const strokeWidth = getStrokeWidth('default', scale);
  const color = entity.color ?? getCategoryColor('Process');
  const defs = ensureDefs(parentEl);
  const gradId = `grad-process-${color.replace(/[^a-fA-F0-9]/g, '')}`;
  createLinearGradient(gradId, color, 'vertical', defs);

  const w = s * 1.5;
  const h = s * 1.0;

  const rect = document.createElementNS(SVG_NS, 'rect');
  rect.setAttribute('x', String(-w / 2));
  rect.setAttribute('y', String(-h / 2));
  rect.setAttribute('width', String(w));
  rect.setAttribute('height', String(h));
  rect.setAttribute('rx', String(SHAPES.borderRadius));
  rect.setAttribute('fill', `url(#${gradId})`);
  rect.setAttribute('stroke', color);
  rect.setAttribute('stroke-width', String(strokeWidth));
  innerG.appendChild(rect);

  const triSize = s * 0.35;
  const playPath = [
    `M ${-triSize / 2} ${-triSize / 2}`,
    `L ${-triSize / 2} ${triSize / 2}`,
    `L ${triSize / 2} 0`,
    'Z',
  ].join(' ');
  const play = document.createElementNS(SVG_NS, 'path');
  play.setAttribute('d', playPath);
  play.setAttribute('fill', color);
  play.setAttribute('stroke', color);
  play.setAttribute('stroke-width', String(strokeWidth * 0.5));
  play.setAttribute('transform', `translate(0, -${triSize * 0.2})`);
  innerG.appendChild(play);

  const label = entity.label ?? (entity.metadata?.label as string) ?? 'Process';
  const labelText = document.createElementNS(SVG_NS, 'text');
  labelText.setAttribute('x', '0');
  labelText.setAttribute('y', String(triSize * 0.6));
  labelText.setAttribute('text-anchor', 'middle');
  labelText.setAttribute('fill', color);
  labelText.setAttribute('font-size', String(getLabelFontSize('label', scale)));
  labelText.setAttribute('font-weight', String(TYPOGRAPHY.fontWeightEmphasis));
  labelText.setAttribute('font-family', TYPOGRAPHY.fontLabel);
  labelText.textContent = label.length > 14 ? label.slice(0, 12) + '…' : label;
  innerG.appendChild(labelText);

  applyEntranceAnimation(innerG, entity);
  parentEl.appendChild(outerG);
  return outerG;
}
