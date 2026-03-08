/**
 * @preplai/illustrations — CacheHierarchy Component
 * Vertical stack of cache levels (L1, L2, L3, RAM)
 *
 * Metadata: { levels: [{ name, size? }] }
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

interface CacheLevel {
  name: string;
  size?: string;
}

export function renderCacheHierarchy(entity: VisualEntity, parentEl: SVGElement): SVGGElement {
  const { outerG, innerG } = buildEntityGroup(entity);

  const s = getSizeParam(entity);
  const scale = s / 50;
  const levelFontSize = getLabelFontSize('value', scale);
  const sublabelFontSize = getLabelFontSize('index', scale);
  const color = entity.color ?? getCategoryColor('CacheHierarchy');
  const defs = ensureDefs(parentEl);
  const gradId = `grad-ch-${color.replace(/[^a-fA-F0-9]/g, '')}`;
  createLinearGradient(gradId, color, 'vertical', defs);

  const meta = entity.metadata ?? {};
  const levelsData = meta.levels as CacheLevel[] | undefined;

  const levels: CacheLevel[] = levelsData ?? [
    { name: 'L1', size: '32 KB' },
    { name: 'L2', size: '256 KB' },
    { name: 'L3', size: '8 MB' },
    { name: 'RAM', size: '16 GB' },
  ];

  const blockHeight = 28;
  const gap = 6;
  const items = levels.map(l => ({ label: l.name, sublabel: l.size }));
  const blocks = stackLayout(items, { blockWidth: s * 1.8, blockHeight, gap });

  blocks.forEach(({ x, y, width, height, label, sublabel }, i) => {
    const clipId = `clip-cachehierarchy-${entity.id}-${i}`;
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

    // Label and sublabel positioned within block (block top y-14, bottom y+14)
    const labelY = sublabel ? y - 2 : y + 4;
    const text = document.createElementNS(SVG_NS, 'text');
    text.setAttribute('x', String(x));
    text.setAttribute('y', String(labelY));
    text.setAttribute('text-anchor', 'middle');
    text.setAttribute('fill', color);
    text.setAttribute('font-size', String(levelFontSize));
    text.setAttribute('font-weight', String(TYPOGRAPHY.fontWeightBold));
    text.setAttribute('font-family', TYPOGRAPHY.fontBadge);
    text.textContent = label;
    blockG.appendChild(text);

    if (sublabel) {
      const sub = document.createElementNS(SVG_NS, 'text');
      sub.setAttribute('x', String(x));
      sub.setAttribute('y', String(y + 5));
      sub.setAttribute('text-anchor', 'middle');
      sub.setAttribute('fill', colorWithAlpha(color, OPACITY.strokeSoft));
      sub.setAttribute('font-size', String(sublabelFontSize));
      sub.setAttribute('font-weight', String(TYPOGRAPHY.fontWeightLabel));
      sub.setAttribute('font-family', TYPOGRAPHY.fontBadge);
      sub.textContent = sublabel;
      blockG.appendChild(sub);
    }

    innerG.appendChild(blockG);
  });

  if (entity.label) {
    const totalH = blocks.length * blockHeight + (blocks.length - 1) * gap;
    const text = document.createElementNS(SVG_NS, 'text');
    text.setAttribute('x', '0');
    text.setAttribute('y', String(totalH / 2 + LABEL_DEFAULTS.offsetBelow));
    text.setAttribute('text-anchor', 'middle');
    text.setAttribute('fill', color);
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
