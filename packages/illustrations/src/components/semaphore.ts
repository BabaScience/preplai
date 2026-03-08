/**
 * @preplai/illustrations — Semaphore Component
 *
 * Synchronization primitive showing available permits (count).
 * Visual: rounded rect with prominent count, optional max for bounded semaphore.
 * When value is 0, uses muted styling to indicate "blocked".
 *
 * Metadata:
 *   value?: number — current permit count (default 2)
 *   max?: number — optional max for bounded semaphore (e.g. 3 → "2/3")
 *   label?: string — semaphore name (or use entity.label)
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

export function renderSemaphore(entity: VisualEntity, parentEl: SVGElement): SVGGElement {
  const { outerG, innerG } = buildEntityGroup(entity);

  const s = getSizeParam(entity);
  const scale = s / 50;
  const color = entity.color ?? getCategoryColor('Semaphore');
  const defs = ensureDefs(parentEl);
  const gradId = `grad-sem-${color.replace(/[^a-fA-F0-9]/g, '')}`;
  createLinearGradient(gradId, color, 'vertical', defs);

  const meta = entity.metadata ?? {};
  const value = Math.max(0, Math.floor((meta.value as number) ?? 2));
  const max = meta.max != null ? Math.max(1, Math.floor(meta.max as number)) : undefined;
  const label = (meta.label as string) ?? entity.label ?? 'sem';

  const isBlocked = value === 0;

  const w = s * 1.4;
  const h = s * 0.9;

  const rect = document.createElementNS(SVG_NS, 'rect');
  rect.setAttribute('x', String(-w / 2));
  rect.setAttribute('y', String(-h / 2));
  rect.setAttribute('width', String(w));
  rect.setAttribute('height', String(h));
  rect.setAttribute('rx', String(SHAPES.borderRadius));
  rect.setAttribute('fill', `url(#${gradId})`);
  rect.setAttribute('stroke', color);
  rect.setAttribute('stroke-width', String(getStrokeWidth('thin', scale)));
  if (isBlocked) {
    rect.setAttribute('opacity', String(OPACITY.strokeSoft));
    rect.setAttribute('stroke-dasharray', '4,4');
  }
  innerG.appendChild(rect);

  const countStr = max != null ? `${value}/${max}` : String(value);
  const valueFontSize = getLabelFontSize('metric', scale);
  const valueText = document.createElementNS(SVG_NS, 'text');
  valueText.setAttribute('x', '0');
  valueText.setAttribute('y', String(max != null ? -2 : 6));
  valueText.setAttribute('text-anchor', 'middle');
  valueText.setAttribute('fill', isBlocked ? colorWithAlpha(color, OPACITY.strokeSoft) : color);
  valueText.setAttribute('font-size', String(Math.min(valueFontSize, s * 0.5)));
  valueText.setAttribute('font-weight', String(TYPOGRAPHY.fontWeightBold));
  valueText.setAttribute('font-family', TYPOGRAPHY.fontBadge);
  valueText.textContent = countStr;
  innerG.appendChild(valueText);

  if (max != null) {
    const subText = document.createElementNS(SVG_NS, 'text');
    subText.setAttribute('x', '0');
    subText.setAttribute('y', String(14));
    subText.setAttribute('text-anchor', 'middle');
    subText.setAttribute('fill', colorWithAlpha(color, OPACITY.strokeSoft));
    subText.setAttribute('font-size', String(getLabelFontSize('index', scale)));
    subText.setAttribute('font-family', TYPOGRAPHY.fontLabel);
    subText.textContent = 'permits';
    innerG.appendChild(subText);
  }

  const labelText = document.createElementNS(SVG_NS, 'text');
  labelText.setAttribute('x', '0');
  labelText.setAttribute('y', String(h / 2 + LABEL_DEFAULTS.offsetBelow));
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
