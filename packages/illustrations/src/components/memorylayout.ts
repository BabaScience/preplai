/**
 * @preplai/illustrations — MemoryLayout Component
 * Stack and heap regions side by side
 *
 * Metadata: { stack: string[], heap: string[] }
 */

import { SVG_NS, buildEntityGroup, applyEntranceAnimation, getSizeParam } from '../utils.js';
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
import { stackLayout } from '../layouts/index.js';
import type { VisualEntity } from '@preplai/shared';

export function renderMemoryLayout(entity: VisualEntity, parentEl: SVGElement): SVGGElement {
  const { outerG, innerG } = buildEntityGroup(entity);

  const s = getSizeParam(entity);
  const scale = s / 50;
  const labelFontSize = getLabelFontSize('inline', scale);
  const blockFontSize = getLabelFontSize('value', scale);
  const strokeWidth = getStrokeWidth('thin', scale);
  const color = entity.color ?? getCategoryColor('MemoryLayout');

  const meta = entity.metadata ?? {};
  const stackData = (meta.stack as string[]) ?? ['main', 'foo()', 'bar()'];
  const heapData = (meta.heap as string[]) ?? ['obj1', 'arr', 'node'];

  const stackItems = stackData.slice(0, 6).map((l) => ({ label: l, sublabel: undefined }));
  const heapItems = heapData.slice(0, 6).map((l) => ({ label: l, sublabel: undefined }));

  const blockH = 24 * scale;
  const stackBlocks = stackLayout(stackItems, { blockWidth: s * 1.2, blockHeight: blockH, gap: 4 });
  const heapBlocks = stackLayout(heapItems, { blockWidth: s * 1.2, blockHeight: blockH, gap: 4 });

  const offsetX = s * 0.7;
  const bottomY = Math.max(
    stackBlocks.length ? stackBlocks[stackBlocks.length - 1].y + blockH / 2 : 0,
    heapBlocks.length ? heapBlocks[heapBlocks.length - 1].y + blockH / 2 : 0,
  );

  // Stack (left)
  const stackLabel = document.createElementNS(SVG_NS, 'text');
  stackLabel.setAttribute('x', String(-offsetX));
  stackLabel.setAttribute('y', String(-s * 0.5 - 10));
  stackLabel.setAttribute('text-anchor', 'middle');
  stackLabel.setAttribute('fill', color);
  stackLabel.setAttribute('font-size', String(labelFontSize));
  stackLabel.setAttribute('font-weight', '600');
  stackLabel.setAttribute('font-family', TYPOGRAPHY.fontBadge);
  stackLabel.textContent = 'Stack';
  innerG.appendChild(stackLabel);

  stackBlocks.forEach(({ x, y, width, height, label }) => {
    const rect = document.createElementNS(SVG_NS, 'rect');
    rect.setAttribute('x', String(-offsetX + x - width / 2));
    rect.setAttribute('y', String(y - height / 2));
    rect.setAttribute('width', String(width));
    rect.setAttribute('height', String(height));
    rect.setAttribute('rx', String(SHAPES.borderRadius - 2));
    rect.setAttribute('fill', colorWithAlpha(color, OPACITY.fillLight));
    rect.setAttribute('stroke', color);
    rect.setAttribute('stroke-width', String(strokeWidth));
    innerG.appendChild(rect);

    const text = document.createElementNS(SVG_NS, 'text');
    text.setAttribute('x', String(-offsetX + x));
    text.setAttribute('y', String(y + 4));
    text.setAttribute('text-anchor', 'middle');
    text.setAttribute('fill', color);
    text.setAttribute('font-size', String(blockFontSize));
    text.setAttribute('font-family', TYPOGRAPHY.fontBadge);
    text.textContent = label;
    innerG.appendChild(text);
  });

  // Heap (right)
  const heapLabel = document.createElementNS(SVG_NS, 'text');
  heapLabel.setAttribute('x', String(offsetX));
  heapLabel.setAttribute('y', String(-s * 0.5 - 10));
  heapLabel.setAttribute('text-anchor', 'middle');
  heapLabel.setAttribute('fill', color);
  heapLabel.setAttribute('font-size', String(labelFontSize));
  heapLabel.setAttribute('font-weight', '600');
  heapLabel.setAttribute('font-family', TYPOGRAPHY.fontBadge);
  heapLabel.textContent = 'Heap';
  innerG.appendChild(heapLabel);

  heapBlocks.forEach(({ x, y, width, height, label }) => {
    const rect = document.createElementNS(SVG_NS, 'rect');
    rect.setAttribute('x', String(offsetX + x - width / 2));
    rect.setAttribute('y', String(y - height / 2));
    rect.setAttribute('width', String(width));
    rect.setAttribute('height', String(height));
    rect.setAttribute('rx', String(SHAPES.borderRadius - 2));
    rect.setAttribute('fill', colorWithAlpha(color, OPACITY.fillLight));
    rect.setAttribute('stroke', color);
    rect.setAttribute('stroke-width', String(strokeWidth));
    innerG.appendChild(rect);

    const text = document.createElementNS(SVG_NS, 'text');
    text.setAttribute('x', String(offsetX + x));
    text.setAttribute('y', String(y + 4));
    text.setAttribute('text-anchor', 'middle');
    text.setAttribute('fill', color);
    text.setAttribute('font-size', String(blockFontSize));
    text.setAttribute('font-family', TYPOGRAPHY.fontBadge);
    text.textContent = label;
    innerG.appendChild(text);
  });

  if (entity.label) {
    const text = document.createElementNS(SVG_NS, 'text');
    text.setAttribute('x', '0');
    text.setAttribute('y', String(bottomY + LABEL_DEFAULTS.offsetBelow));
    text.setAttribute('text-anchor', LABEL_DEFAULTS.textAnchor);
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
