/**
 * @preplai/illustrations — Annotation Component
 *
 * Sticky-note style: rounded rect with folded corner and shadow.
 */

import { SVG_NS, buildEntityGroup, applyEntranceAnimation, getSizeParam } from '../utils.js';
import { createLinearGradient, ensureDefs } from '../visual-utils.js';
import { getCategoryColor, TYPOGRAPHY, SHAPES, STROKE, LABEL_DEFAULTS } from '../design-tokens.js';
import type { VisualEntity } from '@preplai/shared';

/** Conservative char width for wrapping. */
const CHAR_WIDTH_RATIO = 0.65;

/** Wrap text into lines. maxLines 0 = unlimited. Long words break across lines; no ellipsis truncation. */
function wrapText(text: string, maxChars: number, maxLines: number): { lines: string[]; truncated: boolean } {
  if (!text.trim()) return { lines: [], truncated: false };
  const words = text.trim().split(/\s+/);
  const lines: string[] = [];
  let current = '';
  let truncated = false;
  const unlimited = maxLines <= 0;

  for (const w of words) {
    const next = current ? `${current} ${w}` : w;
    if (next.length <= maxChars) {
      current = next;
    } else {
      if (current) {
        lines.push(current);
        if (!unlimited && lines.length >= maxLines) {
          truncated = true;
          break;
        }
      }
      if (w.length <= maxChars) {
        current = w;
      } else {
        const chunks = w.match(new RegExp(`.{1,${maxChars}}`, 'g')) ?? [w];
        for (let i = 0; i < chunks.length; i++) {
          if (current) {
            lines.push(current);
            if (!unlimited && lines.length >= maxLines) {
              truncated = true;
              current = '';
              break;
            }
          }
          current = chunks[i];
        }
        if (truncated) break;
      }
    }
  }
  if (current && !truncated) lines.push(current);
  return { lines, truncated };
}

export function renderAnnotation(entity: VisualEntity, parentEl: SVGElement): SVGGElement {
  const { outerG, innerG } = buildEntityGroup(entity);

  const s = getSizeParam(entity);
  const color = entity.color ?? getCategoryColor('Annotation');
  const defs = ensureDefs(parentEl);
  const gradId = `grad-annotation-${color.replace(/[^a-fA-F0-9]/g, '')}`;
  createLinearGradient(gradId, color, 'vertical', defs);

  const meta = entity.metadata ?? {};
  const label = (meta.label as string) ?? entity.label ?? 'Annotation';
  const widthUnits = (meta.width as number) ?? 144;
  const maxLinesRaw = (meta.maxLines as number) ?? 4;
  const maxLines = maxLinesRaw === 0 ? 0 : Math.max(1, Math.min(20, maxLinesRaw | 0));

  const padX = 12;
  const padY = 10;
  const foldSize = 14;
  const w = widthUnits;
  const availableWidth = Math.max(40, w - 2 * padX - foldSize);
  const scale = s / 50;
  /** Fixed 15px rendered: compensate for scaleGroup so text stays 15px like Service */
  const fontSize = TYPOGRAPHY.fontSizeDefault / scale;
  const maxChars = Math.max(8, Math.floor(availableWidth / (fontSize * CHAR_WIDTH_RATIO)));
  const { lines } = wrapText(label, maxChars, maxLines);
  const lineHeight = fontSize * LABEL_DEFAULTS.lineHeight;
  const h = 2 * padY + lineHeight * Math.max(1, lines.length);

  const scaleGroup = document.createElementNS(SVG_NS, 'g');
  scaleGroup.setAttribute('transform', `scale(${scale})`);

  // Sticky-note path: rect with folded top-right corner (triangle cutout)
  const rx = SHAPES.borderRadius;
  const halfW = w / 2;
  const halfH = h / 2;

  // Clockwise: bl corner → left → tl corner → top → right up → fold diagonal → back → bottom
  const pathD = [
    `M ${-halfW + rx},${halfH}`,
    `Q ${-halfW},${halfH} ${-halfW},${halfH - rx}`,
    `L ${-halfW},${-halfH + rx}`,
    `Q ${-halfW},${-halfH} ${-halfW + rx},${-halfH}`,
    `L ${halfW - foldSize},${-halfH}`,
    `L ${halfW - foldSize},${halfH - foldSize}`,
    `L ${halfW - foldSize},${halfH}`,
    `L ${halfW},${halfH - foldSize}`,
    `L ${halfW - foldSize},${halfH - foldSize}`,
    `L ${halfW - foldSize},${halfH}`,
    `L ${-halfW + rx},${halfH}`,
    'Z',
  ].join(' ');

  // Shadow (slightly offset, darker fill)
  const shadow = document.createElementNS(SVG_NS, 'path');
  shadow.setAttribute('d', pathD);
  shadow.setAttribute('transform', 'translate(3, 3)');
  shadow.setAttribute('fill', 'rgba(0,0,0,0.15)');
  shadow.setAttribute('stroke', 'none');
  scaleGroup.appendChild(shadow);

  // Main sticky body
  const body = document.createElementNS(SVG_NS, 'path');
  body.setAttribute('d', pathD);
  body.setAttribute('fill', `url(#${gradId})`);
  body.setAttribute('stroke', color);
  body.setAttribute('stroke-width', String(STROKE.thin));
  body.setAttribute('stroke-linejoin', 'round');
  scaleGroup.appendChild(body);

  // Folded corner (darker triangle to suggest shadow)
  const foldPath = `M ${halfW - foldSize},${halfH - foldSize} L ${halfW},${halfH - foldSize} L ${halfW - foldSize},${halfH} Z`;
  const fold = document.createElementNS(SVG_NS, 'path');
  fold.setAttribute('d', foldPath);
  fold.setAttribute('fill', 'rgba(0,0,0,0.08)');
  fold.setAttribute('stroke', color);
  fold.setAttribute('stroke-width', String(STROKE.minimal));
  fold.setAttribute('stroke-linejoin', 'round');
  scaleGroup.appendChild(fold);

  // Clip for text
  const clipId = `clip-annotation-${entity.id}`;
  let clipEl = defs.querySelector(`#${clipId}`) as SVGClipPathElement | null;
  if (!clipEl) {
    clipEl = document.createElementNS(SVG_NS, 'clipPath');
    clipEl.setAttribute('id', clipId);
    defs.appendChild(clipEl);
  }
  clipEl.innerHTML = '';
  const clipPath = document.createElementNS(SVG_NS, 'path');
  clipPath.setAttribute('d', pathD);
  clipEl.appendChild(clipPath);

  const textGroup = document.createElementNS(SVG_NS, 'text');
  textGroup.setAttribute('clip-path', `url(#${clipId})`);
  textGroup.setAttribute('x', '0');
  textGroup.setAttribute('y', '0');
  textGroup.setAttribute('text-anchor', 'middle');
  textGroup.setAttribute('fill', color);
  textGroup.setAttribute('font-size', String(fontSize));
  textGroup.setAttribute('font-weight', String(TYPOGRAPHY.fontWeightLabel));
  textGroup.setAttribute('font-family', TYPOGRAPHY.fontLabel);

  const textOffset = lines.length > 1 ? -(lineHeight * (lines.length - 1)) / 2 : 0;
  lines.forEach((line, i) => {
    const tspan = document.createElementNS(SVG_NS, 'tspan');
    tspan.setAttribute('x', '0');
    tspan.setAttribute('dy', i === 0 ? String(textOffset) : String(lineHeight));
    tspan.textContent = line;
    textGroup.appendChild(tspan);
  });

  scaleGroup.appendChild(textGroup);
  innerG.appendChild(scaleGroup);

  applyEntranceAnimation(innerG, entity);
  parentEl.appendChild(outerG);
  return outerG;
}
