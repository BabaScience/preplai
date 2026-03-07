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

/** Truncate text to fit within pixel width; ~0.6em per char for typical font */
function truncateToFit(text: string, maxWidth: number, fontSize: number): string {
  const approxCharWidth = fontSize * 0.6;
  const maxChars = Math.max(5, Math.floor((maxWidth - 16) / approxCharWidth));
  if (text.length <= maxChars) return text;
  return text.slice(0, maxChars - 3) + '...';
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
  const blockWidth = s * 2.8;
  const blockHeight = 28;
  const blocks = stackLayout(items, { blockWidth, blockHeight, gap: 6 });

  blocks.forEach(({ x, y, width, height, label, sublabel }, i) => {
    const clipId = `clip-callstack-${entity.id}-${i}`;
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
    rect.setAttribute('stroke-width', String(SHAPES.strokeWidthThin));
    blockG.appendChild(rect);

    const usableWidth = width - 16;
    const displayLabel = truncateToFit(label, usableWidth, 11);
    const displaySublabel = sublabel ? truncateToFit(sublabel, usableWidth, 9) : undefined;

    const text = document.createElementNS(SVG_NS, 'text');
    text.setAttribute('x', String(x));
    text.setAttribute('y', String(y + (displaySublabel ? -2 : 4)));
    text.setAttribute('text-anchor', 'middle');
    text.setAttribute('fill', color);
    text.setAttribute('font-size', '11');
    text.setAttribute('font-weight', '600');
    text.setAttribute('font-family', TYPOGRAPHY.fontBadge);
    text.textContent = displayLabel;
    blockG.appendChild(text);

    if (displaySublabel) {
      const sub = document.createElementNS(SVG_NS, 'text');
      sub.setAttribute('x', String(x));
      sub.setAttribute('y', String(y + 10));
      sub.setAttribute('text-anchor', 'middle');
      sub.setAttribute('fill', `${color}99`);
      sub.setAttribute('font-size', '9');
      sub.setAttribute('font-family', TYPOGRAPHY.fontBadge);
      sub.textContent = displaySublabel;
      blockG.appendChild(sub);
    }

    innerG.appendChild(blockG);
  });

  if (entity.label) {
    const totalH = blocks.length * blockHeight + (blocks.length - 1) * 6;
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
