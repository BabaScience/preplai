/**
 * @pre/illustrations — StepList Component
 * Numbered steps + connecting lines
 */

import { SVG_NS, buildEntityGroup, applyEntranceAnimation, getSizeParam } from '../utils.js';
import { createLinearGradient, ensureDefs } from '../visual-utils.js';
import { getCategoryColor, TYPOGRAPHY } from '../design-tokens.js';
import type { VisualEntity } from '@pre/shared';

export function renderStepList(entity: VisualEntity, parentEl: SVGElement): SVGGElement {
  const { outerG, innerG } = buildEntityGroup(entity);

  const s = getSizeParam(entity, 1.5);
  const color = entity.color ?? getCategoryColor('StepList');
  const defs = ensureDefs(parentEl);
  const gradId = `grad-steplist-${color.replace(/[^a-fA-F0-9]/g, '')}`;
  createLinearGradient(gradId, color, 'vertical', defs);

  const meta = entity.metadata ?? {};
  const steps = (meta.steps as string[]) ?? (entity.textContent ? entity.textContent.split('\n') : ['Step 1', 'Step 2', 'Step 3']);
  const visibleSteps = steps.slice(0, 5);

  const stepH = 28;
  const numR = 10;
  const startY = -((visibleSteps.length - 1) * stepH) / 2;

  visibleSteps.forEach((step, i) => {
    const y = startY + i * stepH;

    if (i > 0) {
      const prevY = startY + (i - 1) * stepH;
      const conn = document.createElementNS(SVG_NS, 'line');
      conn.setAttribute('x1', String(-s * 0.6));
      conn.setAttribute('y1', String(prevY + numR));
      conn.setAttribute('x2', String(-s * 0.6));
      conn.setAttribute('y2', String(y - numR));
      conn.setAttribute('stroke', color);
      conn.setAttribute('stroke-width', '1.5');
      conn.setAttribute('opacity', '0.5');
      innerG.appendChild(conn);
    }

    const circle = document.createElementNS(SVG_NS, 'circle');
    circle.setAttribute('cx', String(-s * 0.6));
    circle.setAttribute('cy', String(y));
    circle.setAttribute('r', String(numR));
    circle.setAttribute('fill', `url(#${gradId})`);
    circle.setAttribute('stroke', color);
    circle.setAttribute('stroke-width', '2');
    innerG.appendChild(circle);

    const num = document.createElementNS(SVG_NS, 'text');
    num.setAttribute('x', String(-s * 0.6));
    num.setAttribute('y', String(y + 4));
    num.setAttribute('text-anchor', 'middle');
    num.setAttribute('fill', color);
    num.setAttribute('font-size', '11');
    num.setAttribute('font-weight', '600');
    num.setAttribute('font-family', TYPOGRAPHY.fontBadge);
    num.textContent = String(i + 1);
    innerG.appendChild(num);

    const text = document.createElementNS(SVG_NS, 'text');
    text.setAttribute('x', String(-s * 0.6 + numR + 14));
    text.setAttribute('y', String(y + 4));
    text.setAttribute('fill', color);
    text.setAttribute('font-size', String(TYPOGRAPHY.fontSizeBadge + 1));
    text.setAttribute('font-family', TYPOGRAPHY.fontLabel);
    text.textContent = step;
    innerG.appendChild(text);
  });

  if (entity.label) {
    const title = document.createElementNS(SVG_NS, 'text');
    title.setAttribute('x', '0');
    title.setAttribute('y', String(startY - 20));
    title.setAttribute('text-anchor', 'middle');
    title.setAttribute('fill', color);
    title.setAttribute('font-size', String(TYPOGRAPHY.fontSizeTitle));
    title.setAttribute('font-weight', String(TYPOGRAPHY.fontWeightTitle));
    title.setAttribute('font-family', TYPOGRAPHY.fontLabel);
    title.textContent = entity.label;
    innerG.appendChild(title);
  }

  applyEntranceAnimation(innerG, entity);
  parentEl.appendChild(outerG);
  return outerG;
}
