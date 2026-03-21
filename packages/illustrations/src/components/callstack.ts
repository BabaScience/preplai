/**
 * @preplai/illustrations — CallStack Component (minimalist)
 *
 * Vertical stack of stack frames (function name + optional locals).
 * No gradient fills, no clip paths, no stackLayout import — manual vertical layout.
 *
 * Metadata: { frames: [{ name, locals? }] }
 */

import { SVG_NS, buildEntityGroup, applyEntranceAnimation, getSizeParam } from '../utils.js';
import {
  getCategoryColor,
  TYPOGRAPHY,
  SHAPES,
  LABEL_DEFAULTS,
  STROKE,
  getStrokeWidth,
  getLabelFontSize,
  colorWithAlpha,
  OPACITY,
} from '../design-tokens.js';
import type { VisualEntity } from '@preplai/shared';

interface StackFrame {
  name: string;
  locals?: string;
}

export function renderCallStack(entity: VisualEntity, parentEl: SVGElement): SVGGElement {
  const { outerG, innerG } = buildEntityGroup(entity);

  const s = getSizeParam(entity);
  const scale = s / 50;
  const labelFontSize = getLabelFontSize('value', scale);
  const sublabelFontSize = getLabelFontSize('index', scale);
  const color = entity.color ?? getCategoryColor('CallStack');

  const meta = entity.metadata ?? {};
  const framesData = meta.frames as StackFrame[] | undefined;
  const frames: StackFrame[] = framesData ?? [
    { name: 'main()' },
    { name: 'processRequest()', locals: 'req, res' },
    { name: 'handleQuery()', locals: 'sql' },
  ];

  const blockWidth = s * 2.8;
  const blockHeight = 28;
  const gap = 6;
  const totalH = frames.length * blockHeight + (frames.length - 1) * gap;
  const startY = -totalH / 2;

  // Highlight glow
  if (entity.highlight) {
    const glow = document.createElementNS(SVG_NS, 'rect');
    glow.setAttribute('x', String(-blockWidth / 2 - 4));
    glow.setAttribute('y', String(startY - 4));
    glow.setAttribute('width', String(blockWidth + 8));
    glow.setAttribute('height', String(totalH + 8));
    glow.setAttribute('rx', String(SHAPES.borderRadius + 2));
    glow.setAttribute('fill', 'none');
    glow.setAttribute('stroke', colorWithAlpha(color, OPACITY.strokeMuted));
    glow.setAttribute('stroke-width', String(STROKE.default));
    glow.setAttribute('stroke-dasharray', '4,4');
    innerG.appendChild(glow);
  }

  frames.forEach((frame, i) => {
    const x = 0;
    const y = startY + i * (blockHeight + gap) + blockHeight / 2;

    const rect = document.createElementNS(SVG_NS, 'rect');
    rect.setAttribute('x', String(x - blockWidth / 2));
    rect.setAttribute('y', String(y - blockHeight / 2));
    rect.setAttribute('width', String(blockWidth));
    rect.setAttribute('height', String(blockHeight));
    rect.setAttribute('rx', String(SHAPES.borderRadius));
    rect.setAttribute('fill', colorWithAlpha(color, OPACITY.fillLight));
    rect.setAttribute('stroke', color);
    rect.setAttribute('stroke-width', String(getStrokeWidth('thin', scale)));
    innerG.appendChild(rect);

    // Truncate label
    const approxCharWidth = labelFontSize * 0.6;
    const maxChars = Math.max(5, Math.floor((blockWidth - 16) / approxCharWidth));
    const displayLabel = frame.name.length > maxChars ? frame.name.slice(0, maxChars - 3) + '...' : frame.name;

    const hasSub = !!frame.locals;
    const text = document.createElementNS(SVG_NS, 'text');
    text.setAttribute('x', String(x));
    text.setAttribute('y', String(hasSub ? y - 2 : y + 4));
    text.setAttribute('text-anchor', 'middle');
    text.setAttribute('fill', color);
    text.setAttribute('font-size', String(labelFontSize));
    text.setAttribute('font-weight', String(TYPOGRAPHY.fontWeightBold));
    text.setAttribute('font-family', TYPOGRAPHY.fontBadge);
    text.textContent = displayLabel;
    innerG.appendChild(text);

    if (frame.locals) {
      const subApproxCharWidth = sublabelFontSize * 0.6;
      const subMaxChars = Math.max(5, Math.floor((blockWidth - 16) / subApproxCharWidth));
      const displaySub = frame.locals.length > subMaxChars ? frame.locals.slice(0, subMaxChars - 3) + '...' : frame.locals;

      const sub = document.createElementNS(SVG_NS, 'text');
      sub.setAttribute('x', String(x));
      sub.setAttribute('y', String(y + 5));
      sub.setAttribute('text-anchor', 'middle');
      sub.setAttribute('fill', colorWithAlpha(color, OPACITY.strokeSoft));
      sub.setAttribute('font-size', String(sublabelFontSize));
      sub.setAttribute('font-weight', String(TYPOGRAPHY.fontWeightLabel));
      sub.setAttribute('font-family', TYPOGRAPHY.fontBadge);
      sub.textContent = displaySub;
      innerG.appendChild(sub);
    }
  });

  if (entity.label) {
    const text = document.createElementNS(SVG_NS, 'text');
    text.setAttribute('x', '0');
    text.setAttribute('y', String(totalH / 2 + LABEL_DEFAULTS.offsetBelow));
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
