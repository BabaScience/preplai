/**
 * @preplai/illustrations — DeadLetterQueue Component
 * A queue with a warning triangle indicator for failed/dead messages.
 */

import { SVG_NS, buildEntityGroup, applyEntranceAnimation, getSizeParam } from '../utils.js';
import { getCategoryColor, TYPOGRAPHY, STROKE, OPACITY, COLORS, colorWithAlpha } from '../design-tokens.js';
import type { VisualEntity } from '@preplai/shared';

export function renderDeadLetterQueue(entity: VisualEntity, parentEl: SVGElement): SVGGElement {
  const { outerG, innerG } = buildEntityGroup(entity);
  const size = getSizeParam(entity);
  const color = entity.color ?? getCategoryColor('DeadLetterQueue');

  const meta = entity.metadata ?? {};
  const messageCount = (meta.messageCount as number) ?? 42;
  const retryPolicy = (meta.retryPolicy as string) ?? '';

  const scale = size / 50;
  const w = 100 * scale;
  const h = 40 * scale;
  const rx = 6 * scale;

  // ── Queue body (red-tinted rounded rect) ──
  const body = document.createElementNS(SVG_NS, 'rect');
  body.setAttribute('x', String(-w / 2));
  body.setAttribute('y', String(-h / 2));
  body.setAttribute('width', String(w));
  body.setAttribute('height', String(h));
  body.setAttribute('rx', String(rx));
  body.setAttribute('fill', colorWithAlpha(color, OPACITY.fillLight));
  body.setAttribute('stroke', color);
  body.setAttribute('stroke-width', String(STROKE.default));
  innerG.appendChild(body);

  // ── Horizontal lines inside (suggesting queued items) ──
  const lineCount = 3;
  const lineW = w * 0.6;
  for (let i = 0; i < lineCount; i++) {
    const ly = -h / 2 + (h / (lineCount + 1)) * (i + 1);
    const line = document.createElementNS(SVG_NS, 'line');
    line.setAttribute('x1', String(-lineW / 2));
    line.setAttribute('y1', String(ly));
    line.setAttribute('x2', String(lineW / 2));
    line.setAttribute('y2', String(ly));
    line.setAttribute('stroke', color);
    line.setAttribute('stroke-width', String(STROKE.thin));
    line.setAttribute('opacity', '0.4');
    line.setAttribute('stroke-dasharray', '4,3');
    innerG.appendChild(line);
  }

  // ── Warning triangle (top-right corner) ──
  const triSize = 14 * scale;
  const triCx = w / 2 - 2 * scale;
  const triCy = -h / 2 - 2 * scale;
  const amberColor = COLORS.orange;

  // Triangle background
  const triPath = document.createElementNS(SVG_NS, 'path');
  const triD = [
    `M ${triCx} ${triCy - triSize * 0.8}`,
    `L ${triCx + triSize * 0.7} ${triCy + triSize * 0.4}`,
    `L ${triCx - triSize * 0.7} ${triCy + triSize * 0.4}`,
    'Z',
  ].join(' ');
  triPath.setAttribute('d', triD);
  triPath.setAttribute('fill', amberColor);
  triPath.setAttribute('stroke', amberColor);
  triPath.setAttribute('stroke-width', String(STROKE.thin));
  triPath.setAttribute('stroke-linejoin', 'round');
  innerG.appendChild(triPath);

  // Exclamation mark inside triangle
  const excl = document.createElementNS(SVG_NS, 'text');
  excl.setAttribute('x', String(triCx));
  excl.setAttribute('y', String(triCy + triSize * 0.2));
  excl.setAttribute('text-anchor', 'middle');
  excl.setAttribute('fill', '#000000');
  excl.setAttribute('font-size', String(10 * scale));
  excl.setAttribute('font-weight', String(TYPOGRAPHY.fontWeightBold));
  excl.setAttribute('font-family', TYPOGRAPHY.fontLabel);
  excl.textContent = '!';
  innerG.appendChild(excl);

  // ── Message count badge (if provided) ──
  if (messageCount != null) {
    const badgeR = 10 * scale;
    const badgeX = -w / 2 + 2 * scale;
    const badgeY = -h / 2 - 2 * scale;

    const badge = document.createElementNS(SVG_NS, 'circle');
    badge.setAttribute('cx', String(badgeX));
    badge.setAttribute('cy', String(badgeY));
    badge.setAttribute('r', String(badgeR));
    badge.setAttribute('fill', color);
    badge.setAttribute('opacity', '0.9');
    innerG.appendChild(badge);

    const badgeText = document.createElementNS(SVG_NS, 'text');
    badgeText.setAttribute('x', String(badgeX));
    badgeText.setAttribute('y', String(badgeY + 3.5 * scale));
    badgeText.setAttribute('text-anchor', 'middle');
    badgeText.setAttribute('fill', '#ffffff');
    badgeText.setAttribute('font-size', String(TYPOGRAPHY.fontSizeBadge * scale));
    badgeText.setAttribute('font-weight', String(TYPOGRAPHY.fontWeightBold));
    badgeText.setAttribute('font-family', TYPOGRAPHY.fontBadge);
    badgeText.textContent = String(messageCount);
    innerG.appendChild(badgeText);
  }

  // ── Retry policy text (small, below queue body) ──
  if (retryPolicy) {
    const rpText = document.createElementNS(SVG_NS, 'text');
    rpText.setAttribute('x', '0');
    rpText.setAttribute('y', String(h / 2 + 14 * scale));
    rpText.setAttribute('text-anchor', 'middle');
    rpText.setAttribute('fill', color);
    rpText.setAttribute('font-size', String(TYPOGRAPHY.fontSizeInline * scale));
    rpText.setAttribute('font-weight', String(TYPOGRAPHY.fontWeightLabel));
    rpText.setAttribute('font-family', TYPOGRAPHY.fontBadge);
    rpText.setAttribute('opacity', '0.7');
    rpText.textContent = retryPolicy;
    innerG.appendChild(rpText);
  }

  // ── Entity label below ──
  if (entity.label) {
    const labelY = retryPolicy ? h / 2 + 28 * scale : h / 2 + 18;
    const text = document.createElementNS(SVG_NS, 'text');
    text.setAttribute('x', '0');
    text.setAttribute('y', String(labelY));
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
