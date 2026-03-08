/**
 * @preplai/illustrations — PipelineStage Component
 *
 * Single CI/CD pipeline stage: chevron shape with label and optional status.
 * Use multiple PipelineStage entities with Arrows/DataFlow between them for full pipelines.
 *
 * Metadata:
 *   label?: string — stage name (e.g. Build, Test, Deploy)
 *   status?: 'pending' | 'running' | 'success' | 'failed' — visual state
 */

import { SVG_NS, buildEntityGroup, applyEntranceAnimation, getSizeParam } from '../utils.js';
import { createLinearGradient, ensureDefs } from '../visual-utils.js';
import {
  getCategoryColor,
  getStrokeWidth,
  getLabelFontSize,
  colorWithAlpha,
  OPACITY,
  TYPOGRAPHY,
} from '../design-tokens.js';
import type { VisualEntity } from '@preplai/shared';

type Status = 'pending' | 'running' | 'success' | 'failed';

export function renderPipelineStage(entity: VisualEntity, parentEl: SVGElement): SVGGElement {
  const { outerG, innerG } = buildEntityGroup(entity);

  const s = getSizeParam(entity);
  const scale = s / 50;
  const labelFontSize = getLabelFontSize('label', scale);
  const strokeWidth = getStrokeWidth('default', scale);
  const color = entity.color ?? getCategoryColor('PipelineStage');
  const defs = ensureDefs(parentEl);
  const gradId = `grad-ps-${color.replace(/[^a-fA-F0-9]/g, '')}`;
  createLinearGradient(gradId, color, 'vertical', defs);

  const meta = entity.metadata ?? {};
  const label = (meta.label as string) ?? entity.label ?? 'Stage';
  const status = (meta.status as Status) ?? 'pending';

  const segW = s * 0.9;
  const segH = s * 0.6;
  const cx = 0;
  const cy = 0;

  const chevronPath = [
    `M ${cx - segW / 2} ${cy}`,
    `L ${cx} ${cy - segH / 2}`,
    `L ${cx + segW / 2} ${cy}`,
    `L ${cx} ${cy + segH / 2}`,
    'Z',
  ].join(' ');

  const seg = document.createElementNS(SVG_NS, 'path');
  seg.setAttribute('d', chevronPath);
  seg.setAttribute('fill', `url(#${gradId})`);
  seg.setAttribute('stroke', color);
  seg.setAttribute('stroke-width', String(strokeWidth));
  innerG.appendChild(seg);

  const labelText = document.createElementNS(SVG_NS, 'text');
  labelText.setAttribute('x', String(cx));
  labelText.setAttribute('y', String(cy + 4));
  labelText.setAttribute('text-anchor', 'middle');
  labelText.setAttribute('fill', color);
  labelText.setAttribute('font-size', String(labelFontSize));
  labelText.setAttribute('font-weight', String(TYPOGRAPHY.fontWeightEmphasis));
  labelText.setAttribute('font-family', TYPOGRAPHY.fontLabel);
  labelText.textContent = label.length > 12 ? label.slice(0, 10) + '…' : label;
  innerG.appendChild(labelText);

  const statusR = s * 0.12;
  const statusY = cy - segH / 2 - statusR - 4;
  if (status !== 'pending') {
    const statusCircle = document.createElementNS(SVG_NS, 'circle');
    statusCircle.setAttribute('cx', String(cx + segW / 2 - statusR));
    statusCircle.setAttribute('cy', String(statusY));
    statusCircle.setAttribute('r', String(statusR));
    statusCircle.setAttribute('fill', 'none');
    statusCircle.setAttribute('stroke', color);
    statusCircle.setAttribute('stroke-width', String(strokeWidth * 0.8));
    innerG.appendChild(statusCircle);

    if (status === 'success') {
      const check = document.createElementNS(SVG_NS, 'path');
      const sx = cx + segW / 2 - statusR;
      check.setAttribute('d', `M ${sx - 4} ${statusY} L ${sx - 1} ${statusY + 4} L ${sx + 5} ${statusY - 3}`);
      check.setAttribute('fill', 'none');
      check.setAttribute('stroke', color);
      check.setAttribute('stroke-width', String(strokeWidth));
      check.setAttribute('stroke-linecap', 'round');
      check.setAttribute('stroke-linejoin', 'round');
      innerG.appendChild(check);
    } else if (status === 'failed') {
      const x = cx + segW / 2 - statusR;
      const cross1 = document.createElementNS(SVG_NS, 'line');
      cross1.setAttribute('x1', String(x - 4));
      cross1.setAttribute('y1', String(statusY - 4));
      cross1.setAttribute('x2', String(x + 4));
      cross1.setAttribute('y2', String(statusY + 4));
      cross1.setAttribute('stroke', color);
      cross1.setAttribute('stroke-width', String(strokeWidth));
      innerG.appendChild(cross1);
      const cross2 = document.createElementNS(SVG_NS, 'line');
      cross2.setAttribute('x1', String(x + 4));
      cross2.setAttribute('y1', String(statusY - 4));
      cross2.setAttribute('x2', String(x - 4));
      cross2.setAttribute('y2', String(statusY + 4));
      cross2.setAttribute('stroke', color);
      cross2.setAttribute('stroke-width', String(strokeWidth));
      innerG.appendChild(cross2);
    } else if (status === 'running') {
      const dot = document.createElementNS(SVG_NS, 'circle');
      dot.setAttribute('cx', String(cx + segW / 2 - statusR));
      dot.setAttribute('cy', String(statusY));
      dot.setAttribute('r', String(statusR * 0.5));
      dot.setAttribute('fill', color);
      innerG.appendChild(dot);
    }
  }

  // Connection stubs (left/right) to show it's part of a pipeline
  const stubLen = s * 0.15;
  const leftStub = document.createElementNS(SVG_NS, 'line');
  leftStub.setAttribute('x1', String(cx - segW / 2 - stubLen));
  leftStub.setAttribute('y1', String(cy));
  leftStub.setAttribute('x2', String(cx - segW / 2));
  leftStub.setAttribute('y2', String(cy));
  leftStub.setAttribute('stroke', colorWithAlpha(color, OPACITY.strokeSoft));
  leftStub.setAttribute('stroke-width', String(strokeWidth * 0.8));
  innerG.appendChild(leftStub);

  const rightStub = document.createElementNS(SVG_NS, 'line');
  rightStub.setAttribute('x1', String(cx + segW / 2));
  rightStub.setAttribute('y1', String(cy));
  rightStub.setAttribute('x2', String(cx + segW / 2 + stubLen));
  rightStub.setAttribute('y2', String(cy));
  rightStub.setAttribute('stroke', colorWithAlpha(color, OPACITY.strokeSoft));
  rightStub.setAttribute('stroke-width', String(strokeWidth * 0.8));
  innerG.appendChild(rightStub);

  applyEntranceAnimation(innerG, entity);
  parentEl.appendChild(outerG);
  return outerG;
}
