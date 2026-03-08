/**
 * @preplai/illustrations — Stack Component
 * Vertical stack of customizable layers (OSI model, tech stack, etc.)
 *
 * Metadata: { layers: Array<{ label: string, color?: string, sublabel?: string }>, direction?: 'top-down' | 'bottom-up' }
 */

import { SVG_NS, buildEntityGroup, applyEntranceAnimation, getSizeParam } from '../utils.js';
import { createLinearGradient, ensureDefs } from '../visual-utils.js';
import {
  getCategoryColor,
  TYPOGRAPHY,
  SHAPES,
  LABEL_DEFAULTS,
  getStrokeWidth,
  getLabelFontSize,
  colorWithAlpha,
  OPACITY,
} from '../design-tokens.js';
import { stackLayout } from '../layouts/index.js';
import type { VisualEntity } from '@preplai/shared';

interface StackLayer {
  label: string;
  color?: string;
  sublabel?: string;
}

/** Truncate text to fit within pixel width; ~0.6em per char for typical font */
function truncateToFit(text: string, maxWidth: number, fontSize: number): string {
  const approxCharWidth = fontSize * 0.6;
  const maxChars = Math.max(5, Math.floor((maxWidth - 16) / approxCharWidth));
  if (text.length <= maxChars) return text;
  return text.slice(0, maxChars - 3) + '...';
}

export function renderStack(entity: VisualEntity, parentEl: SVGElement): SVGGElement {
  const { outerG, innerG } = buildEntityGroup(entity);

  const s = getSizeParam(entity);
  const scale = s / 50;
  const labelFontSize = getLabelFontSize('value', scale);
  const sublabelFontSize = getLabelFontSize('index', scale);
  const defaultColor = entity.color ?? getCategoryColor('Stack');
  const defs = ensureDefs(parentEl);

  const meta = entity.metadata ?? {};
  const layersData = meta.layers as StackLayer[] | undefined;

  const layers: StackLayer[] = layersData ?? [
    { label: 'Application' },
    { label: 'Transport' },
    { label: 'Network' },
    { label: 'Link' },
    { label: 'Physical' },
  ];

  const items = layers.map((l) => ({ label: l.label, sublabel: l.sublabel }));
  const blockWidth = s * 2.8;
  const blockHeight = 30;
  const gap = 6;
  const blocks = stackLayout(items, { blockWidth, blockHeight, gap });

  blocks.forEach(({ x, y, width, height, label, sublabel }, i) => {
    const layer = layers[i];
    const color = layer?.color ?? defaultColor;
    const gradId = `grad-stack-${entity.id}-${i}-${color.replace(/[^a-fA-F0-9]/g, '')}`;
    createLinearGradient(gradId, color, 'vertical', defs);

    const clipId = `clip-stack-${entity.id}-${i}`;
    let clipEl = defs.querySelector(`#${clipId}`) as SVGClipPathElement | null;
    if (!clipEl) {
      clipEl = document.createElementNS(SVG_NS, 'clipPath');
      clipEl.setAttribute('id', clipId);
      defs.appendChild(clipEl);
    }
    clipEl.innerHTML = '';
    const clipRect = document.createElementNS(SVG_NS, 'rect');
    clipRect.setAttribute('x', String(x - width / 2));
    clipRect.setAttribute('y', String(y - height / 2));
    clipRect.setAttribute('width', String(width));
    clipRect.setAttribute('height', String(height));
    clipRect.setAttribute('rx', String(SHAPES.borderRadius));
    clipEl.appendChild(clipRect);

    const blockG = document.createElementNS(SVG_NS, 'g');
    blockG.setAttribute('clip-path', `url(#${clipId})`);

    const rect = document.createElementNS(SVG_NS, 'rect');
    rect.setAttribute('x', String(x - width / 2));
    rect.setAttribute('y', String(y - height / 2));
    rect.setAttribute('width', String(width));
    rect.setAttribute('height', String(height));
    rect.setAttribute('rx', String(SHAPES.borderRadius));
    rect.setAttribute('fill', `url(#${gradId})`);
    rect.setAttribute('stroke', color);
    rect.setAttribute('stroke-width', String(getStrokeWidth('thin', scale)));
    blockG.appendChild(rect);

    const usableWidth = width - 16;
    const displayLabel = truncateToFit(label, usableWidth, labelFontSize);
    const displaySublabel = sublabel ? truncateToFit(sublabel, usableWidth, sublabelFontSize) : undefined;

    const text = document.createElementNS(SVG_NS, 'text');
    text.setAttribute('x', String(x));
    text.setAttribute('y', String(displaySublabel ? y - 2 : y + 4));
    text.setAttribute('text-anchor', 'middle');
    text.setAttribute('fill', color);
    text.setAttribute('font-size', String(labelFontSize));
    text.setAttribute('font-weight', String(TYPOGRAPHY.fontWeightBold));
    text.setAttribute('font-family', TYPOGRAPHY.fontBadge);
    text.textContent = displayLabel;
    blockG.appendChild(text);

    if (displaySublabel) {
      const sub = document.createElementNS(SVG_NS, 'text');
      sub.setAttribute('x', String(x));
      sub.setAttribute('y', String(y + 6));
      sub.setAttribute('text-anchor', 'middle');
      sub.setAttribute('fill', colorWithAlpha(color, OPACITY.strokeSoft));
      sub.setAttribute('font-size', String(sublabelFontSize));
      sub.setAttribute('font-weight', String(TYPOGRAPHY.fontWeightLabel));
      sub.setAttribute('font-family', TYPOGRAPHY.fontBadge);
      sub.textContent = displaySublabel;
      blockG.appendChild(sub);
    }

    innerG.appendChild(blockG);
  });

  if (entity.label) {
    const totalH = blocks.length * blockHeight + (blocks.length - 1) * gap;
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
