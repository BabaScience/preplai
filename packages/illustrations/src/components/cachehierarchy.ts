/**
 * @preplai/illustrations — CacheHierarchy Component
 * Vertical stack of cache levels (L1, L2, L3, RAM)
 *
 * Metadata: { levels: [{ name, size? }] }
 */

import { SVG_NS, buildEntityGroup, applyEntranceAnimation, getSizeParam } from '../utils.js';
import { createLinearGradient, ensureDefs } from '../visual-utils.js';
import { getCategoryColor, TYPOGRAPHY, SHAPES } from '../design-tokens.js';
import { stackLayout } from '../layouts/index.js';
import type { VisualEntity } from '@preplai/shared';

interface CacheLevel {
  name: string;
  size?: string;
}

export function renderCacheHierarchy(entity: VisualEntity, parentEl: SVGElement): SVGGElement {
  const { outerG, innerG } = buildEntityGroup(entity);

  const s = getSizeParam(entity);
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

  const items = levels.map(l => ({ label: l.name, sublabel: l.size }));
  const blocks = stackLayout(items, { blockWidth: s * 1.8, blockHeight: 28, gap: 6 });

  blocks.forEach(({ x, y, width, height, label, sublabel }) => {
    const rect = document.createElementNS(SVG_NS, 'rect');
    rect.setAttribute('x', String(x - width / 2));
    rect.setAttribute('y', String(y - height / 2));
    rect.setAttribute('width', String(width));
    rect.setAttribute('height', String(height));
    rect.setAttribute('rx', String(SHAPES.borderRadius));
    rect.setAttribute('fill', `url(#${gradId})`);
    rect.setAttribute('stroke', color);
    rect.setAttribute('stroke-width', String(SHAPES.strokeWidthThin));
    innerG.appendChild(rect);

    const text = document.createElementNS(SVG_NS, 'text');
    text.setAttribute('x', String(x));
    text.setAttribute('y', String(y + (sublabel ? -2 : 4)));
    text.setAttribute('text-anchor', 'middle');
    text.setAttribute('fill', color);
    text.setAttribute('font-size', '12');
    text.setAttribute('font-weight', '600');
    text.setAttribute('font-family', TYPOGRAPHY.fontBadge);
    text.textContent = label;
    innerG.appendChild(text);

    if (sublabel) {
      const sub = document.createElementNS(SVG_NS, 'text');
      sub.setAttribute('x', String(x));
      sub.setAttribute('y', String(y + 10));
      sub.setAttribute('text-anchor', 'middle');
      sub.setAttribute('fill', `${color}99`);
      sub.setAttribute('font-size', '9');
      sub.setAttribute('font-family', TYPOGRAPHY.fontBadge);
      sub.textContent = sublabel;
      innerG.appendChild(sub);
    }
  });

  if (entity.label) {
    const totalH = blocks.length * 28 + (blocks.length - 1) * 6;
    const text = document.createElementNS(SVG_NS, 'text');
    text.setAttribute('x', '0');
    text.setAttribute('y', String(totalH / 2 + 20));
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
