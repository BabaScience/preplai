/**
 * @pre/illustrations — CodeBlock Component
 * Code editor visual: dark rect + traffic-light dots + line number column + monospace text
 */

import { SVG_NS, buildEntityGroup, applyEntranceAnimation, getSizeParam } from '../utils.js';
import { getCategoryColor, TYPOGRAPHY, SHAPES } from '../design-tokens.js';
import type { VisualEntity } from '@pre/shared';

export function renderCodeBlock(entity: VisualEntity, parentEl: SVGElement): SVGGElement {
  const { outerG, innerG } = buildEntityGroup(entity);

  const s = getSizeParam(entity, 1.5);
  const color = entity.color ?? getCategoryColor('CodeBlock');
  const meta = entity.metadata ?? {};
  const code = (meta.code as string) ?? entity.textContent ?? '';
  const lines = (meta.lines as string[]) ?? code.split('\n');

  const totalW = s * 3;
  const totalH = s * 2;
  const lineNumColW = 32;

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

  // ── File name in title bar
  if (entity.label) {
    const title = document.createElementNS(SVG_NS, 'text');
    title.setAttribute('x', '0');
    title.setAttribute('y', String(-totalH / 2 + 16));
    title.setAttribute('text-anchor', 'middle');
    title.setAttribute('fill', '#ffffff80');
    title.setAttribute('font-size', '10');
    title.setAttribute('font-family', TYPOGRAPHY.fontCode);
    title.textContent = entity.label;
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

  // ── Code lines
  const lineHeight = 14;
  const startY = -totalH / 2 + 40;
  const maxLines = Math.floor((totalH - 40) / lineHeight);
  const visibleLines = lines.slice(0, maxLines);

  visibleLines.forEach((line: string, i: number) => {
    // Line number
    const lineNum = document.createElementNS(SVG_NS, 'text');
    lineNum.setAttribute('x', String(-totalW / 2 + 12));
    lineNum.setAttribute('y', String(startY + i * lineHeight));
    lineNum.setAttribute('fill', '#ffffff30');
    lineNum.setAttribute('font-size', '10');
    lineNum.setAttribute('font-family', TYPOGRAPHY.fontCode);
    lineNum.textContent = String(i + 1);
    innerG.appendChild(lineNum);

    // Code text
    const codeLine = document.createElementNS(SVG_NS, 'text');
    codeLine.setAttribute('x', String(-totalW / 2 + lineNumColW + 8));
    codeLine.setAttribute('y', String(startY + i * lineHeight));
    codeLine.setAttribute('fill', color);
    codeLine.setAttribute('font-size', '10');
    codeLine.setAttribute('font-family', TYPOGRAPHY.fontCode);
    codeLine.textContent = line;
    innerG.appendChild(codeLine);
  });

  applyEntranceAnimation(innerG, entity);
  parentEl.appendChild(outerG);
  return outerG;
}
