/**
 * @preplai/illustrations — Mutex Component
 *
 * Binary lock synchronization primitive.
 * Visual: rounded rect with padlock icon, locked/unlocked state styling.
 *
 * Metadata:
 *   locked?: boolean — whether the mutex is locked (default false)
 *   owner?: string — thread/process holding the lock
 */

import { SVG_NS, buildEntityGroup, applyEntranceAnimation, getSizeParam } from '../utils.js';
import { createLinearGradient, ensureDefs } from '../visual-utils.js';
import {
  getCategoryColor,
  getStrokeWidth,
  getLabelFontSize,
  colorWithAlpha,
  OPACITY,
  TYPOGRAPHY,
  SHAPES,
  LABEL_DEFAULTS,
} from '../design-tokens.js';
import type { VisualEntity } from '@preplai/shared';

export function renderMutex(entity: VisualEntity, parentEl: SVGElement): SVGGElement {
  const { outerG, innerG } = buildEntityGroup(entity);

  const s = getSizeParam(entity);
  const scale = s / 50;
  const color = entity.color ?? getCategoryColor('Mutex');
  const defs = ensureDefs(parentEl);
  const gradId = `grad-mtx-${color.replace(/[^a-fA-F0-9]/g, '')}`;
  createLinearGradient(gradId, color, 'vertical', defs);

  const meta = entity.metadata ?? {};
  const locked = (meta.locked as boolean) ?? false;
  const owner = (meta.owner as string) ?? '';
  const label = entity.label ?? 'mutex';

  const w = s * 1.3;
  const h = s * 1.0;
  const halfW = w / 2;
  const halfH = h / 2;
  const sw = getStrokeWidth('thin', scale);

  // Body rect
  const rect = document.createElementNS(SVG_NS, 'rect');
  rect.setAttribute('x', String(-halfW));
  rect.setAttribute('y', String(-halfH));
  rect.setAttribute('width', String(w));
  rect.setAttribute('height', String(h));
  rect.setAttribute('rx', String(SHAPES.borderRadius));
  rect.setAttribute('fill', `url(#${gradId})`);
  rect.setAttribute('stroke', color);
  rect.setAttribute('stroke-width', String(sw));
  if (locked) {
    rect.setAttribute('stroke-dasharray', '4,4');
    rect.setAttribute('opacity', String(OPACITY.strokeSoft));
  }
  innerG.appendChild(rect);

  // Padlock icon
  const lockScale = Math.max(0.5, scale * 0.7);
  const lockY = -4 * lockScale;

  // Lock body (small rect)
  const lockBody = document.createElementNS(SVG_NS, 'rect');
  lockBody.setAttribute('x', String(-8 * lockScale));
  lockBody.setAttribute('y', String(lockY));
  lockBody.setAttribute('width', String(16 * lockScale));
  lockBody.setAttribute('height', String(12 * lockScale));
  lockBody.setAttribute('rx', String(2 * lockScale));
  lockBody.setAttribute('fill', locked ? colorWithAlpha(color, OPACITY.fillHeavy) : 'none');
  lockBody.setAttribute('stroke', locked ? colorWithAlpha(color, OPACITY.strokeSoft) : color);
  lockBody.setAttribute('stroke-width', String(sw * 0.8));
  innerG.appendChild(lockBody);

  // Lock shackle (arc above body)
  const shackleOpen = !locked;
  const shackle = document.createElementNS(SVG_NS, 'path');
  if (shackleOpen) {
    // Open shackle — shifted right
    shackle.setAttribute('d',
      `M ${-4 * lockScale} ${lockY} ` +
      `V ${lockY - 6 * lockScale} ` +
      `A ${5 * lockScale} ${5 * lockScale} 0 0 1 ${6 * lockScale} ${lockY - 6 * lockScale} ` +
      `V ${lockY - 2 * lockScale}`
    );
  } else {
    // Closed shackle
    shackle.setAttribute('d',
      `M ${-4 * lockScale} ${lockY} ` +
      `V ${lockY - 6 * lockScale} ` +
      `A ${4 * lockScale} ${4 * lockScale} 0 0 1 ${4 * lockScale} ${lockY - 6 * lockScale} ` +
      `V ${lockY}`
    );
  }
  shackle.setAttribute('fill', 'none');
  shackle.setAttribute('stroke', locked ? colorWithAlpha(color, OPACITY.strokeSoft) : color);
  shackle.setAttribute('stroke-width', String(sw * 0.8));
  shackle.setAttribute('stroke-linecap', 'round');
  innerG.appendChild(shackle);

  // State text below lock icon
  const stateStr = locked ? (owner || 'LOCKED') : 'OPEN';
  const stateText = document.createElementNS(SVG_NS, 'text');
  stateText.setAttribute('x', '0');
  stateText.setAttribute('y', String(lockY + 24 * lockScale));
  stateText.setAttribute('text-anchor', 'middle');
  stateText.setAttribute('fill', locked ? colorWithAlpha(color, OPACITY.strokeSoft) : color);
  stateText.setAttribute('font-size', String(Math.min(getLabelFontSize('value', scale), s * 0.25)));
  stateText.setAttribute('font-weight', String(TYPOGRAPHY.fontWeightEmphasis));
  stateText.setAttribute('font-family', TYPOGRAPHY.fontBadge);
  stateText.textContent = stateStr.length > 10 ? stateStr.slice(0, 8) + '…' : stateStr;
  innerG.appendChild(stateText);

  // Label below shape
  const labelText = document.createElementNS(SVG_NS, 'text');
  labelText.setAttribute('x', '0');
  labelText.setAttribute('y', String(halfH + LABEL_DEFAULTS.offsetBelow));
  labelText.setAttribute('text-anchor', LABEL_DEFAULTS.textAnchor);
  labelText.setAttribute('fill', color);
  labelText.setAttribute('font-size', String(getLabelFontSize('label', scale)));
  labelText.setAttribute('font-weight', String(TYPOGRAPHY.fontWeightLabel));
  labelText.setAttribute('font-family', TYPOGRAPHY.fontLabel);
  labelText.textContent = label.length > 12 ? label.slice(0, 10) + '…' : label;
  innerG.appendChild(labelText);

  applyEntranceAnimation(innerG, entity);
  parentEl.appendChild(outerG);
  return outerG;
}
