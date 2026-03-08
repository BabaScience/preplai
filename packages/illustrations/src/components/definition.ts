/**
 * @preplai/illustrations — Definition Component
 * Term + definition card with left accent bar
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
  getLabelFontSize,
  getStrokeWidth,
  colorWithAlpha,
  OPACITY,
  LABEL_DEFAULTS,
} from '../design-tokens.js';
import type { VisualEntity } from '@preplai/shared';

export function renderDefinition(entity: VisualEntity, parentEl: SVGElement): SVGGElement {
  const { outerG, innerG } = buildEntityGroup(entity);

  const s = getSizeParam(entity);
  const scale = s / 50;
  const color = entity.color ?? getCategoryColor('Definition');
  const defs = ensureDefs(parentEl);
  const gradId = `grad-def-${color.replace(/[^a-fA-F0-9]/g, '')}`;
  createLinearGradient(gradId, color, 'vertical', defs);

  const meta = entity.metadata ?? {};
  const term = (meta.term as string) ?? entity.label ?? 'Term';
  const definition = (meta.definition as string) ?? entity.textContent ?? 'Definition goes here.';

  const w = s * 2.2;
  const h = s * 1.6;

  const card = document.createElementNS(SVG_NS, 'rect');
  card.setAttribute('x', String(-w / 2));
  card.setAttribute('y', String(-h / 2));
  card.setAttribute('width', String(w));
  card.setAttribute('height', String(h));
  card.setAttribute('rx', String(SHAPES.borderRadius));
  card.setAttribute('fill', `url(#${gradId})`);
  card.setAttribute('stroke', color);
  card.setAttribute('stroke-width', String(getStrokeWidth('default', scale)));
  innerG.appendChild(card);

  const clipId = `clip-def-${entity.id.replace(/[^a-zA-Z0-9-]/g, '')}`;
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

  const accentBar = document.createElementNS(SVG_NS, 'rect');
  accentBar.setAttribute('x', String(-w / 2));
  accentBar.setAttribute('y', String(-h / 2));
  accentBar.setAttribute('width', '4');
  accentBar.setAttribute('height', String(h));
  accentBar.setAttribute('rx', '2');
  accentBar.setAttribute('fill', color);
  accentBar.setAttribute('opacity', '0.8');
  innerG.appendChild(accentBar);

  const termText = document.createElementNS(SVG_NS, 'text');
  termText.setAttribute('x', String(-w / 2 + 16));
  termText.setAttribute('y', String(-h / 2 + 22));
  termText.setAttribute('fill', color);
  termText.setAttribute('font-size', String(TYPOGRAPHY.fontSizeTitle));
  termText.setAttribute('font-weight', String(TYPOGRAPHY.fontWeightTitle));
  termText.setAttribute('font-family', TYPOGRAPHY.fontLabel);
  termText.textContent = term;
  innerG.appendChild(termText);

  const defFontSize = getLabelFontSize('value', scale);
  const defStartX = -w / 2 + 16;
  const defStartY = -h / 2 + 44;
  const availableWidth = Math.max(60, w - 32);
  const maxCharsPerLine = Math.max(8, Math.floor(availableWidth / (defFontSize * CHAR_WIDTH_RATIO)));
  const { lines: defLines } = wrapBodyText(definition, maxCharsPerLine, 8);
  const defLineHeight = defFontSize * LABEL_DEFAULTS.lineHeight;

  const defGroup = document.createElementNS(SVG_NS, 'text');
  defGroup.setAttribute('text-anchor', 'start');
  defGroup.setAttribute('fill', colorWithAlpha(color, OPACITY.strokeSoft));
  defGroup.setAttribute('font-size', String(defFontSize));
  defGroup.setAttribute('font-family', TYPOGRAPHY.fontLabel);
  defGroup.setAttribute('font-weight', String(TYPOGRAPHY.fontWeightLabel));

  defLines.forEach((line, i) => {
    const tspan = document.createElementNS(SVG_NS, 'tspan');
    tspan.setAttribute('x', String(defStartX));
    tspan.setAttribute('y', String(defStartY + i * defLineHeight));
    tspan.textContent = line;
    defGroup.appendChild(tspan);
  });
  innerG.appendChild(defGroup);

  applyEntranceAnimation(innerG, entity);
  parentEl.appendChild(outerG);
  return outerG;
}
