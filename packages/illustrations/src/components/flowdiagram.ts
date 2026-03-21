/**
 * @preplai/illustrations — FlowDiagram Component
 *
 * Vertical flowchart: rect/diamond steps connected by arrows.
 * Use for: process flows, decision trees, algorithms.
 *
 * @see METADATA_SCHEMAS.md#flowdiagram
 *
 * Metadata:
 *   steps: Array<{ label: string, type?: 'default' | 'decision' }>
 */

import { SVG_NS, buildEntityGroup, applyEntranceAnimation, getSizeParam } from '../utils.js';
import { ensureDefs } from '../visual-utils.js';
import {
  getCategoryColor,
  getStrokeWidth,
  getLabelFontSize,
  TYPOGRAPHY,
  SHAPES,
  LABEL_DEFAULTS,
  colorWithAlpha,
  OPACITY,
} from '../design-tokens.js';
import type { VisualEntity } from '@preplai/shared';

type StepDef = { label: string; type?: 'default' | 'decision' };

const STEP_H = 32;
const BOX_W = 70;
const BOX_H = 24;
const DIAMOND_R = 18;

export function renderFlowDiagram(entity: VisualEntity, parentEl: SVGElement): SVGGElement {
  const { outerG, innerG } = buildEntityGroup(entity);

  const s = getSizeParam(entity);
  const scale = s / 50;
  const color = entity.color ?? getCategoryColor('FlowDiagram');
  const defs = ensureDefs(parentEl);

  const meta = entity.metadata ?? {};
  const stepsRaw = (meta.steps as StepDef[] | undefined) ?? [
    { label: 'Start', type: 'default' },
    { label: 'Condition?', type: 'decision' },
    { label: 'Process', type: 'default' },
    { label: 'End', type: 'default' },
  ];
  type StepInput = { label?: unknown; name?: unknown; type?: unknown };
  const steps: StepDef[] = Array.isArray(stepsRaw)
    ? (stepsRaw as StepInput[])
        .filter((st) => st != null && typeof st === 'object' && (st.label != null || st.name != null))
        .map((st) => ({
          label: String(st.label ?? st.name ?? 'Step'),
          type: (st.type === 'decision' ? 'decision' : 'default') as 'default' | 'decision',
        }))
    : [{ label: 'Start', type: 'default' }];

  const strokeWidth = Math.max(0.4, getStrokeWidth('minimal', scale) * 0.5);
  const shapeStrokeWidth = Math.max(0.5, getStrokeWidth('minimal', scale) * 0.67);
  const fontSize = getLabelFontSize('value', 1) / scale;

  const markerId = `arrow-fd-${entity.id.replace(/[^a-z0-9]/gi, '')}`;
  if (!defs.querySelector(`#${markerId}`)) {
    const marker = document.createElementNS(SVG_NS, 'marker');
    marker.setAttribute('id', markerId);
    marker.setAttribute('markerWidth', '8');
    marker.setAttribute('markerHeight', '6');
    marker.setAttribute('refX', '7');
    marker.setAttribute('refY', '3');
    marker.setAttribute('orient', 'auto');
    const poly = document.createElementNS(SVG_NS, 'polygon');
    poly.setAttribute('points', '0 0, 8 3, 0 6');
    poly.setAttribute('fill', color);
    marker.appendChild(poly);
    defs.appendChild(marker);
  }

  const scaleGroup = document.createElementNS(SVG_NS, 'g');
  scaleGroup.setAttribute('transform', `scale(${scale})`);

  const totalH = steps.length * STEP_H - 4;
  const startY = -totalH / 2 + STEP_H / 2;

  steps.forEach((step, i) => {
    const y = startY + i * STEP_H;
    const isDecision = step.type === 'decision';

    if (i > 0) {
      const prevY = startY + (i - 1) * STEP_H;
      const prevIsDecision = (steps[i - 1] as StepDef).type === 'decision';
      const prevBottom = prevIsDecision ? prevY + DIAMOND_R : prevY + BOX_H / 2;
      const top = isDecision ? y - DIAMOND_R : y - BOX_H / 2;

      const line = document.createElementNS(SVG_NS, 'line');
      line.setAttribute('x1', '0');
      line.setAttribute('y1', String(prevBottom));
      line.setAttribute('x2', '0');
      line.setAttribute('y2', String(top));
      line.setAttribute('stroke', color);
      line.setAttribute('stroke-width', String(strokeWidth));
      line.setAttribute('stroke-linecap', 'round');
      line.setAttribute('marker-end', `url(#${markerId})`);
      scaleGroup.appendChild(line);
    }

    const displayLabel = step.label.length > 14 ? step.label.slice(0, 11) + '…' : step.label;

    if (isDecision) {
      const stepG = document.createElementNS(SVG_NS, 'g');
      stepG.setAttribute('transform', `translate(0, ${y})`);

      const d = DIAMOND_R;
      const points = `0,${-d} ${d},0 0,${d} ${-d},0`;
      const poly = document.createElementNS(SVG_NS, 'polygon');
      poly.setAttribute('points', points);
      poly.setAttribute('fill', colorWithAlpha(color, OPACITY.fillLight));
      poly.setAttribute('stroke', color);
      poly.setAttribute('stroke-width', String(shapeStrokeWidth));
      poly.setAttribute('stroke-linejoin', 'round');
      poly.setAttribute('stroke-linecap', 'round');
      stepG.appendChild(poly);

      const text = document.createElementNS(SVG_NS, 'text');
      text.setAttribute('x', '0');
      text.setAttribute('y', '4');
      text.setAttribute('text-anchor', LABEL_DEFAULTS.textAnchor);
      text.setAttribute('fill', color);
      text.setAttribute('font-size', String(fontSize));
      text.setAttribute('font-weight', String(TYPOGRAPHY.fontWeightEmphasis));
      text.setAttribute('font-family', TYPOGRAPHY.fontLabel);
      text.textContent = displayLabel;
      stepG.appendChild(text);

      scaleGroup.appendChild(stepG);
    } else {
      const rect = document.createElementNS(SVG_NS, 'rect');
      rect.setAttribute('x', String(-BOX_W / 2));
      rect.setAttribute('y', String(y - BOX_H / 2));
      rect.setAttribute('width', String(BOX_W));
      rect.setAttribute('height', String(BOX_H));
      rect.setAttribute('rx', String(SHAPES.borderRadius));
      rect.setAttribute('fill', colorWithAlpha(color, OPACITY.fillLight));
      rect.setAttribute('stroke', color);
      rect.setAttribute('stroke-width', String(shapeStrokeWidth));
      rect.setAttribute('stroke-linejoin', 'round');
      scaleGroup.appendChild(rect);

      const text = document.createElementNS(SVG_NS, 'text');
      text.setAttribute('x', '0');
      text.setAttribute('y', String(y));
      text.setAttribute('text-anchor', LABEL_DEFAULTS.textAnchor);
      text.setAttribute('dominant-baseline', 'central');
      text.setAttribute('fill', color);
      text.setAttribute('font-size', String(fontSize));
      text.setAttribute('font-weight', String(TYPOGRAPHY.fontWeightLabel));
      text.setAttribute('font-family', TYPOGRAPHY.fontLabel);
      text.textContent = displayLabel;
      scaleGroup.appendChild(text);
    }
  });

  innerG.appendChild(scaleGroup);

  if (entity.label) {
    const labelEl = document.createElementNS(SVG_NS, 'text');
    labelEl.setAttribute('x', '0');
    labelEl.setAttribute('y', String(totalH / 2 * scale + LABEL_DEFAULTS.offsetBelow));
    labelEl.setAttribute('text-anchor', LABEL_DEFAULTS.textAnchor);
    labelEl.setAttribute('fill', color);
    labelEl.setAttribute('font-size', String(getLabelFontSize('label', scale)));
    labelEl.setAttribute('font-weight', String(TYPOGRAPHY.fontWeightLabel));
    labelEl.setAttribute('font-family', TYPOGRAPHY.fontLabel);
    labelEl.textContent = entity.label;
    innerG.appendChild(labelEl);
  }

  applyEntranceAnimation(innerG, entity);
  parentEl.appendChild(outerG);
  return outerG;
}
