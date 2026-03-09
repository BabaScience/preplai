/**
 * @preplai/illustrations — PullRequest Component
 * PR card: merge icon + title + status badge
 * Metadata: { prNumber?: number, status?: 'open'|'merged'|'closed', reviewers?: number }
 */

import { SVG_NS, buildEntityGroup, applyEntranceAnimation, getSizeParam } from '../utils.js';
import { createLinearGradient, ensureDefs } from '../visual-utils.js';
import {
  getCategoryColor, getStrokeWidth, getLabelFontSize,
  TYPOGRAPHY, SHAPES, COLORS, STROKE,
} from '../design-tokens.js';
import type { VisualEntity } from '@preplai/shared';

const STATUS_COLORS: Record<string, string> = {
  open: COLORS.green,
  merged: COLORS.violet,
  closed: COLORS.red,
};

export function renderPullRequest(entity: VisualEntity, parentEl: SVGElement): SVGGElement {
  const { outerG, innerG } = buildEntityGroup(entity);

  const s = getSizeParam(entity);
  const scale = s / 50;
  const color = entity.color ?? getCategoryColor('PullRequest');
  const defs = ensureDefs(parentEl);
  const gradId = `grad-pr-${entity.id.replace(/[^a-zA-Z0-9]/g, '')}`;
  createLinearGradient(gradId, color, 'vertical', defs);

  const meta = entity.metadata ?? {};
  const prNumber = meta.prNumber as number | undefined;
  const status = (meta.status as string) ?? 'open';
  const title = entity.label ?? 'Pull Request';

  const w = s * 1.6;
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

  // Merge icon (two lines merging into one)
  const mergeG = document.createElementNS(SVG_NS, 'g');
  mergeG.setAttribute('transform', `translate(${-hw + 18}, 0)`);
  // Top dot
  const topDot = document.createElementNS(SVG_NS, 'circle');
  topDot.setAttribute('cx', '0');
  topDot.setAttribute('cy', '-8');
  topDot.setAttribute('r', '3');
  topDot.setAttribute('fill', color);
  mergeG.appendChild(topDot);
  // Bottom dot
  const bottomDot = document.createElementNS(SVG_NS, 'circle');
  bottomDot.setAttribute('cx', '0');
  bottomDot.setAttribute('cy', '8');
  bottomDot.setAttribute('r', '3');
  bottomDot.setAttribute('fill', color);
  mergeG.appendChild(bottomDot);
  // Branch line curving into trunk
  const mergePath = document.createElementNS(SVG_NS, 'path');
  mergePath.setAttribute('d', 'M 0 -5 L 0 5 M 6 -6 Q 6 0 0 3');
  mergePath.setAttribute('stroke', color);
  mergePath.setAttribute('stroke-width', String(STROKE.default));
  mergePath.setAttribute('fill', 'none');
  mergePath.setAttribute('stroke-linecap', 'round');
  mergeG.appendChild(mergePath);
  innerG.appendChild(mergeG);

  // Title + PR number
  const titleStr = prNumber ? `#${prNumber} ${title}` : title;
  const titleText = document.createElementNS(SVG_NS, 'text');
  titleText.setAttribute('x', String(-hw + 32));
  titleText.setAttribute('y', String(-2));
  titleText.setAttribute('text-anchor', 'start');
  titleText.setAttribute('fill', color);
  titleText.setAttribute('font-size', String(getLabelFontSize('value', scale)));
  titleText.setAttribute('font-weight', String(TYPOGRAPHY.fontWeightBold));
  titleText.setAttribute('font-family', TYPOGRAPHY.fontLabel);
  titleText.textContent = titleStr.length > 22 ? titleStr.slice(0, 22) + '...' : titleStr;
  innerG.appendChild(titleText);

  // Status badge
  const statusColor = STATUS_COLORS[status] ?? color;
  const badgeW = status.length * 7 + 10;
  const badgeX = hw - badgeW - 6;
  const badgeY = hh - 18;

  const badge = document.createElementNS(SVG_NS, 'rect');
  badge.setAttribute('x', String(badgeX));
  badge.setAttribute('y', String(badgeY));
  badge.setAttribute('width', String(badgeW));
  badge.setAttribute('height', '12');
  badge.setAttribute('rx', '6');
  badge.setAttribute('fill', statusColor);
  badge.setAttribute('opacity', '0.7');
  innerG.appendChild(badge);

  const badgeText = document.createElementNS(SVG_NS, 'text');
  badgeText.setAttribute('x', String(badgeX + badgeW / 2));
  badgeText.setAttribute('y', String(badgeY + 9));
  badgeText.setAttribute('text-anchor', 'middle');
  badgeText.setAttribute('fill', '#0a0a12');
  badgeText.setAttribute('font-size', String(getLabelFontSize('inline', scale)));
  badgeText.setAttribute('font-family', TYPOGRAPHY.fontCode);
  badgeText.textContent = status;
  innerG.appendChild(badgeText);

  applyEntranceAnimation(innerG, entity);
  parentEl.appendChild(outerG);
  return outerG;
}
