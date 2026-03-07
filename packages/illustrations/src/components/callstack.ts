/**
 * @preplai/illustrations — CallStack Component
 * Vertical stack of stack frames (function name + optional locals)
 *
 * Metadata: { frames: [{ name, locals? }] }
 */

import { SVG_NS, buildEntityGroup, applyEntranceAnimation, getSizeParam } from '../utils.js';
import { createLinearGradient, ensureDefs } from '../visual-utils.js';
import { getCategoryColor, TYPOGRAPHY, SHAPES } from '../design-tokens.js';
import { stackLayout } from '../layouts/index.js';
import type { VisualEntity } from '@preplai/shared';

interface StackFrame {
  name: string;
  locals?: string;
}

export function renderCallStack(entity: VisualEntity, parentEl: SVGElement): SVGGElement {
  const { outerG, innerG } = buildEntityGroup(entity);

  const s = getSizeParam(entity);
  const color = entity.color ?? getCategoryColor('CallStack');
  const defs = ensureDefs(parentEl);
  const gradId = `grad-cs-${color.replace(/[^a-fA-F0-9]/g, '')}`;
  createLinearGradient(gradId, color, 'vertical', defs);

  const meta = entity.metadata ?? {};
  const framesData = meta.frames as StackFrame[] | undefined;
  const frames: StackFrame[] = framesData ?? [
    { name: 'main()' },
    { name: 'processRequest()', locals: 'req, res' },
    { name: 'handleQuery()', locals: 'sql' },
  ];

  const items = frames.map(f => ({
    label: f.name,
    sublabel: f.locals,
  }));
  const blocks = stackLayout(items, { blockWidth: s * 1.6, blockHeight: 26, gap: 6 });

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
    text.setAttribute('font-size', '11');
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
    const totalH = blocks.length * 26 + (blocks.length - 1) * 6;
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
