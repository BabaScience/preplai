/**
 * @preplai/illustrations — MLModel Component
 * Simplified brain/model icon for high-level ML architecture.
 * Rounded rectangle body with stylized brain shape, status indicator, and metadata badges.
 */

import { SVG_NS, buildEntityGroup, applyEntranceAnimation, getSizeParam } from '../utils.js';
import { createLinearGradient, ensureDefs, ensureGlassFilter } from '../visual-utils.js';
import { getCategoryColor, colorWithAlpha, TYPOGRAPHY, STROKE, OPACITY, COLORS, SHAPES } from '../design-tokens.js';
import type { VisualEntity } from '@preplai/shared';

/** Status → dot color mapping */
const STATUS_COLORS: Record<string, string> = {
  training: COLORS.orange,
  deployed: COLORS.green,
  archived: '#888888',
};

export function renderMLModel(entity: VisualEntity, parentEl: SVGElement): SVGGElement {
  const { outerG, innerG } = buildEntityGroup(entity);
  const size = getSizeParam(entity);
  const color = entity.color ?? getCategoryColor('MLModel');
  const meta = (entity.metadata ?? {}) as {
    framework?: string;
    version?: string;
    accuracy?: string;
    status?: string;
  };

  const defs = ensureDefs(parentEl);
  const gradId = `grad-mlmodel-${color.replace(/[^a-fA-F0-9]/g, '')}`;
  createLinearGradient(gradId, color, 'vertical', defs);

  const w = size * 2.0;   // ~100px at size=50
  const h = size * 1.4;   // ~70px at size=50

  // ── Body (rounded rectangle) ──
  const body = document.createElementNS(SVG_NS, 'rect');
  body.setAttribute('x', String(-w / 2));
  body.setAttribute('y', String(-h / 2));
  body.setAttribute('width', String(w));
  body.setAttribute('height', String(h));
  body.setAttribute('rx', String(SHAPES.borderRadiusLarge));
  body.setAttribute('fill', colorWithAlpha(color, OPACITY.fillLight));
  body.setAttribute('stroke', color);
  body.setAttribute('stroke-width', String(STROKE.default));
  body.setAttribute('filter', ensureGlassFilter(parentEl));
  innerG.appendChild(body);

  // ── Brain icon (stylized walnut shape — two curved halves) ──
  // Scaled relative to body size
  const brainScale = size * 0.28;
  const brainY = -h * 0.08; // slightly above center to leave room for badges

  // Left hemisphere
  const brainLeft = document.createElementNS(SVG_NS, 'path');
  brainLeft.setAttribute('d', [
    `M 0 ${brainY - brainScale * 0.8}`,
    `C ${-brainScale * 0.3} ${brainY - brainScale} ${-brainScale * 0.9} ${brainY - brainScale * 0.6} ${-brainScale * 0.85} ${brainY - brainScale * 0.1}`,
    `C ${-brainScale * 0.8} ${brainY + brainScale * 0.5} ${-brainScale * 0.3} ${brainY + brainScale * 0.9} 0 ${brainY + brainScale * 0.8}`,
  ].join(' '));
  brainLeft.setAttribute('fill', 'none');
  brainLeft.setAttribute('stroke', color);
  brainLeft.setAttribute('stroke-width', String(STROKE.default));
  brainLeft.setAttribute('stroke-linecap', 'round');
  brainLeft.setAttribute('opacity', '0.8');
  innerG.appendChild(brainLeft);

  // Right hemisphere (mirror)
  const brainRight = document.createElementNS(SVG_NS, 'path');
  brainRight.setAttribute('d', [
    `M 0 ${brainY - brainScale * 0.8}`,
    `C ${brainScale * 0.3} ${brainY - brainScale} ${brainScale * 0.9} ${brainY - brainScale * 0.6} ${brainScale * 0.85} ${brainY - brainScale * 0.1}`,
    `C ${brainScale * 0.8} ${brainY + brainScale * 0.5} ${brainScale * 0.3} ${brainY + brainScale * 0.9} 0 ${brainY + brainScale * 0.8}`,
  ].join(' '));
  brainRight.setAttribute('fill', 'none');
  brainRight.setAttribute('stroke', color);
  brainRight.setAttribute('stroke-width', String(STROKE.default));
  brainRight.setAttribute('stroke-linecap', 'round');
  brainRight.setAttribute('opacity', '0.8');
  innerG.appendChild(brainRight);

  // Center divide line
  const centerLine = document.createElementNS(SVG_NS, 'line');
  centerLine.setAttribute('x1', '0');
  centerLine.setAttribute('y1', String(brainY - brainScale * 0.7));
  centerLine.setAttribute('x2', '0');
  centerLine.setAttribute('y2', String(brainY + brainScale * 0.7));
  centerLine.setAttribute('stroke', color);
  centerLine.setAttribute('stroke-width', String(STROKE.minimal));
  centerLine.setAttribute('opacity', '0.4');
  innerG.appendChild(centerLine);

  // ── Status indicator (colored dot in top-right corner) ──
  const status = meta.status?.toLowerCase() ?? '';
  const statusColor = STATUS_COLORS[status] ?? color;
  const statusDot = document.createElementNS(SVG_NS, 'circle');
  statusDot.setAttribute('cx', String(w / 2 - 10));
  statusDot.setAttribute('cy', String(-h / 2 + 10));
  statusDot.setAttribute('r', '4');
  statusDot.setAttribute('fill', statusColor);
  statusDot.setAttribute('opacity', '0.9');
  innerG.appendChild(statusDot);

  // ── Accuracy badge (below brain, if provided) ──
  if (meta.accuracy) {
    const accText = document.createElementNS(SVG_NS, 'text');
    accText.setAttribute('x', '0');
    accText.setAttribute('y', String(brainY + brainScale + 10));
    accText.setAttribute('text-anchor', 'middle');
    accText.setAttribute('fill', color);
    accText.setAttribute('font-size', String(TYPOGRAPHY.fontSizeBadge));
    accText.setAttribute('font-weight', String(TYPOGRAPHY.fontWeightEmphasis));
    accText.setAttribute('font-family', TYPOGRAPHY.fontBadge);
    accText.setAttribute('opacity', '0.8');
    accText.textContent = meta.accuracy;
    innerG.appendChild(accText);
  }

  // ── Version text (small monospace, bottom-left) ──
  if (meta.version) {
    const verText = document.createElementNS(SVG_NS, 'text');
    verText.setAttribute('x', String(-w / 2 + 8));
    verText.setAttribute('y', String(h / 2 - 6));
    verText.setAttribute('text-anchor', 'start');
    verText.setAttribute('fill', color);
    verText.setAttribute('font-size', String(TYPOGRAPHY.fontSizeIndex));
    verText.setAttribute('font-weight', String(TYPOGRAPHY.fontWeightLabel));
    verText.setAttribute('font-family', TYPOGRAPHY.fontBadge);
    verText.setAttribute('opacity', '0.5');
    verText.textContent = `v${meta.version}`;
    innerG.appendChild(verText);
  }

  // ── Entity label below ──
  if (entity.label) {
    const label = document.createElementNS(SVG_NS, 'text');
    label.setAttribute('x', '0');
    label.setAttribute('y', String(h / 2 + 20));
    label.setAttribute('text-anchor', 'middle');
    label.setAttribute('fill', color);
    label.setAttribute('font-size', String(TYPOGRAPHY.fontSizeLabel));
    label.setAttribute('font-weight', String(TYPOGRAPHY.fontWeightLabel));
    label.setAttribute('font-family', TYPOGRAPHY.fontLabel);
    label.textContent = entity.label;
    innerG.appendChild(label);
  }

  applyEntranceAnimation(innerG, entity);
  parentEl.appendChild(outerG);
  return outerG;
}
