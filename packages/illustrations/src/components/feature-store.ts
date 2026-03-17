/**
 * @preplai/illustrations — FeatureStore Component
 * Dual-port storage icon for ML feature serving (Training + Inference ports).
 * Cylinder body with "F" badge and left/right port indicators.
 */

import { SVG_NS, buildEntityGroup, applyEntranceAnimation, getSizeParam } from '../utils.js';
import { getCategoryColor, TYPOGRAPHY, STROKE, OPACITY } from '../design-tokens.js';
import { renderCylinderBase, getCylinderLabelY } from '../cylinder-utils.js';
import type { VisualEntity } from '@preplai/shared';

export function renderFeatureStore(entity: VisualEntity, parentEl: SVGElement): SVGGElement {
  const { outerG, innerG } = buildEntityGroup(entity);
  const size = getSizeParam(entity);
  const color = entity.color ?? getCategoryColor('FeatureStore');
  const gradId = `grad-fstore-${color.replace(/[^a-fA-F0-9]/g, '')}`;

  // ── Cylinder body (reuse shared cylinder renderer) ──
  renderCylinderBase(innerG, parentEl, {
    size,
    color,
    gradId,
    stripeOffsets: [],
    glass: true,
  });

  const rx = size / 2;
  const bodyH = size * 0.55;
  const topY = -size / 3;
  const bodyMidY = topY + bodyH / 2;

  // ── "F" badge centered in cylinder body ──
  const badge = document.createElementNS(SVG_NS, 'text');
  badge.setAttribute('x', '0');
  badge.setAttribute('y', String(bodyMidY + 5));
  badge.setAttribute('text-anchor', 'middle');
  badge.setAttribute('fill', color);
  badge.setAttribute('font-size', String(Math.max(12, size * 0.3)));
  badge.setAttribute('font-weight', String(TYPOGRAPHY.fontWeightBold));
  badge.setAttribute('font-family', TYPOGRAPHY.fontBadge);
  badge.setAttribute('opacity', '0.9');
  badge.textContent = 'F';
  innerG.appendChild(badge);

  // ── Left port (Training) ──
  const portW = size * 0.18;
  const portH = size * 0.12;
  const portR = 2;

  const leftPort = document.createElementNS(SVG_NS, 'rect');
  leftPort.setAttribute('x', String(-rx - portW));
  leftPort.setAttribute('y', String(bodyMidY - portH / 2));
  leftPort.setAttribute('width', String(portW));
  leftPort.setAttribute('height', String(portH));
  leftPort.setAttribute('rx', String(portR));
  leftPort.setAttribute('ry', String(portR));
  leftPort.setAttribute('fill', `${color}${OPACITY.fillMedium}`);
  leftPort.setAttribute('stroke', color);
  leftPort.setAttribute('stroke-width', String(STROKE.thin));
  innerG.appendChild(leftPort);

  // Left port connector line
  const leftLine = document.createElementNS(SVG_NS, 'line');
  leftLine.setAttribute('x1', String(-rx));
  leftLine.setAttribute('y1', String(bodyMidY));
  leftLine.setAttribute('x2', String(-rx - portW));
  leftLine.setAttribute('y2', String(bodyMidY));
  leftLine.setAttribute('stroke', color);
  leftLine.setAttribute('stroke-width', String(STROKE.thin));
  leftLine.setAttribute('opacity', '0.6');
  innerG.appendChild(leftLine);

  // Left port label
  const leftLabel = document.createElementNS(SVG_NS, 'text');
  leftLabel.setAttribute('x', String(-rx - portW / 2));
  leftLabel.setAttribute('y', String(bodyMidY + portH / 2 + 11));
  leftLabel.setAttribute('text-anchor', 'middle');
  leftLabel.setAttribute('fill', color);
  leftLabel.setAttribute('font-size', String(TYPOGRAPHY.fontSizeIndex));
  leftLabel.setAttribute('font-weight', String(TYPOGRAPHY.fontWeightLabel));
  leftLabel.setAttribute('font-family', TYPOGRAPHY.fontLabel);
  leftLabel.setAttribute('opacity', '0.7');
  leftLabel.textContent = 'Training';
  innerG.appendChild(leftLabel);

  // ── Right port (Inference) ──
  const rightPort = document.createElementNS(SVG_NS, 'rect');
  rightPort.setAttribute('x', String(rx));
  rightPort.setAttribute('y', String(bodyMidY - portH / 2));
  rightPort.setAttribute('width', String(portW));
  rightPort.setAttribute('height', String(portH));
  rightPort.setAttribute('rx', String(portR));
  rightPort.setAttribute('ry', String(portR));
  rightPort.setAttribute('fill', `${color}${OPACITY.fillMedium}`);
  rightPort.setAttribute('stroke', color);
  rightPort.setAttribute('stroke-width', String(STROKE.thin));
  innerG.appendChild(rightPort);

  // Right port connector line
  const rightLine = document.createElementNS(SVG_NS, 'line');
  rightLine.setAttribute('x1', String(rx));
  rightLine.setAttribute('y1', String(bodyMidY));
  rightLine.setAttribute('x2', String(rx + portW));
  rightLine.setAttribute('y2', String(bodyMidY));
  rightLine.setAttribute('stroke', color);
  rightLine.setAttribute('stroke-width', String(STROKE.thin));
  rightLine.setAttribute('opacity', '0.6');
  innerG.appendChild(rightLine);

  // Right port label
  const rightLabel = document.createElementNS(SVG_NS, 'text');
  rightLabel.setAttribute('x', String(rx + portW / 2));
  rightLabel.setAttribute('y', String(bodyMidY + portH / 2 + 11));
  rightLabel.setAttribute('text-anchor', 'middle');
  rightLabel.setAttribute('fill', color);
  rightLabel.setAttribute('font-size', String(TYPOGRAPHY.fontSizeIndex));
  rightLabel.setAttribute('font-weight', String(TYPOGRAPHY.fontWeightLabel));
  rightLabel.setAttribute('font-family', TYPOGRAPHY.fontLabel);
  rightLabel.setAttribute('opacity', '0.7');
  rightLabel.textContent = 'Inference';
  innerG.appendChild(rightLabel);

  // ── Entity label below ──
  if (entity.label) {
    const text = document.createElementNS(SVG_NS, 'text');
    text.setAttribute('x', '0');
    text.setAttribute('y', String(getCylinderLabelY(size)));
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
