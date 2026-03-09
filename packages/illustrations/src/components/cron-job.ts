/**
 * @preplai/illustrations — CronJob Component
 * Scheduled task: card with clock icon + cron expression + job name
 * Metadata: { schedule?: string, lastRun?: string }
 */

import { SVG_NS, buildEntityGroup, applyEntranceAnimation, getSizeParam } from '../utils.js';
import { createLinearGradient, ensureDefs } from '../visual-utils.js';
import {
  getCategoryColor, getStrokeWidth, getLabelFontSize,
  TYPOGRAPHY, SHAPES, STROKE,
} from '../design-tokens.js';
import type { VisualEntity } from '@preplai/shared';

export function renderCronJob(entity: VisualEntity, parentEl: SVGElement): SVGGElement {
  const { outerG, innerG } = buildEntityGroup(entity);

  const s = getSizeParam(entity);
  const scale = s / 50;
  const color = entity.color ?? getCategoryColor('CronJob');
  const defs = ensureDefs(parentEl);
  const gradId = `grad-cron-${entity.id.replace(/[^a-zA-Z0-9]/g, '')}`;
  createLinearGradient(gradId, color, 'vertical', defs);

  const label = entity.label ?? 'cleanup-logs';
  const meta = entity.metadata ?? {};
  const schedule = (meta.schedule as string) ?? '0 */6 * * *';

  const w = s * 1.4;
  const h = s * 0.7;
  const hw = w / 2;
  const hh = h / 2;

  // Card
  const card = document.createElementNS(SVG_NS, 'rect');
  card.setAttribute('x', String(-hw));
  card.setAttribute('y', String(-hh));
  card.setAttribute('width', String(w));
  card.setAttribute('height', String(h));
  card.setAttribute('rx', String(SHAPES.borderRadius));
  card.setAttribute('fill', `url(#${gradId})`);
  card.setAttribute('stroke', color);
  card.setAttribute('stroke-width', String(getStrokeWidth('default', scale)));
  innerG.appendChild(card);

  // Clock icon (circle + hour/minute hands)
  const clockG = document.createElementNS(SVG_NS, 'g');
  clockG.setAttribute('transform', `translate(${-hw + 18}, 0)`);
  const clockCircle = document.createElementNS(SVG_NS, 'circle');
  clockCircle.setAttribute('cx', '0');
  clockCircle.setAttribute('cy', '0');
  clockCircle.setAttribute('r', '8');
  clockCircle.setAttribute('fill', 'none');
  clockCircle.setAttribute('stroke', color);
  clockCircle.setAttribute('stroke-width', String(STROKE.default));
  clockG.appendChild(clockCircle);
  // Hour hand (pointing to 10 o'clock)
  const hourHand = document.createElementNS(SVG_NS, 'line');
  hourHand.setAttribute('x1', '0'); hourHand.setAttribute('y1', '0');
  hourHand.setAttribute('x2', '-3'); hourHand.setAttribute('y2', '-4');
  hourHand.setAttribute('stroke', color); hourHand.setAttribute('stroke-width', String(STROKE.emphasized));
  clockG.appendChild(hourHand);
  // Minute hand (pointing to 12)
  const minHand = document.createElementNS(SVG_NS, 'line');
  minHand.setAttribute('x1', '0'); minHand.setAttribute('y1', '0');
  minHand.setAttribute('x2', '0'); minHand.setAttribute('y2', '-6');
  minHand.setAttribute('stroke', color); minHand.setAttribute('stroke-width', String(STROKE.default));
  clockG.appendChild(minHand);
  // Center dot
  const centerDot = document.createElementNS(SVG_NS, 'circle');
  centerDot.setAttribute('cx', '0');
  centerDot.setAttribute('cy', '0');
  centerDot.setAttribute('r', '1.5');
  centerDot.setAttribute('fill', color);
  clockG.appendChild(centerDot);
  // Circular arrow (repeat indicator) at top-right
  const repeatArrow = document.createElementNS(SVG_NS, 'path');
  repeatArrow.setAttribute('d', 'M 5 -6 A 8 8 0 0 1 8 0 M 8 0 L 6 -2 M 8 0 L 10 -2');
  repeatArrow.setAttribute('fill', 'none');
  repeatArrow.setAttribute('stroke', color);
  repeatArrow.setAttribute('stroke-width', String(STROKE.thin));
  repeatArrow.setAttribute('opacity', '0.6');
  clockG.appendChild(repeatArrow);
  innerG.appendChild(clockG);

  // Job name
  const nameText = document.createElementNS(SVG_NS, 'text');
  nameText.setAttribute('x', String(-hw + 34));
  nameText.setAttribute('y', String(-3));
  nameText.setAttribute('text-anchor', 'start');
  nameText.setAttribute('fill', color);
  nameText.setAttribute('font-size', String(getLabelFontSize('value', scale)));
  nameText.setAttribute('font-weight', String(TYPOGRAPHY.fontWeightBold));
  nameText.setAttribute('font-family', TYPOGRAPHY.fontCode);
  nameText.textContent = label;
  innerG.appendChild(nameText);

  // Schedule
  const schedText = document.createElementNS(SVG_NS, 'text');
  schedText.setAttribute('x', String(-hw + 34));
  schedText.setAttribute('y', String(11));
  schedText.setAttribute('text-anchor', 'start');
  schedText.setAttribute('fill', color);
  schedText.setAttribute('font-size', String(getLabelFontSize('inline', scale)));
  schedText.setAttribute('font-family', TYPOGRAPHY.fontCode);
  schedText.setAttribute('opacity', '0.5');
  schedText.textContent = schedule;
  innerG.appendChild(schedText);

  applyEntranceAnimation(innerG, entity);
  parentEl.appendChild(outerG);
  return outerG;
}
