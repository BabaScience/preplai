/**
 * @preplai/illustrations — SagaStep Component
 * A numbered step in a distributed transaction with action and compensation boxes.
 */

import { SVG_NS, buildEntityGroup, applyEntranceAnimation, getSizeParam } from '../utils.js';
import { getCategoryColor, TYPOGRAPHY, STROKE, OPACITY, COLORS, colorWithAlpha } from '../design-tokens.js';
import type { VisualEntity } from '@preplai/shared';

export function renderSagaStep(entity: VisualEntity, parentEl: SVGElement): SVGGElement {
  const { outerG, innerG } = buildEntityGroup(entity);
  const size = getSizeParam(entity);
  const color = entity.color ?? getCategoryColor('SagaStep');

  const meta = entity.metadata ?? {};
  const step = (meta.step as string) ?? 'Reserve Inventory';
  const action = (meta.action as string) ?? 'reserveItems()';
  const compensation = (meta.compensation as string) ?? 'releaseItems()';

  const scale = size / 50;
  const boxW = 100 * scale;
  const boxH = 35 * scale;
  const gap = 12 * scale;
  const rx = 4 * scale;

  const actionColor = COLORS.green;
  const compColor = COLORS.red;

  // ── Action box (top, green-tinted) ──
  const actionY = -boxH - gap / 2;
  const actionRect = document.createElementNS(SVG_NS, 'rect');
  actionRect.setAttribute('x', String(-boxW / 2));
  actionRect.setAttribute('y', String(actionY));
  actionRect.setAttribute('width', String(boxW));
  actionRect.setAttribute('height', String(boxH));
  actionRect.setAttribute('rx', String(rx));
  actionRect.setAttribute('fill', colorWithAlpha(actionColor, OPACITY.fillLight));
  actionRect.setAttribute('stroke', actionColor);
  actionRect.setAttribute('stroke-width', String(STROKE.default));
  innerG.appendChild(actionRect);

  // Action text inside
  const actionText = document.createElementNS(SVG_NS, 'text');
  actionText.setAttribute('x', '0');
  actionText.setAttribute('y', String(actionY + boxH / 2 + 4 * scale));
  actionText.setAttribute('text-anchor', 'middle');
  actionText.setAttribute('fill', actionColor);
  actionText.setAttribute('font-size', String(TYPOGRAPHY.fontSizeInline * scale));
  actionText.setAttribute('font-weight', String(TYPOGRAPHY.fontWeightEmphasis));
  actionText.setAttribute('font-family', TYPOGRAPHY.fontBadge);
  actionText.textContent = action;
  innerG.appendChild(actionText);

  // ── Compensation box (bottom, red-tinted) ──
  const compY = gap / 2;
  const compRect = document.createElementNS(SVG_NS, 'rect');
  compRect.setAttribute('x', String(-boxW / 2));
  compRect.setAttribute('y', String(compY));
  compRect.setAttribute('width', String(boxW));
  compRect.setAttribute('height', String(boxH));
  compRect.setAttribute('rx', String(rx));
  compRect.setAttribute('fill', colorWithAlpha(compColor, OPACITY.fillLight));
  compRect.setAttribute('stroke', compColor);
  compRect.setAttribute('stroke-width', String(STROKE.default));
  innerG.appendChild(compRect);

  // Compensation text inside
  const compText = document.createElementNS(SVG_NS, 'text');
  compText.setAttribute('x', '0');
  compText.setAttribute('y', String(compY + boxH / 2 + 4 * scale));
  compText.setAttribute('text-anchor', 'middle');
  compText.setAttribute('fill', compColor);
  compText.setAttribute('font-size', String(TYPOGRAPHY.fontSizeInline * scale));
  compText.setAttribute('font-weight', String(TYPOGRAPHY.fontWeightEmphasis));
  compText.setAttribute('font-family', TYPOGRAPHY.fontBadge);
  compText.textContent = compensation;
  innerG.appendChild(compText);

  // ── Arrow from action to compensation (rollback) ──
  const arrowX = boxW / 2 + 10 * scale;
  const arrowTopY = actionY + boxH / 2;
  const arrowBottomY = compY + boxH / 2;

  // Vertical line
  const arrowLine = document.createElementNS(SVG_NS, 'line');
  arrowLine.setAttribute('x1', String(arrowX));
  arrowLine.setAttribute('y1', String(arrowTopY));
  arrowLine.setAttribute('x2', String(arrowX));
  arrowLine.setAttribute('y2', String(arrowBottomY));
  arrowLine.setAttribute('stroke', color);
  arrowLine.setAttribute('stroke-width', String(STROKE.thin));
  arrowLine.setAttribute('opacity', '0.7');
  arrowLine.setAttribute('stroke-dasharray', '3,2');
  innerG.appendChild(arrowLine);

  // Arrowhead pointing down
  const arrowHead = document.createElementNS(SVG_NS, 'polygon');
  const ahSize = 4 * scale;
  arrowHead.setAttribute('points', [
    `${arrowX - ahSize},${arrowBottomY - ahSize}`,
    `${arrowX + ahSize},${arrowBottomY - ahSize}`,
    `${arrowX},${arrowBottomY}`,
  ].join(' '));
  arrowHead.setAttribute('fill', color);
  arrowHead.setAttribute('opacity', '0.7');
  innerG.appendChild(arrowHead);

  // "rollback" label on arrow
  const rollbackText = document.createElementNS(SVG_NS, 'text');
  rollbackText.setAttribute('x', String(arrowX + 6 * scale));
  rollbackText.setAttribute('y', String((arrowTopY + arrowBottomY) / 2 + 3 * scale));
  rollbackText.setAttribute('text-anchor', 'start');
  rollbackText.setAttribute('fill', color);
  rollbackText.setAttribute('font-size', String(TYPOGRAPHY.fontSizeIndex * scale));
  rollbackText.setAttribute('font-weight', String(TYPOGRAPHY.fontWeightLabel));
  rollbackText.setAttribute('font-family', TYPOGRAPHY.fontBadge);
  rollbackText.setAttribute('opacity', '0.6');
  rollbackText.textContent = 'rollback';
  innerG.appendChild(rollbackText);

  // ── Numbered circle (top-left corner of action box) ──
  const circR = 10 * scale;
  const circX = -boxW / 2 - 2 * scale;
  const circY = actionY - 2 * scale;

  const stepCircle = document.createElementNS(SVG_NS, 'circle');
  stepCircle.setAttribute('cx', String(circX));
  stepCircle.setAttribute('cy', String(circY));
  stepCircle.setAttribute('r', String(circR));
  stepCircle.setAttribute('fill', color);
  stepCircle.setAttribute('opacity', '0.9');
  innerG.appendChild(stepCircle);

  // Step number or first char
  const stepNum = document.createElementNS(SVG_NS, 'text');
  stepNum.setAttribute('x', String(circX));
  stepNum.setAttribute('y', String(circY + 4 * scale));
  stepNum.setAttribute('text-anchor', 'middle');
  stepNum.setAttribute('fill', '#ffffff');
  stepNum.setAttribute('font-size', String(TYPOGRAPHY.fontSizeBadge * scale));
  stepNum.setAttribute('font-weight', String(TYPOGRAPHY.fontWeightBold));
  stepNum.setAttribute('font-family', TYPOGRAPHY.fontBadge);
  stepNum.textContent = step.charAt(0).toUpperCase();
  innerG.appendChild(stepNum);

  // ── Step name as small text above action box ──
  const stepText = document.createElementNS(SVG_NS, 'text');
  stepText.setAttribute('x', String(circX + circR + 6 * scale));
  stepText.setAttribute('y', String(circY + 3 * scale));
  stepText.setAttribute('text-anchor', 'start');
  stepText.setAttribute('fill', color);
  stepText.setAttribute('font-size', String(TYPOGRAPHY.fontSizeInline * scale));
  stepText.setAttribute('font-weight', String(TYPOGRAPHY.fontWeightLabel));
  stepText.setAttribute('font-family', TYPOGRAPHY.fontLabel);
  stepText.setAttribute('opacity', '0.8');
  stepText.textContent = step;
  innerG.appendChild(stepText);

  // ── Entity label below ──
  if (entity.label) {
    const text = document.createElementNS(SVG_NS, 'text');
    text.setAttribute('x', '0');
    text.setAttribute('y', String(compY + boxH + 18));
    text.setAttribute('text-anchor', 'middle');
    text.setAttribute('fill', color);
    text.setAttribute('font-size', String(TYPOGRAPHY.fontSizeLabel));
    text.setAttribute('font-weight', String(TYPOGRAPHY.fontWeightLabel));
    text.setAttribute('font-family', TYPOGRAPHY.fontLabel);
    text.textContent = entity.label;
    innerG.appendChild(text);
  }

  applyEntranceAnimation(innerG, entity);
  parentEl.appendChild(outerG);
  return outerG;
}
