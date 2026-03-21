/**
 * @preplai/illustrations — Stack Component
 *
 * Clean vertical stack of labeled layers.
 * Use for: tech stacks, OSI model, protocol layers, layer diagrams.
 *
 * Metadata: { layers: Array<{ label: string, color?: string }> }
 *
 * Minimalist style matching the Composable engine aesthetic.
 */

import { SVG_NS, buildEntityGroup, applyEntranceAnimation, getSizeParam } from '../utils.js';
import {
  getCategoryColor,
  TYPOGRAPHY,
  SHAPES,
  STROKE,
  LABEL_DEFAULTS,
  colorWithAlpha,
  OPACITY,
  getStrokeWidth,
  getLabelFontSize,
} from '../design-tokens.js';
import type { VisualEntity } from '@preplai/shared';

interface StackLayer {
  label: string;
  color?: string;
}

export function renderStack(entity: VisualEntity, parentEl: SVGElement): SVGGElement {
  const { outerG, innerG } = buildEntityGroup(entity);

  const s = getSizeParam(entity);
  const scale = s / 50;
  const defaultColor = entity.color ?? getCategoryColor('Stack');

  const meta = entity.metadata ?? {};
  const layers: StackLayer[] = (meta.layers as StackLayer[]) ?? [
    { label: 'Application' },
    { label: 'Transport' },
    { label: 'Network' },
    { label: 'Link' },
    { label: 'Physical' },
  ];

  const blockW = s * 1.6;
  const blockH = 20 * scale;
  const gap = 4 * scale;
  const totalH = layers.length * blockH + (layers.length - 1) * gap;
  const startY = -totalH / 2 + blockH / 2;

  // Highlight glow
  if (entity.highlight) {
    const glow = document.createElementNS(SVG_NS, 'rect');
    glow.setAttribute('x', String(-blockW / 2 - 3));
    glow.setAttribute('y', String(-totalH / 2 - 3));
    glow.setAttribute('width', String(blockW + 6));
    glow.setAttribute('height', String(totalH + 6));
    glow.setAttribute('rx', String(SHAPES.borderRadius + 2));
    glow.setAttribute('fill', 'none');
    glow.setAttribute('stroke', colorWithAlpha(defaultColor, OPACITY.strokeMuted));
    glow.setAttribute('stroke-width', String(STROKE.default));
    glow.setAttribute('stroke-dasharray', '4,4');
    innerG.appendChild(glow);
  }

  layers.forEach((layer, i) => {
    const color = layer.color ?? defaultColor;
    const y = startY + i * (blockH + gap);

    const rect = document.createElementNS(SVG_NS, 'rect');
    rect.setAttribute('x', String(-blockW / 2));
    rect.setAttribute('y', String(y - blockH / 2));
    rect.setAttribute('width', String(blockW));
    rect.setAttribute('height', String(blockH));
    rect.setAttribute('rx', String(SHAPES.borderRadius));
    rect.setAttribute('fill', colorWithAlpha(color, OPACITY.fillLight));
    rect.setAttribute('stroke', color);
    rect.setAttribute('stroke-width', String(getStrokeWidth('thin', scale)));
    innerG.appendChild(rect);

    const text = document.createElementNS(SVG_NS, 'text');
    text.setAttribute('x', '0');
    text.setAttribute('y', String(y + 4));
    text.setAttribute('text-anchor', 'middle');
    text.setAttribute('fill', color);
    text.setAttribute('font-size', String(getLabelFontSize('value', scale)));
    text.setAttribute('font-weight', String(TYPOGRAPHY.fontWeightBold));
    text.setAttribute('font-family', TYPOGRAPHY.fontBadge);
    text.textContent = layer.label.slice(0, 20);
    innerG.appendChild(text);
  });

  // Label below
  if (entity.label) {
    const text = document.createElementNS(SVG_NS, 'text');
    text.setAttribute('x', '0');
    text.setAttribute('y', String(totalH / 2 + LABEL_DEFAULTS.offsetBelow));
    text.setAttribute('text-anchor', LABEL_DEFAULTS.textAnchor);
    text.setAttribute('fill', defaultColor);
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
