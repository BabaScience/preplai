/**
 * @preplai/illustrations — Build Component
 * CI/CD build step: card with gear icon + status + duration
 * Metadata: { buildNumber?: string, status?: 'running'|'success'|'failed', duration?: string }
 */

import { SVG_NS, buildEntityGroup, applyEntranceAnimation, getSizeParam } from '../utils.js';
import { createLinearGradient, ensureDefs } from '../visual-utils.js';
import {
  getCategoryColor, getStrokeWidth, getLabelFontSize,
  TYPOGRAPHY, SHAPES, COLORS, STROKE,
} from '../design-tokens.js';
import type { VisualEntity } from '@preplai/shared';

export function renderBuild(entity: VisualEntity, parentEl: SVGElement): SVGGElement {
  const { outerG, innerG } = buildEntityGroup(entity);

  const s = getSizeParam(entity);
  const scale = s / 50;
  const color = entity.color ?? getCategoryColor('Build');
  const defs = ensureDefs(parentEl);
  const gradId = `grad-build-${entity.id.replace(/[^a-zA-Z0-9]/g, '')}`;
  createLinearGradient(gradId, color, 'vertical', defs);

  const meta = entity.metadata ?? {};
  const buildNumber = (meta.buildNumber as string) ?? '';
  const status = (meta.status as string) ?? 'success';
  const duration = (meta.duration as string) ?? '';
  const label = entity.label ?? 'Build';

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

  // Gear icon (simplified)
  const gearG = document.createElementNS(SVG_NS, 'g');
  gearG.setAttribute('transform', `translate(${-hw + 18}, 0)`);
  const gearCircle = document.createElementNS(SVG_NS, 'circle');
  gearCircle.setAttribute('cx', '0');
  gearCircle.setAttribute('cy', '0');
  gearCircle.setAttribute('r', '5');
  gearCircle.setAttribute('fill', 'none');
  gearCircle.setAttribute('stroke', color);
  gearCircle.setAttribute('stroke-width', String(STROKE.default));
  gearG.appendChild(gearCircle);
  // Gear teeth (4 stubs)
  for (let i = 0; i < 4; i++) {
    const angle = (Math.PI / 2) * i;
    const tooth = document.createElementNS(SVG_NS, 'line');
    tooth.setAttribute('x1', String(5 * Math.cos(angle)));
    tooth.setAttribute('y1', String(5 * Math.sin(angle)));
    tooth.setAttribute('x2', String(8 * Math.cos(angle)));
    tooth.setAttribute('y2', String(8 * Math.sin(angle)));
    tooth.setAttribute('stroke', color);
    tooth.setAttribute('stroke-width', String(STROKE.emphasized));
    tooth.setAttribute('stroke-linecap', 'round');
    gearG.appendChild(tooth);
  }
  innerG.appendChild(gearG);

  // Label + build number
  const titleStr = buildNumber ? `${label} #${buildNumber}` : label;
  const titleText = document.createElementNS(SVG_NS, 'text');
  titleText.setAttribute('x', String(-hw + 34));
  titleText.setAttribute('y', String(-2));
  titleText.setAttribute('text-anchor', 'start');
  titleText.setAttribute('fill', color);
  titleText.setAttribute('font-size', String(getLabelFontSize('value', scale)));
  titleText.setAttribute('font-weight', String(TYPOGRAPHY.fontWeightBold));
  titleText.setAttribute('font-family', TYPOGRAPHY.fontLabel);
  titleText.textContent = titleStr;
  innerG.appendChild(titleText);

  // Status + duration line
  const statusColor = status === 'success' ? COLORS.green : status === 'failed' ? COLORS.red : COLORS.orange;
  const statusInfo = duration ? `${status} · ${duration}` : status;
  const statusText = document.createElementNS(SVG_NS, 'text');
  statusText.setAttribute('x', String(-hw + 34));
  statusText.setAttribute('y', String(12));
  statusText.setAttribute('text-anchor', 'start');
  statusText.setAttribute('fill', statusColor);
  statusText.setAttribute('font-size', String(getLabelFontSize('inline', scale)));
  statusText.setAttribute('font-family', TYPOGRAPHY.fontCode);
  statusText.setAttribute('opacity', '0.8');
  statusText.textContent = statusInfo;
  innerG.appendChild(statusText);

  applyEntranceAnimation(innerG, entity);
  parentEl.appendChild(outerG);
  return outerG;
}
