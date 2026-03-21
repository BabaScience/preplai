/**
 * @preplai/illustrations — CodeBlock Component (minimalist)
 *
 * Clean code editor: dark rect + traffic-light dots + line numbers + monospace text.
 * No clip paths. Uses design tokens for all colors.
 *
 * Metadata: { code?: string, lines?: string[], tabSize?: number }
 */

import { SVG_NS, buildEntityGroup, applyEntranceAnimation, getSizeParam } from '../utils.js';
import { getCategoryColor, TYPOGRAPHY, SHAPES, STROKE, colorWithAlpha, OPACITY } from '../design-tokens.js';
import type { VisualEntity } from '@preplai/shared';

export function renderCodeBlock(entity: VisualEntity, parentEl: SVGElement): SVGGElement {
  const { outerG, innerG } = buildEntityGroup(entity);

  const s = getSizeParam(entity);
  const scale = s / 50;
  const color = entity.color ?? getCategoryColor('CodeBlock');
  const meta = entity.metadata ?? {};
  const code = (meta.code as string) ?? entity.textContent ?? '';
  const lines = (meta.lines as string[]) ?? code.split('\n');
  const tabSize = Math.max(1, Math.min(8, ((meta.tabSize as number) ?? 2) | 0));

  /** Expand tabs and convert all spaces to non-breaking spaces (\u00A0)
   *  so SVG <text> elements preserve indentation (SVG collapses regular spaces). */
  const expandTabs = (text: string): string => {
    let result = '';
    let col = 0;
    for (const ch of text) {
      if (ch === '\t') {
        const spaces = tabSize - (col % tabSize);
        result += '\u00A0'.repeat(spaces);
        col += spaces;
      } else if (ch === ' ') {
        result += '\u00A0';
        col += 1;
      } else {
        result += ch;
        col += 1;
      }
    }
    return result;
  };

  const totalW = s * 7 * (2 / 3);
  const totalH = s * 2;
  const lineNumColW = 32;
  const titleFontSize = Math.max(10, Math.round(10 * scale));
  const lineNumFontSize = Math.max(10, Math.round(10 * scale));
  const codeFontSize = Math.max(11, Math.round(11 * scale));
  const lineHeight = Math.max(14, Math.round(14 * scale));

  // Background
  const bg = document.createElementNS(SVG_NS, 'rect');
  bg.setAttribute('x', String(-totalW / 2));
  bg.setAttribute('y', String(-totalH / 2));
  bg.setAttribute('width', String(totalW));
  bg.setAttribute('height', String(totalH));
  bg.setAttribute('rx', String(SHAPES.borderRadiusLarge));
  bg.setAttribute('fill', colorWithAlpha(color, OPACITY.fillLight));
  bg.setAttribute('stroke', colorWithAlpha(color, OPACITY.strokeMuted));
  bg.setAttribute('stroke-width', String(STROKE.default));
  innerG.appendChild(bg);

  // Title bar
  const titleBar = document.createElementNS(SVG_NS, 'rect');
  titleBar.setAttribute('x', String(-totalW / 2));
  titleBar.setAttribute('y', String(-totalH / 2));
  titleBar.setAttribute('width', String(totalW));
  titleBar.setAttribute('height', '24');
  titleBar.setAttribute('rx', String(SHAPES.borderRadiusLarge));
  titleBar.setAttribute('fill', colorWithAlpha(color, OPACITY.fillMedium));
  innerG.appendChild(titleBar);

  // Accent strip
  const accentBar = document.createElementNS(SVG_NS, 'rect');
  accentBar.setAttribute('x', String(-totalW / 2));
  accentBar.setAttribute('y', String(-totalH / 2));
  accentBar.setAttribute('width', '3');
  accentBar.setAttribute('height', '24');
  accentBar.setAttribute('rx', '1.5');
  accentBar.setAttribute('fill', color);
  accentBar.setAttribute('opacity', '0.8');
  innerG.appendChild(accentBar);

  // Traffic light dots
  const dotColors = ['#ff5f57', '#ffbd2e', '#28c840'];
  dotColors.forEach((dc, i) => {
    const dot = document.createElementNS(SVG_NS, 'circle');
    dot.setAttribute('cx', String(-totalW / 2 + 16 + i * 16));
    dot.setAttribute('cy', String(-totalH / 2 + 12));
    dot.setAttribute('r', '4.5');
    dot.setAttribute('fill', dc);
    innerG.appendChild(dot);
  });

  // File name in title bar
  if (entity.label) {
    const titleAreaWidth = totalW - 64;
    const titleCharWidth = titleFontSize * 0.6;
    const titleMaxChars = Math.max(8, Math.floor(titleAreaWidth / titleCharWidth));
    const titleText = entity.label.length <= titleMaxChars
      ? entity.label
      : entity.label.slice(0, titleMaxChars - 3) + '...';
    const title = document.createElementNS(SVG_NS, 'text');
    title.setAttribute('x', '0');
    title.setAttribute('y', String(-totalH / 2 + 12));
    title.setAttribute('text-anchor', 'middle');
    title.setAttribute('dominant-baseline', 'middle');
    title.setAttribute('fill', colorWithAlpha(color, OPACITY.strokeSoft));
    title.setAttribute('font-size', String(titleFontSize));
    title.setAttribute('font-family', TYPOGRAPHY.fontCode);
    title.textContent = titleText;
    innerG.appendChild(title);
  }

  // Line number column background
  const lineNumBg = document.createElementNS(SVG_NS, 'rect');
  lineNumBg.setAttribute('x', String(-totalW / 2));
  lineNumBg.setAttribute('y', String(-totalH / 2 + 24));
  lineNumBg.setAttribute('width', String(lineNumColW));
  lineNumBg.setAttribute('height', String(totalH - 24));
  lineNumBg.setAttribute('fill', colorWithAlpha(color, '08'));
  innerG.appendChild(lineNumBg);

  // Code lines
  const startY = -totalH / 2 + 40;
  const maxLines = Math.floor((totalH - 40) / lineHeight);
  const visibleLines = lines.slice(0, maxLines);
  const codeAreaWidth = totalW - lineNumColW - 16;
  const charWidth = codeFontSize * 0.6;
  const maxCharsPerLine = Math.max(10, Math.floor(codeAreaWidth / charWidth));

  const truncateLine = (text: string): string => {
    if (text.length <= maxCharsPerLine) return text;
    return text.slice(0, maxCharsPerLine - 3) + '...';
  };

  visibleLines.forEach((line: string, i: number) => {
    const lineCenterY = startY + (i + 0.5) * lineHeight;

    const lineNum = document.createElementNS(SVG_NS, 'text');
    lineNum.setAttribute('x', String(-totalW / 2 + lineNumColW - 6));
    lineNum.setAttribute('y', String(lineCenterY));
    lineNum.setAttribute('text-anchor', 'end');
    lineNum.setAttribute('dominant-baseline', 'middle');
    lineNum.setAttribute('fill', colorWithAlpha(color, '30'));
    lineNum.setAttribute('font-size', String(lineNumFontSize));
    lineNum.setAttribute('font-family', TYPOGRAPHY.fontCode);
    lineNum.textContent = String(i + 1);
    innerG.appendChild(lineNum);

    const codeLine = document.createElementNS(SVG_NS, 'text');
    codeLine.setAttribute('x', String(-totalW / 2 + lineNumColW + 8));
    codeLine.setAttribute('y', String(lineCenterY));
    codeLine.setAttribute('dominant-baseline', 'middle');
    codeLine.setAttribute('fill', color);
    codeLine.setAttribute('font-size', String(codeFontSize));
    codeLine.setAttribute('font-family', TYPOGRAPHY.fontCode);
    codeLine.setAttribute('xml:space', 'preserve');
    codeLine.textContent = truncateLine(expandTabs(line));
    innerG.appendChild(codeLine);
  });

  applyEntranceAnimation(innerG, entity);
  parentEl.appendChild(outerG);
  return outerG;
}
