/**
 * @preplai/illustrations — CodeBlock Component (Cinematic Depth)
 *
 * Clean code editor: dark rect + traffic-light dots + line numbers + monospace text.
 * No clip paths. Uses design tokens for all colors.
 *
 * Cinematic Depth: directional lighting halo, ground shadow, ambient occlusion,
 * specular highlight, micro-life float animation.
 *
 * Metadata: { code?: string, lines?: string[], tabSize?: number }
 */

import { SVG_NS, buildEntityGroup, applyEntranceAnimation, getSizeParam } from '../utils.js';
import { TYPOGRAPHY, SHAPES, STROKE, colorWithAlpha } from '../design-tokens.js';
import { resolveColorCascade } from '../color-cascade.js';
import { ensureDefs } from '../visual-utils.js';
import type { VisualEntity } from '@preplai/shared';

export function renderCodeBlock(entity: VisualEntity, parentEl: SVGElement): SVGGElement {
  const { outerG, innerG } = buildEntityGroup(entity);

  const s = getSizeParam(entity);
  const scale = s / 50;
  const cc = resolveColorCascade(entity);
  const color = cc.base;
  const entityId = (entity.id ?? Math.random().toString(36).slice(2)).replace(/[^a-zA-Z0-9]/g, '').slice(0, 8);
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
  const hw = totalW / 2;
  const hh = totalH / 2;

  const defs = ensureDefs(parentEl);

  // ── Pillar 1: Directional Lighting ────────────────────────────────
  const haloId = `code-halo-${entityId}`;
  if (!defs.querySelector(`#${haloId}`)) {
    const haloGrad = document.createElementNS(SVG_NS, 'radialGradient');
    haloGrad.setAttribute('id', haloId);
    haloGrad.setAttribute('cx', '38%'); haloGrad.setAttribute('cy', '38%');
    haloGrad.setAttribute('r', '50%');
    const s1 = document.createElementNS(SVG_NS, 'stop');
    s1.setAttribute('offset', '0%'); s1.setAttribute('stop-color', color); s1.setAttribute('stop-opacity', '0.13');
    const s2 = document.createElementNS(SVG_NS, 'stop');
    s2.setAttribute('offset', '100%'); s2.setAttribute('stop-color', color); s2.setAttribute('stop-opacity', '0');
    haloGrad.appendChild(s1); haloGrad.appendChild(s2);
    defs.appendChild(haloGrad);
  }
  const halo = document.createElementNS(SVG_NS, 'ellipse');
  halo.setAttribute('cx', String(-hw * 0.1));
  halo.setAttribute('cy', String(-hh * 0.1));
  halo.setAttribute('rx', String(hw * 1.3));
  halo.setAttribute('ry', String(hh * 1.2));
  halo.setAttribute('fill', `url(#${haloId})`);
  innerG.appendChild(halo);

  // ── Pillar 2: Ground Shadow ───────────────────────────────────────
  const gsId = `code-gshadow-${entityId}`;
  if (!defs.querySelector(`#${gsId}`)) {
    const gsg = document.createElementNS(SVG_NS, 'radialGradient');
    gsg.setAttribute('id', gsId);
    gsg.setAttribute('cx', '50%'); gsg.setAttribute('cy', '50%'); gsg.setAttribute('r', '50%');
    const g1 = document.createElementNS(SVG_NS, 'stop');
    g1.setAttribute('offset', '0%'); g1.setAttribute('stop-color', '#000000'); g1.setAttribute('stop-opacity', '0.18');
    const g2 = document.createElementNS(SVG_NS, 'stop');
    g2.setAttribute('offset', '100%'); g2.setAttribute('stop-color', '#000000'); g2.setAttribute('stop-opacity', '0');
    gsg.appendChild(g1); gsg.appendChild(g2);
    defs.appendChild(gsg);
  }
  const groundShadow = document.createElementNS(SVG_NS, 'ellipse');
  groundShadow.setAttribute('cx', '0');
  groundShadow.setAttribute('cy', String(hh + 6));
  groundShadow.setAttribute('rx', String(hw * 0.8));
  groundShadow.setAttribute('ry', String(hh * 0.08));
  groundShadow.setAttribute('fill', `url(#${gsId})`);
  innerG.appendChild(groundShadow);

  // Background
  const bg = document.createElementNS(SVG_NS, 'rect');
  bg.setAttribute('x', String(-hw));
  bg.setAttribute('y', String(-hh));
  bg.setAttribute('width', String(totalW));
  bg.setAttribute('height', String(totalH));
  bg.setAttribute('rx', String(SHAPES.borderRadiusLarge));
  bg.setAttribute('fill', cc.fill);
  bg.setAttribute('stroke', cc.glow);
  bg.setAttribute('stroke-width', String(STROKE.default));
  innerG.appendChild(bg);

  // ── Pillar 3: Ambient Occlusion ───────────────────────────────────
  const aoId = `code-ao-${entityId}`;
  if (!defs.querySelector(`#${aoId}`)) {
    const aoGrad = document.createElementNS(SVG_NS, 'radialGradient');
    aoGrad.setAttribute('id', aoId);
    aoGrad.setAttribute('cx', '70%'); aoGrad.setAttribute('cy', '75%'); aoGrad.setAttribute('r', '55%');
    const a1 = document.createElementNS(SVG_NS, 'stop');
    a1.setAttribute('offset', '0%'); a1.setAttribute('stop-color', '#000000'); a1.setAttribute('stop-opacity', '0.10');
    const a2 = document.createElementNS(SVG_NS, 'stop');
    a2.setAttribute('offset', '100%'); a2.setAttribute('stop-color', '#000000'); a2.setAttribute('stop-opacity', '0');
    aoGrad.appendChild(a1); aoGrad.appendChild(a2);
    defs.appendChild(aoGrad);
  }
  const ao = document.createElementNS(SVG_NS, 'rect');
  ao.setAttribute('x', String(-hw));
  ao.setAttribute('y', String(-hh));
  ao.setAttribute('width', String(totalW));
  ao.setAttribute('height', String(totalH));
  ao.setAttribute('rx', String(SHAPES.borderRadiusLarge));
  ao.setAttribute('fill', `url(#${aoId})`);
  ao.setAttribute('pointer-events', 'none');
  innerG.appendChild(ao);

  // ── Pillar 4: Specular Highlight ──────────────────────────────────
  const specId = `code-spec-${entityId}`;
  if (!defs.querySelector(`#${specId}`)) {
    const specGrad = document.createElementNS(SVG_NS, 'radialGradient');
    specGrad.setAttribute('id', specId);
    specGrad.setAttribute('cx', '35%'); specGrad.setAttribute('cy', '25%'); specGrad.setAttribute('r', '40%');
    const sp1 = document.createElementNS(SVG_NS, 'stop');
    sp1.setAttribute('offset', '0%'); sp1.setAttribute('stop-color', '#ffffff'); sp1.setAttribute('stop-opacity', '0.18');
    const sp2 = document.createElementNS(SVG_NS, 'stop');
    sp2.setAttribute('offset', '100%'); sp2.setAttribute('stop-color', '#ffffff'); sp2.setAttribute('stop-opacity', '0');
    specGrad.appendChild(sp1); specGrad.appendChild(sp2);
    defs.appendChild(specGrad);
  }
  const specular = document.createElementNS(SVG_NS, 'rect');
  specular.setAttribute('x', String(-hw));
  specular.setAttribute('y', String(-hh));
  specular.setAttribute('width', String(totalW));
  specular.setAttribute('height', String(totalH));
  specular.setAttribute('rx', String(SHAPES.borderRadiusLarge));
  specular.setAttribute('fill', `url(#${specId})`);
  specular.setAttribute('pointer-events', 'none');
  innerG.appendChild(specular);

  // Title bar
  const titleBar = document.createElementNS(SVG_NS, 'rect');
  titleBar.setAttribute('x', String(-hw));
  titleBar.setAttribute('y', String(-hh));
  titleBar.setAttribute('width', String(totalW));
  titleBar.setAttribute('height', '24');
  titleBar.setAttribute('rx', String(SHAPES.borderRadiusLarge));
  titleBar.setAttribute('fill', cc.fillMedium);
  innerG.appendChild(titleBar);

  // Accent strip
  const accentBar = document.createElementNS(SVG_NS, 'rect');
  accentBar.setAttribute('x', String(-hw));
  accentBar.setAttribute('y', String(-hh));
  accentBar.setAttribute('width', '3');
  accentBar.setAttribute('height', '24');
  accentBar.setAttribute('rx', '1.5');
  accentBar.setAttribute('fill', cc.stroke);
  accentBar.setAttribute('opacity', '0.8');
  innerG.appendChild(accentBar);

  // Traffic light dots
  const dotColors = ['#ff5f57', '#ffbd2e', '#28c840'];
  dotColors.forEach((dc, i) => {
    const dot = document.createElementNS(SVG_NS, 'circle');
    dot.setAttribute('cx', String(-hw + 16 + i * 16));
    dot.setAttribute('cy', String(-hh + 12));
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
    title.setAttribute('y', String(-hh + 12));
    title.setAttribute('text-anchor', 'middle');
    title.setAttribute('dominant-baseline', 'middle');
    title.setAttribute('fill', cc.textSecondary);
    title.setAttribute('font-size', String(titleFontSize));
    title.setAttribute('font-family', TYPOGRAPHY.fontCode);
    title.textContent = titleText;
    innerG.appendChild(title);
  }

  // Line number column background
  const lineNumBg = document.createElementNS(SVG_NS, 'rect');
  lineNumBg.setAttribute('x', String(-hw));
  lineNumBg.setAttribute('y', String(-hh + 24));
  lineNumBg.setAttribute('width', String(lineNumColW));
  lineNumBg.setAttribute('height', String(totalH - 24));
  lineNumBg.setAttribute('fill', colorWithAlpha(cc.base, '08'));
  innerG.appendChild(lineNumBg);

  // Code lines
  const startY = -hh + 40;
  const maxVisibleLines = Math.floor((totalH - 40) / lineHeight);
  const visibleLines = lines.slice(0, maxVisibleLines);
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
    lineNum.setAttribute('x', String(-hw + lineNumColW - 6));
    lineNum.setAttribute('y', String(lineCenterY));
    lineNum.setAttribute('text-anchor', 'end');
    lineNum.setAttribute('dominant-baseline', 'middle');
    lineNum.setAttribute('fill', colorWithAlpha(cc.base, '30'));
    lineNum.setAttribute('font-size', String(lineNumFontSize));
    lineNum.setAttribute('font-family', TYPOGRAPHY.fontCode);
    lineNum.textContent = String(i + 1);
    innerG.appendChild(lineNum);

    const codeLine = document.createElementNS(SVG_NS, 'text');
    codeLine.setAttribute('x', String(-hw + lineNumColW + 8));
    codeLine.setAttribute('y', String(lineCenterY));
    codeLine.setAttribute('dominant-baseline', 'middle');
    codeLine.setAttribute('fill', cc.textPrimary);
    codeLine.setAttribute('font-size', String(codeFontSize));
    codeLine.setAttribute('font-family', TYPOGRAPHY.fontCode);
    codeLine.setAttribute('xml:space', 'preserve');
    codeLine.textContent = truncateLine(expandTabs(line));
    innerG.appendChild(codeLine);
  });

  // ── Pillar 5: Micro-Life (float animation) ────────────────────────
  const styleId = `code-style-${entityId}`;
  const svg = parentEl.ownerSVGElement ?? (parentEl as SVGSVGElement);
  if (!svg.querySelector(`#${styleId}`)) {
    const style = document.createElementNS(SVG_NS, 'style');
    style.setAttribute('id', styleId);
    style.textContent = `
      @keyframes codeFloat_${entityId} {
        0%, 100% { transform: translateY(0); }
        50% { transform: translateY(-1.5px); }
      }
      .code-float-${entityId} {
        animation: codeFloat_${entityId} 4.2s ease-in-out infinite;
      }
    `;
    svg.insertBefore(style, svg.firstChild);
  }
  innerG.classList.add(`code-float-${entityId}`);

  applyEntranceAnimation(innerG, entity);
  parentEl.appendChild(outerG);
  return outerG;
}
