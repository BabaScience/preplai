/**
 * @preplai/illustrations — CodeBlock Component
 *
 * Code editor visual: dark rect + traffic-light dots + line number column + monospace text.
 * Use for: code snippets, algorithm walkthroughs, syntax examples.
 *
 * @see METADATA_SCHEMAS.md#codeblock
 * @see ILLUSTRATIONS_AGENT_GUIDE.md
 *
 * Metadata:
 *   code: string — split on \n for lines (or use lines directly)
 *   lines: string[] — one per line, overrides code if both present
 * entity.label: title bar filename (truncates if long)
 */

import { SVG_NS, buildEntityGroup, applyEntranceAnimation, getSizeParam } from '../utils.js';
import { ensureDefs } from '../visual-utils.js';
import { getCategoryColor, TYPOGRAPHY, SHAPES } from '../design-tokens.js';
import type { VisualEntity } from '@preplai/shared';

export function renderCodeBlock(entity: VisualEntity, parentEl: SVGElement): SVGGElement {
  const { outerG, innerG } = buildEntityGroup(entity);

  const s = getSizeParam(entity);
  const scale = s / 50;
  const color = entity.color ?? getCategoryColor('CodeBlock');
  const meta = entity.metadata ?? {};
  const code = (meta.code as string) ?? entity.textContent ?? '';
  const lines = (meta.lines as string[]) ?? code.split('\n');

  const totalW = s * 7 * (2 / 3); // Original s*7, scaled to two-thirds (~233 at default size)
  const totalH = s * 2;
  const lineNumColW = 32;
  const titleFontSize = Math.max(10, Math.round(10 * scale));
  const lineNumFontSize = Math.max(10, Math.round(10 * scale));
  const codeFontSize = Math.max(11, Math.round(11 * scale));
  const lineHeight = Math.max(14, Math.round(14 * scale));

  // ── Clip path to prevent content overflow
  const defs = ensureDefs(parentEl);
  const clipId = `clip-codeblock-${entity.id}`;
  let clipEl = defs.querySelector(`#${clipId}`) as SVGClipPathElement | null;
  if (!clipEl) {
    clipEl = document.createElementNS(SVG_NS, 'clipPath');
    clipEl.setAttribute('id', clipId);
    defs.appendChild(clipEl);
  }
  clipEl.innerHTML = '';
  const clipRect = document.createElementNS(SVG_NS, 'rect');
  clipRect.setAttribute('x', String(-totalW / 2));
  clipRect.setAttribute('y', String(-totalH / 2));
  clipRect.setAttribute('width', String(totalW));
  clipRect.setAttribute('height', String(totalH));
  clipRect.setAttribute('rx', String(SHAPES.borderRadiusLarge));
  clipEl.appendChild(clipRect);
  innerG.setAttribute('clip-path', `url(#${clipId})`);

  // ── Background
  const bg = document.createElementNS(SVG_NS, 'rect');
  bg.setAttribute('x', String(-totalW / 2));
  bg.setAttribute('y', String(-totalH / 2));
  bg.setAttribute('width', String(totalW));
  bg.setAttribute('height', String(totalH));
  bg.setAttribute('rx', String(SHAPES.borderRadiusLarge));
  bg.setAttribute('fill', '#1a1a2e');
  bg.setAttribute('stroke', `${color}40`);
  bg.setAttribute('stroke-width', String(SHAPES.strokeWidthThin));
  innerG.appendChild(bg);

  // ── Title bar (dark with accent strip)
  const titleBar = document.createElementNS(SVG_NS, 'rect');
  titleBar.setAttribute('x', String(-totalW / 2));
  titleBar.setAttribute('y', String(-totalH / 2));
  titleBar.setAttribute('width', String(totalW));
  titleBar.setAttribute('height', '24');
  titleBar.setAttribute('rx', String(SHAPES.borderRadiusLarge));
  titleBar.setAttribute('fill', '#2a2a4a');
  innerG.appendChild(titleBar);
  const accentBar = document.createElementNS(SVG_NS, 'rect');
  accentBar.setAttribute('x', String(-totalW / 2));
  accentBar.setAttribute('y', String(-totalH / 2));
  accentBar.setAttribute('width', '3');
  accentBar.setAttribute('height', '24');
  accentBar.setAttribute('rx', '1.5');
  accentBar.setAttribute('fill', color);
  accentBar.setAttribute('opacity', '0.8');
  innerG.appendChild(accentBar);

  // ── Traffic light dots
  const dotColors = ['#ff5f57', '#ffbd2e', '#28c840'];
  dotColors.forEach((dc, i) => {
    const dot = document.createElementNS(SVG_NS, 'circle');
    dot.setAttribute('cx', String(-totalW / 2 + 16 + i * 16));
    dot.setAttribute('cy', String(-totalH / 2 + 12));
    dot.setAttribute('r', '4.5');
    dot.setAttribute('fill', dc);
    innerG.appendChild(dot);
  });

  // ── File name in title bar (truncate if too long)
  if (entity.label) {
    const titleAreaWidth = totalW - 64; // leave space for dots
    const titleCharWidth = titleFontSize * 0.6;
    const titleMaxChars = Math.max(8, Math.floor(titleAreaWidth / titleCharWidth));
    const titleText =
      entity.label.length <= titleMaxChars
        ? entity.label
        : entity.label.slice(0, titleMaxChars - 3) + '...';
    const title = document.createElementNS(SVG_NS, 'text');
    title.setAttribute('x', '0');
    title.setAttribute('y', String(-totalH / 2 + 12));
    title.setAttribute('text-anchor', 'middle');
    title.setAttribute('dominant-baseline', 'middle');
    title.setAttribute('fill', '#ffffff80');
    title.setAttribute('font-size', String(titleFontSize));
    title.setAttribute('font-family', TYPOGRAPHY.fontCode);
    title.textContent = titleText;
    innerG.appendChild(title);
  }

  // ── Line number column background
  const lineNumBg = document.createElementNS(SVG_NS, 'rect');
  lineNumBg.setAttribute('x', String(-totalW / 2));
  lineNumBg.setAttribute('y', String(-totalH / 2 + 24));
  lineNumBg.setAttribute('width', String(lineNumColW));
  lineNumBg.setAttribute('height', String(totalH - 24));
  lineNumBg.setAttribute('fill', '#0d0d14');
  innerG.appendChild(lineNumBg);

  // ── Code lines (truncate long lines to prevent overflow)
  const startY = -totalH / 2 + 40;
  const maxLines = Math.floor((totalH - 40) / lineHeight);
  const visibleLines = lines.slice(0, maxLines);
  const codeAreaWidth = totalW - lineNumColW - 16;
  const charWidth = codeFontSize * 0.6; // ~0.6em for monospace
  const maxCharsPerLine = Math.max(10, Math.floor(codeAreaWidth / charWidth));

  const truncateLine = (text: string): string => {
    if (text.length <= maxCharsPerLine) return text;
    return text.slice(0, maxCharsPerLine - 3) + '...';
  };

  visibleLines.forEach((line: string, i: number) => {
    const lineCenterY = startY + (i + 0.5) * lineHeight;

    // Line number (right-aligned in column)
    const lineNum = document.createElementNS(SVG_NS, 'text');
    lineNum.setAttribute('x', String(-totalW / 2 + lineNumColW - 6));
    lineNum.setAttribute('y', String(lineCenterY));
    lineNum.setAttribute('text-anchor', 'end');
    lineNum.setAttribute('dominant-baseline', 'middle');
    lineNum.setAttribute('fill', '#ffffff30');
    lineNum.setAttribute('font-size', String(lineNumFontSize));
    lineNum.setAttribute('font-family', TYPOGRAPHY.fontCode);
    lineNum.textContent = String(i + 1);
    innerG.appendChild(lineNum);

    // Code text (truncated to fit)
    const codeLine = document.createElementNS(SVG_NS, 'text');
    codeLine.setAttribute('x', String(-totalW / 2 + lineNumColW + 8));
    codeLine.setAttribute('y', String(lineCenterY));
    codeLine.setAttribute('dominant-baseline', 'middle');
    codeLine.setAttribute('fill', color);
    codeLine.setAttribute('font-size', String(codeFontSize));
    codeLine.setAttribute('font-family', TYPOGRAPHY.fontCode);
    codeLine.textContent = truncateLine(line);
    innerG.appendChild(codeLine);
  });

  applyEntranceAnimation(innerG, entity);
  parentEl.appendChild(outerG);
  return outerG;
}
