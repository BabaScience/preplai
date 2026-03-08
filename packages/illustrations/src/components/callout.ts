/**
 * @preplai/illustrations — Callout Component
 * Icon + type (tip/warning/note/important) + body text
 */

import {
  SVG_NS,
  buildEntityGroup,
  applyEntranceAnimation,
  getSizeParam,
  wrapBodyText,
  CHAR_WIDTH_RATIO,
} from '../utils.js';
import { createLinearGradient, ensureDefs } from '../visual-utils.js';
import {
  getCategoryColor,
  TYPOGRAPHY,
  SHAPES,
  getStrokeWidth,
  getLabelFontSize,
  colorWithAlpha,
  OPACITY,
  LABEL_DEFAULTS,
} from '../design-tokens.js';
import type { VisualEntity } from '@preplai/shared';

const CALLOUT_CONFIG: Record<string, { icon: string; colorOffset?: number }> = {
  tip: { icon: '💡' },
  warning: { icon: '⚠' },
  note: { icon: '📝' },
  important: { icon: '❗' },
};

export function renderCallout(entity: VisualEntity, parentEl: SVGElement): SVGGElement {
  const { outerG, innerG } = buildEntityGroup(entity);

  const s = getSizeParam(entity);
  const scale = s / 50;
  const color = entity.color ?? getCategoryColor('Callout');
  const defs = ensureDefs(parentEl);
  const gradId = `grad-callout-${color.replace(/[^a-fA-F0-9]/g, '')}`;
  createLinearGradient(gradId, color, 'vertical', defs);

  const meta = entity.metadata ?? {};
  const calloutType = ((meta.calloutType as string) ?? 'note').toLowerCase();
  const config = CALLOUT_CONFIG[calloutType] ?? CALLOUT_CONFIG.note;
  const body = (meta.body as string) ?? entity.textContent ?? entity.label ?? '';

  const w = s * 2;
  const h = s * 1.2;

  const clipId = `clip-callout-${entity.id.replace(/[^a-zA-Z0-9-]/g, '')}`;
  const clipPathEl = document.createElementNS(SVG_NS, 'clipPath');
  clipPathEl.setAttribute('id', clipId);
  const clipRect = document.createElementNS(SVG_NS, 'rect');
  clipRect.setAttribute('x', String(-w / 2));
  clipRect.setAttribute('y', String(-h / 2));
  clipRect.setAttribute('width', String(w));
  clipRect.setAttribute('height', String(h));
  clipRect.setAttribute('rx', String(SHAPES.borderRadius));
  clipPathEl.appendChild(clipRect);
  defs.appendChild(clipPathEl);

  innerG.setAttribute('clip-path', `url(#${clipId})`);

  const card = document.createElementNS(SVG_NS, 'rect');
  card.setAttribute('x', String(-w / 2));
  card.setAttribute('y', String(-h / 2));
  card.setAttribute('width', String(w));
  card.setAttribute('height', String(h));
  card.setAttribute('rx', String(SHAPES.borderRadius));
  card.setAttribute('fill', `url(#${gradId})`);
  card.setAttribute('stroke', color);
  card.setAttribute('stroke-width', String(getStrokeWidth('thin', scale)));
  innerG.appendChild(card);

  const typeFontSize = getLabelFontSize('title', scale);
  const bodyFontSize = getLabelFontSize('value', scale);

  const iconText = document.createElementNS(SVG_NS, 'text');
  iconText.setAttribute('x', String(-w / 2 + 20));
  iconText.setAttribute('y', String(-h / 2 + 22));
  iconText.setAttribute('fill', color);
  iconText.setAttribute('font-size', String(typeFontSize));
  iconText.textContent = config.icon;
  innerG.appendChild(iconText);

  const typeLabel = document.createElementNS(SVG_NS, 'text');
  typeLabel.setAttribute('x', String(-w / 2 + 44));
  typeLabel.setAttribute('y', String(-h / 2 + 22));
  typeLabel.setAttribute('fill', color);
  typeLabel.setAttribute('font-size', String(typeFontSize));
  typeLabel.setAttribute('font-weight', String(TYPOGRAPHY.fontWeightTitle));
  typeLabel.setAttribute('font-family', TYPOGRAPHY.fontLabel);
  typeLabel.textContent = calloutType.charAt(0).toUpperCase() + calloutType.slice(1);
  innerG.appendChild(typeLabel);

  if (body) {
    const bodyStartX = -w / 2 + 20;
    const bodyStartY = -h / 2 + 44;
    const availableWidth = Math.max(60, w - 40);
    const maxCharsPerLine = Math.max(8, Math.floor(availableWidth / (bodyFontSize * CHAR_WIDTH_RATIO)));
    const maxLines = 8;
    const { lines } = wrapBodyText(body, maxCharsPerLine, maxLines);
    const lineHeight = bodyFontSize * LABEL_DEFAULTS.lineHeight;

    const bodyGroup = document.createElementNS(SVG_NS, 'text');
    bodyGroup.setAttribute('text-anchor', 'start');
    bodyGroup.setAttribute('fill', colorWithAlpha(color, OPACITY.strokeSoft));
    bodyGroup.setAttribute('font-size', String(bodyFontSize));
    bodyGroup.setAttribute('font-family', TYPOGRAPHY.fontLabel);
    bodyGroup.setAttribute('font-weight', String(TYPOGRAPHY.fontWeightLabel));

    lines.forEach((line, i) => {
      const tspan = document.createElementNS(SVG_NS, 'tspan');
      tspan.setAttribute('x', String(bodyStartX));
      tspan.setAttribute('y', String(bodyStartY + i * lineHeight));
      tspan.textContent = line;
      bodyGroup.appendChild(tspan);
    });
    innerG.appendChild(bodyGroup);
  }

  applyEntranceAnimation(innerG, entity);
  parentEl.appendChild(outerG);
  return outerG;
}
