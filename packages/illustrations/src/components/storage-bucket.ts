/**
 * @preplai/illustrations — StorageBucket Component
 * Cloud storage bucket: bucket/container shape with file icon
 * Metadata: { provider?: string, bucketName?: string }
 */

import { SVG_NS, buildEntityGroup, applyEntranceAnimation, getSizeParam } from '../utils.js';
import {
  getCategoryColor, getStrokeWidth, getLabelFontSize,
  colorWithAlpha, OPACITY,
  TYPOGRAPHY, STROKE,
} from '../design-tokens.js';
import type { VisualEntity } from '@preplai/shared';

export function renderStorageBucket(entity: VisualEntity, parentEl: SVGElement): SVGGElement {
  const { outerG, innerG } = buildEntityGroup(entity);

  const s = getSizeParam(entity);
  const scale = s / 50;
  const color = entity.color ?? getCategoryColor('StorageBucket');

  const label = entity.label ?? 'Storage';

  const w = s * 0.8;
  const h = s * 0.9;
  const hw = w / 2;

  // Bucket shape: trapezoid (wider at top)
  const topW = hw;
  const botW = hw * 0.7;
  const topY = -h * 0.4;
  const botY = h * 0.3;

  const bucket = document.createElementNS(SVG_NS, 'path');
  bucket.setAttribute('d', `M ${-topW} ${topY} L ${topW} ${topY} L ${botW} ${botY} L ${-botW} ${botY} Z`);
  bucket.setAttribute('fill', colorWithAlpha(color, OPACITY.fillLight));
  bucket.setAttribute('stroke', color);
  bucket.setAttribute('stroke-width', String(getStrokeWidth('default', scale)));
  bucket.setAttribute('stroke-linejoin', 'round');
  innerG.appendChild(bucket);

  // Top rim
  const rim = document.createElementNS(SVG_NS, 'line');
  rim.setAttribute('x1', String(-topW));
  rim.setAttribute('y1', String(topY));
  rim.setAttribute('x2', String(topW));
  rim.setAttribute('y2', String(topY));
  rim.setAttribute('stroke', color);
  rim.setAttribute('stroke-width', String(STROKE.emphasized));
  innerG.appendChild(rim);

  // File icon inside
  const fileG = document.createElementNS(SVG_NS, 'g');
  fileG.setAttribute('transform', `translate(0, ${topY + (botY - topY) * 0.45})`);
  const fileRect = document.createElementNS(SVG_NS, 'rect');
  fileRect.setAttribute('x', '-5');
  fileRect.setAttribute('y', '-6');
  fileRect.setAttribute('width', '10');
  fileRect.setAttribute('height', '12');
  fileRect.setAttribute('rx', '1');
  fileRect.setAttribute('fill', 'none');
  fileRect.setAttribute('stroke', color);
  fileRect.setAttribute('stroke-width', String(STROKE.thin));
  fileRect.setAttribute('opacity', '0.5');
  fileG.appendChild(fileRect);
  // Folded corner
  const fold = document.createElementNS(SVG_NS, 'path');
  fold.setAttribute('d', 'M 2 -6 L 5 -3');
  fold.setAttribute('stroke', color);
  fold.setAttribute('stroke-width', String(STROKE.thin));
  fold.setAttribute('opacity', '0.5');
  fileG.appendChild(fold);
  innerG.appendChild(fileG);

  // Label below
  if (label) {
    const text = document.createElementNS(SVG_NS, 'text');
    text.setAttribute('x', '0');
    text.setAttribute('y', String(botY + 18));
    text.setAttribute('text-anchor', 'middle');
    text.setAttribute('fill', color);
    text.setAttribute('font-size', String(getLabelFontSize('label', scale)));
    text.setAttribute('font-weight', String(TYPOGRAPHY.fontWeightLabel));
    text.setAttribute('font-family', TYPOGRAPHY.fontLabel);
    text.textContent = label;
    innerG.appendChild(text);
  }

  applyEntranceAnimation(innerG, entity);
  parentEl.appendChild(outerG);
  return outerG;
}
