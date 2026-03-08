/**
 * @preplai/illustrations — User Component
 *
 * Human figure: head (radial gradient) + neck + shoulders/torso arc + arms.
 * Uses design tokens for stroke, typography, and optional highlight glow.
 */

import { SVG_NS, buildEntityGroup, applyEntranceAnimation, getSizeParam } from '../utils.js';
import { createRadialGradient, ensureDefs } from '../visual-utils.js';
import {
  getCategoryColor,
  getStrokeWidth,
  getLabelFontSize,
  colorWithAlpha,
  OPACITY,
  TYPOGRAPHY,
  LABEL_DEFAULTS,
} from '../design-tokens.js';
import type { VisualEntity } from '@preplai/shared';

export function renderUser(entity: VisualEntity, parentEl: SVGElement): SVGGElement {
  const { outerG, innerG } = buildEntityGroup(entity);

  const s = getSizeParam(entity) * 0.9;
  const scale = s / 50;
  const color = entity.color ?? getCategoryColor('User');
  const strokeW = getStrokeWidth('default', scale);
  const strokeThin = getStrokeWidth('thin', scale);
  const defs = ensureDefs(parentEl);
  const headGradId = `grad-user-head-${color.replace(/[^a-fA-F0-9]/g, '')}`;
  createRadialGradient(headGradId, color, defs);

  const headR = s * 0.28;
  const headY = -s * 0.32;
  const _shoulderY = s * 0.08;
  const shoulderW = s * 0.42;

  if (entity.highlight) {
    const glow = document.createElementNS(SVG_NS, 'circle');
    glow.setAttribute('cx', '0');
    glow.setAttribute('cy', String(headY));
    glow.setAttribute('r', String(headR + 6));
    glow.setAttribute('fill', 'none');
    glow.setAttribute('stroke', colorWithAlpha(color, OPACITY.strokeMuted));
    glow.setAttribute('stroke-width', String(strokeW));
    glow.setAttribute('stroke-dasharray', '4,4');
    innerG.appendChild(glow);
  }

  // Head
  const head = document.createElementNS(SVG_NS, 'circle');
  head.setAttribute('cx', '0');
  head.setAttribute('cy', String(headY));
  head.setAttribute('r', String(headR));
  head.setAttribute('fill', `url(#${headGradId})`);
  head.setAttribute('stroke', color);
  head.setAttribute('stroke-width', String(strokeW));
  innerG.appendChild(head);

  // Neck
  const neckW = s * 0.12;
  const neckH = s * 0.14;
  const neck = document.createElementNS(SVG_NS, 'rect');
  neck.setAttribute('x', String(-neckW / 2));
  neck.setAttribute('y', String(headY + headR - 1));
  neck.setAttribute('width', String(neckW));
  neck.setAttribute('height', String(neckH));
  neck.setAttribute('rx', String(neckW / 4));
  neck.setAttribute('fill', colorWithAlpha(color, OPACITY.fillMedium));
  neck.setAttribute('stroke', color);
  neck.setAttribute('stroke-width', String(strokeThin));
  innerG.appendChild(neck);

  // Shoulders/torso arc — smooth curve from shoulder to shoulder
  const bodyTopY = headY + headR + neckH;
  const body = document.createElementNS(SVG_NS, 'path');
  body.setAttribute(
    'd',
    `M ${-shoulderW} ${bodyTopY} Q 0 ${bodyTopY - s * 0.18} ${shoulderW} ${bodyTopY}`,
  );
  body.setAttribute('fill', colorWithAlpha(color, OPACITY.fillMedium));
  body.setAttribute('stroke', color);
  body.setAttribute('stroke-width', String(strokeW));
  body.setAttribute('stroke-linecap', 'round');
  innerG.appendChild(body);

  // Arms — curved paths for a natural pose
  const armStartY = bodyTopY - s * 0.04;
  const armL = document.createElementNS(SVG_NS, 'path');
  armL.setAttribute(
    'd',
    `M ${-shoulderW} ${armStartY} Q ${-shoulderW - s * 0.12} ${armStartY + s * 0.12} ${-shoulderW - s * 0.18} ${armStartY + s * 0.22}`,
  );
  armL.setAttribute('fill', 'none');
  armL.setAttribute('stroke', color);
  armL.setAttribute('stroke-width', String(strokeThin));
  armL.setAttribute('stroke-linecap', 'round');
  armL.setAttribute('opacity', '0.9');
  innerG.appendChild(armL);
  const armR = document.createElementNS(SVG_NS, 'path');
  armR.setAttribute(
    'd',
    `M ${shoulderW} ${armStartY} Q ${shoulderW + s * 0.12} ${armStartY + s * 0.12} ${shoulderW + s * 0.18} ${armStartY + s * 0.22}`,
  );
  armR.setAttribute('fill', 'none');
  armR.setAttribute('stroke', color);
  armR.setAttribute('stroke-width', String(strokeThin));
  armR.setAttribute('stroke-linecap', 'round');
  armR.setAttribute('opacity', '0.9');
  innerG.appendChild(armR);

  if (entity.label) {
    const labelY = bodyTopY + LABEL_DEFAULTS.offsetBelow;
    const text = document.createElementNS(SVG_NS, 'text');
    text.setAttribute('x', '0');
    text.setAttribute('y', String(labelY));
    text.setAttribute('text-anchor', 'middle');
    text.setAttribute('fill', color);
    text.setAttribute('font-size', String(getLabelFontSize('label', scale)));
    text.setAttribute('font-weight', String(TYPOGRAPHY.fontWeightLabel));
    text.setAttribute('font-family', TYPOGRAPHY.fontLabel);
    text.textContent = entity.label;
    innerG.appendChild(text);
  }

  applyEntranceAnimation(innerG, entity);
  parentEl.appendChild(outerG);
  return outerG;
}
