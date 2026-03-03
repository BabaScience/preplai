/**
 * @preplai/illustrations — MemoryLayout Component
 * Stack and heap regions side by side
 *
 * Metadata: { stack: string[], heap: string[] }
 */

import { SVG_NS, buildEntityGroup, applyEntranceAnimation, getSizeParam } from '../utils.js';
import { createLinearGradient, ensureDefs } from '../visual-utils.js';
import { getCategoryColor, TYPOGRAPHY, SHAPES } from '../design-tokens.js';
import { stackLayout } from '../layouts/index.js';
import type { VisualEntity } from '@preplai/shared';

export function renderMemoryLayout(entity: VisualEntity, parentEl: SVGElement): SVGGElement {
  const { outerG, innerG } = buildEntityGroup(entity);

  const s = getSizeParam(entity, 1.5);
  const color = entity.color ?? getCategoryColor('MemoryLayout');
  const defs = ensureDefs(parentEl);
  const gradId = `grad-ml-${color.replace(/[^a-fA-F0-9]/g, '')}`;
  createLinearGradient(gradId, color, 'vertical', defs);

  const meta = entity.metadata ?? {};
  const stackData = (meta.stack as string[]) ?? ['main', 'foo()', 'bar()'];
  const heapData = (meta.heap as string[]) ?? ['obj1', 'arr', 'node'];

  const stackItems = stackData.map(l => ({ label: l, sublabel: undefined }));
  const heapItems = heapData.map(l => ({ label: l, sublabel: undefined }));

  const stackBlocks = stackLayout(stackItems, { blockWidth: s * 1.2, blockHeight: 24, gap: 4 });
  const heapBlocks = stackLayout(heapItems, { blockWidth: s * 1.2, blockHeight: 24, gap: 4 });

  const offsetX = s * 0.7;

  // Stack (left)
  const stackLabel = document.createElementNS(SVG_NS, 'text');
  stackLabel.setAttribute('x', String(-offsetX));
  stackLabel.setAttribute('y', String(-s * 0.5 - 10));
  stackLabel.setAttribute('text-anchor', 'middle');
  stackLabel.setAttribute('fill', color);
  stackLabel.setAttribute('font-size', '11');
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
    rect.setAttribute('fill', `url(#${gradId})`);
    rect.setAttribute('stroke', color);
    rect.setAttribute('stroke-width', String(SHAPES.strokeWidthThin));
    innerG.appendChild(rect);

    const text = document.createElementNS(SVG_NS, 'text');
    text.setAttribute('x', String(-offsetX + x));
    text.setAttribute('y', String(y + 4));
    text.setAttribute('text-anchor', 'middle');
    text.setAttribute('fill', color);
    text.setAttribute('font-size', '10');
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
  heapLabel.setAttribute('font-size', '11');
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
    rect.setAttribute('fill', `url(#${gradId})`);
    rect.setAttribute('stroke', color);
    rect.setAttribute('stroke-width', String(SHAPES.strokeWidthThin));
    innerG.appendChild(rect);

    const text = document.createElementNS(SVG_NS, 'text');
    text.setAttribute('x', String(offsetX + x));
    text.setAttribute('y', String(y + 4));
    text.setAttribute('text-anchor', 'middle');
    text.setAttribute('fill', color);
    text.setAttribute('font-size', '10');
    text.setAttribute('font-family', TYPOGRAPHY.fontBadge);
    text.textContent = label;
    innerG.appendChild(text);
  });

  if (entity.label) {
    const text = document.createElementNS(SVG_NS, 'text');
    text.setAttribute('x', '0');
    text.setAttribute('y', String(s * 0.5 + 20));
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
