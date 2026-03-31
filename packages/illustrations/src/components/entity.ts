/**
 * @preplai/illustrations — Entity Component
 *
 * Generic node: rounded rect with gradient fill and centered label.
 * Use for: placeholders, generic nodes, "things" in diagrams when no specific type fits.
 *
 * @see METADATA_SCHEMAS.md#entity
 */

import { SVG_NS, buildEntityGroup, applyEntranceAnimation, getSizeParam } from '../utils.js';
import {
  getCategoryColor,
  getLabelFontSize,
  TYPOGRAPHY,
  SHAPES,
  STROKE,
  LABEL_DEFAULTS,
  colorWithAlpha,
  OPACITY,
} from '../design-tokens.js';
import type { VisualEntity } from '@preplai/shared';

const DESIGN_W = 72;
const DESIGN_H = 38;

export function renderEntityNode(entity: VisualEntity, parentEl: SVGElement): SVGGElement {
  const { outerG, innerG } = buildEntityGroup(entity);

  const s = getSizeParam(entity);
  const scale = s / 50;
  const color = entity.color ?? getCategoryColor('Entity');

  const meta = entity.metadata ?? {};
  const label = (meta.label as string) ?? entity.label ?? 'Entity';
  const designW = (typeof meta.width === 'number' ? meta.width : DESIGN_W);
  const w = designW;
  const h = DESIGN_H;
  const hw = w / 2;
  const hh = h / 2;

  const scaleGroup = document.createElementNS(SVG_NS, 'g');
  scaleGroup.setAttribute('transform', `scale(${scale})`);

  const fontSize = getLabelFontSize('default', 1) / scale;
  const displayText = label.length > 16 ? label.slice(0, 13) + '…' : label;

  const rect = document.createElementNS(SVG_NS, 'rect');
  rect.setAttribute('x', String(-hw));
  rect.setAttribute('y', String(-hh));
  rect.setAttribute('width', String(w));
  rect.setAttribute('height', String(h));
  rect.setAttribute('rx', String(SHAPES.borderRadius));
  rect.setAttribute('fill', colorWithAlpha(color, OPACITY.fillLight));
  rect.setAttribute('stroke', color);
  rect.setAttribute('stroke-width', String(STROKE.default));
  scaleGroup.appendChild(rect);

  const text = document.createElementNS(SVG_NS, 'text');
  text.setAttribute('x', '0');
  text.setAttribute('y', '0');
  text.setAttribute('text-anchor', LABEL_DEFAULTS.textAnchor);
  text.setAttribute('dominant-baseline', 'central');
  text.setAttribute('fill', color);
  text.setAttribute('font-size', String(fontSize));
  text.setAttribute('font-weight', String(TYPOGRAPHY.fontWeightLabel));
  text.setAttribute('font-family', TYPOGRAPHY.fontLabel);
  // textLength enforces interior label stays within shape bounds (single-label rule)
  const maxLabelWidth = Math.max(20, w - 12);
  text.setAttribute('textLength', String(Math.min(maxLabelWidth, displayText.length * fontSize * 0.6)));
  text.setAttribute('lengthAdjust', 'spacingAndGlyphs');
  text.textContent = displayText;
  scaleGroup.appendChild(text);

  innerG.appendChild(scaleGroup);

  applyEntranceAnimation(innerG, entity);
  parentEl.appendChild(outerG);
  return outerG;
}
