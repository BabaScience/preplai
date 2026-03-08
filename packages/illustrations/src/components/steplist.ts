/**
 * @preplai/illustrations — StepList Component
 * Numbered steps + connecting lines
 *
 * Layout in design units; uniform scale transform so size changes scale the whole illustration.
 */

import { SVG_NS, buildEntityGroup, applyEntranceAnimation, getSizeParam } from '../utils.js';
import { createLinearGradient, ensureDefs } from '../visual-utils.js';
import { getCategoryColor, TYPOGRAPHY, STROKE } from '../design-tokens.js';
import type { VisualEntity } from '@preplai/shared';

const DESIGN_STEP_H = 28;
const DESIGN_NUM_R = 10;
const DESIGN_LEFT_X = -30; // Circle center x in design units
const DESIGN_TEXT_LEFT = DESIGN_LEFT_X + DESIGN_NUM_R + 14; // Left edge of step text (left-aligned)

/** Truncate step label to max 2 words for clean display. */
function truncateStepLabel(text: string): string {
  const words = text.trim().split(/\s+/);
  if (words.length <= 2) return text.trim();
  return words.slice(0, 2).join(' ');
}

export function renderStepList(entity: VisualEntity, parentEl: SVGElement): SVGGElement {
  const { outerG, innerG } = buildEntityGroup(entity);

  const s = getSizeParam(entity);
  const color = entity.color ?? getCategoryColor('StepList');
  const defs = ensureDefs(parentEl);
  const gradId = `grad-steplist-${color.replace(/[^a-fA-F0-9]/g, '')}`;
  createLinearGradient(gradId, color, 'vertical', defs);

  const meta = entity.metadata ?? {};
  const steps = (meta.steps as string[]) ?? (entity.textContent ? entity.textContent.split('\n') : ['Step 1', 'Step 2', 'Step 3']);
  const visibleSteps = steps.slice(0, 5);
  const currentStep = typeof meta.currentStep === 'number' ? meta.currentStep : -1;
  const checkmarks = meta.checkmarks === true;

  const stepH = DESIGN_STEP_H;
  const numR = DESIGN_NUM_R;
  const leftX = DESIGN_LEFT_X;
  const startY = -((visibleSteps.length - 1) * stepH) / 2;

  const scale = s / 50;
  const scaleGroup = document.createElementNS(SVG_NS, 'g');
  scaleGroup.setAttribute('transform', `scale(${scale})`);

  visibleSteps.forEach((step, i) => {
    const y = startY + i * stepH;
    const isCompleted = checkmarks && currentStep >= 0 && i < currentStep;
    const isCurrent = currentStep >= 0 && i === currentStep;

    if (i > 0) {
      const prevY = startY + (i - 1) * stepH;
      const conn = document.createElementNS(SVG_NS, 'line');
      conn.setAttribute('x1', String(leftX));
      conn.setAttribute('y1', String(prevY + numR));
      conn.setAttribute('x2', String(leftX));
      conn.setAttribute('y2', String(y - numR));
      conn.setAttribute('stroke', color);
      conn.setAttribute('stroke-width', String(STROKE.thin));
      conn.setAttribute('opacity', '0.5');
      scaleGroup.appendChild(conn);
    }

    const circle = document.createElementNS(SVG_NS, 'circle');
    circle.setAttribute('cx', String(leftX));
    circle.setAttribute('cy', String(y));
    circle.setAttribute('r', String(numR));
    circle.setAttribute('fill', isCompleted ? color : `url(#${gradId})`);
    circle.setAttribute('stroke', color);
    circle.setAttribute('stroke-width', String(isCurrent ? STROKE.selected : STROKE.default));
    circle.setAttribute('opacity', isCompleted ? '0.6' : '1');
    scaleGroup.appendChild(circle);

    if (isCompleted) {
      const check = document.createElementNS(SVG_NS, 'path');
      check.setAttribute('d', `M ${leftX - 5} ${y + 4} L ${leftX - 2} ${y} L ${leftX + 6} ${y - 4}`);
      check.setAttribute('fill', 'none');
      check.setAttribute('stroke', 'white');
      check.setAttribute('stroke-width', String(STROKE.default));
      check.setAttribute('stroke-linecap', 'round');
      check.setAttribute('stroke-linejoin', 'round');
      scaleGroup.appendChild(check);
    } else {
      const num = document.createElementNS(SVG_NS, 'text');
      num.setAttribute('x', String(leftX));
      num.setAttribute('y', String(y + 4));
      num.setAttribute('text-anchor', 'middle');
      num.setAttribute('fill', isCurrent ? color : 'white');
      num.setAttribute('font-size', String(Math.round(12 * scale)));
      num.setAttribute('font-weight', '600');
      num.setAttribute('font-family', TYPOGRAPHY.fontBadge);
      num.textContent = String(i + 1);
      scaleGroup.appendChild(num);
    }

    const text = document.createElementNS(SVG_NS, 'text');
    text.setAttribute('x', String(DESIGN_TEXT_LEFT));
    text.setAttribute('y', String(y + 4));
    text.setAttribute('text-anchor', 'start');
    text.setAttribute('fill', color);
    text.setAttribute('font-size', String(Math.round(13 * scale)));
    text.setAttribute('font-family', TYPOGRAPHY.fontLabel);
    text.textContent = truncateStepLabel(step);
    scaleGroup.appendChild(text);
  });

  if (entity.label) {
    const title = document.createElementNS(SVG_NS, 'text');
    title.setAttribute('x', String(DESIGN_TEXT_LEFT));
    title.setAttribute('y', String(startY - 20));
    title.setAttribute('text-anchor', 'start');
    title.setAttribute('fill', color);
    title.setAttribute('font-size', String(TYPOGRAPHY.fontSizeTitle));
    title.setAttribute('font-weight', String(TYPOGRAPHY.fontWeightTitle));
    title.setAttribute('font-family', TYPOGRAPHY.fontLabel);
    title.textContent = entity.label;
    scaleGroup.appendChild(title);
  }

  innerG.appendChild(scaleGroup);

  applyEntranceAnimation(innerG, entity);
  parentEl.appendChild(outerG);
  return outerG;
}
