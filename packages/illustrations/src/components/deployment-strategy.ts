/**
 * @preplai/illustrations — DeploymentStrategy Component
 * Parallel environment boxes with traffic routing for blue-green/canary/rolling deployments.
 */

import { SVG_NS, buildEntityGroup, applyEntranceAnimation, getSizeParam } from '../utils.js';
import { getCategoryColor, TYPOGRAPHY, STROKE, OPACITY, COLORS, SHAPES } from '../design-tokens.js';
import type { VisualEntity } from '@preplai/shared';

interface DeploymentMetadata {
  strategy?: 'blue-green' | 'canary' | 'rolling';
  trafficSplit?: number;
}

export function renderDeploymentStrategy(entity: VisualEntity, parentEl: SVGElement): SVGGElement {
  const { outerG, innerG } = buildEntityGroup(entity);
  const size = getSizeParam(entity);
  const color = entity.color ?? getCategoryColor('DeploymentStrategy');

  const meta = (entity.metadata ?? {}) as DeploymentMetadata;
  const strategy = meta.strategy ?? 'blue-green';
  const trafficSplit = meta.trafficSplit ?? 50;

  if (strategy === 'rolling') {
    renderRolling(innerG, size, color);
  } else {
    renderDualEnv(innerG, size, color, strategy, trafficSplit);
  }

  // ── Entity label below ──
  if (entity.label) {
    const labelY = size * 0.85;
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

/** Render blue-green or canary: two env boxes + traffic router. */
function renderDualEnv(
  innerG: SVGGElement,
  size: number,
  color: string,
  strategy: 'blue-green' | 'canary',
  trafficSplit: number,
): void {
  const boxW = size * 0.8;
  const boxH = size * 0.5;
  const gap = size * 0.6;
  const leftX = -(gap / 2 + boxW);
  const rightX = gap / 2;
  const boxY = size * 0.05;
  const br = SHAPES.borderRadius;

  const greenColor = COLORS.green;
  const blueColor = COLORS.blue;

  const leftPct = strategy === 'canary' ? (100 - trafficSplit) : trafficSplit;
  const rightPct = strategy === 'canary' ? trafficSplit : (100 - trafficSplit);
  const leftName = strategy === 'canary' ? 'Current' : 'Blue';
  const rightName = strategy === 'canary' ? 'Canary' : 'Green';
  const leftColor = blueColor;
  const rightColor = greenColor;

  // ── Left environment box ──
  const leftBox = document.createElementNS(SVG_NS, 'rect');
  leftBox.setAttribute('x', String(leftX));
  leftBox.setAttribute('y', String(boxY));
  leftBox.setAttribute('width', String(boxW));
  leftBox.setAttribute('height', String(boxH));
  leftBox.setAttribute('rx', String(br));
  leftBox.setAttribute('ry', String(br));
  leftBox.setAttribute('fill', `${leftColor}${OPACITY.fillMedium}`);
  leftBox.setAttribute('stroke', leftColor);
  leftBox.setAttribute('stroke-width', String(STROKE.default));
  innerG.appendChild(leftBox);

  // Left box label
  const leftLabel = document.createElementNS(SVG_NS, 'text');
  leftLabel.setAttribute('x', String(leftX + boxW / 2));
  leftLabel.setAttribute('y', String(boxY + boxH / 2 + 4));
  leftLabel.setAttribute('text-anchor', 'middle');
  leftLabel.setAttribute('fill', leftColor);
  leftLabel.setAttribute('font-size', String(TYPOGRAPHY.fontSizeValue));
  leftLabel.setAttribute('font-weight', String(TYPOGRAPHY.fontWeightLabel));
  leftLabel.setAttribute('font-family', TYPOGRAPHY.fontLabel);
  leftLabel.textContent = leftName;
  innerG.appendChild(leftLabel);

  // Left traffic percentage
  const leftPctText = document.createElementNS(SVG_NS, 'text');
  leftPctText.setAttribute('x', String(leftX + boxW / 2));
  leftPctText.setAttribute('y', String(boxY + boxH + 14));
  leftPctText.setAttribute('text-anchor', 'middle');
  leftPctText.setAttribute('fill', leftColor);
  leftPctText.setAttribute('font-size', String(TYPOGRAPHY.fontSizeBadge));
  leftPctText.setAttribute('font-weight', String(TYPOGRAPHY.fontWeightBold));
  leftPctText.setAttribute('font-family', TYPOGRAPHY.fontBadge);
  leftPctText.setAttribute('opacity', '0.8');
  leftPctText.textContent = `${leftPct}%`;
  innerG.appendChild(leftPctText);

  // ── Right environment box ──
  const rightBox = document.createElementNS(SVG_NS, 'rect');
  rightBox.setAttribute('x', String(rightX));
  rightBox.setAttribute('y', String(boxY));
  rightBox.setAttribute('width', String(boxW));
  rightBox.setAttribute('height', String(boxH));
  rightBox.setAttribute('rx', String(br));
  rightBox.setAttribute('ry', String(br));
  rightBox.setAttribute('fill', `${rightColor}${OPACITY.fillMedium}`);
  rightBox.setAttribute('stroke', rightColor);
  rightBox.setAttribute('stroke-width', String(STROKE.default));
  innerG.appendChild(rightBox);

  // Right box label
  const rightLabel = document.createElementNS(SVG_NS, 'text');
  rightLabel.setAttribute('x', String(rightX + boxW / 2));
  rightLabel.setAttribute('y', String(boxY + boxH / 2 + 4));
  rightLabel.setAttribute('text-anchor', 'middle');
  rightLabel.setAttribute('fill', rightColor);
  rightLabel.setAttribute('font-size', String(TYPOGRAPHY.fontSizeValue));
  rightLabel.setAttribute('font-weight', String(TYPOGRAPHY.fontWeightLabel));
  rightLabel.setAttribute('font-family', TYPOGRAPHY.fontLabel);
  rightLabel.textContent = rightName;
  innerG.appendChild(rightLabel);

  // Right traffic percentage
  const rightPctText = document.createElementNS(SVG_NS, 'text');
  rightPctText.setAttribute('x', String(rightX + boxW / 2));
  rightPctText.setAttribute('y', String(boxY + boxH + 14));
  rightPctText.setAttribute('text-anchor', 'middle');
  rightPctText.setAttribute('fill', rightColor);
  rightPctText.setAttribute('font-size', String(TYPOGRAPHY.fontSizeBadge));
  rightPctText.setAttribute('font-weight', String(TYPOGRAPHY.fontWeightBold));
  rightPctText.setAttribute('font-family', TYPOGRAPHY.fontBadge);
  rightPctText.setAttribute('opacity', '0.8');
  rightPctText.textContent = `${rightPct}%`;
  innerG.appendChild(rightPctText);

  // ── Traffic router (diamond shape at top center) ──
  const routerY = boxY - size * 0.35;
  const routerS = size * 0.12;

  const diamond = document.createElementNS(SVG_NS, 'path');
  const dPath = [
    `M 0 ${routerY - routerS}`,
    `L ${routerS} ${routerY}`,
    `L 0 ${routerY + routerS}`,
    `L ${-routerS} ${routerY}`,
    'Z',
  ].join(' ');
  diamond.setAttribute('d', dPath);
  diamond.setAttribute('fill', `${color}${OPACITY.fillHeavy}`);
  diamond.setAttribute('stroke', color);
  diamond.setAttribute('stroke-width', String(STROKE.default));
  innerG.appendChild(diamond);

  // Router label
  const routerLabel = document.createElementNS(SVG_NS, 'text');
  routerLabel.setAttribute('x', '0');
  routerLabel.setAttribute('y', String(routerY - routerS - 6));
  routerLabel.setAttribute('text-anchor', 'middle');
  routerLabel.setAttribute('fill', color);
  routerLabel.setAttribute('font-size', String(TYPOGRAPHY.fontSizeIndex));
  routerLabel.setAttribute('font-weight', String(TYPOGRAPHY.fontWeightLabel));
  routerLabel.setAttribute('font-family', TYPOGRAPHY.fontLabel);
  routerLabel.setAttribute('opacity', '0.7');
  routerLabel.textContent = 'Router';
  innerG.appendChild(routerLabel);

  // ── Arrows from router to each environment ──
  const leftBoxCenter = leftX + boxW / 2;
  const rightBoxCenter = rightX + boxW / 2;

  // Arrow to left box
  const arrowLeft = document.createElementNS(SVG_NS, 'line');
  arrowLeft.setAttribute('x1', String(-routerS));
  arrowLeft.setAttribute('y1', String(routerY + routerS * 0.5));
  arrowLeft.setAttribute('x2', String(leftBoxCenter));
  arrowLeft.setAttribute('y2', String(boxY));
  arrowLeft.setAttribute('stroke', color);
  arrowLeft.setAttribute('stroke-width', String(STROKE.thin));
  arrowLeft.setAttribute('opacity', '0.5');
  arrowLeft.setAttribute('marker-end', 'none');
  innerG.appendChild(arrowLeft);

  // Arrow to right box
  const arrowRight = document.createElementNS(SVG_NS, 'line');
  arrowRight.setAttribute('x1', String(routerS));
  arrowRight.setAttribute('y1', String(routerY + routerS * 0.5));
  arrowRight.setAttribute('x2', String(rightBoxCenter));
  arrowRight.setAttribute('y2', String(boxY));
  arrowRight.setAttribute('stroke', color);
  arrowRight.setAttribute('stroke-width', String(STROKE.thin));
  arrowRight.setAttribute('opacity', '0.5');
  innerG.appendChild(arrowRight);

  // Small arrowheads (triangles) at the end of each arrow
  for (const [tx, ty] of [[leftBoxCenter, boxY], [rightBoxCenter, boxY]]) {
    const arrowHead = document.createElementNS(SVG_NS, 'polygon');
    const aSize = 4;
    arrowHead.setAttribute('points',
      `${tx},${ty} ${tx - aSize},${ty - aSize * 1.5} ${tx + aSize},${ty - aSize * 1.5}`
    );
    arrowHead.setAttribute('fill', color);
    arrowHead.setAttribute('opacity', '0.5');
    innerG.appendChild(arrowHead);
  }
}

/** Render rolling strategy: 3 boxes in a row with status indicators. */
function renderRolling(innerG: SVGGElement, size: number, color: string): void {
  const boxW = size * 0.55;
  const boxH = size * 0.4;
  const gap = size * 0.15;
  const totalW = boxW * 3 + gap * 2;
  const startX = -totalW / 2;
  const boxY = -boxH / 2;
  const br = SHAPES.borderRadius;

  const statuses: Array<{ label: string; statusColor: string; statusLabel: string }> = [
    { label: 'Pod 1', statusColor: COLORS.green, statusLabel: 'Updated' },
    { label: 'Pod 2', statusColor: COLORS.orange, statusLabel: 'Updating' },
    { label: 'Pod 3', statusColor: '#888888', statusLabel: 'Pending' },
  ];

  for (let i = 0; i < 3; i++) {
    const x = startX + i * (boxW + gap);
    const { label, statusColor, statusLabel } = statuses[i];

    // Box
    const box = document.createElementNS(SVG_NS, 'rect');
    box.setAttribute('x', String(x));
    box.setAttribute('y', String(boxY));
    box.setAttribute('width', String(boxW));
    box.setAttribute('height', String(boxH));
    box.setAttribute('rx', String(br));
    box.setAttribute('ry', String(br));
    box.setAttribute('fill', `${statusColor}${OPACITY.fillMedium}`);
    box.setAttribute('stroke', statusColor);
    box.setAttribute('stroke-width', String(STROKE.default));
    innerG.appendChild(box);

    // Box label
    const boxLabel = document.createElementNS(SVG_NS, 'text');
    boxLabel.setAttribute('x', String(x + boxW / 2));
    boxLabel.setAttribute('y', String(boxY + boxH / 2 - 2));
    boxLabel.setAttribute('text-anchor', 'middle');
    boxLabel.setAttribute('fill', statusColor);
    boxLabel.setAttribute('font-size', String(TYPOGRAPHY.fontSizeValue));
    boxLabel.setAttribute('font-weight', String(TYPOGRAPHY.fontWeightLabel));
    boxLabel.setAttribute('font-family', TYPOGRAPHY.fontLabel);
    boxLabel.textContent = label;
    innerG.appendChild(boxLabel);

    // Status indicator dot
    const dotR = 3;
    const dot = document.createElementNS(SVG_NS, 'circle');
    dot.setAttribute('cx', String(x + boxW / 2));
    dot.setAttribute('cy', String(boxY + boxH / 2 + 10));
    dot.setAttribute('r', String(dotR));
    dot.setAttribute('fill', statusColor);
    innerG.appendChild(dot);

    // Status label below box
    const statusText = document.createElementNS(SVG_NS, 'text');
    statusText.setAttribute('x', String(x + boxW / 2));
    statusText.setAttribute('y', String(boxY + boxH + 14));
    statusText.setAttribute('text-anchor', 'middle');
    statusText.setAttribute('fill', statusColor);
    statusText.setAttribute('font-size', String(TYPOGRAPHY.fontSizeIndex));
    statusText.setAttribute('font-weight', String(TYPOGRAPHY.fontWeightLabel));
    statusText.setAttribute('font-family', TYPOGRAPHY.fontLabel);
    statusText.setAttribute('opacity', '0.7');
    statusText.textContent = statusLabel;
    innerG.appendChild(statusText);

    // Progress arrow between boxes
    if (i < 2) {
      const arrowX1 = x + boxW + 2;
      const arrowX2 = x + boxW + gap - 2;
      const arrowY = boxY + boxH / 2;

      const arrow = document.createElementNS(SVG_NS, 'line');
      arrow.setAttribute('x1', String(arrowX1));
      arrow.setAttribute('y1', String(arrowY));
      arrow.setAttribute('x2', String(arrowX2));
      arrow.setAttribute('y2', String(arrowY));
      arrow.setAttribute('stroke', color);
      arrow.setAttribute('stroke-width', String(STROKE.thin));
      arrow.setAttribute('opacity', '0.4');
      innerG.appendChild(arrow);

      // Small arrowhead
      const aSize = 3;
      const head = document.createElementNS(SVG_NS, 'polygon');
      head.setAttribute('points',
        `${arrowX2},${arrowY} ${arrowX2 - aSize * 1.5},${arrowY - aSize} ${arrowX2 - aSize * 1.5},${arrowY + aSize}`
      );
      head.setAttribute('fill', color);
      head.setAttribute('opacity', '0.4');
      innerG.appendChild(head);
    }
  }

  // Rolling strategy title above
  const titleY = boxY - 10;
  const title = document.createElementNS(SVG_NS, 'text');
  title.setAttribute('x', '0');
  title.setAttribute('y', String(titleY));
  title.setAttribute('text-anchor', 'middle');
  title.setAttribute('fill', color);
  title.setAttribute('font-size', String(TYPOGRAPHY.fontSizeIndex));
  title.setAttribute('font-weight', String(TYPOGRAPHY.fontWeightLabel));
  title.setAttribute('font-family', TYPOGRAPHY.fontLabel);
  title.setAttribute('opacity', '0.6');
  title.textContent = 'Rolling Update';
  innerG.appendChild(title);
}
